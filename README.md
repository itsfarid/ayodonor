# AyoDonor

Proyek edukasi independen tentang donor darah untuk anak muda Indonesia: dasar-dasar donor, kuis panduan awal,
contoh lokasi (data demo), dan FAQ yang bisa dicari. Tidak memakai AI dan tidak butuh API key.

> **Bukan layanan medis.** AyoDonor tidak berafiliasi dengan PMI atau Kemenkes. Kuis **bukan** keputusan kelayakan:
> petugas PMI yang menentukan lewat pemeriksaan langsung. Data lokasi dan stok adalah contoh yang belum diverifikasi.
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
| `npm run clean` | Hapus `dist` |

Tes tidak butuh API key, server, atau jaringan.

## Deployment

Cloudflare Pages: preset Vite, build command `npm run build`, output directory `dist`, tanpa environment variable.
Detail, header, domain, dan risiko: [docs/static-deployment.md](docs/static-deployment.md).

## Struktur

```
src/               aplikasi React (kuis, FAQ di src/data/faq.ts, lokasi demo)
shared/content.ts  teks ringkasan kuis
public/            favicon dan _headers (Cloudflare Pages)
tests/             vitest (node + jsdom)
docs/              klaim medis & sumber, migrasi, deployment, bukti rate limit lama
```
