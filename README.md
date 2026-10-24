# AyoDonor

Proyek pribadi dan independen tentang donor darah untuk anak muda Indonesia: dasar-dasar donor, kuis panduan awal,
pencari UDD/UTD PMI (daftar dari halaman Kontak PMI), dan FAQ yang bisa dicari. Tidak memakai AI dan tidak butuh API key.
Kontribusi dari luar diterima (lihat [CONTRIBUTING.md](CONTRIBUTING.md)). Situs: <https://ayodonor.web.id>

> **Bukan layanan medis.** AyoDonor adalah proyek pribadi: tidak berafiliasi dengan, tidak dikelola oleh, dan tidak didukung atau disahkan oleh PMI maupun Kemenkes. Kuis **bukan** keputusan kelayakan:
> petugas PMI yang menentukan lewat pemeriksaan langsung. Daftar UDD/UTD disalin dari halaman Kontak PMI dan bisa belum lengkap atau sudah berubah; stok darah tidak ditampilkan.
> Klaim kesehatan dan sumbernya dicatat di [docs/medical-claims.md](docs/medical-claims.md); isinya belum ditinjau tenaga medis.

## Masalah yang ingin dijawab

Calon donor muda sering tidak tahu apa yang diperiksa petugas, bagaimana bersiap, atau ke mana harus pergi, dan menemukan angka
yang berbeda-beda di berbagai sumber. AyoDonor merangkum informasi umum dengan tautan sumber di dekat tiap klaim, menampilkan
perbedaan antar sumber apa adanya, dan mengarahkan keputusan pribadi ke petugas PMI.

## Fitur (ada di kode)

Lima halaman: `/` (ringkasan), `/panduan` (syarat, persiapan, proses, setelah donor, kuis, FAQ yang bisa dicari),
`/fakta-mitos`, `/lokasi` (cari UDD/UTD per kota, kabupaten, nama unit, atau provinsi di 228 unit), `/tentang` (sumber beserta
tanggal akses dan keterbatasannya, tabel perbedaan antar sumber, ringkasan privasi). Kuis dihitung di browser dan tidak ada data
pengguna yang dikirim ke server. Stok darah tidak ditampilkan. Pencari lokasi tidak punya koordinat bersumber, jadi jarak dari
posisi pengguna tidak dihitung.

## Teknologi

React 19, Vite 6, Tailwind 4, TypeScript 5.8, dibangun menjadi **situs statis** (tanpa server, basis data, atau API key) dan
dilayani sebagai Cloudflare Workers static assets ([docs/static-deployment.md](docs/static-deployment.md)). Tes: Vitest, Testing Library, jsdom.
Versi awal proyek ini memakai Google Gemini dan server Express; keduanya sudah dihapus
([docs/ai-removal.md](docs/ai-removal.md), [docs/static-migration.md](docs/static-migration.md)), riwayat Git tetap menyimpannya.

## Menjalankan

Prasyarat: Node.js dan npm. Versi minimum menurut dependensi terpasang: `npm run dev` dan `npm run build` butuh Node 20.19+ atau 22.12+
(`@vitejs/plugin-react`); `npm test` butuh Node 22.22.2+, 24.15+, atau 26+ (`jsdom` 30). Yang benar-benar diuji pemelihara: Node 26.8.2 dengan npm 11.19.1.
Belum ada CI yang menegakkan versi.

```bash
npm install
npm run dev        # Vite dev server, http://localhost:5173
npm run build      # situs statis lengkap -> dist/
npm run preview    # sajikan dist/ secara lokal, http://localhost:4173
```

| Perintah | Fungsi |
|---|---|
| `npm run lint` | Pengecekan tipe (`tsc --noEmit`) |
| `npm test` | Semua tes (vitest): konten, UI, FAQ, SEO, dan build statis ke direktori sementara |
| `npm run check:seo -- <url>` | Audit SEO situs yang berjalan (status, redirect, metadata, sitemap, robots, 404); lihat [docs/seo.md](docs/seo.md) |
| `npm run check:links` | Cek semua URL sumber di `src/data/sources.ts` (manual, butuh jaringan) |
| `npm run clean` | Hapus `dist` |

