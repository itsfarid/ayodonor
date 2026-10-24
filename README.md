# AyoDonor

**English** · [Bahasa Indonesia](#bahasa-indonesia)

A personal, independent project about blood donation for young people in Indonesia: donation basics, a short starter quiz,
a finder for PMI blood donor units (UDD/UTD, list taken from the PMI Contact page), and a searchable FAQ. It uses no AI and needs no API key.
External contributions are welcome (see [CONTRIBUTING.md](CONTRIBUTING.md)). Site: <https://ayodonor.web.id> (content is in Indonesian).

> **Not a medical service.** AyoDonor is a personal project: it is not affiliated with, operated by, or endorsed or approved by PMI (the Indonesian Red Cross) or the Ministry of Health (Kemenkes). The quiz is **not** an eligibility decision:
> PMI staff decide through an in-person examination. The UDD/UTD list is copied from the PMI Contact page and may be incomplete or out of date; blood stock is not shown.
> Health claims and their sources are recorded in [docs/medical-claims.md](docs/medical-claims.md) (Indonesian); the content has not been reviewed by medical professionals.

## The problem

Prospective young donors often do not know what staff check, how to prepare, or where to go, and they find differing figures across sources.
AyoDonor summarises general information with source links next to each claim, shows the differences between sources as they are,
and points personal decisions to PMI staff.

## Features (present in the code)

Five pages: `/` (overview), `/panduan` (requirements, preparation, process, after donating, quiz, searchable FAQ),
`/fakta-mitos` (facts and myths), `/lokasi` (search 228 UDD/UTD by city, regency, unit name, or province), `/tentang` (sources with access dates and
limitations, a table of differences between sources, a privacy summary). The quiz is computed in the browser and no user data is sent to a server.
Blood stock is not shown. The finder has no sourced coordinates, so distance from the user's position is not calculated.

## Tech stack

React 19, Vite 6, Tailwind 4, TypeScript 5.8, built as a **static site** (no server, database, or API key) and served as Cloudflare Workers static assets
([docs/static-deployment.md](docs/static-deployment.md)). Tests: Vitest, Testing Library, jsdom.
An early version of the project used Google Gemini and an Express server; both were removed
([docs/ai-removal.md](docs/ai-removal.md), [docs/static-migration.md](docs/static-migration.md)), and the Git history still contains them.

## Getting started

Prerequisites: Node.js and npm. Minimum versions according to the installed dependencies: `npm run dev` and `npm run build` need Node 20.19+ or 22.12+
(`@vitejs/plugin-react`); `npm test` needs Node 22.22.2+, 24.15+, or 26+ (`jsdom` 30). What the maintainer has actually tested: Node 26.8.2 with npm 11.19.1.
No CI enforces versions yet.

```bash
npm install
npm run dev        # Vite dev server, http://localhost:5173
npm run build      # complete static site -> dist/
npm run preview    # serve dist/ locally, http://localhost:4173
```

| Command | Purpose |
|---|---|
| `npm run lint` | Type check (`tsc --noEmit`) |
| `npm test` | All tests (vitest): content, UI, FAQ, SEO, and a static build into a temporary directory |
| `npm run check:seo -- <url>` | SEO audit of a running site (status, redirects, metadata, sitemap, robots, 404); see [docs/seo.md](docs/seo.md) |
| `npm run check:links` | Check every source URL in `src/data/sources.ts` (manual, needs network) |
| `npm run clean` | Remove `dist` |

Tests need no API key, server, or network. No environment variables are required; see [.env.example](.env.example).
There is no style linter or formatter in the repository.

## Deployment

Cloudflare (Workers static assets or Pages): build command `npm run build`, output directory `dist`, no environment variables.
Each of the five pages (`/`, `/panduan`, `/fakta-mitos`, `/lokasi`, `/tentang`) has its own built HTML file, so no fallback rule is needed.
Details, headers, domain, and risks: [docs/static-deployment.md](docs/static-deployment.md). SEO (canonical URLs, sitemap, robots, 404, JSON-LD, Search Console checklist): [docs/seo.md](docs/seo.md).
The docs in `docs/` are written in Indonesian.

## Structure

```
src/               React app: pages/ (five pages), layout/, components/, router.tsx, routes.ts (route and metadata table), seo.ts;
                   FAQ in data/faq.ts, UDD/UTD finder data in data/utd.ts
shared/content.ts  quiz summary text
public/            favicon, robots.txt, and _headers (Cloudflare); sitemap.xml is generated at build time from src/routes.ts
scripts/           check-source-links.mjs, seo-audit.mjs
tests/             vitest (node + jsdom)
docs/              medical claims and sources, design direction, migration, deployment, SEO, open-source readiness audit
```

## Data sources and attribution

- **The 228 UDD/UTD list** (`src/data/utd.ts`): facility contact data published by the **Indonesian Red Cross (Palang Merah Indonesia, PMI)** on its
  Contact page (<https://ayodonor.pmi.or.id/?page=kontak>), copied as is (including the source's spelling) on 24 October 2026. The rights to the data remain with
  PMI; copying it does not mean PMI endorses AyoDonor. The page states no license or terms of use, so the maintainer
  intends to ask PMI for clarification about redistribution; **until there is an answer, the status is not established**
  ([audit](docs/open-source-readiness-audit.md#10-dataset-uddutd-pemisahan-dan-redistribusi-lanjutan-24-okt-2026), Indonesian). The data may be incomplete or out of date;
  contact the unit or PMI to confirm.
- **Educational text**: written by this project based on the sources listed on the `/tentang` page and in `src/data/sources.ts`
  (Permenkes 91/2015, the PMI FAQ, WHO, Kemenkes articles and press releases). A link to a source is not a license to its content.
- Dependencies remain under their own licenses (see `package-lock.json`).

## License

The project's code is licensed under **MIT** ([LICENSE](LICENSE), copyright 2026 Farid). The license covers the source code, tests, scripts, and configuration written for this project,
and **not** third-party material:

- **The UDD/UTD data** (`src/data/utd.ts`) belongs to its source (PMI) and is not covered by the MIT license; its redistribution status is not yet established (see above).
- **Educational text** and source links: the text license has not been decided separately; the content of referenced sources remains the publishers'.
- **Dependencies** remain under their own licenses.

Note: the provenance of the code (partly produced with AI tools, including the initial code from Google AI Studio) and its ownership have not been fully verified;
see [docs/ai-terms-review.md](docs/ai-terms-review.md) and [docs/open-source-readiness-audit.md](docs/open-source-readiness-audit.md) (both in Indonesian). This repository has not been published.

## Contributing, security, conduct

Contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md). Reporting vulnerabilities: [SECURITY.md](SECURITY.md). Community rules:
[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Do not put secrets or personal data in issues or pull requests.
(The contribution guide and security policy are written in Indonesian.)

---

# Bahasa Indonesia

[English](#ayodonor) · **Bahasa Indonesia**

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
