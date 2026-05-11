"""
backtest_multi.py — Multi-pair backtest runner (V1 vs V2) across asset classes.
Tests BTC/USDT, ETH/USDT, XAU/USD, GBP/USD using Yahoo Finance data.
SL/TP are adapted per asset class to match typical volatility.
"""

import os
import time
import warnings
import requests
import pandas as pd
import yfinance as yf
from dataclasses import dataclass
from datetime import datetime, timedelta

warnings.filterwarnings("ignore")

# ── Asset Configuration ───────────────────────────────────────────────────────
# SL/TP scaled to each market's typical daily volatility range
@dataclass
class PairConfig:
    ticker:   str
    sl_v1:    float   # V1 stop loss %
    tp_v1:    float   # V1 take profit %
    sl_v2:    float   # V2 stop loss %
    tp_v2:    float   # V2 take profit %
    note:     str

PAIRS = {
    "BTC/USDT": PairConfig("BTC-USD",   0.050, 0.100, 0.035, 0.105, "Crypto — high vol"),
    "ETH/USDT": PairConfig("ETH-USD",   0.050, 0.100, 0.035, 0.105, "Crypto — high vol"),
    "XAU/USD":  PairConfig("GC=F",      0.015, 0.030, 0.012, 0.036, "Gold — med vol"),
    "GBP/USD":  PairConfig("GBPUSD=X",  0.004, 0.008, 0.003, 0.009, "Forex — low vol"),
}

TEST_DAYS      = 90
INITIAL_BAL    = 1000.0   # use $1000 so small % moves are visible
TRADE_SIZE_PCT = 0.20
TIMEFRAME      = "1h"

# V1 strategy params
V1_EMA_FAST  = 20
V1_EMA_SLOW  = 50
V1_RSI_BUY   = 65
V1_RSI_SELL  = 35

# V2 strategy params
V2_EMA_FAST  = 9
V2_EMA_SLOW  = 21
V2_EMA_TREND = 200
V2_RSI_BUY   = 62
V2_RSI_SELL  = 40


# ── Indicators ────────────────────────────────────────────────────────────────

def ema(s: pd.Series, p: int) -> pd.Series:
    return s.ewm(span=p, adjust=False).mean()


def rsi(s: pd.Series, p: int = 14) -> pd.Series:
    d  = s.diff()
    g  = d.clip(lower=0)
    l  = -d.clip(upper=0)
    ag = g.ewm(com=p - 1, adjust=False).mean()
    al = l.ewm(com=p - 1, adjust=False).mean()
    return 100 - (100 / (1 + ag / al.replace(0, float("inf"))))


# ── Data Fetching ─────────────────────────────────────────────────────────────

def _cache_path(symbol: str) -> str:
    return f"cache_{symbol.replace('/','').replace('=','_')}_{TIMEFRAME}_{TEST_DAYS}d.csv"


def _load_cache(symbol: str) -> pd.DataFrame | None:
    path = _cache_path(symbol)
    if not os.path.exists(path):
        return None
    age_h = (datetime.now().timestamp() - os.path.getmtime(path)) / 3600
    if age_h >= 12:
        return None
    df = pd.read_csv(path, index_col=0, parse_dates=True)
    df.index.name = "timestamp"
    return df


def _normalise(df: pd.DataFrame) -> pd.DataFrame:
    """Flatten MultiIndex columns and standardise column names."""
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
    df.columns = ["open", "high", "low", "close", "volume"]
    df = df.astype(float)
    df.index.name = "timestamp"
    return df[~df.index.duplicated(keep="first")]


