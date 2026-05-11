# 🤖 Real Trading Bot — Brief & Execution Plan

> **Untuk: Aaron (Personal Use)**
> Dokumen ini adalah rencana teknis untuk membangun trading bot yang benar-benar live
> dengan uang asli di exchange kripto.

---

## ⚠️ Sebelum Mulai — Baca Ini Dulu

> [!CAUTION]
> **Ini bukan permainan.** Bot trading dengan uang asli bisa **kehilangan seluruh modal**
> dalam hitungan jam jika salah konfigurasi, strategy buruk, atau market crash tiba-tiba.
> Mulai HANYA dengan uang yang sanggup kamu rugikan 100%.

> [!IMPORTANT]
> **Rekomendasi modal awal:** $50–$100 USD (~800rb–1.6jt IDR).
> Cukup untuk belajar, tidak terlalu sakit kalau hilang.

---

## 🎯 Apa yang Akan Dibangun

Bot Python yang:
1. **Terhubung ke Binance** via API (exchange paling populer, bisa pakai IDR via P2P)
2. **Membaca harga real-time** BTC/USDT setiap jam
3. **Menjalankan strategy EMA Crossover** (sederhana, proven, mudah dipahami)
4. **Execute order otomatis** — beli saat sinyal BUY, jual saat sinyal SELL
5. **Kirim notifikasi Telegram** setiap ada trade
6. **Berjalan 24/7** di VPS cloud (Render.com — gratis)
7. **Stop-loss otomatis** jika rugi lebih dari 5%

---

## 📐 Arsitektur Bot

```
[Binance API] ──→ [Bot Python] ──→ [Strategy Engine]
                      │                    │
                      │         ┌──────────┴──────────┐
                      │         │  EMA 20 vs EMA 50   │
                      │         │  + RSI Confirmation  │
                      │         └──────────┬──────────┘
                      │                    │
                      ↓                    ↓
               [Telegram Alert]    [Execute Order]
                                          │
                                   ┌──────┴──────┐
                                   │  BUY / SELL  │
                                   │  Stop Loss   │
                                   └─────────────┘
```

---

## 📦 Yang Akan Saya Buat (Tugas Developer)

### File Structure:
```
trading-bot-live/
├── bot.py              # Main bot loop (scheduler + orchestrator)
├── strategy.py         # EMA + RSI strategy logic
├── risk.py             # Stop-loss & position sizing
├── notifier.py         # Telegram notifications
├── config.py           # Baca konfigurasi dari .env
├── logger.py           # Logging ke file + console
├── backtest.py         # Backtest historis sebelum live
├── requirements.txt    # Python dependencies
├── .env.example        # Template env vars (JANGAN commit .env asli!)
├── render.yaml         # Auto-deploy config untuk Render.com
└── README.md           # Step-by-step setup guide
```

### Fitur Teknis:

| Fitur | Detail |
|-------|--------|
| Exchange | Binance Spot (via ccxt library) |
| Trading pair | BTC/USDT |
| Timeframe | 1 jam (cukup untuk pemula) |
| Strategy | EMA 20/50 + RSI 14 |
| Stop Loss | -5% dari harga entry |
| Take Profit | +10% dari harga entry |
| Position size | 20% dari balance per trade |
| Notifikasi | Telegram bot real-time |
| Deploy | Render.com (free tier) |
| Logging | File + console dengan timestamp |

---

## 🛠️ Yang Harus Kamu Lakukan (Tugas Aaron)

### Langkah 1 — Setup Binance (30 menit)
- [ ] Daftar / login ke **binance.com**
- [ ] Verifikasi KYC (foto KTP + selfie)
- [ ] Deposit USDT minimal $50–$100 (via P2P dengan IDR)
- [ ] Pergi ke: **Account → API Management → Create API**
  - ✅ Enable: Read Info
  - ✅ Enable: Spot & Margin Trading
  - ❌ Disable: Withdrawal (JANGAN enable ini — ever!)
- [ ] Catat **API Key** dan **Secret Key** di tempat aman

