"use client";
import { useState } from "react";

const strategies = [
  {
    id: "trend",
    name: "Trend Following",
    icon: "📈",
    tagline: "Ride the wave",
    difficulty: "Beginner",
    difficultyColor: "var(--neon-green)",
    description:
      "Follow price momentum using moving averages (EMA/SMA). Buy when short MA crosses above long MA, sell on the reverse. Best in trending markets like crypto bull runs.",
    pros: ["Simple logic", "Easy to backtest", "Works great in bull markets"],
    cons: ["Laggy signals", "Loses in sideways markets", "High drawdown in chop"],
    indicators: ["EMA 20/50", "MACD", "RSI > 50"],
    example: "if ema_20 > ema_50:\n    buy()\nelif ema_20 < ema_50:\n    sell()",
  },
  {
    id: "mean",
    name: "Mean Reversion",
    icon: "🔄",
    tagline: "Buy the dip, sell the rip",
    difficulty: "Intermediate",
    difficultyColor: "var(--neon-yellow)",
    description:
      "Bet that prices revert to the mean after extreme moves. Uses RSI, Bollinger Bands, and Z-scores to identify overbought/oversold conditions.",
    pros: ["High win rate", "Profits in ranging markets", "Clear entry/exit rules"],
    cons: ["Can fail in strong trends", "Requires tight risk management", "Works less in crypto"],
    indicators: ["RSI < 30/> 70", "Bollinger Bands", "Z-Score"],
    example: "if rsi < 30:\n    buy()  # Oversold\nelif rsi > 70:\n    sell()  # Overbought",
  },
  {
    id: "arbitrage",
    name: "Arbitrage",
    icon: "⚡",
    tagline: "Exploit price differences",
    difficulty: "Advanced",
    difficultyColor: "var(--accent-red)",
    description:
      "Profit from price differences of the same asset across different exchanges or between spot/futures. Requires fast execution, low latency, and multiple exchange APIs.",
    pros: ["Market-neutral", "Near risk-free profit", "Consistent returns"],
    cons: ["Requires capital", "Very competitive", "Needs ultra-low latency"],
    indicators: ["Price spread", "Order book depth", "Execution speed"],
    example: "spread = binance_price - okx_price\nif spread > min_profit:\n    buy_okx(); sell_binance()",
  },
];

export default function StrategySelector() {
  const [selected, setSelected] = useState("trend");

  const active = strategies.find((s) => s.id === selected);

  return (
    <div>
      {/* Strategy tabs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {strategies.map((s) => (
          <button
            key={s.id}
            id={`strategy-${s.id}`}
            className={`strategy-card ${selected === s.id ? "active" : ""}`}
            onClick={() => setSelected(s.id)}
            style={{
              padding: "16px 12px",
              borderRadius: "12px",
              border: "1px solid",
              borderColor: selected === s.id ? "var(--neon-green)" : "var(--border-card)",
              background: selected === s.id ? "rgba(0,255,136,0.06)" : "var(--bg-card)",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.3s ease",
              boxShadow: selected === s.id ? "0 0 20px rgba(0,255,136,0.1)" : "none",
            }}
          >
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>{s.icon}</div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "14px",
                color: selected === s.id ? "var(--text-primary)" : "var(--text-secondary)",
                marginBottom: "4px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {s.name}
            </div>
            <div
              style={{
                fontSize: "11px",
                fontFamily: "'JetBrains Mono', monospace",
                color: s.difficultyColor,
                opacity: 0.8,
              }}
            >
              {s.difficulty}
            </div>
          </button>
        ))}
      </div>

      {/* Detail panel */}
      {active && (
        <div
          style={{
            background: "rgba(0,255,136,0.03)",
            border: "1px solid var(--border-green)",
            borderRadius: "16px",
            padding: "28px",
            animation: "fadeInUp 0.3s ease forwards",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "20px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                background: "rgba(0,255,136,0.1)",
                border: "1px solid var(--border-green)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                flexShrink: 0,
              }}
            >
              {active.icon}
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "6px",
                }}
              >
                <h3
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "var(--text-primary)",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {active.name}
                </h3>
                <span
                  style={{
                    padding: "2px 10px",
                    borderRadius: "100px",
                    fontSize: "11px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    color: active.difficultyColor,
                    border: `1px solid ${active.difficultyColor}40`,
                    background: `${active.difficultyColor}10`,
                  }}
                >
                  {active.difficulty}
                </span>
              </div>
              <p style={{ color: "var(--neon-green)", fontSize: "13px", fontStyle: "italic", opacity: 0.8 }}>
                {active.tagline}
              </p>
            </div>
          </div>

          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "15px",
              lineHeight: 1.7,
              marginBottom: "24px",
            }}
          >
            {active.description}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            {/* Pros */}
            <div
              style={{
                background: "rgba(0,255,136,0.04)",
                border: "1px solid rgba(0,255,136,0.12)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  color: "var(--neon-green)",
                  fontWeight: 700,
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                ✓ Pros
              </div>
              {active.pros.map((p, i) => (
                <div
                  key={i}
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                    marginBottom: "6px",
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "var(--neon-green)", flexShrink: 0 }}>→</span>
                  {p}
                </div>
              ))}
            </div>

            {/* Cons */}
            <div
              style={{
                background: "rgba(255,68,68,0.04)",
                border: "1px solid rgba(255,68,68,0.12)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  color: "var(--accent-red)",
                  fontWeight: 700,
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                ✗ Cons
              </div>
              {active.cons.map((c, i) => (
                <div
                  key={i}
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                    marginBottom: "6px",
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "var(--accent-red)", flexShrink: 0 }}>→</span>
                  {c}
                </div>
              ))}
            </div>

            {/* Indicators */}
            <div
              style={{
                background: "rgba(245,196,0,0.04)",
                border: "1px solid rgba(245,196,0,0.12)",
                borderRadius: "12px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  color: "var(--neon-yellow)",
                  fontWeight: 700,
                  fontSize: "12px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                📡 Indicators
              </div>
              {active.indicators.map((ind, i) => (
                <div
                  key={i}
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                    marginBottom: "6px",
                    display: "flex",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "var(--neon-yellow)", flexShrink: 0 }}>→</span>
                  <code
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "12px",
                    }}
                  >
                    {ind}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Quick logic */}
          <div>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "12px",
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: "8px",
                letterSpacing: "0.05em",
              }}
            >
              // Quick logic preview
            </div>
            <div
              style={{
                background: "#010a05",
                border: "1px solid var(--border-green)",
                borderRadius: "8px",
                padding: "16px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "13px",
                color: "var(--neon-green)",
                whiteSpace: "pre",
                lineHeight: 1.8,
              }}
            >
              {active.example}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
