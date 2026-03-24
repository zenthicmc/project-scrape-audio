# ScriptAI — AI Video Script Generator

ScriptAI adalah platform SaaS berbasis AI yang mengubah transkrip video Instagram Reels dan TikTok menjadi script video yang menarik dan siap pakai, dengan 7 pilihan gaya bahasa.

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Database** | PostgreSQL + Prisma ORM |
| **Auth** | NextAuth v5 (Email/Password + Google OAuth) |
| **Queue** | BullMQ + Redis |
| **AI** | Anthropic Claude API |
| **Payment** | Midtrans Snap |
| **Editor** | Tiptap Rich Text Editor |
| **Styling** | Tailwind CSS |
| **Email** | Nodemailer (SMTP) |

---

## Fitur Utama

- **Landing Page** — High-conversion dengan PAS framework, before/after comparison, pricing, FAQ
- **Auth System** — Register, login, Google OAuth, email verification, password reset
- **Dashboard** — Sidebar navigation dengan Instagram Scraper, TikTok Scraper, History, Billing, Settings
- **Credit System** — 1 generate = 10 credits (configurable), top-up via Midtrans
- **Background Jobs** — BullMQ + Redis untuk async processing
- **AI Paraphrasing** — Claude API dengan 7 gaya bahasa:
  - Original
  - Mirip referensi
  - Story telling
  - Skeptical hook
  - Fokus benefit
  - PAS
  - Fokus fitur
- **Rich Text Editor** — Tiptap dengan toolbar lengkap
- **In-App Notifications** — Polling real-time untuk status job dan payment
- **Owner Notifications** — Webhook notifikasi ke owner saat payment berhasil

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis server
- Anthropic API key
- Midtrans account
- Google OAuth credentials (opsional)
- SMTP credentials untuk email

### 1. Clone & Install

```bash
git clone <repo-url>
cd scriptai
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` dan isi semua nilai yang diperlukan (lihat `.env.example` untuk daftar lengkap).

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema ke database
npx prisma db push

# Atau jalankan migration
npx prisma migrate dev --name init
```

### 4. Jalankan Development Server

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: BullMQ Worker
npm run worker
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## Deployment

### Railway (Recommended)

1. Push ke GitHub
2. Buat project baru di [Railway](https://railway.app)
3. Add services: **PostgreSQL** dan **Redis**
4. Deploy dari GitHub repo
5. Set semua environment variables di Railway dashboard
6. Set `NEXTAUTH_URL` ke URL Railway Anda
7. Jalankan `npx prisma db push` via Railway shell

### Vercel + External Redis/DB

1. Deploy ke Vercel
2. Gunakan [Neon](https://neon.tech) untuk PostgreSQL
3. Gunakan [Upstash](https://upstash.com) untuk Redis
4. **Catatan:** BullMQ worker tidak bisa jalan di Vercel (serverless). Gunakan Railway atau VPS untuk worker.

### Midtrans Webhook

Set webhook URL di Midtrans dashboard:
```
https://yourdomain.com/api/payment/webhook
```

---

## Struktur Project

```
src/
├── app/
│   ├── (landing)/          ← Landing page
│   ├── auth/               ← Login, register, verify, reset
│   ├── dashboard/          ← Dashboard pages
│   │   ├── instagram/      ← Instagram scraper
│   │   ├── tiktok/         ← TikTok scraper
│   │   ├── history/        ← Job history + editor
│   │   ├── billing/        ← Credits & payment
│   │   └── settings/       ← User settings
│   └── api/                ← API routes
│       ├── auth/           ← NextAuth + register + verify
│       ├── jobs/           ← Script generation jobs
│       ├── credits/        ← Credit balance
│       ├── notifications/  ← In-app notifications
│       ├── payment/        ← Midtrans create + webhook
│       └── user/           ← Profile + password
├── components/
│   ├── dashboard/          ← Sidebar, topbar, scraper form
│   └── editor/             ← Tiptap editor
├── lib/
│   ├── auth.ts             ← NextAuth config
│   ├── prisma.ts           ← Prisma client
│   ├── queue.ts            ← BullMQ queue
│   ├── worker.ts           ← BullMQ worker
│   ├── email.ts            ← Email utilities
│   ├── midtrans.ts         ← Midtrans utilities
│   └── utils.ts            ← Shared utilities, constants
└── prisma/
    └── schema.prisma       ← Database schema
```

---

## Konfigurasi

### Credits Per Generation

Ubah di `.env.local`:
```env
CREDITS_PER_GENERATION=10
```

### Credit Packages

Edit di `src/lib/utils.ts` — array `CREDIT_PACKAGES`.

### Gaya Bahasa (Script Styles)

Didefinisikan di `src/lib/utils.ts` — array `SCRIPT_STYLES`. Prompt AI ada di `src/lib/worker.ts`.

---

## API Reference

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/auth/register` | Daftar akun baru |
| `POST` | `/api/auth/verify-email` | Verifikasi email |
| `POST` | `/api/auth/forgot-password` | Request reset password |
| `POST` | `/api/auth/reset-password` | Reset password |
| `POST` | `/api/jobs` | Buat job generate script |
| `GET` | `/api/jobs` | List semua jobs |
| `GET` | `/api/jobs/[jobId]` | Detail job |
| `PATCH` | `/api/jobs/[jobId]` | Update script |
| `GET` | `/api/credits` | Saldo & riwayat kredit |
| `GET` | `/api/notifications` | Notifikasi |
| `POST` | `/api/notifications/mark-read` | Tandai semua dibaca |
| `POST` | `/api/payment/create` | Buat transaksi Midtrans |
| `POST` | `/api/payment/webhook` | Midtrans webhook |
| `PATCH` | `/api/user/profile` | Update profil |
| `POST` | `/api/user/change-password` | Ubah password |

---

## License

MIT
