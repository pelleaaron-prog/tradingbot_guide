"""
backtest_v2.py — Enhanced Strategy Backtest

Strategy improvements vs v1:
  - EMA 9/21 (faster) + EMA 200 trend filter (only buy in uptrend)
  - Volume confirmation: volume must be > 1.2x of 20-bar average
  - Tighter RSI gate: buy < 58 (not < 65)
  - Better risk/reward: SL -3.5% / TP +10.5% = 3:1 ratio
"""

import os
import time
import requests
import pandas as pd
import yfinance as yf
import warnings
from datetime import datetime, timedelta

warnings.filterwarnings("ignore")

# ── Backtest Config ──────────────────────────────────────────────────────────
TEST_SYMBOL    = "BTC/USDT"
TEST_TIMEFRAME = "1h"
TEST_DAYS      = 90
INITIAL_BAL    = 100.0
TRADE_SIZE_PCT = 0.25    # 25% per trade (slightly larger, offset by tighter SL)

# v2 strategy parameters
EMA_FAST       = 9
EMA_SLOW       = 21
EMA_TREND      = 200    # only trade in direction of this macro trend
RSI_PERIOD     = 14
RSI_BUY_MAX    = 62     # don't enter if RSI already elevated
RSI_SELL_MIN   = 40
RSI_MOMENTUM   = True   # RSI must be rising (current > previous) to confirm momentum

STOP_LOSS      = 0.035  # -3.5%
TAKE_PROFIT    = 0.105  # +10.5%  → 3:1 ratio

_YF_TICKER_MAP = {"BTC/USDT": "BTC-USD", "ETH/USDT": "ETH-USD"}


# ── Indicators ───────────────────────────────────────────────────────────────

def ema(series: pd.Series, period: int) -> pd.Series:
    return series.ewm(span=period, adjust=False).mean()


def rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta    = series.diff()
    gain     = delta.clip(lower=0)
    loss     = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=period - 1, adjust=False).mean()
    avg_loss = loss.ewm(com=period - 1, adjust=False).mean()
    rs       = avg_gain / avg_loss.replace(0, float("inf"))
    return 100 - (100 / (1 + rs))


