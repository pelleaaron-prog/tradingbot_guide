"use client";
import { useState } from "react";

function syntaxHighlight(code) {
  // Simple syntax highlighter that returns React elements
  const lines = code.split("\n");
  return lines.map((line, lineIdx) => {
    const parts = [];
    let remaining = line;
    let key = 0;

    // Process line token by token
    const tokens = [
      { pattern: /(#.*)$/, cls: "token-comment" },
      { pattern: /\b(import|from|as|def|return|if|else|elif|for|in|while|class|try|except|with|pass|True|False|None)\b/, cls: "token-keyword" },
      { pattern: /("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*')/, cls: "token-string" },
      { pattern: /\b(\d+\.?\d*)\b/, cls: "token-number" },
      { pattern: /\b([A-Z][a-zA-Z0-9_]*)\b/, cls: "token-class" },
      { pattern: /\b([a-z_][a-z_0-9]*)\s*(?=\()/, cls: "token-function" },
      { pattern: /\b(self|cls|print|len|range|list|dict|str|int|float|bool|type)\b/, cls: "token-builtin" },
    ];

    // Simple token-based rendering
    const elements = [];
    let i = 0;
    const chars = line.split("");

    // Just render each line as styled spans using a simplified approach
    let processedLine = line;

    return (
      <div
        key={lineIdx}
        style={{
          display: "flex",
          minHeight: "22px",
        }}
      >
        <span
          style={{
            color: "#3d6b52",
            userSelect: "none",
            minWidth: "36px",
            textAlign: "right",
            paddingRight: "16px",
            fontSize: "12px",
            lineHeight: "22px",
          }}
        >
          {lineIdx + 1}
        </span>
        <HighlightedLine line={line} />
      </div>
    );
  });
}

function HighlightedLine({ line }) {
  if (line.trim().startsWith("#")) {
    return <span className="token-comment" style={{ lineHeight: "22px" }}>{line}</span>;
  }

  // Tokenize inline
  const segments = [];
  let remaining = line;

  const patterns = [
    { regex: /^(import|from|as|def|return|if|else|elif|for|in|while|class|try|except|with|pass|True|False|None|not|and|or)\b/, cls: "token-keyword" },
    { regex: /^("""[\s\S]*?"""|'''[\s\S]*?'''|"[^"\n]*"|'[^'\n]*')/, cls: "token-string" },
    { regex: /^(\d+\.?\d*)/, cls: "token-number" },
    { regex: /^([A-Z][a-zA-Z0-9_]*)(?=\s*[\(\.:])/, cls: "token-class" },
    { regex: /^([a-z_][a-z_0-9]*)(?=\s*\()/, cls: "token-function" },
    { regex: /^(self|print|len|range|append|split|strip|format|join|get|set|dict|list|str|int|float|bool|pd|np|ccxt|ta|schedule|time|os|logging|json)\b/, cls: "token-builtin" },
    { regex: /^([=+\-*/<>!&|%^]+)/, cls: "token-operator" },
  ];

  let safety = 0;
  while (remaining.length > 0 && safety < 1000) {
    safety++;
    let matched = false;

    for (const { regex, cls } of patterns) {
      const m = remaining.match(regex);
      if (m) {
        segments.push(
          <span key={segments.length} className={cls}>{m[0]}</span>
        );
        remaining = remaining.slice(m[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Add plain text char
      const last = segments[segments.length - 1];
      if (last && typeof last === "string") {
        segments[segments.length - 1] = segments[segments.length - 1] + remaining[0];
      } else {
        segments.push(remaining[0]);
      }
      remaining = remaining.slice(1);
    }
  }

  return (
    <span style={{ lineHeight: "22px" }}>
      {segments.map((s, i) =>
        typeof s === "string" ? <span key={i}>{s}</span> : s
      )}
    </span>
  );
}

export default function CodeBlock({ code, language = "python", filename }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="code-block"
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        fontSize: "13px",
        lineHeight: "22px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "rgba(0,255,136,0.04)",
          borderBottom: "1px solid var(--border-green)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Traffic lights */}
          <div style={{ display: "flex", gap: "6px" }}>
            {["#ff5f57", "#febc2e", "#28c840"].map((color, i) => (
              <div
                key={i}
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: color,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "12px",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {filename || `${language}_bot.py`}
          </span>
        </div>

        <button
          onClick={handleCopy}
          style={{
            background: copied ? "rgba(0,255,136,0.15)" : "rgba(0,255,136,0.05)",
            border: "1px solid rgba(0,255,136,0.2)",
            color: copied ? "var(--neon-green)" : "var(--text-secondary)",
            padding: "4px 12px",
            borderRadius: "6px",
            fontSize: "11px",
            fontFamily: "'JetBrains Mono', monospace",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {copied ? "✓ Copied!" : "⎘ Copy"}
        </button>
      </div>

      {/* Code content */}
      <div
        style={{
          padding: "16px 0",
          overflowX: "auto",
          background: "#010a05",
        }}
      >
        <div style={{ minWidth: "max-content", paddingRight: "24px" }}>
          {syntaxHighlight(code)}
        </div>
      </div>
    </div>
  );
}
