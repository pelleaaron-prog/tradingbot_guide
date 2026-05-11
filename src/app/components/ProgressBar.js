"use client";

const steps = [
  { id: 1, label: "Choose Market", icon: "📊" },
  { id: 2, label: "Fetch Data", icon: "🔗" },
  { id: 3, label: "Strategy", icon: "🧠" },
  { id: 4, label: "Deploy", icon: "🚀" },
];

export default function ProgressBar({ currentStep }) {
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div
      id="progress-tracker"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(2, 11, 6, 0.9)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-card)",
        padding: "16px 24px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Step labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "12px",
            position: "relative",
          }}
        >
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isDone = step.id < currentStep;

            return (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  flex: 1,
                }}
              >
                {/* Circle */}
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    border: isActive
                      ? "2px solid var(--neon-green)"
                      : isDone
                      ? "2px solid rgba(0,255,136,0.4)"
                      : "2px solid var(--border-card)",
                    background: isActive
                      ? "rgba(0,255,136,0.15)"
                      : isDone
                      ? "rgba(0,255,136,0.05)"
                      : "transparent",
                    boxShadow: isActive ? "0 0 15px rgba(0,255,136,0.3)" : "none",
                    transition: "all 0.3s ease",
                  }}
                >
                  {isDone ? (
                    <span style={{ color: "var(--neon-green)", fontSize: "16px" }}>✓</span>
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  style={{
                    fontSize: "11px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 600,
                    color: isActive
                      ? "var(--neon-green)"
                      : isDone
                      ? "var(--text-secondary)"
                      : "var(--text-muted)",
                    letterSpacing: "0.05em",
                    textAlign: "center",
                    transition: "color 0.3s ease",
                  }}
                >
                  {step.id}. {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress bar track */}
        <div
          style={{
            height: "4px",
            background: "rgba(0,255,136,0.08)",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            className="progress-fill"
            style={{
              height: "100%",
              width: `${progress}%`,
              borderRadius: "2px",
            }}
          />
        </div>

        {/* Step counter */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "6px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--text-muted)",
            }}
          >
            Step {currentStep} of {steps.length}
          </span>
        </div>
      </div>
    </div>
  );
}
