# SEO teknis AyoDonor

Dokumen ini mencatat apa yang **benar-benar ada** di repositori (per 24 Oktober 2026), cara memeriksanya, dan apa yang masih
manual. Validasi teknis (HTML, sitemap, schema.org) **tidak menjamin** halaman terindeks, tampil, atau mendapat rich results
di Google; itu hanya bisa dilihat di Search Console.

## URL kanonis

Satu alamat per halaman, HTTPS, domain `ayodonor.web.id`, tanpa `www`, tanpa trailing slash (kecuali beranda), tanpa `.html`.

| Halaman | URL kanonis | Berkas di `dist/` |
|---|---|---|
| Beranda | `https://ayodonor.web.id/` | `index.html` |
| Panduan | `https://ayodonor.web.id/panduan` | `panduan.html` |
| Fakta & Mitos | `https://ayodonor.web.id/fakta-mitos` | `fakta-mitos.html` |
| Lokasi | `https://ayodonor.web.id/lokasi` | `lokasi.html` |
| Tentang | `https://ayodonor.web.id/tentang` | `tentang.html` |

Sumber tunggal: `src/routes.ts` (`ROUTES`, `canonicalUrl`). Build menulis HTML, sitemap, dan JSON-LD dari tabel itu, jadi
tidak ada daftar kedua yang bisa menyimpang.

Varian alamat (diuji pada Workers runtime lokal dan, kecuali yang baru, di produksi): `/panduan/`, `/panduan.html`,
`/index.html`, `/404.html` dijawab **307** ke alamat kanonik (`/panduan`, `/`, `/404`). Itu perilaku Workers static assets
(`html_handling` bawaan). 307 berarti "sementara"; tag canonical di halaman tujuan menjadi sinyal utama. Query (`?x=1`) dan
`#anchor` dijawab dengan halaman yang sama dan canonical tanpa query. `/PANDUAN` dan `/lokasi.html/` dijawab 404.

## Metadata per halaman

Dibuat saat build oleh plugin `ayodonor-route-html` di `vite.config.ts` dan dijaga tetap benar oleh router saat berpindah
halaman di dalam aplikasi (`applyHead` di `src/router.tsx`). Tiap berkas punya `<html lang="id">`, viewport, title, description,
canonical absolut, `og:title`, `og:description`, `og:url`, `og:type`, `og:locale`, `og:site_name`, dan `twitter:*` yang konsisten.

| Halaman | Title (panjang) | Description (panjang) |
|---|---|---|
| `/` | AyoDonor — Edukasi Donor Darah untuk Anak Muda (46) | 202 |
| `/panduan` | Panduan Donor Darah — AyoDonor (30) | 206 |
| `/fakta-mitos` | Fakta dan Mitos Donor Darah — AyoDonor (38) | 157 |
| `/lokasi` | Cari UDD/UTD PMI per Kota — AyoDonor (36) | 204 |
| `/tentang` | Tentang AyoDonor dan Sumber Informasi (37) | 186 |

Catatan: empat deskripsi lebih panjang dari ~160 karakter yang biasa tampil penuh di hasil pencarian; kalimat penutup
"Bukan layanan medis dan tidak berafiliasi dengan PMI." bisa terpotong di tampilan. Google tetap bisa membuat cuplikannya
sendiri. Teks tidak diubah di sini karena itu keputusan redaksi (lihat Backlog).

## sitemap.xml dan robots.txt

- `sitemap.xml` **dibuat saat build** dari `ROUTES` (`buildSitemap()` di `src/seo.ts`) dan ditulis ke `dist/sitemap.xml`. Isinya
  tepat lima URL kanonis di atas. Tidak ada 404, aset, redirect, query, atau varian trailing slash. **Tidak ada `lastmod`**:
  build tidak punya tanggal "perubahan bermakna" per halaman yang bisa dipertanggungjawabkan, dan tanggal yang berubah tiap
  build atau dikarang lebih buruk daripada tidak ada. Sitemap membantu penemuan URL; bukan jaminan indeksasi.
- `public/robots.txt` disalin apa adanya ke `dist/robots.txt`: `User-agent: *`, `Allow: /`, tanpa `Disallow` (CSS, JS, dan aset
  tidak diblokir), dan `Sitemap: https://ayodonor.web.id/sitemap.xml`. robots.txt mengatur perayapan, bukan penghapusan dari
  indeks, dan bukan perlindungan data.
