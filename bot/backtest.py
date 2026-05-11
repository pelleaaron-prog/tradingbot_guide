"""
backtest.py — Historical Backtesting Engine
Run this BEFORE deploying to see how the strategy would have performed over the last N days.
Uses Yahoo Finance (yfinance) for data — not geo-blocked. Live bot still uses ccxt on Render.com.
"""

import pandas as pd
import yfinance as yf
from datetime import datetime, timedelta

from strategy import analyze, Signal
import config

# Configuration for backtest
TEST_SYMBOL = "BTC/USDT"
TEST_TIMEFRAME = "1h"
TEST_DAYS = 90
INITIAL_BALANCE = 100.0
TRADE_SIZE_PCT = 0.20
STOP_LOSS = 0.05
TAKE_PROFIT = 0.10

_YF_INTERVAL_MAP = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "4h": "1h", "1d": "1d",
}
_YF_TICKER_MAP = {"BTC/USDT": "BTC-USD", "ETH/USDT": "ETH-USD"}


def fetch_historical_data(symbol: str, timeframe: str, days: int) -> pd.DataFrame:
    """Fetch OHLCV history via Yahoo Finance (accessible from Indonesia)."""
    ticker = _YF_TICKER_MAP.get(symbol, symbol.replace("/", "-").replace("USDT", "USD"))
    interval = _YF_INTERVAL_MAP.get(timeframe, "1h")
    start_date = datetime.now() - timedelta(days=days)

    print(f"Fetching {days} days of {symbol} data via Yahoo Finance...")
    try:
        df = yf.download(ticker, start=start_date, interval=interval,
                         auto_adjust=True, progress=False)
    except Exception as e:
        print(f"Error fetching data: {e}")
        return pd.DataFrame()

    if df.empty:
        return pd.DataFrame()

    # Normalize to expected column names
    df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
    df.columns = ["open", "high", "low", "close", "volume"]
    df = df.astype(float)
    df = df[~df.index.duplicated(keep="first")]
    df.index.name = "timestamp"
    print(f"Fetched {len(df)} candles.")
    return df


def run_backtest():
    df = fetch_historical_data(TEST_SYMBOL, TEST_TIMEFRAME, TEST_DAYS)
    print(f"Fetched {len(df)} candles.")

    if len(df) < config.EMA_LONG + 5:
        print("Not enough data for the configured EMA lengths.")
        return

    balance = INITIAL_BALANCE
    in_position = False
    entry_price = 0.0
    qty = 0.0
    
    trades = []
    wins = 0
    losses = 0

    print("\nStarting simulation...\n")

    # We need to simulate candle by candle to avoid look-ahead bias
    # Start iterating from the point where we have enough history for EMAs
    start_idx = config.EMA_LONG + 5
    
    for i in range(start_idx, len(df)):
        # Provide a slice of the dataframe up to current candle (exclusive of current to simulate 'closed' candle for strategy)
        # Strategy expects latest closed candle at index -2. 
        # So we pass df up to i (exclusive), meaning i-1 is the last "closed" candle.
        current_slice = df.iloc[:i]
        
        # We need the current "live" price to check SL/TP during the period
        current_candle = df.iloc[i]
        curr_high = current_candle['high']
        curr_low = current_candle['low']
        curr_close = current_candle['close']
        timestamp = df.index[i]

        if in_position:
            # Check Stop Loss / Take Profit against High/Low of current candle
            sl_price = entry_price * (1 - STOP_LOSS)
            tp_price = entry_price * (1 + TAKE_PROFIT)

            exit_reason = None
            exit_price = 0.0

            if curr_low <= sl_price:
                exit_reason = "STOP LOSS"
                exit_price = sl_price
            elif curr_high >= tp_price:
                exit_reason = "TAKE PROFIT"
                exit_price = tp_price

            if exit_reason:
                in_position = False
                revenue = qty * exit_price
                pnl = revenue - (qty * entry_price)
                balance += revenue
                
                if pnl > 0: wins += 1
                else: losses += 1

                trades.append({
                    'time': timestamp,
                    'type': 'SELL',
                    'reason': exit_reason,
                    'price': exit_price,
                    'pnl': pnl,
                    'balance': balance
                })
                continue # Moved to next candle after closing position

        # Check for Entry signals if not in position
        if not in_position:
            # Analyze up to previous candle
            res = analyze(current_slice)
            
            if res.signal == Signal.BUY:
                in_position = True
                # Execute at open of current candle
                entry_price = current_candle['open'] 
                
                trade_amount = balance * TRADE_SIZE_PCT
                qty = trade_amount / entry_price
                balance -= trade_amount
                
                trades.append({
                    'time': timestamp,
                    'type': 'BUY',
                    'reason': 'STRATEGY',
                    'price': entry_price,
                    'pnl': 0,
                    'balance': balance + trade_amount # Display total theoretical balance
                })

    # Close any open positions at the end of the backtest
    if in_position:
        final_price = df.iloc[-1]['close']
        revenue = qty * final_price
        pnl = revenue - (qty * entry_price)
        balance += revenue
        if pnl > 0: wins += 1
        else: losses += 1
        trades.append({
            'time': df.index[-1],
            'type': 'SELL',
            'reason': 'END_OF_TEST',
            'price': final_price,
            'pnl': pnl,
            'balance': balance
        })

    # --- Print Results ---
    print("-" * 50)
    print("BACKTEST RESULTS")
    print("-" * 50)
    print(f"Period:       {TEST_DAYS} days")
    print(f"Pair:         {TEST_SYMBOL}")
    print(f"Timeframe:    {TEST_TIMEFRAME}")
    print(f"Strategy:     EMA {config.EMA_SHORT}/{config.EMA_LONG} + RSI")
    print("-" * 50)
    print(f"Start Bal:    ${INITIAL_BALANCE:.2f}")
    print(f"Final Bal:    ${balance:.2f}")
    
    total_pnl = balance - INITIAL_BALANCE
    print(f"Total PnL:    ${total_pnl:.2f} ({(total_pnl/INITIAL_BALANCE)*100:.2f}%)")
    
    total_trades = wins + losses
    win_rate = (wins / total_trades * 100) if total_trades > 0 else 0
    print(f"Total Trades: {total_trades}")
    print(f"Wins:         {wins}")
    print(f"Losses:       {losses}")
    print(f"Win Rate:     {win_rate:.1f}%")
    print("-" * 50)

if __name__ == "__main__":
    run_backtest()
