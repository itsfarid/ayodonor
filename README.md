# AyoDonor

Proyek edukasi independen tentang donor darah untuk anak muda Indonesia: dasar-dasar donor, kuis panduan awal,
contoh lokasi (data demo), dan asisten AI untuk pertanyaan umum.

> **Bukan layanan medis.** AyoDonor tidak berafiliasi dengan PMI atau Kemenkes. Kuis **bukan** keputusan kelayakan:
> petugas PMI yang menentukan lewat pemeriksaan langsung. Data lokasi dan stok adalah contoh yang belum diverifikasi.
> Klaim kesehatan dan sumbernya dicatat di [docs/medical-claims.md](docs/medical-claims.md).

## Teknologi

React 19 + Vite 6 + Tailwind 4 (frontend), Express + TypeScript (server), Google Gemini lewat `@google/genai`
(opsional; tanpa API key aplikasi memakai ringkasan otomatis yang diberi label).

## Menjalankan

Prasyarat: Node.js 22.12+ (diuji di Node 26).

```bash
npm install
cp .env.example .env.local   # opsional: isi GEMINI_API_KEY untuk mengaktifkan AI (jangan di-commit)
npm run dev                  # mode pengembangan (Vite), http://127.0.0.1:3000
```

Produksi:

```bash
npm run build                # frontend -> dist/public, server -> dist/server/index.cjs
npm start                    # node dist/server/index.cjs
```

Bundel server dibangun dengan `NODE_ENV=production` yang "dikunci" (`--define`), jadi `npm start` tidak bisa
menjalankan Vite dev server. Server produksi gagal start dengan pesan jelas bila `dist/public/index.html` tidak ada.

### Skrip

| Perintah | Fungsi |
|---|---|
| `npm run lint` | Pengecekan tipe (`tsc --noEmit`) |
| `npm test` | Semua tes (vitest): API, produksi, proxy/shutdown, konten, UI |
| `npm run smoke:prod` | Build, jalankan server hasil build **tanpa** `NODE_ENV`, cek rute, path sensitif, shutdown |
| `npm run smoke:dev` | Jalankan mode dev, cek Vite aktif, shutdown |
| `npm run clean` | Hapus `dist` |

Tes memakai Gemini tiruan; tidak butuh API key dan tidak memanggil layanan berbayar.

## Konfigurasi (environment)

Lihat [.env.example](.env.example). Ringkasnya: `GEMINI_API_KEY`, `PORT` (default 3000), `HOST`, `TRUST_PROXY`,
`GEMINI_TIMEOUT_MS`, `STATIC_DIR`.

### Asumsi deployment yang wajib diperhatikan

- **Alamat IP klien dan rate limit.** Batas 10 permintaan/menit/IP (jendela 60 detik) berlaku untuk
  `/api/gemini/evaluate` dan `/api/gemini/chat` (satu penghitung bersama), dihitung **sebelum** body diparse.
  Defaultnya `X-Forwarded-For` **diabaikan**. Bila aplikasi berjalan di balik reverse proxy/platform (mis. Cloud Run),
  atur `TRUST_PROXY=<jumlah proxy di depan>` (mis. `1`); kalau tidak, semua pengguna berbagi satu penghitung.
  Jangan pakai `true`. Penghitung ada di memori per instance, jadi bukan pembatas terdistribusi: dengan beberapa instance
  batas efektifnya dikalikan jumlah instance. Pasang juga batas biaya/kuota di sisi Gemini.
- **Health check:** `GET /api/health`. **Shutdown:** SIGTERM/SIGINT menghentikan koneksi baru, menunggu request berjalan
  maksimal 10 detik, lalu keluar (kode 0, atau 1 bila dipaksa).
- **Log:** satu baris JSON per request (id, path, status, durasi) dan kegagalan upstream (jenis, status). Isi pesan,
  nama, dan jawaban kuis tidak dicatat.

## API

| Endpoint | Body | Catatan |
|---|---|---|
| `GET /api/health` | - | `{status:"ok"}` |
| `POST /api/gemini/evaluate` | `{name?, ageWeight, sleep, meds, recency}` (`safe`\|`unsafe`\|``), maks 4 KB | Ringkasan hasil kuis |
| `POST /api/gemini/chat` | `{message (<=500), history[<=20 x {role:user\|model, text<=2000}]}`, maks 96 KB | Chat |

Sukses: `{success:true, source:"ai"|"fallback", fallbackReason?, text}`. `source:"fallback"` berarti teks otomatis
(tanpa API key atau kuota habis), bukan jawaban AI. Galat: `{success:false, code, error}` dengan 400 (`invalid_request`,
`invalid_json`), 413 (`payload_too_large`), 429 (`rate_limited`), 502/504 (`upstream_*`), 500 (`internal_error`).

## Struktur

```
server.ts          entry (config, Gemini client, shutdown)
server/            app (createApp), validation, errors, gemini, prompts, config, shutdown, logger
shared/content.ts  teks aman bersama (ringkasan kuis, balasan chat otomatis)
src/               aplikasi React
tests/             vitest (node + jsdom)
scripts/           smoke test dev/produksi
docs/              klaim medis & sumber, bukti rate limit
```