Tes tidak butuh API key, server, atau jaringan. Tidak ada variabel lingkungan yang dibutuhkan; lihat [.env.example](.env.example).
Tidak ada linter gaya atau formatter di repositori.

## Deployment

Cloudflare (Workers static assets atau Pages): build command `npm run build`, output directory `dist`, tanpa environment variable.
Lima halaman (`/`, `/panduan`, `/fakta-mitos`, `/lokasi`, `/tentang`) masing-masing punya berkas HTML hasil build, jadi tidak perlu aturan fallback.
Detail, header, domain, dan risiko: [docs/static-deployment.md](docs/static-deployment.md). SEO (URL kanonis, sitemap, robots, 404, JSON-LD, checklist Search Console): [docs/seo.md](docs/seo.md).

## Struktur

```
src/               aplikasi React: pages/ (lima halaman), layout/, components/, router.tsx, routes.ts (tabel rute dan metadata), seo.ts;
                   FAQ di data/faq.ts, pencari UDD/UTD di data/utd.ts
shared/content.ts  teks ringkasan kuis
public/            favicon, robots.txt, dan _headers (Cloudflare); sitemap.xml dibuat saat build dari src/routes.ts
scripts/           check-source-links.mjs, seo-audit.mjs
tests/             vitest (node + jsdom)
docs/              klaim medis & sumber, arah desain, migrasi, deployment, SEO, audit kesiapan open source
```

## Sumber data dan atribusi

- **Daftar 228 UDD/UTD** (`src/data/utd.ts`): data kontak fasilitas yang dipublikasikan **Palang Merah Indonesia (PMI)** di halaman
  Kontak PMI (<https://ayodonor.pmi.or.id/?page=kontak>), disalin apa adanya (dengan ejaan sumber) pada 24 Oktober 2026. Hak atas data tetap pada
  PMI; penyalinan ini tidak berarti PMI mendukung AyoDonor. Halaman itu tidak mencantumkan lisensi atau syarat penggunaan, jadi
  pemelihara akan meminta klarifikasi kepada PMI tentang redistribusinya; **sampai ada jawaban, statusnya belum dipastikan**
  ([audit](docs/open-source-readiness-audit.md#10-dataset-uddutd-pemisahan-dan-redistribusi-lanjutan-24-okt-2026)). Data bisa belum lengkap atau sudah
  berubah; hubungi unit atau PMI untuk memastikan.
- **Teks edukasi**: ditulis proyek ini berdasarkan sumber yang tercantum di halaman `/tentang` dan `src/data/sources.ts`
  (Permenkes 91/2015, FAQ PMI, WHO, artikel dan siaran pers Kemenkes). Tautan sumber bukan pemberian lisensi atas isi sumber.
- Dependensi tetap di bawah lisensinya masing-masing (lihat `package-lock.json`).

## Lisensi

Kode proyek ini berlisensi **MIT** ([LICENSE](LICENSE), hak cipta 2026 Farid). Lisensi itu mencakup kode sumber, tes, skrip, dan konfigurasi karya proyek ini,
**bukan** materi pihak ketiga:

- **Data UDD/UTD** (`src/data/utd.ts`) milik sumbernya (PMI) dan tidak dicakup lisensi MIT; status redistribusinya belum dipastikan (lihat di atas).
- **Teks edukasi** dan tautan sumber: lisensi teks belum diputuskan terpisah; isi sumber yang dirujuk tetap milik penerbitnya.
- **Dependensi** tetap di bawah lisensinya masing-masing.

Catatan: asal-usul kode (sebagian dihasilkan dengan bantuan alat AI, termasuk kode awal dari Google AI Studio) dan kepemilikannya belum diverifikasi sepenuhnya;
lihat [docs/ai-terms-review.md](docs/ai-terms-review.md) dan [docs/open-source-readiness-audit.md](docs/open-source-readiness-audit.md). Repositori ini belum dipublikasikan.

## Kontribusi, keamanan, perilaku

Panduan kontribusi: [CONTRIBUTING.md](CONTRIBUTING.md). Pelaporan kerentanan: [SECURITY.md](SECURITY.md). Aturan komunitas:
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Jangan menaruh rahasia atau data pribadi di Issue maupun pull request.
