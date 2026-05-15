"""
exchange.py — MetaTrader5 exchange wrapper.
Handles: connection, data fetching, order execution, balance check.
Requires MetaTrader5 terminal installed and running on the same machine.
"""

import MetaTrader5 as mt5
import pandas as pd
from logger import get_logger
from config import MT5_LOGIN, MT5_PASSWORD, MT5_SERVER, SYMBOL, TIMEFRAME, CANDLE_LIMIT, DRY_RUN

log = get_logger("exchange")

# Map timeframe string to MT5 constant
TIMEFRAME_MAP = {
    "1m":  mt5.TIMEFRAME_M1,
    "5m":  mt5.TIMEFRAME_M5,
    "15m": mt5.TIMEFRAME_M15,
    "1h":  mt5.TIMEFRAME_H1,
    "4h":  mt5.TIMEFRAME_H4,
    "1d":  mt5.TIMEFRAME_D1,
}

# MT5 uses symbol names without slash (e.g. BTCUSD not BTC/USD)
def _mt5_symbol(symbol: str) -> str:
    return symbol.replace("/", "")


def connect() -> bool:
    """Initialize and login to MetaTrader5 terminal."""
    if not mt5.initialize():
        raise ConnectionError(f"MT5 initialize() failed: {mt5.last_error()}")

    if MT5_LOGIN and MT5_PASSWORD and MT5_SERVER:
        ok = mt5.login(MT5_LOGIN, password=MT5_PASSWORD, server=MT5_SERVER)
        if not ok:
            raise ConnectionError(f"MT5 login failed: {mt5.last_error()}")

    info = mt5.account_info()
    log.info(f"Connected to MT5 — Account: {info.login} | Server: {info.server} | Balance: ${info.balance:.2f}")
    return True


def fetch_ohlcv(exchange, symbol: str = SYMBOL,
                timeframe: str = TIMEFRAME, limit: int = CANDLE_LIMIT) -> pd.DataFrame:
    """Fetch candlestick data and return as DataFrame."""
    mt5_symbol = _mt5_symbol(symbol)
    tf = TIMEFRAME_MAP.get(timeframe, mt5.TIMEFRAME_H1)

    rates = mt5.copy_rates_from_pos(mt5_symbol, tf, 0, limit)
    if rates is None or len(rates) == 0:
        raise ValueError(f"No data returned for {mt5_symbol}: {mt5.last_error()}")

    df = pd.DataFrame(rates)
    df["timestamp"] = pd.to_datetime(df["time"], unit="s")
    df.set_index("timestamp", inplace=True)
    df = df.rename(columns={"open": "open", "high": "high", "low": "low",
                             "close": "close", "tick_volume": "volume"})
    df = df[["open", "high", "low", "close", "volume"]].astype(float)
    log.debug(f"Fetched {len(df)} candles | last close: ${df['close'].iloc[-1]:,.2f}")
    return df


def get_balance_usdt(exchange) -> float:
    """Return free balance in account currency."""
    info = mt5.account_info()
    balance = float(info.balance)
    log.debug(f"Account balance: ${balance:.2f}")
    return balance


def get_base_balance(exchange, symbol: str = SYMBOL) -> float:
    """Return held volume for the symbol (approximation via open positions)."""
    mt5_symbol = _mt5_symbol(symbol)
    positions = mt5.positions_get(symbol=mt5_symbol)
    if not positions:
        return 0.0
    total = sum(p.volume for p in positions if p.type == mt5.ORDER_TYPE_BUY)
    return float(total)


def get_current_price(exchange, symbol: str = SYMBOL) -> float:
    """Return latest ask price."""
    mt5_symbol = _mt5_symbol(symbol)
    tick = mt5.symbol_info_tick(mt5_symbol)
    return float(tick.ask)


def execute_buy(exchange, usdt_amount: float, symbol: str = SYMBOL) -> dict | None:
    """Place a market buy order. DRY_RUN simulates without placing."""
    try:
        mt5_symbol = _mt5_symbol(symbol)
        price = get_current_price(exchange, symbol)
        info = mt5.symbol_info(mt5_symbol)
        volume = round(usdt_amount / price, 2)
        volume = max(info.volume_min, round(volume / info.volume_step) * info.volume_step)

        if DRY_RUN:
            log.info(f"[DRY RUN] BUY {volume:.4f} {mt5_symbol} @ ${price:,.2f} (${usdt_amount:.2f})")
            return {"id": "DRY_RUN", "symbol": symbol, "side": "buy",
                    "amount": volume, "price": price, "cost": volume * price, "status": "closed"}

        request = {
            "action":   mt5.TRADE_ACTION_DEAL,
            "symbol":   mt5_symbol,
            "volume":   volume,
            "type":     mt5.ORDER_TYPE_BUY,
            "price":    price,
            "deviation": 20,
            "magic":    234000,
            "comment":  "trading-bot buy",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        result = mt5.order_send(request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            log.error(f"BUY order failed: {result.retcode} {result.comment}")
            return None

        log.info(f"BUY order placed: {volume:.4f} {mt5_symbol} @ ${price:,.2f} | ticket={result.order}")
        return {"id": str(result.order), "symbol": symbol, "side": "buy",
                "amount": volume, "price": price, "cost": volume * price, "status": "closed"}

    except Exception as e:
        log.error(f"execute_buy error: {e}")
        return None


def execute_sell(exchange, quantity: float, symbol: str = SYMBOL) -> dict | None:
    """Place a market sell order. DRY_RUN simulates without placing."""
    try:
        mt5_symbol = _mt5_symbol(symbol)
        price = float(mt5.symbol_info_tick(mt5_symbol).bid)

        if DRY_RUN:
            log.info(f"[DRY RUN] SELL {quantity:.4f} {mt5_symbol} @ ${price:,.2f} (${quantity * price:.2f})")
            return {"id": "DRY_RUN", "symbol": symbol, "side": "sell",
                    "amount": quantity, "price": price, "cost": quantity * price, "status": "closed"}

        request = {
            "action":   mt5.TRADE_ACTION_DEAL,
            "symbol":   mt5_symbol,
            "volume":   quantity,
            "type":     mt5.ORDER_TYPE_SELL,
            "price":    price,
            "deviation": 20,
            "magic":    234000,
            "comment":  "trading-bot sell",
            "type_time": mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        result = mt5.order_send(request)
        if result.retcode != mt5.TRADE_RETCODE_DONE:
            log.error(f"SELL order failed: {result.retcode} {result.comment}")
            return None

        log.info(f"SELL order placed: {quantity:.4f} {mt5_symbol} @ ${price:,.2f} | ticket={result.order}")
        return {"id": str(result.order), "symbol": symbol, "side": "sell",
                "amount": quantity, "price": price, "cost": quantity * price, "status": "closed"}

    except Exception as e:
        log.error(f"execute_sell error: {e}")
        return None


def shutdown(exchange) -> None:
    """Disconnect from MT5 terminal."""
    mt5.shutdown()
    log.info("MT5 connection closed.")
