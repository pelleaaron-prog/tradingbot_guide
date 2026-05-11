"use client";
import { useState } from "react";
import TickerBar from "./components/TickerBar";
import HeroSection from "./components/HeroSection";
import ProgressBar from "./components/ProgressBar";
import StepCards from "./components/StepCards";
import RealTalkSection from "./components/RealTalkSection";
import FooterCTA from "./components/FooterCTA";

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1);
  const [checkedItems, setCheckedItems] = useState({});
  const [showGuide, setShowGuide] = useState(false);

  const handleStart = () => {
    setShowGuide(true);
    setTimeout(() => {
      document.getElementById("progress-tracker")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
      }}
    >
      {/* Live market ticker */}
      <TickerBar />

      {/* Hero section */}
      <HeroSection onStart={handleStart} />

      {/* Sticky progress bar */}
      <ProgressBar currentStep={currentStep} />

      {/* Step-by-step guide */}
      <section
        id="guide"
        style={{
          paddingTop: "48px",
          paddingBottom: "0",
          background: "linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%)",
        }}
      >
        {/* Section header */}
        <div
          style={{
            textAlign: "center",
            padding: "0 24px 48px",
            maxWidth: "700px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0,255,136,0.06)",
              border: "1px solid rgba(0,255,136,0.15)",
              borderRadius: "100px",
              padding: "6px 16px",
              marginBottom: "20px",
              fontSize: "12px",
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--neon-green)",
              letterSpacing: "0.05em",
            }}
          >
            🛠️ STEP-BY-STEP GUIDE
          </div>

          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 900,
              marginBottom: "16px",
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            From Zero to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, var(--neon-green), #00d4aa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Live Bot
            </span>
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "16px",
              lineHeight: 1.7,
            }}
          >
            4 steps. Real code. No fluff. Expand each step, read the code, check the boxes,
            and you'll have a working trading bot.
          </p>
        </div>

        {/* Step cards */}
        <StepCards
          currentStep={currentStep}
          setCurrentStep={setCurrentStep}
          checkedItems={checkedItems}
          setCheckedItems={setCheckedItems}
        />
      </section>

      {/* Real Talk warning */}
      <RealTalkSection />

      {/* Footer CTA */}
      <FooterCTA />
    </main>
  );
}