- Sebelum deploy ini, produksi tidak punya keduanya dari repositori: `/sitemap.xml` 404, dan `/robots.txt` menjawab 200 berisi
  teks komentar "content signals" yang kemungkinan disisipkan Cloudflare (tanpa `User-agent` dan tanpa `Sitemap`). **Belum
  diverifikasi** bagaimana Cloudflare menggabungkan fitur itu dengan `robots.txt` dari origin; periksa `curl https://ayodonor.web.id/robots.txt`
  setelah deploy dan pastikan baris `Sitemap:` dan `Allow: /` terlihat.

## Penanganan 404

- `wrangler.jsonc`: `assets.not_found_handling = "404-page"`. Alamat tak dikenal (`/tidak-ada`, `/tidak-ada/dalam`,
  `/assets/tidak-ada.js`, dst.) dijawab **404** dengan isi `dist/404.html`. Aset yang hilang tidak
  mendapat beranda dengan status 200. Jangan ganti ke `single-page-application` (soft 404).
- `404.html`: `<meta name="robots" content="noindex">`, tanpa canonical dan tanpa `og:url`.
- **Temuan:** `404.html` juga ada sebagai aset biasa, sehingga **`/404` dijawab 200** (diverifikasi lokal dan di produksi;
  `/404.html` dialihkan 307 ke `/404`). Karena status tidak bisa diubah tanpa skrip Worker (perubahan model deployment),
  `public/_headers` menambahkan `X-Robots-Tag: noindex` untuk `/404` dan `/404.html`. Halaman publik tidak diberi header itu
  (ada tesnya). `noindex` tidak dipasang global.

## Structured data

Satu blok JSON-LD, hanya di beranda (`websiteJsonLd()` di `src/seo.ts`): `WebSite` dengan `name` "AyoDonor", `url`,
`inLanguage: "id"`, dan `description` sama dengan description beranda. Alasan: itu data yang benar dan tampak di situs, dan
`WebSite` adalah jenis yang dipakai Google untuk nama situs.

Sengaja **tidak** ada: `Organization`/`MedicalOrganization` (identitas organisasi tidak terdokumentasi; AyoDonor bukan
layanan medis), `BreadcrumbList` (tidak ada breadcrumb di halaman), rating/review, data lokasi atau koordinat. Tes
(`tests/static-build.test.ts`) mem-parse JSON-nya, mengunci isinya, melarang tipe-tipe itu di seluruh `dist/`, dan memastikan
halaman lain serta `404.html` tidak punya JSON-LD. Periksa manual dengan Rich Results Test atau Schema Markup Validator bila
perlu; lolos validasi tidak menjamin tampilan khusus di Google.

## Perayapan tanpa JavaScript (rendering)

Fakta (diverifikasi pada `dist/`): HTML mentah tiap halaman berisi head yang benar dan `<div id="root"></div>` kosong; seluruh
isi (judul halaman, teks edukasi, FAQ, tautan) dirender oleh JavaScript React. Konsekuensi:

- Googlebot menjalankan JavaScript, jadi isi halaman bisa diindeks, tetapi lewat antrean render yang lebih lambat dan lebih
  rapuh daripada HTML statis.
- Crawler atau pratinjau yang tidak menjalankan JavaScript hanya melihat title, description, dan `og:*`.
- Data 228 UDD/UTD hanya ada di bundel JavaScript dan baru tampil setelah pengguna mencari; tidak ada halaman atau teks
  statis per lokasi. Itu disengaja (lihat Backlog).

Mitigasi berisiko rendah yang sudah ada: blok `<noscript>` di setiap berkas HTML berisi tautan ke lima halaman kanonis, supaya
HTML mentah punya graf tautan dan pengunjung tanpa JavaScript punya jalan keluar. Itu bukan pengganti prerender isi.
Usulan prerender ada di [docs/seo-prerender-proposal.md](seo-prerender-proposal.md) dan **belum dikerjakan**.

## Menjalankan audit lokal

```bash
npm run lint && npm test && npm run build      # tipe, 224 tes (termasuk build ke direktori sementara), dist/ lengkap
npx wrangler dev --port 8799                   # Workers runtime lokal; lihat catatan restart di bawah
npm run check:seo -- http://127.0.0.1:8799     # status, redirect, metadata, sitemap, robots, 404
npm run check:seo -- https://ayodonor.web.id   # sama, terhadap produksi
```