def fetch_all(days: int = TEST_DAYS) -> dict[str, pd.DataFrame]:
    """
    Download all pairs in one batch request to avoid rate-limiting.
    Uses cache for pairs already downloaded within 12h.
    """
    result: dict[str, pd.DataFrame] = {}
    to_download: list[tuple[str, str]] = []   # (symbol, yf_ticker)

    for symbol, cfg in PAIRS.items():
        cached = _load_cache(symbol)
        if cached is not None:
            result[symbol] = cached
            print(f"  {symbol}: loaded from cache ({len(cached)} candles)")
        else:
            to_download.append((symbol, cfg.ticker))

    if not to_download:
        return result

    start  = datetime.now() - timedelta(days=days)
    tickers = [t for _, t in to_download]

    print(f"\n  Downloading {tickers} in one batch request...")
    raw = pd.DataFrame()
    for attempt in range(3):
        try:
            raw = yf.download(
                tickers, start=start, interval=TIMEFRAME,
                auto_adjust=True, progress=False, group_by="ticker",
            )
            if not raw.empty:
                break
        except Exception as e:
            print(f"  Attempt {attempt+1} failed: {e}")
        wait = (attempt + 1) * 12
        print(f"  Waiting {wait}s before retry...")
        time.sleep(wait)

    for symbol, ticker in to_download:
        try:
            if raw.empty:
                df = pd.DataFrame()
            elif len(tickers) == 1:
                df = _normalise(raw)
            else:
                df = _normalise(raw[ticker].dropna(how="all"))

            if df.empty:
                print(f"  {symbol}: no data received")
                result[symbol] = pd.DataFrame()
            else:
                df.to_csv(_cache_path(symbol))
                result[symbol] = df
                print(f"  {symbol}: {len(df)} candles downloaded")
        except Exception as e:
            print(f"  {symbol}: error processing — {e}")
            result[symbol] = pd.DataFrame()

    return result


# ── V1 Signal ─────────────────────────────────────────────────────────────────

def v1_signal(curr: pd.Series, prev: pd.Series) -> str:
    bull = (prev["ema_fast"] <= prev["ema_slow"]) and (curr["ema_fast"] > curr["ema_slow"])
    bear = (prev["ema_fast"] >= prev["ema_slow"]) and (curr["ema_fast"] < curr["ema_slow"])
    if bull and curr["rsi"] < V1_RSI_BUY:  return "BUY"
    if bear and curr["rsi"] > V1_RSI_SELL: return "SELL"
    return "HOLD"


