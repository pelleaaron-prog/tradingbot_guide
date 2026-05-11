"use client";

const warnings = [
  {
    icon: "📉",
    title: "Most bots lose money",
    desc: "Studies show 70–80% of retail algo traders lose money. Backtesting is not a guarantee of future performance.",
  },
  {
    icon: "⚡",
    title: "Markets are not static",
    desc: "A strategy that works for 6 months can stop working overnight. Markets adapt. You need to adapt too.",
  },
  {
    icon: "💸",
    title: "Start with paper trading",
    desc: "Never deploy real money until you've run at least 1–3 months of live paper trading with consistent results.",
  },
  {
    icon: "🔒",
    title: "Security is non-negotiable",
    desc: "Never store API keys in plaintext. Use environment variables. Enable IP restrictions on your exchange.",
  },
  {
    icon: "⚖️",
    title: "Check regulations",
    desc: "Algorithmic trading may be regulated in your country. Check local laws and exchange Terms of Service.",
  },
  {
    icon: "🧪",
    title: "Risk management first",
    desc: "Set a max drawdown limit. If your bot loses more than 10–15% of capital, shut it down and analyze.",
  },
];

export default function RealTalkSection() {
  return (
    <section
      id="real-talk"
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "80px 24px",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "48px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255,68,68,0.08)",
            border: "1px solid rgba(255,68,68,0.25)",
            borderRadius: "100px",
            padding: "6px 16px",
            marginBottom: "20px",
            fontSize: "12px",
            fontFamily: "'JetBrains Mono', monospace",
            color: "var(--accent-red)",
            letterSpacing: "0.05em",
          }}
        >
          ⚠️ REAL TALK — READ THIS
        </div>
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(28px, 4vw, 44px)",
            fontWeight: 900,
            marginBottom: "16px",
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Before You Deploy with{" "}
          <span className="text-gradient-yellow">Real Money</span>
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "16px", maxWidth: "500px", margin: "0 auto", lineHeight: 1.7 }}>
          The hype is real. The risks are realer. Here's what no YouTube tutorial will tell you.
        </p>
      </div>

      {/* Warning card */}
      <div
        className="warning-card"
        style={{
          borderRadius: "20px",
          padding: "40px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: "linear-gradient(90deg, var(--accent-red), var(--neon-yellow), var(--neon-green))",
          }}
        />

        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            fontSize: "120px",
            opacity: 0.03,
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          ⚠️
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
          }}
        >
          {warnings.map((w, i) => (
            <div
              key={i}
              className="card-hover"
              style={{
                display: "flex",
                gap: "16px",
                padding: "20px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "12px",
                border: "1px solid rgba(255,68,68,0.1)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  fontSize: "28px",
                  flexShrink: 0,
                  lineHeight: 1,
                  marginTop: "2px",
                }}
              >
                {w.icon}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "var(--text-primary)",
                    marginBottom: "6px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {w.title}
                </div>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  {w.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom disclaimer */}
        <div
          style={{
            marginTop: "32px",
            padding: "16px 20px",
            background: "rgba(0,0,0,0.4)",
            borderRadius: "10px",
            border: "1px solid rgba(255,68,68,0.15)",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "18px", flexShrink: 0 }}>📋</span>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "12px",
              lineHeight: 1.7,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span style={{ color: "var(--accent-red)" }}>DISCLAIMER:</span> This guide is for
            educational purposes only. Nothing here is financial advice. Trading involves
            substantial risk of loss. Past performance does not guarantee future results.
            Only trade with capital you can afford to lose entirely.
          </p>
        </div>
      </div>
    </section>
  );
}
