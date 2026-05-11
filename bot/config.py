"""
config.py — Central configuration loader
Reads all settings from .env file via python-dotenv.
NEVER hardcode API keys here. Always use .env
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── Exchange ────────────────────────────────────────────────
BINANCE_API_KEY    = os.getenv("BINANCE_API_KEY", "")
BINANCE_SECRET     = os.getenv("BINANCE_SECRET", "")

# ── Trading Parameters ───────────────────────────────────────
SYMBOL             = os.getenv("SYMBOL", "BTC/USDT")
TIMEFRAME          = os.getenv("TIMEFRAME", "1h")
TRADE_AMOUNT_USDT  = float(os.getenv("TRADE_AMOUNT_USDT", "10"))   # $ per trade
POSITION_SIZE_PCT  = float(os.getenv("POSITION_SIZE_PCT", "0.20")) # 20% of balance

# ── Risk Management ──────────────────────────────────────────
STOP_LOSS_PCT      = float(os.getenv("STOP_LOSS_PCT", "0.05"))     # -5% stop loss
TAKE_PROFIT_PCT    = float(os.getenv("TAKE_PROFIT_PCT", "0.10"))   # +10% take profit
MAX_DAILY_LOSS_PCT = float(os.getenv("MAX_DAILY_LOSS_PCT", "0.10")) # -10% daily kill switch

# ── Strategy Params ──────────────────────────────────────────
EMA_SHORT          = int(os.getenv("EMA_SHORT", "20"))
EMA_LONG           = int(os.getenv("EMA_LONG", "50"))
RSI_PERIOD         = int(os.getenv("RSI_PERIOD", "14"))
RSI_OVERSOLD       = float(os.getenv("RSI_OVERSOLD", "35"))
RSI_OVERBOUGHT     = float(os.getenv("RSI_OVERBOUGHT", "65"))
CANDLE_LIMIT       = int(os.getenv("CANDLE_LIMIT", "200"))         # historical candles

# ── Telegram ─────────────────────────────────────────────────
TELEGRAM_TOKEN     = os.getenv("TELEGRAM_TOKEN", "")
TELEGRAM_CHAT_ID   = os.getenv("TELEGRAM_CHAT_ID", "")

# ── Mode ─────────────────────────────────────────────────────
DRY_RUN            = os.getenv("DRY_RUN", "true").lower() == "true"
LOG_LEVEL          = os.getenv("LOG_LEVEL", "INFO")

# ── Validation ───────────────────────────────────────────────
def validate():
    """Check required config values are present."""
    errors = []
    if not BINANCE_API_KEY:
        errors.append("BINANCE_API_KEY is missing")
    if not BINANCE_SECRET:
        errors.append("BINANCE_SECRET is missing")
    if not TELEGRAM_TOKEN:
        errors.append("TELEGRAM_TOKEN is missing (required for alerts)")
    if not TELEGRAM_CHAT_ID:
        errors.append("TELEGRAM_CHAT_ID is missing")
    if TRADE_AMOUNT_USDT < 10:
        errors.append(f"TRADE_AMOUNT_USDT={TRADE_AMOUNT_USDT} is below Binance minimum ($10)")
    if errors:
        raise ValueError("Config errors:\n" + "\n".join(f"  - {e}" for e in errors))

def summary():
    """Print config summary (without secrets)."""
    mode = "🔴 LIVE TRADING" if not DRY_RUN else "🟡 PAPER TRADING (DRY RUN)"
    return f"""
╔══════════════════════════════════════╗
║       TRADING BOT CONFIGURATION     ║
╠══════════════════════════════════════╣
║  Mode:        {mode}
║  Symbol:      {SYMBOL}
║  Timeframe:   {TIMEFRAME}
║  Trade Size:  ${TRADE_AMOUNT_USDT:.2f} USDT
║  EMA:         {EMA_SHORT}/{EMA_LONG}
║  RSI Period:  {RSI_PERIOD}
║  Stop Loss:   -{STOP_LOSS_PCT*100:.1f}%
║  Take Profit: +{TAKE_PROFIT_PCT*100:.1f}%
║  API Key:     {BINANCE_API_KEY[:8]}...
╚══════════════════════════════════════╝"""
