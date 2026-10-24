# AyoDonor

Proyek edukasi independen tentang donor darah untuk anak muda Indonesia: dasar-dasar donor, kuis panduan awal,
pencari UDD/UTD PMI (daftar dari halaman Kontak PMI), dan FAQ yang bisa dicari. Tidak memakai AI dan tidak butuh API key.

> **Bukan layanan medis.** AyoDonor tidak berafiliasi dengan PMI atau Kemenkes. Kuis **bukan** keputusan kelayakan:
> petugas PMI yang menentukan lewat pemeriksaan langsung. Daftar UDD/UTD disalin dari halaman Kontak PMI dan bisa belum lengkap atau sudah berubah; stok darah tidak ditampilkan.
> Klaim kesehatan dan sumbernya dicatat di [docs/medical-claims.md](docs/medical-claims.md).

## Teknologi

React 19 + Vite 6 + Tailwind 4, dibangun menjadi **situs statis** (tanpa server, basis data, atau API key). Kuis dihitung di browser dan
tidak ada data pengguna yang dikirim ke server. Versi awal proyek ini memakai Google Gemini dan server Express untuk acara
terkait GCP; keduanya sudah dihapus ([docs/ai-removal.md](docs/ai-removal.md), [docs/static-migration.md](docs/static-migration.md)),
riwayat Git tetap menyimpannya.

## Menjalankan

Prasyarat: Node.js 22.12+ (diuji di Node 26).

```bash
npm install
npm run dev        # Vite dev server, http://localhost:5173
npm run build      # situs statis lengkap -> dist/
npm run preview    # sajikan dist/ secara lokal, http://localhost:4173
```

| Perintah | Fungsi |
|---|---|
| `npm run lint` | Pengecekan tipe (`tsc --noEmit`) |
| `npm test` | Semua tes (vitest): konten, UI, FAQ, dan build statis ke direktori sementara |
| `npm run check:seo -- <url>` | Audit SEO situs yang berjalan (status, redirect, metadata, sitemap, robots, 404); lihat [docs/seo.md](docs/seo.md) |
| `npm run clean` | Hapus `dist` |

Tes tidak butuh API key, server, atau jaringan.

## Deployment

Cloudflare (Workers static assets atau Pages): build command `npm run build`, output directory `dist`, tanpa environment variable.
Lima halaman (`/`, `/panduan`, `/fakta-mitos`, `/lokasi`, `/tentang`) masing-masing punya berkas HTML hasil build, jadi tidak perlu aturan fallback.
Detail, header, domain, dan risiko: [docs/static-deployment.md](docs/static-deployment.md). SEO (URL kanonis, sitemap, robots, 404, JSON-LD, checklist Search Console): [docs/seo.md](docs/seo.md).

## Struktur

```
src/               aplikasi React: pages/ (lima halaman), layout/, components/, router.tsx, routes.ts (tabel rute dan metadata);
                   FAQ di data/faq.ts, pencari UDD/UTD di data/utd.ts
shared/content.ts  teks ringkasan kuis
public/            favicon, robots.txt, dan _headers (Cloudflare); sitemap.xml dibuat saat build dari src/routes.ts
tests/             vitest (node + jsdom)
docs/              klaim medis & sumber, arah desain (design-direction.md), migrasi, deployment, bukti rate limit lama
```
