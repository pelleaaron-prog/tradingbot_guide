# Project Brief — Trading Bot (Untuk Dilanjutkan)

> Dokumen ini dibuat untuk melanjutkan pekerjaan di sesi chat baru.
> Repo: https://github.com/pelleaaron-prog/tradingbot_guide
> Branch aktif: `main`

---

## Ringkasan Proyek

Proyek ini terdiri dari **dua bagian terpisah**:

### 1. Next.js Web App (`src/`)
Website interaktif — panduan step-by-step cara membangun trading bot.
- Framework: Next.js 16 (App Router, bukan Pages Router)
- Stack: plain JavaScript, inline styles, CSS variables
- Components: `TickerBar`, `HeroSection`, `ProgressBar`, `StepCards`, `RealTalkSection`, `FooterCTA`
- **Status: selesai, belum disentuh di sesi ini**

### 2. Python Trading Bot (`bot/`)
Bot trading crypto live di Binance Spot.
- **Status: selesai dan siap deploy**

---

## Apa yang Sudah Dikerjakan di Sesi Ini

### Bot Python — Selesai
```
bot/
├── bot.py          ✅ Main loop + RUN_ONCE mode untuk GitHub Actions
├── strategy.py     ✅ EMA 20/50 + RSI 14 (V1 strategy)
├── exchange.py     ✅ ccxt Binance wrapper (DRY_RUN safe)
├── risk.py         ✅ SL/TP/kill-switch + save_state()/load_state()
├── config.py       ✅ Semua config dari .env
├── notifier.py     ✅ Telegram alerts
├── logger.py       ✅ Rotating file + console
├── backtest.py     ✅ V1 backtest via Yahoo Finance (bukan Binance — blocked di ID)
├── backtest_v2.py  ✅ V2 strategy (EMA 9/21 + EMA 200 trend filter + RSI momentum)
├── backtest_multi.py ✅ Multi-pair runner: BTC, ETH, XAU, GBP
├── state.json      ✅ Persistent state untuk GitHub Actions
├── requirements.txt ✅ ccxt, pandas, yfinance, dll
└── .env            ✅ SUDAH TERISI (tidak di-commit)
```

### Deploy — Dua Opsi Siap
1. **GitHub Actions** (GRATIS, direkomendasikan) — `.github/workflows/trading-bot.yml`
   - Berjalan setiap jam (:05)
   - State disimpan di `bot/state.json` (auto-commit setiap run)
   - **Belum: user perlu tambah 4 secrets di GitHub Settings**

2. **Render.com** — `render.yaml` di root repo
   - rootDir: `bot`, startCommand: `python bot.py`
   - **Belum: user perlu input env vars di Render dashboard**

---

## Hasil Backtest (Penting untuk Keputusan)

### V1 vs V2 — 90 Hari, $1000 Modal

| Pair     | V1 Return | V2 Return | V1 Win% | V2 Win% |
|----------|-----------|-----------|---------|---------|
| BTC/USDT | +4.43%    | +2.15%    | 75%     | 43%     |
| ETH/USDT | **+7.50%**| -0.06%    | 67%     | 25%     |
| XAU/USD  | -0.68%    | -0.01%    | 17%     | 25%     |
| GBP/USD  | -0.47%    | -0.18%    | 13%     | 20%     |

**Kesimpulan:**
- V1 (EMA 20/50) unggul di crypto untuk market sideways/choppy
- ETH/USDT V1 performa terbaik (+7.5%)
- Forex dan Gold tidak cocok dengan EMA crossover strategy ini
- **Bot saat ini dikonfigurasi untuk BTC/USDT V1**

---

## Yang Belum Selesai / Yang Perlu Dilanjutkan

### PRIORITAS: Aktivasi GitHub Actions
User perlu melakukan ini secara manual di GitHub:
1. Buka repo → **Settings → Secrets and variables → Actions**
2. Tambahkan 4 secrets:
   - `BINANCE_API_KEY`
   - `BINANCE_SECRET`
   - `TELEGRAM_TOKEN`
   - `TELEGRAM_CHAT_ID`
3. Buka tab **Actions → Trading Bot → Run workflow** untuk test pertama
4. Cek Telegram — bot kirim notifikasi startup

### Kemungkinan Pekerjaan Lanjutan
- [ ] Tambah ETH/USDT sebagai pair kedua di bot (V1 performanya terbaik)
- [ ] Monitor paper trading 1 minggu, review hasilnya
- [ ] Setelah paper trading positif → ubah `DRY_RUN=true` ke `false` di secrets
- [ ] Pertimbangkan tambah IP whitelist di Binance API (set ke GitHub Actions IP range)
- [ ] Next.js web app masih bisa dikembangkan (belum ada live data integration)

---

## Context Teknis Penting

### Kenapa Yahoo Finance, bukan Binance untuk backtest?
`api.binance.com` diblokir oleh ISP Indonesia (OJK). Bot live di GitHub Actions/Render (server US) tidak kena masalah ini.

### Kenapa ada dua render.yaml?
- `bot/render.yaml` — warisan dari initial commit, tidak digunakan
- `render.yaml` (root) — yang aktif, dengan `rootDir: bot`

### State persistence (GitHub Actions)
`bot/state.json` menyimpan: posisi terbuka, entry price, daily P&L, kill switch status.
Setiap run GitHub Actions → bot baca state → execute tick → tulis state → auto-commit.

### RUN_ONCE mode
Set env var `RUN_ONCE=true` → bot run satu tick dan exit (untuk GitHub Actions).
Default `false` → bot loop terus (untuk Render/local).

### Antigravity IDE
IDE yang digunakan user. Membaca `AGENTS.md` (sama seperti Claude Code).
File `AGENTS.md` di root repo adalah shared rules untuk kedua agent.

---

## File Konfigurasi Penting

```
.env (JANGAN commit)          → ada di bot/.env, berisi API keys
AGENTS.md                     → rules untuk Claude Code + Antigravity agent
render.yaml                   → Render.com deploy config
.github/workflows/trading-bot.yml → GitHub Actions workflow
```

---

## Perintah Berguna

```bash
# Paper trading lokal
cd bot && python bot.py

# Backtest V1
cd bot && python backtest.py

# Backtest multi-pair V1 vs V2
cd bot && python backtest_multi.py

# Test satu tick (GitHub Actions mode)
cd bot && RUN_ONCE=true python bot.py
```
