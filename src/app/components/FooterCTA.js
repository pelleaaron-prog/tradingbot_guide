"use client";

export default function FooterCTA() {
  return (
    <footer
      id="footer"
      style={{
        background: "linear-gradient(180deg, var(--bg-primary) 0%, #010a05 100%)",
        borderTop: "1px solid var(--border-card)",
        padding: "80px 24px 40px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "50%",
          transform: "translateX(-50%)",
          width: "500px",
          height: "200px",
          background: "radial-gradient(ellipse, rgba(0,255,136,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center", position: "relative" }}>
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(0,255,136,0.08)",
            border: "1px solid rgba(0,255,136,0.2)",
            borderRadius: "100px",
            padding: "6px 16px",
            marginBottom: "24px",
            fontSize: "12px",
            fontFamily: "'JetBrains Mono', monospace",
            color: "var(--neon-green)",
          }}
        >
          🤖 100% FREE — No Paywall
        </div>

        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 900,
            marginBottom: "20px",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}
        >
          Start coding your{" "}
          <span className="text-gradient">bot today.</span>
        </h2>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "17px",
            lineHeight: 1.7,
            marginBottom: "40px",
            maxWidth: "480px",
            margin: "0 auto 40px",
          }}
        >
          You have the code. You have the guide. The only thing left is to open your terminal and type{" "}
          <code
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--neon-green)",
              background: "rgba(0,255,136,0.08)",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "14px",
            }}
          >
            pip install ccxt
          </code>
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "64px",
          }}
        >
          <a
            href="#step-1"
            id="footer-start-btn"
            className="btn-primary"
            style={{
              padding: "16px 40px",
              borderRadius: "12px",
              fontSize: "17px",
              textDecoration: "none",
              display: "inline-block",
            }}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("step-1")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            🚀 Start Building Now
          </a>
          <a
            href="https://github.com/ccxt/ccxt"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{
              padding: "16px 32px",
              borderRadius: "12px",
              fontSize: "15px",
              textDecoration: "none",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
            }}
          >
            📦 View ccxt Docs
          </a>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, var(--border-green), transparent)",
            marginBottom: "32px",
          }}
        />

        {/* Bottom meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "24px",
            flexWrap: "wrap",
            color: "var(--text-muted)",
            fontSize: "12px",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span>Built with Next.js & ❤️</span>
          <span style={{ color: "var(--border-green)" }}>•</span>
          <span>Dark Mode — Always</span>
          <span style={{ color: "var(--border-green)" }}>•</span>
          <span>© 2025 TradingBot Guide</span>
        </div>

        <p
          style={{
            marginTop: "20px",
            color: "var(--text-muted)",
            fontSize: "11px",
            lineHeight: 1.6,
            fontFamily: "'JetBrains Mono', monospace",
            maxWidth: "500px",
            margin: "20px auto 0",
          }}
        >
          ⚠️ Educational purposes only. Not financial advice. Trading involves risk of loss.
        </p>
      </div>
    </footer>
  );
}
