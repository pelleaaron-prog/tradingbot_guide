"""
exchange.py — Bybit exchange wrapper via ccxt.
Handles: connection, data fetching, order execution, balance check.
All errors are caught and logged — never crash the main bot.
"""

import ccxt
import pandas as pd
import time
from logger import get_logger
from config import BYBIT_API_KEY, BYBIT_SECRET, SYMBOL, TIMEFRAME, CANDLE_LIMIT, DRY_RUN

log = get_logger("exchange")


def connect() -> ccxt.bybit:
    """Create and verify Bybit connection."""
    exchange = ccxt.bybit({
        "apiKey": BYBIT_API_KEY,
        "secret": BYBIT_SECRET,
        "options": {"defaultType": "spot"},
        "enableRateLimit": True,
    })
    exchange.load_markets()
    log.info(f"Connected to Bybit — {len(exchange.markets)} markets loaded")
    return exchange


def fetch_ohlcv(exchange: ccxt.bybit, symbol: str = SYMBOL,
                timeframe: str = TIMEFRAME, limit: int = CANDLE_LIMIT) -> pd.DataFrame:
    """Fetch candlestick data and return as DataFrame."""
    try:
        raw = exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
        df = pd.DataFrame(raw, columns=["timestamp", "open", "high", "low", "close", "volume"])
        df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
        df.set_index("timestamp", inplace=True)
        df = df.astype(float)
        log.debug(f"Fetched {len(df)} candles | last close: ${df['close'].iloc[-1]:,.2f}")
        return df
    except Exception as e:
        log.error(f"fetch_ohlcv error: {e}")
        raise


def get_balance_usdt(exchange: ccxt.bybit) -> float:
    """Return free USDT balance."""
    try:
        balance = exchange.fetch_balance()
        usdt = balance.get("USDT", {}).get("free", 0.0)
        log.debug(f"USDT balance: ${usdt:.2f}")
        return float(usdt)
    except Exception as e:
        log.error(f"get_balance_usdt error: {e}")
        raise


def get_base_balance(exchange: ccxt.bybit, symbol: str = SYMBOL) -> float:
    """Return free balance of the base asset (e.g., BTC for BTC/USDT)."""
    base = symbol.split("/")[0]
    try:
        balance = exchange.fetch_balance()
        qty = balance.get(base, {}).get("free", 0.0)
        log.debug(f"{base} balance: {qty:.6f}")
        return float(qty)
    except Exception as e:
        log.error(f"get_base_balance error: {e}")
        raise


def get_current_price(exchange: ccxt.bybit, symbol: str = SYMBOL) -> float:
    """Return latest ticker price."""
    ticker = exchange.fetch_ticker(symbol)
    return float(ticker["last"])


def execute_buy(exchange: ccxt.bybit, usdt_amount: float, symbol: str = SYMBOL) -> dict | None:
    """
    Buy using market order for given USDT amount.
    In DRY_RUN mode: simulates the order without actually placing it.
    Returns order dict or simulated dict.
    """
    try:
        price = get_current_price(exchange, symbol)
        qty   = usdt_amount / price
        qty   = float(exchange.amount_to_precision(symbol, qty))

        if DRY_RUN:
            log.info(f"[DRY RUN] BUY {qty:.6f} {symbol} @ ${price:,.2f} (${usdt_amount:.2f} USDT)")
            return {
                "id":     "DRY_RUN",
                "symbol": symbol,
                "side":   "buy",
                "amount": qty,
                "price":  price,
                "cost":   qty * price,
                "status": "closed",
            }

        order = exchange.create_market_buy_order(symbol, qty)
        log.info(f"BUY order placed: {qty:.6f} {symbol} @ ${price:,.2f} | ID={order['id']}")
        time.sleep(1)
        return order

    except Exception as e:
        log.error(f"execute_buy error: {e}")
        return None


def execute_sell(exchange: ccxt.bybit, quantity: float, symbol: str = SYMBOL) -> dict | None:
    """
    Sell all held quantity using market order.
    In DRY_RUN mode: simulates without placing.
    """
    try:
        price = get_current_price(exchange, symbol)
        qty   = float(exchange.amount_to_precision(symbol, quantity))

        if DRY_RUN:
            log.info(f"[DRY RUN] SELL {qty:.6f} {symbol} @ ${price:,.2f} (${qty * price:.2f} USDT)")
            return {
                "id":     "DRY_RUN",
                "symbol": symbol,
                "side":   "sell",
                "amount": qty,
                "price":  price,
                "cost":   qty * price,
                "status": "closed",
            }

        order = exchange.create_market_sell_order(symbol, qty)
        log.info(f"SELL order placed: {qty:.6f} {symbol} @ ${price:,.2f} | ID={order['id']}")
        time.sleep(1)
        return order

    except Exception as e:
        log.error(f"execute_sell error: {e}")
        return None
