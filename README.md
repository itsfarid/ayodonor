# AyoDonor

Proyek edukasi independen tentang donor darah untuk anak muda Indonesia: dasar-dasar donor, kuis panduan awal,
contoh lokasi (data demo), dan FAQ yang bisa dicari. Tidak memakai AI dan tidak butuh API key.

> **Bukan layanan medis.** AyoDonor tidak berafiliasi dengan PMI atau Kemenkes. Kuis **bukan** keputusan kelayakan:
> petugas PMI yang menentukan lewat pemeriksaan langsung. Data lokasi dan stok adalah contoh yang belum diverifikasi.
> Klaim kesehatan dan sumbernya dicatat di [docs/medical-claims.md](docs/medical-claims.md).

## Teknologi

React 19 + Vite 6 + Tailwind 4 (frontend), Express + TypeScript (server kecil untuk menyajikan aset dan health check).
Kuis dihitung di browser; tidak ada data pengguna yang dikirim ke server. Versi awal proyek ini memakai Google Gemini
untuk acara terkait GCP; fitur itu sudah dihapus ([docs/ai-removal.md](docs/ai-removal.md)), riwayat Git tetap menyimpannya.

## Menjalankan

Prasyarat: Node.js 22.12+ (diuji di Node 26).

```bash
npm install
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
| `npm test` | Semua tes (vitest): API, produksi, proxy/shutdown, konten, UI, FAQ |
| `npm run smoke:prod` | Build, jalankan server hasil build **tanpa** `NODE_ENV`, cek rute, path sensitif, shutdown |
| `npm run smoke:dev` | Jalankan mode dev, cek Vite aktif, shutdown |
| `npm run clean` | Hapus `dist` |

Tes tidak butuh API key, jaringan, atau layanan berbayar.

## Konfigurasi (environment)

Tidak ada secret yang dibutuhkan. Variabel opsional (lihat [.env.example](.env.example)): `PORT` (default 3000), `HOST`,
`TRUST_PROXY`, `STATIC_DIR`. File `.env` tidak lagi dimuat otomatis; atur lewat shell atau platform.

### Asumsi deployment yang wajib diperhatikan

- **Alamat IP klien dan rate limit.** Batas 60 permintaan/menit/IP (jendela 60 detik) berlaku untuk semua path `/api`
  dan dihitung **sebelum** body diparse (body dibatasi 1 KB). Defaultnya `X-Forwarded-For` **diabaikan**. Bila aplikasi
  berjalan di balik reverse proxy/platform (mis. Cloud Run), atur `TRUST_PROXY=<jumlah proxy di depan>` (mis. `1`);
  kalau tidak, semua pengguna berbagi satu penghitung. Jangan pakai `true`. Penghitung ada di memori per instance, jadi
  bukan pembatas terdistribusi.
- **Health check:** `GET /api/health`. **Shutdown:** SIGTERM/SIGINT menghentikan koneksi baru, menunggu request berjalan
  maksimal 10 detik, lalu keluar (kode 0, atau 1 bila dipaksa).
- **Log:** satu baris JSON per request (id, path tanpa query, status, durasi). Isi body tidak dicatat.

## API

Hanya satu endpoint: `GET /api/health` memberi `{status:"ok"}`. Path `/api/*` lain (termasuk endpoint `/api/gemini/*`
yang lama) menjawab `404 {success:false, code:"not_found"}`. Galat umum: 400 `invalid_json`, 413 `payload_too_large`,
429 `rate_limited`, 500 `internal_error`, semuanya berbentuk `{success:false, code, error}`.

### Apakah server masih diperlukan?

Tidak ada penyimpanan, autentikasi, atau data eksternal dinamis; kuis, FAQ, dan lokasi demo sepenuhnya di frontend.
Satu-satunya fungsi server adalah menyajikan `dist/public` dan `GET /api/health`. Hosting statis (hanya isi `dist/public`)
secara teknis memungkinkan. Migrasi tidak dilakukan di sini; ini keputusan deployment terpisah.

## Struktur

```
server.ts          entry (config, shutdown)
server/            app (createApp), errors, config, shutdown, logger
shared/content.ts  teks ringkasan kuis
src/               aplikasi React (kuis, FAQ di src/data/faq.ts, lokasi demo)
tests/             vitest (node + jsdom)
scripts/           smoke test dev/produksi
docs/              klaim medis & sumber, bukti rate limit
```
