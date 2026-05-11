"use client";
import { useState } from "react";
import CodeBlock from "./CodeBlock";
import StrategySelector from "./StrategySelector";

const STEP1_CODE = `# Step 1: Choose your market
# Supported by ccxt library (500+ exchanges)

import ccxt

# Crypto: BTC, ETH, SOL, etc.
crypto_markets = ["BTC/USDT", "ETH/USDT", "SOL/USDT"]

# Stocks: Use alpaca-trade-api or yfinance
# Forex: Use ccxt with forex-compatible exchange

# Choose your exchange
exchange = ccxt.binance({
    'apiKey': 'YOUR_API_KEY',        # From exchange settings
    'secret': 'YOUR_SECRET_KEY',
    'options': {'defaultType': 'spot'}
})

# Test connection
markets = exchange.load_markets()
print(f"Connected! {len(markets)} markets available")

# Check balance
balance = exchange.fetch_balance()
usdt_balance = balance['USDT']['free']
print(f"Available capital: {usdt_balance} USDT")`;

const STEP2_CODE = `# Step 2: Connect to exchange & fetch OHLCV data
import ccxt
import pandas as pd

exchange = ccxt.binance({
    'apiKey': 'YOUR_API_KEY',
    'secret': 'YOUR_SECRET_KEY',
})

def fetch_ohlcv(symbol, timeframe='1h', limit=200):
    """Fetch historical candlestick data."""
    ohlcv = exchange.fetch_ohlcv(symbol, timeframe, limit=limit)
    df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
    df.set_index('timestamp', inplace=True)
    return df

# Fetch BTC/USDT hourly data
df = fetch_ohlcv('BTC/USDT', '1h', 200)
print(f"Fetched {len(df)} candles")
print(df.tail())

# Also fetch real-time ticker
ticker = exchange.fetch_ticker('BTC/USDT')
print(f"\\nCurrent BTC price: \${ticker['last']:,.2f}")
print(f"24h Change: {ticker['percentage']:.2f}%")
print(f"24h Volume: \${ticker['quoteVolume']:,.0f}")`;

const STEP3_CODE = `# Step 3: EMA Crossover Strategy (Trend Following)
import ccxt
import pandas as pd
import ta  # pip install ta

exchange = ccxt.binance({'apiKey': '...', 'secret': '...'})

def calculate_signals(df):
    """Add technical indicators and generate signals."""
    # Calculate EMAs
    df['ema_20'] = ta.trend.EMAIndicator(df['close'], window=20).ema_indicator()
    df['ema_50'] = ta.trend.EMAIndicator(df['close'], window=50).ema_indicator()

    # RSI for confirmation
    df['rsi'] = ta.momentum.RSIIndicator(df['close'], window=14).rsi()

    # Generate signal: 1 = BUY, -1 = SELL, 0 = HOLD
    df['signal'] = 0
    df.loc[(df['ema_20'] > df['ema_50']) & (df['rsi'] < 70), 'signal'] = 1   # BUY
    df.loc[(df['ema_20'] < df['ema_50']) & (df['rsi'] > 30), 'signal'] = -1  # SELL
    return df

def execute_trade(signal, symbol, usdt_amount=100):
    """Execute buy or sell order."""
    ticker = exchange.fetch_ticker(symbol)
    price = ticker['last']

    if signal == 1:  # BUY
        qty = usdt_amount / price
        order = exchange.create_market_buy_order(symbol, qty)
        print(f"BUY {qty:.6f} {symbol} @ \${price:,.2f}")
        return order

    elif signal == -1:  # SELL
        balance = exchange.fetch_balance()
        base_asset = symbol.split('/')[0]
        qty = balance[base_asset]['free']
        if qty > 0:
            order = exchange.create_market_sell_order(symbol, qty)
            print(f"SELL {qty:.6f} {symbol} @ \${price:,.2f}")
            return order

    return None  # HOLD`;

