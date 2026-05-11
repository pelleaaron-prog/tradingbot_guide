"""
strategy.py — EMA Crossover + RSI Confirmation Strategy

Logic:
  BUY  when: EMA_short crosses ABOVE EMA_long AND RSI < RSI_OVERBOUGHT
  SELL when: EMA_short crosses BELOW EMA_long AND RSI > RSI_OVERSOLD
  HOLD otherwise

Why this combo?
  - EMA crossover identifies trend direction
  - RSI filter avoids entering in extreme conditions
  - Together reduces false signals significantly
"""

import pandas as pd
from dataclasses import dataclass
from enum import Enum
from logger import get_logger
from config import EMA_SHORT, EMA_LONG, RSI_PERIOD, RSI_OVERSOLD, RSI_OVERBOUGHT

log = get_logger("strategy")


class Signal(Enum):
    BUY  = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"


@dataclass
class StrategyResult:
    signal:    Signal
    ema_short: float
    ema_long:  float
    rsi:       float
    price:     float
    reason:    str


def compute_ema(series: pd.Series, period: int) -> pd.Series:
    return series.ewm(span=period, adjust=False).mean()


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain  = delta.clip(lower=0)
    loss  = -delta.clip(upper=0)
    avg_gain = gain.ewm(com=period - 1, adjust=False).mean()
    avg_loss = loss.ewm(com=period - 1, adjust=False).mean()
    rs  = avg_gain / avg_loss.replace(0, float("inf"))
    rsi = 100 - (100 / (1 + rs))
    return rsi


def analyze(df: pd.DataFrame) -> StrategyResult:
    """
    Run strategy on OHLCV dataframe.
    Expects columns: [timestamp, open, high, low, close, volume]
    Returns StrategyResult with signal + indicator values.
    """
    if len(df) < EMA_LONG + 5:
        raise ValueError(f"Not enough candles: need {EMA_LONG + 5}, got {len(df)}")

    close = df["close"]

    # Calculate indicators
    df["ema_short"] = compute_ema(close, EMA_SHORT)
    df["ema_long"]  = compute_ema(close, EMA_LONG)
    df["rsi"]       = compute_rsi(close, RSI_PERIOD)

    # Current values (latest closed candle = -2, last is still forming)
    curr  = df.iloc[-2]
    prev  = df.iloc[-3]

    ema_s_now  = curr["ema_short"]
    ema_l_now  = curr["ema_long"]
    ema_s_prev = prev["ema_short"]
    ema_l_prev = prev["ema_long"]
    rsi_now    = curr["rsi"]
    price_now  = curr["close"]

    # Crossover detection
    bullish_cross = (ema_s_prev <= ema_l_prev) and (ema_s_now > ema_l_now)
    bearish_cross = (ema_s_prev >= ema_l_prev) and (ema_s_now < ema_l_now)

    # Already in trend (no fresh cross, but confirm position)
    ema_above = ema_s_now > ema_l_now
    ema_below = ema_s_now < ema_l_now

    log.debug(
        f"EMA{EMA_SHORT}={ema_s_now:.2f} | EMA{EMA_LONG}={ema_l_now:.2f} | "
        f"RSI={rsi_now:.1f} | Cross: {'⬆️ BULL' if bullish_cross else '⬇️ BEAR' if bearish_cross else '➡️ NONE'}"
    )

    # ── Signal Logic ───────────────────────────────────────────────
    if bullish_cross and rsi_now < RSI_OVERBOUGHT:
        return StrategyResult(
            signal=Signal.BUY,
            ema_short=ema_s_now, ema_long=ema_l_now, rsi=rsi_now, price=price_now,
            reason=f"Bullish EMA cross ({EMA_SHORT}>{EMA_LONG}), RSI={rsi_now:.1f}"
        )

    if bearish_cross and rsi_now > RSI_OVERSOLD:
        return StrategyResult(
            signal=Signal.SELL,
            ema_short=ema_s_now, ema_long=ema_l_now, rsi=rsi_now, price=price_now,
            reason=f"Bearish EMA cross ({EMA_SHORT}<{EMA_LONG}), RSI={rsi_now:.1f}"
        )

    return StrategyResult(
        signal=Signal.HOLD,
        ema_short=ema_s_now, ema_long=ema_l_now, rsi=rsi_now, price=price_now,
        reason="No crossover signal"
    )