def add_v1_indicators(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["ema_fast"] = ema(df["close"], V1_EMA_FAST)
    df["ema_slow"] = ema(df["close"], V1_EMA_SLOW)
    df["rsi"]      = rsi(df["close"])
    return df.dropna()


# ── V2 Signal ─────────────────────────────────────────────────────────────────

def v2_signal(curr: pd.Series, prev: pd.Series) -> str:
    if curr["close"] < curr["ema_trend"]:
        return "HOLD"
    bull = (prev["ema_fast"] <= prev["ema_slow"]) and (curr["ema_fast"] > curr["ema_slow"])
    bear = (prev["ema_fast"] >= prev["ema_slow"]) and (curr["ema_fast"] < curr["ema_slow"])
    rsi_rising = curr["rsi"] > prev["rsi"]
    if bull and curr["rsi"] < V2_RSI_BUY and rsi_rising: return "BUY"
    if bear and curr["rsi"] > V2_RSI_SELL:                return "SELL"
    return "HOLD"


def add_v2_indicators(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["ema_fast"]  = ema(df["close"], V2_EMA_FAST)
    df["ema_slow"]  = ema(df["close"], V2_EMA_SLOW)
    df["ema_trend"] = ema(df["close"], V2_EMA_TREND)
    df["rsi"]       = rsi(df["close"])
    return df.dropna()


# ── Backtest Engine ───────────────────────────────────────────────────────────

def run_sim(df: pd.DataFrame, signal_fn, sl: float, tp: float,
            start_idx: int) -> dict:
    """Generic simulation loop. Returns result dict."""
    balance = INITIAL_BAL
    in_pos  = False
    entry   = qty = 0.0
    wins = losses = 0
    trades = []

    for i in range(start_idx, len(df) - 1):
        curr = df.iloc[i]
        prev = df.iloc[i - 1]
        ts   = df.index[i]

        if in_pos:
            sl_p = entry * (1 - sl)
            tp_p = entry * (1 + tp)
            reason = exit_p = None
            if curr["low"] <= sl_p:
                reason, exit_p = "SL", sl_p
            elif curr["high"] >= tp_p:
                reason, exit_p = "TP", tp_p
            if reason:
                pnl     = qty * (exit_p - entry)
                balance += qty * exit_p
                in_pos  = False
                if pnl > 0: wins   += 1
                else:        losses += 1
                trades.append({"ts": ts, "type": "SELL", "reason": reason,
                               "price": exit_p, "pnl": pnl})
            continue

        sig = signal_fn(curr, prev)
        if sig == "BUY":
            amt     = balance * TRADE_SIZE_PCT
            entry   = df.iloc[i + 1]["open"]
            qty     = amt / entry
            balance -= amt
            in_pos  = True
            trades.append({"ts": ts, "type": "BUY", "reason": "ENTRY",
                           "price": entry, "pnl": 0})

    # Close open position at end
    if in_pos:
        exit_p  = df.iloc[-1]["close"]
        pnl     = qty * (exit_p - entry)
        balance += qty * exit_p
        if pnl > 0: wins += 1
        else:        losses += 1
        trades.append({"ts": df.index[-1], "type": "SELL", "reason": "END",
                       "price": exit_p, "pnl": pnl})

    total     = wins + losses
    total_pnl = balance - INITIAL_BAL
    return {
        "balance":  balance,
        "pnl":      total_pnl,
        "pnl_pct":  total_pnl / INITIAL_BAL * 100,
        "trades":   total,
        "wins":     wins,
        "losses":   losses,
        "win_rate": (wins / total * 100) if total else 0,
    }


# ── Main ──────────────────────────────────────────────────────────────────────

def run_all():
    results = {}

    print("\nLoading data for all pairs...")
    all_data = fetch_all()

    for symbol, cfg in PAIRS.items():
        df_raw = all_data.get(symbol, pd.DataFrame())

        if df_raw.empty or len(df_raw) < V2_EMA_TREND + 10:
            print(f"\n  {symbol}: SKIP — not enough data ({len(df_raw)} candles)")
            results[symbol] = None
            continue

        df_v1 = add_v1_indicators(df_raw)
        df_v2 = add_v2_indicators(df_raw)

        r_v1 = run_sim(df_v1, v1_signal, cfg.sl_v1, cfg.tp_v1, V1_EMA_SLOW + 5)
        r_v2 = run_sim(df_v2, v2_signal, cfg.sl_v2, cfg.tp_v2, V2_EMA_TREND + 5)

        results[symbol] = {"v1": r_v1, "v2": r_v2, "cfg": cfg}

    # ── Print Summary Table ───────────────────────────────────────────────────
    print("\n")
    print("=" * 85)
    print(f"  MULTI-PAIR BACKTEST — {TEST_DAYS} days | ${INITIAL_BAL:.0f} starting balance")
    print("=" * 85)
    print(f"  {'Pair':<12} {'Version':<6} {'PnL':>9} {'Return':>8} {'Trades':>7} "
          f"{'Win%':>7} {'SL':>6} {'TP':>6}  Note")
    print("  " + "-" * 81)

    for symbol, res in results.items():
        if res is None:
            print(f"  {symbol:<12} {'—':<6} {'NO DATA':>9}")
            continue
        cfg = res["cfg"]
        for ver, r, sl, tp in [
            ("V1", res["v1"], cfg.sl_v1, cfg.tp_v1),
            ("V2", res["v2"], cfg.sl_v2, cfg.tp_v2),
        ]:
            pnl_str = f"${r['pnl']:+.2f}"
            ret_str = f"{r['pnl_pct']:+.2f}%"
            note    = cfg.note if ver == "V1" else ""
            print(f"  {symbol:<12} {ver:<6} {pnl_str:>9} {ret_str:>8} "
                  f"{r['trades']:>7} {r['win_rate']:>6.1f}% "
                  f"{sl*100:>5.1f}% {tp*100:>5.1f}%  {note}")
        print("  " + "-" * 81)

    print()
    print("  Notes:")
    print("  • SL/TP scaled per asset class (crypto 5%/10%, gold 1.5%/3%, forex 0.4%/0.8%)")
    print("  • V2 adds EMA 200 trend filter + RSI momentum gate on top of V1")
    print("  • All simulations: 20% position size, no compounding within trades")
    print("=" * 85)
    print()


if __name__ == "__main__":
    run_all()
