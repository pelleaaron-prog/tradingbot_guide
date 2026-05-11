"""
notifier.py — Telegram notifications for every bot event.
Alerts are sent for: trade execution, errors, daily summary, startup.
"""

import requests
from logger import get_logger
from config import TELEGRAM_TOKEN, TELEGRAM_CHAT_ID, SYMBOL, DRY_RUN

log = get_logger("notifier")

BASE_URL = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}"


def _send(text: str) -> bool:
    """Send a message to Telegram. Returns True on success."""
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        log.warning("Telegram not configured — skipping notification")
        return False
    try:
        resp = requests.post(
            f"{BASE_URL}/sendMessage",
            json={"chat_id": TELEGRAM_CHAT_ID, "text": text, "parse_mode": "HTML"},
            timeout=10,
        )
        resp.raise_for_status()
        return True
    except Exception as e:
        log.error(f"Telegram send failed: {e}")
        return False


def send_startup(config_summary: str):
    mode = "🔴 LIVE" if not DRY_RUN else "🟡 PAPER"
    _send(
        f"🤖 <b>Trading Bot Started</b>\n"
        f"Mode: <b>{mode}</b>\n"
        f"Pair: <b>{SYMBOL}</b>\n\n"
        f"<pre>{config_summary}</pre>"
    )


def send_buy(price: float, qty: float, usdt_spent: float, ema_short: float, ema_long: float, rsi: float):
    mode = "📄 PAPER" if DRY_RUN else "✅ LIVE"
    _send(
        f"🟢 <b>BUY Signal Executed</b> [{mode}]\n"
        f"Pair:     <b>{SYMBOL}</b>\n"
        f"Price:    <b>${price:,.2f}</b>\n"
        f"Qty:      <b>{qty:.6f} BTC</b>\n"
        f"Spent:    <b>${usdt_spent:.2f} USDT</b>\n"
        f"─────────────────\n"
        f"EMA {ema_short:.2f} &gt; EMA {ema_long:.2f}\n"
        f"RSI: {rsi:.1f}"
    )


def send_sell(price: float, qty: float, usdt_received: float, pnl: float, pnl_pct: float, reason: str):
    mode = "📄 PAPER" if DRY_RUN else "✅ LIVE"
    emoji = "🟢" if pnl >= 0 else "🔴"
    _send(
        f"{emoji} <b>SELL Executed</b> [{mode}]\n"
        f"Pair:     <b>{SYMBOL}</b>\n"
        f"Price:    <b>${price:,.2f}</b>\n"
        f"Qty:      <b>{qty:.6f} BTC</b>\n"
        f"Received: <b>${usdt_received:.2f} USDT</b>\n"
        f"PnL:      <b>{'+' if pnl >= 0 else ''}{pnl:.2f} USDT ({pnl_pct:+.2f}%)</b>\n"
        f"Reason:   <b>{reason}</b>"
    )


def send_daily_summary(total_trades: int, wins: int, losses: int, total_pnl: float, balance: float):
    win_rate = (wins / total_trades * 100) if total_trades > 0 else 0
    emoji = "📈" if total_pnl >= 0 else "📉"
    _send(
        f"{emoji} <b>Daily Summary</b>\n"
        f"Trades:   {total_trades} (W:{wins} / L:{losses})\n"
        f"Win Rate: {win_rate:.1f}%\n"
        f"PnL:      <b>{'+' if total_pnl >= 0 else ''}{total_pnl:.2f} USDT</b>\n"
        f"Balance:  <b>${balance:.2f} USDT</b>"
    )


def send_error(error_msg: str):
    _send(f"⚠️ <b>Bot Error</b>\n<code>{error_msg[:500]}</code>")


def send_kill_switch(reason: str, balance: float):
    _send(
        f"🚨 <b>KILL SWITCH ACTIVATED</b>\n"
        f"Reason: {reason}\n"
        f"Balance: ${balance:.2f} USDT\n"
        f"Bot has stopped trading. Check logs!"
    )


def send_signal_skip(signal_type: str, rsi: float, reason: str):
    """Log skipped signals (no message sent to avoid spam, only logged)."""
    log.info(f"Signal {signal_type} skipped — RSI={rsi:.1f} — {reason}")