`npm run check:seo` (`scripts/seo-audit.mjs`) tanpa dependensi dan keluar dengan kode 1 bila ada yang gagal. Terhadap
produksi sebelum deploy ini, empat pemeriksaan gagal (sitemap 404, robots tanpa `Sitemap:`, `/404` tanpa header) dan itu benar.
Wrangler bukan dependensi repositori; pakai `npx`. Setelah `npm run build` ulang, **restart `wrangler dev`**: pada pengujian
kami, instans yang sudah berjalan menjawab 404 untuk semua alamat karena manifest aset lamanya.

Pemeriksaan lain yang dijalankan dengan tes, bukan skrip: tautan internal dan `#anchor` (`tests/site.test.tsx`), isi `dist/`
tanpa sourcemap/secret (`tests/static-build.test.ts`), tautan sumber (`npm run check:links`, butuh jaringan).

## Prosedur deployment (manual)

1. `npm run lint && npm test && npm run build`
2. Pastikan `dist/` memuat `robots.txt`, `sitemap.xml`, `404.html`, `_headers`, lima HTML halaman.
3. `wrangler deploy` (nama Worker `ayodonor`; jangan mengubah nama, binding, atau DNS).
4. `npm run check:seo -- https://ayodonor.web.id` dan `curl -s https://ayodonor.web.id/robots.txt`.

## Checklist Google Search Console (manual; repositori tidak punya akses akun)

1. Tambahkan properti **Domain** `ayodonor.web.id` dan verifikasi lewat rekaman TXT DNS (properti domain mencakup http/https
   dan semua subdomain).
2. Sitemaps → kirim `https://ayodonor.web.id/sitemap.xml`.
3. Periksa status sitemap: harus "Berhasil" dengan 5 URL ditemukan. "Berhasil" hanya berarti berkasnya terbaca.
4. URL Inspection untuk lima URL kanonis: lihat "User-declared canonical" = "Google-selected canonical", HTML hasil render
   (konten muncul, bukan root kosong), dan "Page fetch: Successful".
5. Bila URL belum terindeks, "Request indexing" untuk beranda, `/panduan`, `/fakta-mitos`, `/lokasi`, `/tentang`. Permintaan
   bukan jaminan, dan kuotanya terbatas.
6. Pages (Page indexing): pastikan `/404` dan URL 404 lain berstatus "Excluded" (noindex / Not found), bukan "Indexed".
7. Core Web Vitals: data lapangan hanya muncul bila trafik cukup; jangan menyamakan dengan angka Lighthouse di bawah.
8. Setelah deploy: pantau Page indexing, Sitemaps, dan Core Web Vitals 1–4 minggu; catat tanggal deploy sebagai pembanding.

Jangan menyatakan halaman "sudah terindeks" hanya karena sitemap terkirim atau URL menjawab 200.

## Performa (hasil lab, bukan data pengguna)

Lighthouse 12 / Chrome 156 headless pada `wrangler dev` lokal dari `dist/` hasil `npm run build` (emulasi mobile bawaan:
CPU 4× lebih lambat, jaringan ~1,6 Mbps). Server lokal dan produksi sama-sama mengirim `content-encoding: br` untuk JS;
di produksi JS ber-cache `immutable` satu tahun dan HTML `max-age=0, must-revalidate` (diverifikasi dengan `curl`):

| Halaman | Mobile (perf) | LCP | TBT | CLS | Desktop (perf) |
|---|---|---|---|---|---|
| `/` | 100 | 1.5 s | 20 ms | 0 | 100 |
| `/panduan` | 95 | 1.7 s | 230 ms | 0 | 100 |
| `/fakta-mitos` | 97 | 1.6 s | 160 ms | 0 | 100 |
| `/lokasi` | 96 | 1.7 s | 200 ms | 0 | 100 |
| `/tentang` | 99 | 1.6 s | 10 ms | 0 | 100 |

