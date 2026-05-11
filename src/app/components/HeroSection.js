"use client";
import { useState, useEffect } from "react";

const headlines = [
  "Build Your Algo Trading Bot",
  "Automate Your Trading Strategy",
  "Code Your Passive Income Engine",
];

export default function HeroSection({ onStart }) {
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);
  const [stats, setStats] = useState({ users: 0, bots: 0, trades: 0 });

  // Typewriter effect
  useEffect(() => {
    const target = headlines[headlineIdx];
    let i = 0;
    setDisplayed("");
    setTyping(true);

    const interval = setInterval(() => {
      if (i <= target.length) {
        setDisplayed(target.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        setTyping(false);
        setTimeout(() => {
          setHeadlineIdx((prev) => (prev + 1) % headlines.length);
        }, 2500);
      }
    }, 55);

    return () => clearInterval(interval);
  }, [headlineIdx]);

  // Animated counter
  useEffect(() => {
    const targets = { users: 12400, bots: 3200, trades: 847000 };
    const duration = 2000;
    const steps = 60;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setStats({
        users: Math.floor(targets.users * ease),
        bots: Math.floor(targets.bots * ease),
        trades: Math.floor(targets.trades * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="hero"
      className="grid-bg"
      style={{
        minHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow orbs */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(0,255,136,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "10%",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, rgba(245,196,0,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Live badge */}
      <div
        className="fade-in-up"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(0,255,136,0.08)",
          border: "1px solid rgba(0,255,136,0.2)",
          borderRadius: "100px",
          padding: "6px 16px",
          marginBottom: "32px",
          fontSize: "12px",
          fontFamily: "'JetBrains Mono', monospace",
          color: "var(--neon-green)",
          letterSpacing: "0.05em",
        }}
      >
        <span
          className="live-pulse"
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "var(--neon-green)",
          }}
        />
        INTERACTIVE GUIDE — FREE ACCESS
      </div>

      {/* Main headline */}
      <h1
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(36px, 6vw, 80px)",
          fontWeight: 900,
          textAlign: "center",
          lineHeight: 1.1,
          marginBottom: "24px",
          maxWidth: "900px",
          letterSpacing: "-0.02em",
        }}
      >
        <span className="text-gradient">{displayed}</span>
        <span
          className="cursor-blink"
          style={{
            display: "inline-block",
            width: "4px",
            height: "0.9em",
            background: "var(--neon-green)",
            marginLeft: "4px",
            verticalAlign: "middle",
            borderRadius: "2px",
          }}
        />
        <br />
        <span style={{ color: "var(--text-secondary)", fontSize: "0.55em", fontWeight: 700, display: "block", marginTop: "8px" }}>
          in 4 Steps — No Finance Degree Required
        </span>
      </h1>

      {/* Subtext */}
      <p
        className="fade-in-up"
        style={{
          color: "var(--text-secondary)",
          fontSize: "clamp(16px, 2vw, 20px)",
          textAlign: "center",
          maxWidth: "600px",
          lineHeight: 1.7,
          marginBottom: "48px",
          animationDelay: "0.2s",
        }}
      >
        From zero to deployed trading bot. Python-powered, exchange-connected,
        strategy-driven. Follow the guide, copy the code, start trading.
      </p>

      {/* CTA Buttons */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center", marginBottom: "80px" }}>
        <button
          id="hero-start-btn"
          className="btn-primary"
          onClick={onStart}
          style={{
            padding: "16px 40px",
            borderRadius: "12px",
            fontSize: "18px",
            letterSpacing: "-0.01em",
          }}
        >
          🚀 Start Building
        </button>
        <a
          href="#step-1"
          className="btn-ghost"
          style={{
            padding: "16px 32px",
            borderRadius: "12px",
            fontSize: "16px",
            textDecoration: "none",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
          }}
        >
          View Steps ↓
        </a>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          gap: "clamp(24px, 5vw, 80px)",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {[
          { label: "Developers", value: stats.users.toLocaleString(), suffix: "+" },
          { label: "Bots Built", value: stats.bots.toLocaleString(), suffix: "+" },
          { label: "Trades Executed", value: stats.trades.toLocaleString(), suffix: "+" },
        ].map((stat, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 900,
                color: "var(--neon-green)",
                lineHeight: 1,
                textShadow: "0 0 20px rgba(0,255,136,0.3)",
              }}
            >
              {stat.value}
              <span style={{ color: "var(--neon-yellow)" }}>{stat.suffix}</span>
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div
        className="float-anim"
        style={{
          position: "absolute",
          bottom: "32px",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          color: "var(--text-muted)",
          fontSize: "12px",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span>scroll to explore</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M4 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </section>
  );
}
