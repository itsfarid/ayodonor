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

Isi `dist/` (diverifikasi oleh `tests/static-build.test.ts`): `index.html`, `favicon.svg`, `_headers`, dan
`assets/*.js|css` ber-hash. Tidak ada sourcemap, file `.env`, atau bundel server.

## Routing

Tidak ada `_redirects` karena aplikasi satu halaman tanpa router sisi klien (navigasi memakai anchor `#id`). Menurut dokumentasi
Cloudflare Pages, proyek tanpa `404.html` tingkat atas diperlakukan sebagai SPA dan semua path dicocokkan ke `/`.
Jangan menambahkan `404.html` kecuali memang diinginkan. Bila nanti ditambahkan rute sisi klien, uji deep link di preview Pages.

## Header (`public/_headers`)

Dipasang: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`,
`Permissions-Policy: geolocation=(self), camera=(), microphone=(), payment=()`, dan cache satu tahun untuk `/assets/*`
(nama file ber-hash).

**CSP belum dipasang** karena belum diuji di browser. Rekomendasi awal (uji dulu di preview, mulai dengan
`Content-Security-Policy-Report-Only`):

```
default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com;
style-src-attr 'unsafe-inline'; font-src https://fonts.gstatic.com; img-src 'self' data:;
connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'
```

`style-src-attr 'unsafe-inline'` dibutuhkan karena React memakai atribut `style`. Menghosting font sendiri
menghilangkan kebutuhan dua host Google dan permintaan IP pengunjung ke Google Fonts.
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
- Data 7 lokasi PMI (alamat, telepon, koordinat) tidak terverifikasi; status stok fiktif.
- Pembatasan laju dan log aplikasi tidak ada lagi; bila diperlukan, atur di Cloudflare.
- Google Fonts dimuat dari pihak ketiga (alamat IP pengunjung terlihat oleh Google); CSP belum dipasang.
- Tautan keluar ke Google Maps/LinkedIn hanya terbuka saat diklik.
