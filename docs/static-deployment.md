# Deployment statis (Cloudflare Pages)

AyoDonor adalah situs statis: `npm run build` menghasilkan seluruh situs ke `dist/`. Tidak ada server, basis data, kunci API,
Worker, atau Pages Functions. Dokumen ini belum berarti situs sudah dideploy; deployment dilakukan manual.

## Pengaturan Cloudflare Pages

| Pengaturan | Nilai |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` (akar repositori) |
| Environment variables | **tidak ada yang wajib**. Bila build gagal karena versi Node, atur `NODE_VERSION=22` |
| Branch | sesuai kebutuhan (mis. `main` untuk produksi, `dev` untuk preview) |

Sumber: dokumentasi Cloudflare dan panduan pihak ketiga (output `dist` adalah bawaan Vite). Cocokkan dengan halaman
pengaturan build Cloudflare saat membuat proyek.

Isi `dist/` (diverifikasi oleh `tests/static-build.test.ts`): `index.html` dan satu `*.html` per halaman, `404.html`, `favicon.svg`,
`_headers`, dan `assets/*.js|css` ber-hash. Tidak ada sourcemap, file `.env`, atau bundel server.

## Routing

Situs punya lima halaman: `/`, `/panduan`, `/fakta-mitos`, `/lokasi`, `/tentang`. Router sisi klien kecil (History API, tanpa
dependensi) menangani perpindahan di dalam aplikasi, tetapi **setiap alamat juga punya berkas HTML sendiri**, ditulis oleh
`npm run build` (plugin `ayodonor-route-html` di `vite.config.ts`):

| Berkas di `dist/` | Alamat |
|---|---|
| `index.html` | `/` |
| `panduan.html`, `fakta-mitos.html`, `lokasi.html`, `tentang.html` | `/panduan`, `/fakta-mitos`, `/lokasi`, `/tentang` |
| `404.html` | halaman tidak ditemukan (`noindex`, tanpa canonical) |

Berkas-berkas itu sama dengan `index.html` kecuali kepala dokumen (judul, deskripsi, canonical, `og:*`). Karena itu kunjungan
langsung, refresh, dan tautan yang dibagikan bekerja di host statis **tanpa aturan rewrite atau fallback SPA**. Tabel rute dan
metadata ada di `src/routes.ts`; menambah halaman berarti menambah baris di sana dan komponen di `src/pages/`.

### Cloudflare Workers (static assets)

Diuji lokal dengan `wrangler dev --assets dist` (Wrangler 4 / workerd), tanpa berkas konfigurasi dan tanpa
`not_found_handling`, pada build `dist/` yang sama:

| Permintaan | Hasil |
|---|---|
| `/`, `/panduan`, `/fakta-mitos`, `/lokasi`, `/tentang` (juga dengan `?q=` atau `#anchor`) | 200, HTML halaman itu dengan judul sendiri |
| `/panduan/`, `/panduan.html`, `/index.html` | 307 ke alamat kanonik (`/panduan`, `/`) |
| `/tidak-ada`, `/assets/tidak-ada.js` | 404 tanpa isi (perilaku bawaan Workers) |
| `/favicon.svg`, `/assets/*.js` | 200; `/assets/*` ber-cache `immutable` satu tahun |
| header `_headers` | terpasang (`nosniff`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`) |

Di peramban, perpindahan lewat menu, tombol kembali, dan buka langsung dengan `#anchor` diperiksa pada server yang sama.
Hal yang **tidak** diuji: deployment sungguhan. Konfigurasi Worker (nama, aset, `not_found_handling`) berada di luar repositori
ini dan tidak diubah. Alamat yang salah ketik menghasilkan 404 kosong; bila ingin halaman 404 yang ramah, atur
`assets.not_found_handling = "404-page"` pada konfigurasi Worker (akan menyajikan `404.html`). Itu keputusan deployment, bukan
syarat agar kelima rute berfungsi. Di Cloudflare Pages, `404.html` tingkat atas membuat Pages menyajikannya untuk alamat tak dikenal
(bukan lagi perilaku SPA), sementara kelima rute tetap dilayani dari berkas masing-masing.

## Header (`public/_headers`)

Dipasang: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
`Permissions-Policy: geolocation=(self), camera=(), microphone=(), payment=()`, dan cache satu tahun untuk `/assets/*`
(nama file ber-hash).

**CSP belum dipasang** karena belum diuji di browser. Rekomendasi awal (uji dulu di preview, mulai dengan
`Content-Security-Policy-Report-Only`):

```
default-src 'self'; script-src 'self'; style-src 'self';
style-src-attr 'unsafe-inline'; font-src 'self'; img-src 'self' data:;
connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'
```

`style-src-attr 'unsafe-inline'` dibutuhkan karena React memakai atribut `style`. Sejak redesain, situs memakai font
sistem (tanpa host font pihak ketiga), sehingga CSP tidak perlu mengizinkan host Google. Rekomendasi ini belum diuji di browser.
HSTS sebaiknya diatur di Cloudflare (SSL/TLS > Edge Certificates) setelah HTTPS stabil.

## Domain `ayodonor.web.id`

- Tambahkan domain kustom di proyek Pages. Menurut dokumentasi Cloudflare, domain **apex** (seperti `ayodonor.web.id`)
  mengharuskan situs ditambahkan sebagai zona Cloudflare dan nameserver diarahkan ke Cloudflare; subdomain (mis.
  `www.ayodonor.web.id`) cukup dengan CNAME ke `<proyek>.pages.dev`.
- Mengubah nameserver, mendaftar domain, dan DNS adalah keputusan manual Anda; tidak dilakukan oleh repositori ini.
- Biaya dan batas gratis Cloudflare Pages tidak diverifikasi di sini; cek halaman harga resmi.

## Pemeriksaan lokal sebelum deploy

```bash
npm run lint && npm test && npm run build
npm run preview        # sajikan dist/ secara lokal, http://localhost:4173
```

## Risiko yang tetap ada

Situs statis mengurangi permukaan serangan sisi server, tetapi bukan jaminan keamanan:
- Teks edukasi, FAQ, dan kuis belum ditinjau tenaga medis/PMI (lihat `docs/medical-claims.md`).
- Daftar 228 UDD/UTD disalin dari halaman Kontak PMI (tanpa koordinat, bisa belum lengkap); stok darah tidak ditampilkan.
- Pembatasan laju dan log aplikasi tidak ada lagi; bila diperlukan, atur di Cloudflare.
- Situs memakai font sistem dan tidak memuat font pihak ketiga; CSP belum dipasang.
- Tautan keluar ke Google Maps/LinkedIn hanya terbuka saat diklik.
