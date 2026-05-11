import "./globals.css";

export const metadata = {
  title: "TradingBot Guide — Build Your Algo Trading Bot in 4 Steps",
  description:
    "Step-by-step interactive guide to building your own algorithmic trading bot with Python. Choose your strategy, connect to markets, and deploy confidently.",
  keywords: "algorithmic trading, trading bot, python trading, algo trading, passive income",
  openGraph: {
    title: "TradingBot Guide — Build Your Algo Trading Bot in 4 Steps",
    description: "Interactive step-by-step guide to building a Python trading bot.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
