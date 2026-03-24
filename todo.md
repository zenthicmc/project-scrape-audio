
## New Features (Round 2)

- [ ] Install next-themes untuk dark/light mode
- [ ] Buat translation files (id.json & en.json) untuk semua halaman
- [ ] Buat LanguageContext provider dengan localStorage persistence
- [ ] Buat ThemeProvider wrapper menggunakan next-themes
- [ ] Buat komponen ThemeToggle (sun/moon icon button)
- [ ] Buat komponen LanguageToggle (ID/EN flag button)
- [ ] Terapkan i18n ke landing page
- [ ] Terapkan i18n ke auth pages (login, register, forgot-password, reset-password, verify-email)
- [ ] Terapkan i18n ke dashboard layout, sidebar, topbar
- [ ] Terapkan i18n ke scraper pages (instagram, tiktok)
- [ ] Terapkan i18n ke history, billing, settings pages
- [ ] Update globals.css untuk light mode CSS variables
- [ ] Push ke GitHub

## Bug Fixes & UI Improvements (Round 3)

- [x] BUG: Fix infinite retry pada worker — set attempts: 1, no auto-requeue
- [x] BUG: Fix credit refund exploit — tambah field creditRefunded di Prisma schema, cek sebelum refund
- [x] BUG: Tambah tombol Retry manual di history page untuk job failed
- [x] FIX: Landing page — hide CTA login/try free saat user sudah login, tampilkan "Go to Dashboard"
- [x] UI: Landing page — tambah emoji ringan untuk visual engagement
- [x] UI: Scraper page — tambah header section (judul + subtitle per platform)
- [x] UI: Scraper page — improve form UI (card container, spacing, label, placeholder)
- [x] UI: Scraper page — URL input dengan contoh URL di bawah
- [x] UI: Scraper page — ubah style selector dari dropdown ke selectable cards
- [x] UI: Scraper page — loading state saat generate (spinner + text)
- [x] UI: Scraper page — empty state dengan ilustrasi ringan

## UI Bug Fix — Sidebar & Header Alignment (Round 4)

- [x] FIX: Sidebar dan header border tidak sejajar — gunakan flex layout yang benar
- [x] FIX: Sidebar warna tidak konsisten dengan header — samakan ke bg-background (white)
- [x] FIX: Sidebar harus h-screen, top-0, tidak ada offset dari header
- [x] FIX: Border sidebar (border-r) dan header (border-b) harus warna & ketebalan sama

## Bug Fix & Feature Update — Profile & Billing (Round 5)

- [x] BUG: Profile update tidak realtime — fix session.update() setelah API call
- [x] BUG: API profile update harus return latest user data
- [x] FEATURE: Hapus sistem subscription dari billing page
- [x] FEATURE: Ganti dengan custom amount top-up (input nominal bebas)
- [x] FEATURE: Tampilkan estimasi credit dari nominal yang diinput
- [x] FEATURE: Validasi minimum top-up Rp 10.000, input numeric only
- [x] FEATURE: Update API payment/create untuk terima nominal bebas
- [x] FEATURE: Tampilkan riwayat top-up dan riwayat penggunaan credit

## Streaming API & Real-Time UX (Round 6)

- [x] FEATURE: Buat streaming API endpoint /api/generate/[jobId]/stream (SSE)
- [x] FEATURE: Buat Processing Page /generate/[jobId] dengan streaming output
- [x] FEATURE: Progress indicator (Fetching transcript → Processing with AI → Finalizing)
- [x] FEATURE: Skeleton loading saat belum ada data
- [x] FEATURE: Typing effect (text muncul per chunk seperti ChatGPT)
- [x] FEATURE: Auto-scroll ke bawah saat text bertambah
- [x] FEATURE: State management: idle/fetching/processing/streaming/completed/failed
- [x] FEATURE: Error handling dengan tombol retry
- [x] FEATURE: Action buttons setelah selesai: Copy, Edit (Tiptap), Regenerate
- [x] FEATURE: Disable submit button saat processing (prevent double submit)
- [x] FIX: ScraperForm redirect ke /generate/[jobId] bukan ke history

## Bug Fix — Transcript SSE Parsing (Round 7)

- [x] BUG: Worker hanya baca 'full_text' dari event 'done' yang kosong — harus akumulasi dari setiap event 'transcript' (field 'text')

## Bug Fix — SSE Parsing & Worker Error (Round 8)

- [x] BUG: SSE /api/generate/[jobId]/stream — failed event mengirim raw SSE text sebagai JSON, client gagal parse
- [x] BUG: Worker error message mengandung raw SSE text dari transcription API

## Bug Fix — Transcription API Format (Round 9)

- [x] FIX: Sesuaikan transcribeVideo() dengan format SSE API yang sebenarnya (event: progress, transcript, done)

## Bug Fix — SSE Event Name (Round 10)

- [x] FIX: Tambah handler event 'status' di transcribeVideo() — nama event API mungkin 'status' bukan 'progress'

## Bug Fix — Claude Model (Round 11)

- [x] FIX: Ganti model claude-3-5-sonnet-20241022 ke claude-haiku-4-5

## UI Fix — Generate Page (Round 12)

- [x] FIX: Stepper garis horizontal tidak center/sejajar dengan lingkaran step
- [x] FIX: Hapus tombol Edit, ganti dengan Tiptap editor inline langsung di halaman generate
- [x] FIX: Tiptap harus parse dan render markdown dari output AI (##, **bold**, ---, dll)

## UI Fix — Stepper & Editor Width (Round 13)

- [ ] FIX: Stepper garis masih tidak center — garis melampaui tepi karena circle di ujung
- [ ] FIX: Perlebar max-width halaman generate dan Tiptap editor untuk teks panjang
