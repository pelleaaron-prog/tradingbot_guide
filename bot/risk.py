"""
risk.py — Risk management: position sizing, stop-loss, take-profit, kill switch

Rules:
  1. Never risk more than POSITION_SIZE_PCT of balance per trade
  2. Stop-loss: exit if price drops STOP_LOSS_PCT below entry
  3. Take-profit: exit if price rises TAKE_PROFIT_PCT above entry
  4. Kill switch: stop all trading if daily loss > MAX_DAILY_LOSS_PCT
"""

from dataclasses import dataclass, field
from datetime import date
from logger import get_logger
from config import (
    POSITION_SIZE_PCT,
    STOP_LOSS_PCT,
    TAKE_PROFIT_PCT,
    MAX_DAILY_LOSS_PCT,
    TRADE_AMOUNT_USDT,
)

log = get_logger("risk")


@dataclass
class Position:
    """Tracks an open position."""
    entry_price:   float
    quantity:      float          # BTC amount
    usdt_spent:    float          # actual USDT used
    stop_loss:     float = field(init=False)
    take_profit:   float = field(init=False)

    def __post_init__(self):
        self.stop_loss   = self.entry_price * (1 - STOP_LOSS_PCT)
        self.take_profit = self.entry_price * (1 + TAKE_PROFIT_PCT)
        log.info(
            f"Position opened: entry=${self.entry_price:,.2f} | "
            f"SL=${self.stop_loss:,.2f} | TP=${self.take_profit:,.2f} | "
            f"Qty={self.quantity:.6f} BTC"
        )

    def pnl(self, current_price: float) -> tuple[float, float]:
        """Returns (pnl_usdt, pnl_pct)"""
        current_value = self.quantity * current_price
        pnl_usdt = current_value - self.usdt_spent
        pnl_pct  = (pnl_usdt / self.usdt_spent) * 100
        return pnl_usdt, pnl_pct


class RiskManager:
    def __init__(self):
        self.position:         Position | None = None
        self.daily_pnl:        float = 0.0
        self.daily_pnl_date:   date  = date.today()
        self.killed:           bool  = False
        self.daily_trade_count: int  = 0
        self.daily_wins:       int   = 0
        self.daily_losses:     int   = 0

    def _reset_daily_if_needed(self):
        today = date.today()
        if today != self.daily_pnl_date:
            log.info(f"New day — resetting daily stats (prev PnL: {self.daily_pnl:+.2f} USDT)")
            self.daily_pnl         = 0.0
            self.daily_pnl_date    = today
            self.daily_trade_count = 0
            self.daily_wins        = 0
            self.daily_losses      = 0
            self.killed            = False  # reset kill switch at new day

    def calculate_trade_size(self, balance_usdt: float) -> float:
        """
        Returns USDT amount to spend on next trade.
        Uses lower of: configured TRADE_AMOUNT_USDT or POSITION_SIZE_PCT of balance.
        Minimum $10 enforced (Binance requirement).
        """
        size = min(TRADE_AMOUNT_USDT, balance_usdt * POSITION_SIZE_PCT)
        size = max(10.0, size)  # Binance minimum notional
        if size > balance_usdt * 0.95:
            log.warning("Trade size would exceed 95% of balance — capping")
            size = balance_usdt * 0.95
        return round(size, 2)

    def open_position(self, entry_price: float, quantity: float, usdt_spent: float) -> Position:
        if self.position:
            raise RuntimeError("Cannot open position — already in a trade!")
        self._reset_daily_if_needed()
        self.position = Position(entry_price, quantity, usdt_spent)
        return self.position

    def close_position(self, exit_price: float) -> tuple[float, float, str]:
        """
        Close current position. Returns (pnl_usdt, pnl_pct, reason).
        reason = 'take_profit' | 'stop_loss' | 'signal'
        """
        if not self.position:
            raise RuntimeError("No open position to close")

        pnl_usdt, pnl_pct = self.position.pnl(exit_price)
        self.daily_pnl += pnl_usdt
        self.daily_trade_count += 1

        if pnl_usdt >= 0:
            self.daily_wins += 1
        else:
            self.daily_losses += 1

        self.position = None
        log.info(f"Position closed: PnL={pnl_usdt:+.2f} USDT ({pnl_pct:+.2f}%) | Daily PnL={self.daily_pnl:+.2f}")
        return pnl_usdt, pnl_pct

    def check_exit_conditions(self, current_price: float) -> str | None:
        """
        Check if open position should be closed.
        Returns exit reason string or None if hold.
        """
        if not self.position:
            return None
        if current_price <= self.position.stop_loss:
            log.warning(f"STOP LOSS triggered: price={current_price:.2f} <= SL={self.position.stop_loss:.2f}")
            return "stop_loss"
        if current_price >= self.position.take_profit:
            log.info(f"TAKE PROFIT triggered: price={current_price:.2f} >= TP={self.position.take_profit:.2f}")
            return "take_profit"
        return None

    def check_kill_switch(self, balance_usdt: float) -> bool:
        """
        Returns True if trading should be halted for the day.
        Activates if daily loss exceeds MAX_DAILY_LOSS_PCT of starting balance.
        """
        self._reset_daily_if_needed()
        if self.killed:
            return True
        # Approximate starting balance = current + abs(loss)
        loss_pct = abs(self.daily_pnl) / max(balance_usdt, 1) if self.daily_pnl < 0 else 0
        if loss_pct >= MAX_DAILY_LOSS_PCT:
            log.critical(f"KILL SWITCH: daily loss {loss_pct*100:.1f}% >= limit {MAX_DAILY_LOSS_PCT*100:.1f}%")
            self.killed = True
            return True
        return False

    @property
    def has_position(self) -> bool:
        return self.position is not None

    def status(self) -> dict:
        return {
            "has_position":   self.has_position,
            "entry_price":    self.position.entry_price if self.position else None,
            "stop_loss":      self.position.stop_loss   if self.position else None,
            "take_profit":    self.position.take_profit if self.position else None,
            "daily_pnl":      self.daily_pnl,
            "daily_trades":   self.daily_trade_count,
            "daily_wins":     self.daily_wins,
            "daily_losses":   self.daily_losses,
            "killed":         self.killed,
        }
