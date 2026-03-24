
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
