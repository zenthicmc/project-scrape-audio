
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
