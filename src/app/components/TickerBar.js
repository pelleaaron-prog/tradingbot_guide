"use client";
import { useState, useEffect } from "react";

const tickerData = [
  { symbol: "BTC/USDT", price: "67,234.50", change: "+2.34%" },
  { symbol: "ETH/USDT", price: "3,521.80", change: "+1.87%" },
  { symbol: "BNB/USDT", price: "412.30", change: "-0.45%" },
  { symbol: "SOL/USDT", price: "178.90", change: "+4.12%" },
  { symbol: "AAPL", price: "189.75", change: "+0.92%" },
  { symbol: "TSLA", price: "243.50", change: "+3.21%" },
  { symbol: "SPY", price: "522.10", change: "+0.67%" },
  { symbol: "GOLD", price: "2,312.40", change: "+0.34%" },
];

export default function TickerBar() {
  const items = [...tickerData, ...tickerData]; // duplicate for seamless loop

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.6)",
        borderBottom: "1px solid rgba(0,255,136,0.15)",
        overflow: "hidden",
        padding: "8px 0",
        backdropFilter: "blur(10px)",
      }}
    >
      <div
        className="ticker-tape"
        style={{ display: "flex", gap: "0", whiteSpace: "nowrap", width: "max-content" }}
      >
        {items.map((item, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "0 32px",
              fontSize: "12px",
              fontFamily: "'JetBrains Mono', monospace",
              borderRight: "1px solid rgba(0,255,136,0.1)",
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>{item.symbol}</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{item.price}</span>
            <span
              style={{
                color: item.change.startsWith("+") ? "var(--neon-green)" : "var(--accent-red)",
                fontWeight: 700,
              }}
            >
              {item.change}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
