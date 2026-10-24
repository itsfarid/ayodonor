# Migrasi ke aplikasi statis (Cloudflare Pages)

## Temuan audit (sebelum migrasi)

| Pertanyaan | Temuan | Bukti |
|---|---|---|
| Apakah frontend memanggil server? | **Tidak.** Tidak ada `fetch`, XHR, WebSocket, atau string `/api/` di `src/`, `index.html`, `public/` | `grep` pada kode sumber |
| Endpoint server | Hanya `GET /api/health`. Tidak ada pemanggilnya di frontend, skrip produksi, atau konfigurasi deployment selain `scripts/smoke-*.mjs` | `server/app.ts` |
| Fungsi Express lain | Menyajikan aset (`dist/public`), request ID/log, rate limit dan batas body untuk `/api`, error handler, shutdown, `TRUST_PROXY` | semua hanya melayani `/api` dan aset statis |
| Penyimpanan, autentikasi, data dinamis | Tidak ada | - |
| Routing sisi klien | **Tidak ada.** Satu halaman; navigasi memakai anchor `#id`. Tidak ada React Router, `pushState`, atau `location.pathname` | `grep` pada `src/` |
| Variabel lingkungan | Opsional dan hanya untuk server (`PORT`, `HOST`, `TRUST_PROXY`, `STATIC_DIR`). Build dan frontend tidak membaca env | `server/config.ts`, `vite.config.ts` |
| Permintaan eksternal dari browser | Google Fonts (`fonts.googleapis.com`, CSS `@import`), tautan keluar ke Google Maps dan LinkedIn (hanya saat diklik), `ayodonor.pmi.or.id` (tautan). Geolokasi memakai API browser | `grep` URL |
| Fitur yang butuh server? | **Tidak ada** (kuis, FAQ, kartu niat donor, lokasi demo semuanya di browser) | `src/` |

Kesimpulan: Express tidak lagi punya fungsi bisnis. Produksi cukup berupa berkas statis.

## Rencana

1. `vite build` menghasilkan seluruh situs ke `dist/` (tanpa sourcemap). `base` tetap `/` (domain kustom di root).
2. `npm run dev` = `vite`; `npm run preview` = `vite preview` untuk memeriksa hasil build secara lokal. Express dihapus dari
   pengembangan juga: Vite dev server sudah cukup.
3. Hapus `server.ts`, `server/`, skrip `start`, `smoke:*`, bundling esbuild, dan dependensi server
   (`express`, `express-rate-limit`, `@types/express`, `tsx`, `esbuild` langsung).
4. Hapus `GET /api/health`: tidak ada yang membutuhkannya, dan endpoint statis palsu tidak akan menggantikannya.
5. Routing/SPA: tidak ada rute sisi klien, jadi **tidak** ada `_redirects`. (Cloudflare Pages tanpa `404.html` memang
   melayani `index.html` untuk path tak dikenal; tidak ada yang bergantung padanya.)
6. `public/_headers` hanya berisi header aman yang tidak berisiko merusak situs (nosniff, referrer, permissions, cache aset
   bernama hash). **CSP tidak dipasang**; rekomendasinya didokumentasikan terpisah dan belum diuji di browser.
7. Tes: tes server dihapus; tes frontend dan konten dipertahankan; tes baru membangun situs ke direktori sementara dan
   memeriksa isinya, lalu menyajikannya lewat `vite preview`.

## Yang sengaja tidak diubah

Konten medis, disclaimer, label data demo PMI, `.env.local` pengguna, dua file `rate_test_result*.txt`, dan dependensi tak
terpakai yang bukan server (`motion`, `autoprefixer`, duplikasi `vite`).