### Langkah 2 — Setup Telegram Bot (10 menit)
- [ ] Buka Telegram → cari **@BotFather**
- [ ] Ketik `/newbot` → ikuti instruksi, beri nama bot
- [ ] Catat **Bot Token** (format: `1234567890:ABCdef...`)
- [ ] Cari nama bot kamu di Telegram, klik **Start**
- [ ] Cari **@userinfobot** → catat **Chat ID** kamu (angka)

### Langkah 3 — Daftar Render.com (5 menit)
- [ ] Daftar di **render.com** menggunakan GitHub account
- [ ] Nanti saya buatkan `render.yaml` yang tinggal connect ke repo

### Langkah 4 — Isi File .env (5 menit)
```env
BINANCE_API_KEY=isi_dari_binance
BINANCE_SECRET=isi_dari_binance
TELEGRAM_TOKEN=isi_dari_botfather
TELEGRAM_CHAT_ID=isi_chat_id_kamu
TRADE_AMOUNT_USDT=50
MAX_LOSS_PCT=0.05
SYMBOL=BTC/USDT
TIMEFRAME=1h
DRY_RUN=true
```

> [!NOTE]
> `DRY_RUN=true` artinya paper trading dulu — tidak ada uang sungguhan bergerak.
> Ganti ke `false` hanya setelah 1 minggu paper trading positif.

---

## 📊 Ekspektasi Realistis

| Skenario | Estimasi Return/Bulan |
|----------|----------------------|
| 🟢 Best case (bull market trending) | +5% – +15% |
| 🟡 Average case (sideways/choppy) | -2% – +5% |
| 🔴 Worst case (bear market crash) | -5% – -15% |
| 🛡️ Stop-loss aktif | Rugi max 5% per trade, bot berhenti |

> [!WARNING]
> EMA Crossover memiliki **win rate ~45–55%** — artinya hampir separuh trade RUGI.
> Yang membuatnya profitable jangka panjang adalah **risk/reward ratio**:
> setiap WIN = +10%, setiap LOSS = -5% (2:1 ratio).
> Butuh **minimal 3 bulan** untuk menilai apakah strategy ini cocok di kondisi market saat ini.

---

## 🚦 Timeline Eksekusi

| Hari | Aktivitas |
|------|-----------|
| Hari 1 | Aaron setup Binance + Telegram. Saya coding semua file bot |
| Hari 2–3 | Jalankan backtest 3 bulan historis, review hasil bersama |
| Hari 4 | Deploy ke Render.com dengan `DRY_RUN=true` |
| Hari 5–11 | **Paper trading** 1 minggu — amati sinyal tanpa uang asli |
| Minggu 2 | Jika paper trading positif/acceptable → set `DRY_RUN=false`, GO LIVE $50 |
| Bulan 1 | Monitor harian, review performa tiap minggu, adjust jika perlu |

---

## 🔐 Security Rules — Wajib Diikuti

> [!CAUTION]
> Melanggar aturan berikut = risiko **kehilangan semua uang** atau **akun dicuri**.

1. **JANGAN enable Withdrawal** di Binance API — ever
2. **JANGAN commit file `.env`** ke GitHub — sudah ada di `.gitignore`
3. **Set IP Whitelist** di Binance API ke IP server Render setelah deploy
4. **Gunakan Spot saja** — BUKAN Futures/Margin (leverage = rugi berlipat)
5. **Set batas rugi harian manual**: jika bot rugi >10% dalam 1 hari, matikan
6. **Simpan API key** di password manager, bukan di chat/email

---

## 💬 Konfirmasi — Siap Lanjut?

**Apakah kamu ingin saya mulai coding bot-nya sekarang?**

Sambil kamu mengerjakan **Langkah 1 & 2** (Binance + Telegram setup),
saya akan langsung membangun semua file Python di folder baru **`trading-bot-live/`**.

Setelah kamu punya API key dan Telegram token → kita langsung deploy dan paper trade!

> [!NOTE]
> Bot ini akan dibuat **konservatif dan aman** untuk pemula:
> posisi kecil, stop-loss ketat, notifikasi real-time, dan paper trade dulu sebelum live.