const STEP4_CODE = `# Step 4: Automated execution with scheduling
import ccxt
import schedule
import time
import logging
import os
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler('bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Config (use env variables in production!)
CONFIG = {
    'symbol': 'BTC/USDT',
    'timeframe': '1h',
    'trade_amount_usdt': 100,
    'max_positions': 1,
    'stop_loss_pct': 0.05,   # 5% stop loss
    'take_profit_pct': 0.10,  # 10% take profit
}

exchange = ccxt.binance({
    'apiKey': os.getenv('BINANCE_API_KEY'),
    'secret': os.getenv('BINANCE_SECRET'),
})

def run_bot():
    """Main bot loop — runs every hour."""
    logger.info(f"Bot tick — {datetime.now()}")
    try:
        df = fetch_ohlcv(CONFIG['symbol'], CONFIG['timeframe'])
        df = calculate_signals(df)
        latest_signal = df['signal'].iloc[-1]

        logger.info(f"Signal: {latest_signal} | Price: \${df['close'].iloc[-1]:,.2f}")
        execute_trade(latest_signal, CONFIG['symbol'], CONFIG['trade_amount_usdt'])

    except Exception as e:
        logger.error(f"Bot error: {e}")

# Schedule bot to run every hour
schedule.every().hour.at(":00").do(run_bot)

logger.info("Bot started! Waiting for next execution...")
run_bot()  # Run immediately on start

while True:
    schedule.run_pending()
    time.sleep(30)`;