Accessibility, Best Practices, dan SEO: 100 pada semua halaman (Lighthouse). Bundel: satu JS 303.8 kB (94.5 kB gzip) dan satu CSS
26.3 kB (6.4 kB gzip); tanpa font atau skrip pihak ketiga. **Batasan:** satu kali jalan per halaman; TBT sangat berfluktuasi
(jalan awal pada mesin yang sama mencatat 1.090 ms untuk beranda dan 2.990 ms untuk `/lokasi` mobile sebelum kode apa pun
diubah, lalu 20 ms dan 200 ms). Jangan membaca selisih kecil sebagai perbaikan atau kemunduran. INP tidak bisa diukur di lab
tanpa interaksi; lab hanya mengukur TBT sebagai pendekatan. LCP lab tidak sama dengan LCP pengguna nyata (CrUX/Search Console).
Seluruh isi dirender JavaScript, sehingga LCP bergantung pada unduh dan eksekusi bundel. Prerender (usulan) adalah satu-satunya
perubahan yang berpotensi memperbaiki itu secara berarti.

## Keamanan terkait SEO (diperiksa)

`.env.local` diabaikan Git (`.gitignore`: `.env*`) dan tidak dilacak; hanya `.env.example` dilacak. Tes build memastikan `dist/`
tanpa sourcemap, berkas `.env`, kunci API, atau referensi `process.env`. Header `_headers` yang ada (nosniff, referrer policy,
`X-Frame-Options: DENY`, permissions policy, cache aset) tetap terpasang; satu-satunya penambahan adalah `X-Robots-Tag` untuk
`/404`. Sitemap tidak memuat endpoint privat (tidak ada).

## Hal yang masih manual

- Verifikasi properti dan semua langkah Search Console di atas.
- Cloudflare (dashboard; tidak diubah di sini): **http://ayodonor.web.id/ menjawab 200 tanpa redirect ke HTTPS** (diverifikasi
  24 Okt 2026). Canonical menunjuk HTTPS sehingga dampaknya terbatas, tetapi aktifkan "Always Use HTTPS" dan, setelah stabil,
  HSTS. `www.ayodonor.web.id` tidak teresolusi (tidak ada duplikat host).
- Gambar Open Graph: lihat Backlog.
- Deployment itu sendiri.

## Keterbatasan: lokal vs produksi

Lokal diverifikasi dengan `wrangler dev` 4.152 (workerd) pada `dist/`. Itu sangat dekat dengan Workers static assets, tetapi tidak
mencakup: perilaku edge Cloudflare (kompresi, fitur robots.txt terkelola, redirect HTTPS), cache, atau HTTP/3. Hasil produksi di
dokumen ini adalah pengamatan 24 Okt 2026 **sebelum** deploy perubahan SEO ini. Tidak ada data Search Console atau CrUX yang
dipakai karena tidak ada akses.

## Backlog (belum dikerjakan; perlu keputusan)

1. **Prerender / static generation isi halaman**: usulan di [seo-prerender-proposal.md](seo-prerender-proposal.md).
2. **Gambar Open Graph**: tidak ada aset yang cocok, jadi tidak ada `og:image` dan `twitter:card` tetap `summary`. Kebutuhan
   desain: 1200×630 px (PNG/JPEG, < 300 kB) berisi nama "AyoDonor" dan satu kalimat deskripsi tanpa klaim medis; simpan di
   `public/`, lalu tambahkan `og:image` (URL absolut), `og:image:alt`, dan ubah `twitter:card` menjadi `summary_large_image`.
   Jangan merujuk URL gambar sebelum berkasnya ada. Ikon PNG (180×180 untuk apple-touch-icon, dan kelipatan 48 px untuk
   favicon) juga belum ada; favicon saat ini hanya SVG.
3. **Panjang deskripsi** (di atas): pertimbangkan merapikan kalimat ke ≤ ~160 karakter dengan peringatan "bukan layanan medis"
   tetap ada. Keputusan redaksi.
4. **307 vs 301** untuk `/panduan/`, `/panduan.html`: bawaan Workers; mengubahnya perlu Worker atau aturan di dashboard.
5. **Peluang konten** (hanya ide, belum ada yang dibuat): halaman ringkas per topik yang sudah ada di FAQ (mis. jeda antar
   donor, persiapan sebelum donor) bila data Search Console menunjukkan permintaan; halaman per kota hanya bila ada konten asli
   per kota (bukan daftar alamat yang sama), karena 228 halaman tipis berisiko dan datanya "bisa belum lengkap".
6. Footer memakai `<h2>` yang sama di semua halaman ("Tentang AyoDonor", "Halaman"); tidak merusak hierarki (satu `<h1>` per
   halaman, tidak ada level yang dilompati), hanya duplikasi teks heading.