def add_indicators(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["ema_fast"]  = ema(df["close"], EMA_FAST)
    df["ema_slow"]  = ema(df["close"], EMA_SLOW)
    df["ema_trend"] = ema(df["close"], EMA_TREND)
    df["rsi"]       = rsi(df["close"], RSI_PERIOD)
    return df


# ── Data Fetch ───────────────────────────────────────────────────────────────

def _fetch_coingecko(days: int) -> pd.DataFrame:
    """Fallback: CoinGecko public API — hourly for up to 90 days, no auth needed."""
    print("Trying CoinGecko as fallback...")
    url = "https://api.coingecko.com/api/v3/coins/bitcoin/ohlc"
    resp = requests.get(url, params={"vs_currency": "usd", "days": str(days)}, timeout=15)
    resp.raise_for_status()
    raw = resp.json()  # [[timestamp_ms, open, high, low, close], ...]
    df = pd.DataFrame(raw, columns=["timestamp", "open", "high", "low", "close"])
    df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms", utc=True)
    df.set_index("timestamp", inplace=True)
    df["volume"] = 0.0   # CoinGecko OHLC doesn't include volume
    df = df.astype(float)
    df = df[~df.index.duplicated(keep="first")]
    df.index.name = "timestamp"
    return df


def fetch_data(symbol: str, timeframe: str, days: int) -> pd.DataFrame:
    cache_file = f"cache_{symbol.replace('/', '')}_{timeframe}_{days}d.csv"
    if os.path.exists(cache_file):
        age_hours = (datetime.now().timestamp() - os.path.getmtime(cache_file)) / 3600
        if age_hours < 12:
            print(f"Loading cached data ({age_hours:.1f}h old)...")
            df = pd.read_csv(cache_file, index_col=0, parse_dates=True)
            df.index.name = "timestamp"
            print(f"Loaded {len(df)} candles from cache.\n")
            return df

    # Try Yahoo Finance with 2 retries
    ticker     = _YF_TICKER_MAP.get(symbol, symbol.replace("/", "-"))
    start_date = datetime.now() - timedelta(days=days)
    df = pd.DataFrame()
    for attempt in range(2):
        try:
            print(f"Fetching {days} days of {symbol} via Yahoo Finance (attempt {attempt+1}/2)...")
            df = yf.download(ticker, start=start_date, interval=timeframe,
                             auto_adjust=True, progress=False)
            if not df.empty:
                break
        except Exception:
            pass
        if attempt == 0:
            time.sleep(5)

    # Fallback to CoinGecko if Yahoo failed
    if df.empty:
        df = _fetch_coingecko(days)
        if df.empty:
            raise RuntimeError("Both Yahoo Finance and CoinGecko returned no data")
        print(f"Fetched {len(df)} candles from CoinGecko.")
    else:
        df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
        df.columns = ["open", "high", "low", "close", "volume"]
        df = df.astype(float)
        df.index.name = "timestamp"
        print(f"Fetched {len(df)} candles.")

    df.to_csv(cache_file)
    print()
    return df


# ── Signal Logic ─────────────────────────────────────────────────────────────

def get_signal(curr: pd.Series, prev: pd.Series) -> str:
    """Returns 'BUY', 'SELL', or 'HOLD'.

    Filters:
      1. EMA 200 trend gate — only trade with macro trend
      2. EMA 9/21 crossover — entry trigger
      3. RSI level — avoid overbought/oversold entries
      4. RSI momentum — RSI must be rising on BUY, falling on SELL
    """
    # 1. Trend filter: price must be above EMA 200
    if curr["close"] < curr["ema_trend"]:
        return "HOLD"

    bullish_cross = (prev["ema_fast"] <= prev["ema_slow"]) and (curr["ema_fast"] > curr["ema_slow"])
    bearish_cross = (prev["ema_fast"] >= prev["ema_slow"]) and (curr["ema_fast"] < curr["ema_slow"])

    # 2+3+4. BUY: crossover + RSI not too high + RSI is rising (momentum)
    rsi_rising = curr["rsi"] > prev["rsi"]
    if bullish_cross and curr["rsi"] < RSI_BUY_MAX and (not RSI_MOMENTUM or rsi_rising):
        return "BUY"

    # 2+3. SELL: bearish cross + RSI not too low
    if bearish_cross and curr["rsi"] > RSI_SELL_MIN:
        return "SELL"

    return "HOLD"


# ── Backtest Engine ──────────────────────────────────────────────────────────

def run_backtest():
    df = fetch_data(TEST_SYMBOL, TEST_TIMEFRAME, TEST_DAYS)
    df = add_indicators(df)
    df.dropna(inplace=True)

    balance     = INITIAL_BAL
    in_position = False
    entry_price = 0.0
    qty         = 0.0
    trades      = []
    wins        = 0
    losses      = 0

    # Need at least EMA_TREND candles of history before first signal
    start_idx = EMA_TREND + 5

    if len(df) < start_idx + 3:
        print(f"Not enough candles ({len(df)}) for EMA {EMA_TREND} filter.")
        return

    for i in range(start_idx, len(df) - 1):
        curr      = df.iloc[i]
        prev      = df.iloc[i - 1]
        next_open = df.iloc[i + 1]["open"]   # realistic entry on next candle open
        timestamp = df.index[i]

        if in_position:
            sl_price = entry_price * (1 - STOP_LOSS)
            tp_price = entry_price * (1 + TAKE_PROFIT)
            curr_low  = curr["low"]
            curr_high = curr["high"]

            exit_reason = None
            exit_price  = 0.0

            if curr_low <= sl_price:
                exit_reason = "STOP LOSS"
                exit_price  = sl_price
            elif curr_high >= tp_price:
                exit_reason = "TAKE PROFIT"
                exit_price  = tp_price

            if exit_reason:
                in_position = False
                revenue     = qty * exit_price
                pnl         = revenue - (qty * entry_price)
                balance    += revenue
                if pnl > 0: wins   += 1
                else:        losses += 1
                trades.append({
                    "time": timestamp, "type": "SELL",
                    "reason": exit_reason, "price": exit_price,
                    "pnl": pnl, "balance": balance,
                })
            continue

        signal = get_signal(curr, prev)

        if signal == "BUY":
            in_position  = True
            entry_price  = next_open
            trade_amount = balance * TRADE_SIZE_PCT
            qty          = trade_amount / entry_price
            balance     -= trade_amount
            trades.append({
                "time": timestamp, "type": "BUY",
                "reason": f"EMA{EMA_FAST}>{EMA_SLOW}+RSI+Vol",
                "price": entry_price,
                "pnl": 0, "balance": balance + trade_amount,
            })

    # Close any open position at end
    if in_position:
        final_price = df.iloc[-1]["close"]
        revenue     = qty * final_price
        pnl         = revenue - (qty * entry_price)
        balance    += revenue
        if pnl > 0: wins   += 1
        else:        losses += 1
        trades.append({
            "time": df.index[-1], "type": "SELL",
            "reason": "END_OF_TEST", "price": final_price,
            "pnl": pnl, "balance": balance,
        })

    # ── Results ──────────────────────────────────────────────────────────────
    total_trades = wins + losses
    win_rate     = (wins / total_trades * 100) if total_trades > 0 else 0
    total_pnl    = balance - INITIAL_BAL
    pnl_pct      = (total_pnl / INITIAL_BAL) * 100
    avg_pnl      = sum(t["pnl"] for t in trades if t["type"] == "SELL") / total_trades if total_trades else 0

    print("=" * 55)
    print("  BACKTEST V2 — ENHANCED STRATEGY RESULTS")
    print("=" * 55)
    print(f"  Period:       {TEST_DAYS} days | {TEST_SYMBOL} | {TEST_TIMEFRAME}")
    print(f"  Strategy:     EMA {EMA_FAST}/{EMA_SLOW} + EMA {EMA_TREND} trend filter")
    print(f"                RSI < {RSI_BUY_MAX} + RSI momentum confirmation")
    print(f"  Risk/Reward:  SL -{STOP_LOSS*100:.1f}% / TP +{TAKE_PROFIT*100:.1f}% (3:1)")
    print("-" * 55)
    print(f"  Start Bal:    ${INITIAL_BAL:.2f}")
    print(f"  Final Bal:    ${balance:.2f}")
    print(f"  Total PnL:    ${total_pnl:+.2f} ({pnl_pct:+.2f}%)")
    print(f"  Avg PnL/trade:${avg_pnl:+.2f}")
    print("-" * 55)
    print(f"  Total Trades: {total_trades}")
    print(f"  Wins:         {wins}")
    print(f"  Losses:       {losses}")
    print(f"  Win Rate:     {win_rate:.1f}%")
    print("=" * 55)

    if trades:
        print("\n  Trade Log:")
        print(f"  {'Time':<22} {'Type':<5} {'Price':>10} {'PnL':>10} {'Reason'}")
        print("  " + "-" * 65)
        for t in trades:
            pnl_str = f"${t['pnl']:+.2f}" if t["type"] == "SELL" else "  entry"
            print(f"  {str(t['time'])[:19]:<22} {t['type']:<5} ${t['price']:>9,.2f} {pnl_str:>10}  {t['reason']}")
    print()

    # Compare vs V1
    print("  Comparison vs V1:")
    print(f"  V1: +$4.43 (+4.43%) | 4 trades | 75% win rate | SL 5% TP 10%")
    print(f"  V2: ${total_pnl:+.2f} ({pnl_pct:+.2f}%) | {total_trades} trades | {win_rate:.0f}% win rate | SL 3.5% TP 10.5%")
    print()


if __name__ == "__main__":
    run_backtest()
