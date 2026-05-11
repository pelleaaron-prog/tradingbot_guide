# Agent Rules — Trading Bot Project

This project has two parts: a **Next.js web app** (interactive guide) and a **Python trading bot** (live Binance integration). Rules below apply to both Claude Code and Antigravity agent.

---

## Project Structure

```
trading-bot/
├── src/                  # Next.js 16 web app (interactive guide UI)
│   └── app/
│       ├── page.js
│       ├── globals.css
│       └── components/
├── bot/                  # Python trading bot (Binance / live trading)
│   ├── bot.py            # Main loop + scheduler
│   ├── strategy.py       # EMA 20/50 + RSI 14 logic
│   ├── exchange.py       # ccxt Binance wrapper
│   ├── risk.py           # Stop-loss, take-profit, kill switch
│   ├── config.py         # .env loader
│   ├── notifier.py       # Telegram alerts
│   ├── backtest.py       # Historical backtesting
│   └── logger.py         # Rotating file + console logger
└── AGENTS.md             # This file — shared rules for all agents
```

---

## Next.js Rules

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

- All components live in `src/app/components/`. Do not create `pages/` directory.
- Use the App Router only. No `getServerSideProps`, `getStaticProps`, or `_app.js`.
- Inline styles are used intentionally (design system via CSS variables in `globals.css`). Do not refactor to Tailwind or CSS modules unless explicitly asked.
- CSS variables: `--bg-primary`, `--bg-secondary`, `--text-primary`, `--text-secondary`, `--neon-green`. Use these, do not hardcode hex colors.

---

## Python Bot Rules

- **Runtime:** Python 3.10+. Use `match` statements, `|` union types, and `dataclass` where appropriate.
- **Dependencies:** Only use what is in `bot/requirements.txt` (ccxt, pandas, python-dotenv, schedule, requests). Do not add new packages without asking.
- **Config:** All configurable values must be read from `.env` via `config.py`. Never hardcode API keys, symbols, or percentages.
- **Logging:** Always use `get_logger(__name__)` from `logger.py`. Never use `print()` in bot code (backtest.py is the only exception).
- **Error handling:** Catch exceptions at the exchange/network boundary only. Let logic errors propagate so they appear in logs.
- **DRY_RUN:** Any order execution must respect `config.DRY_RUN`. Never place a real order without checking this flag.

---

## Security Rules — Non-Negotiable

- **NEVER** suggest enabling Withdrawal permission on Binance API.
- **NEVER** commit or output the contents of `.env`. It is gitignored.
- **NEVER** log or print raw API keys — `config.summary()` already masks them.
- **NEVER** suggest using Binance Futures or Margin — Spot only.
- If asked to change `DRY_RUN=false`, confirm explicitly with the user before proceeding.
- Do not suggest storing secrets in code comments, chat, or any file other than `.env`.

---

## Agent Behavior

- **Ask before destructive actions:** deleting files, dropping data, resetting git state, or any change to `bot/risk.py` thresholds.
- **Never auto-deploy.** Deployment to Render.com requires explicit user confirmation.
- **Backtest before live:** If suggesting strategy changes, always recommend running `python bot/backtest.py` first.
- **No feature creep.** Do not add strategies, pairs, or exchanges beyond what is asked.
- **Paper trade first.** If the bot is not yet live, default recommendations assume `DRY_RUN=true`.

---

## Code Style

### Python
- 4-space indentation, no tabs.
- Type hints on all function signatures.
- Module-level docstring on every file (one sentence is enough).
- Keep functions under 40 lines. Extract helpers if needed.

### JavaScript (Next.js)
- Functional components only. No class components.
- `"use client"` only when state or browser APIs are needed.
- No TypeScript (project uses plain JS).
- No external UI libraries (no shadcn, MUI, Chakra, etc.).

---

## Git Conventions

- Never commit `.env` or `bot/logs/`.
- Commit messages: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:` prefixes.
- Keep `main` deployable at all times.
