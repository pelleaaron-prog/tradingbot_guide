# 🤖 Binance Trading Bot

Automated cryptocurrency trading bot running on Binance Spot market. 
Built for personal use with strict risk management.

## Strategy
- **Entry:** EMA 20 crosses above EMA 50 AND RSI < 65
- **Risk/Reward:** -5% Stop Loss / +10% Take Profit
- **Position Size:** 20% of available balance per trade (min $10)
- **Safety:** Daily kill switch if total loss exceeds 10%

## Requirements
- Python 3.10+
- Binance account with API Key (Read & Trade only, **NO WITHDRAWAL**)
- Telegram Bot Token (for notifications)

## Local Setup

1. **Clone repository & enter directory**
   ```bash
   cd bot
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your API keys and Telegram credentials.

4. **Run Backtest (Important!)**
   Before running live, check how the strategy performed historically:
   ```bash
   python backtest.py
   ```

5. **Start Bot**
   By default, the bot starts in `DRY_RUN=true` mode (Paper Trading).
   It will not use real money.
   ```bash
   python bot.py
   ```

## Going Live
When you are ready to trade with real money:
1. Open `.env`
2. Change `DRY_RUN=true` to `DRY_RUN=false`
3. Restart the bot.

## Deployment (Render.com)
1. Push this repository to a private GitHub repo.
2. Sign in to [Render.com](https://render.com).
3. Create a new **Background Worker**.
4. Connect your GitHub repo.
5. In the Environment Variables section on Render, add ALL the variables from your `.env` file.
6. Deploy!

---
**Disclaimer:** This software is for educational purposes. Cryptocurrency trading carries a high level of risk. Never trade with money you cannot afford to lose.