const steps = [
  {
    id: 1,
    icon: "📊",
    title: "Choose Your Market",
    subtitle: "Crypto, Stocks, or Forex?",
    time: "~15 min",
    desc: "Before writing a single line of code, you need to decide WHAT you're trading. Each market has different mechanics, data sources, and regulations. Choose wisely — it determines everything else.",
    code: STEP1_CODE,
    filename: "01_setup_market.py",
    checklist: [
      "Choose between Crypto, Stocks, or Forex",
      "Create exchange account (Binance/Alpaca/etc)",
      "Enable API access in exchange settings",
      "Set API permissions: Read + Trade only, NO withdrawal",
      "Store API keys in .env file, NOT in code",
    ],
    tags: ["ccxt", "binance", "alpaca", "yfinance"],
    extra: null,
  },
  {
    id: 2,
    icon: "🔗",
    title: "Connect & Fetch Data",
    subtitle: "Real-time + historical OHLCV",
    time: "~30 min",
    desc: "Data is the bloodstream of your bot. You need historical OHLCV (Open/High/Low/Close/Volume) to calculate indicators, and real-time prices to execute trades. We use the ccxt library — it works with 500+ exchanges via one unified API.",
    code: STEP2_CODE,
    filename: "02_fetch_data.py",
    checklist: [
      "Install dependencies: pip install ccxt pandas",
      "Test API connection successfully",
      "Fetch at least 200 historical candles",
      "Verify OHLCV data format is correct",
      "Implement error handling for network failures",
    ],
    tags: ["pandas", "OHLCV", "websocket", "REST API"],
    extra: null,
  },
  {
    id: 3,
    icon: "🧠",
    title: "Build Your Strategy",
    subtitle: "Pick your approach",
    time: "~1-2 hrs",
    desc: "This is the brain of your bot. Choose a strategy that matches your risk tolerance and market conditions. There's no 'best' strategy — only strategies that suit specific market environments.",
    code: STEP3_CODE,
    filename: "03_strategy.py",
    checklist: [
      "Install ta library: pip install ta",
      "Choose strategy: Trend / Mean Reversion / Arbitrage",
      "Calculate at least 2 indicator confluences",
      "Backtest on 6+ months of historical data",
      "Measure Sharpe Ratio & Max Drawdown",
      "Define clear entry AND exit rules",
    ],
    tags: ["EMA", "RSI", "MACD", "Bollinger"],
    extra: <StrategySelector />,
  },
  {
    id: 4,
    icon: "🚀",
    title: "Deploy & Run 24/7",
    subtitle: "From localhost to live bot",
    time: "~1 hr",
    desc: "Your strategy works locally — now make it run 24/7 in the cloud. We'll use Python's schedule library for timing, add proper logging, and deploy to a VPS or cloud service. This is where your bot becomes a real algo trading system.",
    code: STEP4_CODE,
    filename: "04_deploy_bot.py",
    checklist: [
      "Paper trade for 2+ weeks minimum",
      "Deploy to VPS (DigitalOcean $4/mo or Render free tier)",
      "Set API keys as environment variables",
      "Add stop-loss and take-profit logic",
      "Set up Telegram alerts for trades",
      "Monitor logs daily for the first month",
    ],
    tags: ["schedule", "VPS", "Render", "DigitalOcean"],
    extra: (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginTop: "8px",
        }}
      >
        {[
          { name: "Render.com", price: "Free tier", tag: "Easiest", color: "var(--neon-green)" },
          { name: "DigitalOcean", price: "$4/mo", tag: "Reliable", color: "var(--neon-yellow)" },
          { name: "Railway", price: "$5/mo", tag: "Dev-friendly", color: "#7c3aed" },
          { name: "AWS EC2", price: "$3.50/mo", tag: "Enterprise", color: "#ff9900" },
        ].map((opt, i) => (
          <div
            key={i}
            className="card-hover"
            style={{
              padding: "16px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-card)",
              borderRadius: "10px",
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-primary)", marginBottom: "4px" }}>
              {opt.name}
            </div>
            <div style={{ fontSize: "12px", color: opt.color, fontFamily: "'JetBrains Mono', monospace", marginBottom: "4px" }}>
              {opt.price}
            </div>
            <div
              style={{
                display: "inline-block",
                fontSize: "10px",
                padding: "2px 8px",
                borderRadius: "100px",
                background: `${opt.color}15`,
                color: opt.color,
                border: `1px solid ${opt.color}30`,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {opt.tag}
            </div>
          </div>
        ))}
      </div>
    ),
  },
];

export default function StepCards({ currentStep, setCurrentStep, checkedItems, setCheckedItems }) {
  const [expanded, setExpanded] = useState(1);

  const toggleCheck = (stepId, idx) => {
    const key = `${stepId}-${idx}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExpand = (stepId) => {
    setExpanded(expanded === stepId ? null : stepId);
    setCurrentStep(stepId);
    setTimeout(() => {
      document.getElementById(`step-${stepId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px 40px" }}>
      {steps.map((step, idx) => {
        const isOpen = expanded === step.id;
        const stepCheckedCount = step.checklist.filter((_, i) => checkedItems[`${step.id}-${i}`]).length;
        const allChecked = stepCheckedCount === step.checklist.length;

        return (
          <div
            key={step.id}
            id={`step-${step.id}`}
            style={{ marginBottom: "16px" }}
          >
            {/* Step header */}
            <button
              id={`step-header-${step.id}`}
              onClick={() => handleExpand(step.id)}
              style={{
                width: "100%",
                background: isOpen
                  ? "rgba(0,255,136,0.06)"
                  : "var(--bg-card)",
                border: `1px solid ${isOpen ? "var(--neon-green)" : "var(--border-card)"}`,
                borderRadius: isOpen ? "16px 16px 0 0" : "16px",
                padding: "20px 24px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                textAlign: "left",
                transition: "all 0.3s ease",
                boxShadow: isOpen ? "0 0 20px rgba(0,255,136,0.08)" : "none",
              }}
            >
              {/* Step number */}
              <div
                className="step-badge"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  flexShrink: 0,
                  background: allChecked
                    ? "rgba(0,255,136,0.2)"
                    : "rgba(0,255,136,0.06)",
                  border: `1px solid ${allChecked ? "var(--neon-green)" : "var(--border-green)"}`,
                }}
              >
                {allChecked ? "✅" : step.icon}
              </div>

              {/* Title area */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      letterSpacing: "0.1em",
                    }}
                  >
                    STEP {step.id}
                  </span>
                  <span
                    style={{
                      background: "rgba(245,196,0,0.1)",
                      border: "1px solid rgba(245,196,0,0.2)",
                      color: "var(--neon-yellow)",
                      padding: "2px 8px",
                      borderRadius: "100px",
                      fontSize: "10px",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    ⏱ {step.time}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "20px",
                    fontWeight: 800,
                    color: isOpen ? "var(--text-primary)" : "var(--text-secondary)",
                    marginTop: "2px",
                    letterSpacing: "-0.01em",
                    transition: "color 0.3s ease",
                  }}
                >
                  {step.title}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "2px" }}>
                  {step.subtitle}
                </div>
              </div>

              {/* Progress & chevron */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: allChecked ? "var(--neon-green)" : "var(--text-muted)",
                  }}
                >
                  {stepCheckedCount}/{step.checklist.length}
                </span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 0.3s ease",
                    color: isOpen ? "var(--neon-green)" : "var(--text-muted)",
                  }}
                >
                  <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </button>

            {/* Step content */}
            {isOpen && (
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--neon-green)",
                  borderTop: "none",
                  borderRadius: "0 0 16px 16px",
                  padding: "28px 24px 32px",
                  animation: "fadeInUp 0.3s ease forwards",
                }}
              >
                {/* Description */}
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "15px",
                    lineHeight: 1.8,
                    marginBottom: "28px",
                    paddingLeft: "16px",
                    borderLeft: "3px solid rgba(0,255,136,0.3)",
                  }}
                >
                  {step.desc}
                </p>

                {/* Tags */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
                  {step.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "4px 12px",
                        background: "rgba(0,255,136,0.06)",
                        border: "1px solid rgba(0,255,136,0.15)",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "var(--neon-green)",
                        opacity: 0.8,
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Code block */}
                <div style={{ marginBottom: "28px" }}>
                  <CodeBlock code={step.code} filename={step.filename} />
                </div>

                {/* Extra content (strategy selector / deploy options) */}
                {step.extra && (
                  <div style={{ marginBottom: "28px" }}>
                    {step.extra}
                  </div>
                )}

                {/* Checklist */}
                <div
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid var(--border-card)",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <div
                    style={{
                      color: "var(--neon-green)",
                      fontWeight: 700,
                      fontSize: "12px",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      marginBottom: "16px",
                      fontFamily: "'JetBrains Mono', monospace",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>✓ Checklist</span>
                    <span
                      style={{
                        background: allChecked ? "rgba(0,255,136,0.2)" : "rgba(0,255,136,0.06)",
                        border: "1px solid rgba(0,255,136,0.2)",
                        padding: "2px 8px",
                        borderRadius: "100px",
                        fontSize: "10px",
                      }}
                    >
                      {stepCheckedCount}/{step.checklist.length} done
                    </span>
                  </div>

                  {step.checklist.map((item, i) => {
                    const checked = !!checkedItems[`${step.id}-${i}`];
                    return (
                      <label
                        key={i}
                        className="checklist-item"
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          padding: "10px 0",
                          cursor: "pointer",
                          borderBottom: i < step.checklist.length - 1 ? "1px solid rgba(0,255,136,0.06)" : "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`check-${step.id}-${i}`}
                          checked={checked}
                          onChange={() => toggleCheck(step.id, i)}
                          style={{ marginTop: "2px", flexShrink: 0 }}
                        />
                        <span
                          style={{
                            color: checked ? "var(--text-muted)" : "var(--text-secondary)",
                            fontSize: "14px",
                            lineHeight: 1.5,
                            textDecoration: checked ? "line-through" : "none",
                            transition: "all 0.2s ease",
                          }}
                        >
                          {item}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Next step button */}
                {step.id < 4 && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
                    <button
                      id={`next-step-${step.id}`}
                      className="btn-primary"
                      onClick={() => handleExpand(step.id + 1)}
                      style={{
                        padding: "12px 28px",
                        borderRadius: "10px",
                        fontSize: "14px",
                      }}
                    >
                      Next: Step {step.id + 1} →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
