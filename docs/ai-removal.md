# Penghapusan fitur AI/Gemini

AyoDonor awalnya memakai Google Gemini untuk acara terkait GCP (kuis dijelaskan AI, chatbot "Sobat Hero AI").
AI bukan lagi kebutuhan produk. Dokumen ini mencatat rencana dan hasilnya. Riwayat Git tetap menunjukkan bahwa versi
awal memakai AI; riwayat tidak ditulis ulang.

## Inventaris (sebelum penghapusan)

| Area | File | Peran AI |
|---|---|---|
| Server | `server.ts` | import `@google/genai`, inisialisasi klien, `GEMINI_API_KEY`, `dotenv` untuk memuat key |
| Server | `server/gemini.ts`, `server/prompts.ts` | panggilan Gemini, timeout, klasifikasi galat, prompt |
| Server | `server/validation.ts` | validasi payload `/api/gemini/*` (khusus AI) |
| Server | `server/app.ts` | endpoint `POST /api/gemini/evaluate` dan `/api/gemini/chat`, label `source:ai/fallback` |
| Server | `server/config.ts` | `GEMINI_TIMEOUT_MS` |
| Bersama | `shared/content.ts` | balasan chat otomatis, `OFFLINE_NOTICE` |
| Frontend | `src/App.tsx` | bagian chat, status AI, pemanggilan API kuis, label "ditulis AI" |
| Frontend | `src/components/PrivacyNotice.tsx` | menjelaskan pengiriman data ke Gemini |
| Konfigurasi | `.env.example`, `metadata.json`, `README.md`, `index.html` | key Gemini, capability AI Studio, teks "asisten AI" |
| Dokumen | `docs/medical-claims.md` | aliran data ke Gemini |
| Tes | `tests/upstream.test.ts`, `validation.test.ts`, `api.test.ts`, `app.test.tsx`, `content.test.ts`, `proxy-shutdown.test.ts`, `helpers/server.ts` | menguji AI atau memakai endpoint AI sebagai sarana |
| Skrip | `scripts/smoke-*.mjs` | memaksa `GEMINI_API_KEY` kosong |
| Dependensi | `@google/genai`, `dotenv` | hanya dipakai untuk AI/key |

## Rencana

- **Kuis:** dihitung sepenuhnya di browser memakai `buildQuizSummary` (`shared/content.ts`). Tidak ada lagi panggilan server,
  jadi nama dan jawaban kuis tidak meninggalkan browser.
- **Chat:** dihapus. Digantikan FAQ statis yang bisa dicari, hanya berisi pernyataan yang sudah ada di
  `docs/medical-claims.md` beserta sumbernya. Tidak ada informasi medis baru.
- **Server:** endpoint Gemini dihapus. Dipertahankan: `createApp`, ID request, log aman, penanganan error terpusat,
  pembatas laju dan batas body pada `/api`, `TRUST_PROXY`, shutdown anggun, penyajian aset produksi tanpa
  bundel/sourcemap server, `GET /api/health`.
- **Dihapus karena tak ada pemakai lagi:** `validation.ts` (khusus payload AI), `@google/genai`, `dotenv`.
- **Tidak diubah:** peringatan medis, label data demo PMI, `.env.local` (berisi key lama; tidak disentuh, tidak diputar).
  Key yang pernah dipakai sebaiknya dicabut di konsol Google bila tidak dipakai lagi (tindakan manual).
- **Backend:** setelah penghapusan, satu-satunya endpoint adalah `/api/health`. Tidak ada penyimpanan, autentikasi, atau data
  eksternal dinamis, jadi aplikasi sebenarnya dapat dilayani sebagai situs statis. Migrasi tidak dilakukan di sini.

## Hasil

- Endpoint `/api/gemini/*`, modul Gemini/prompt/validasi, chat UI, label status AI, `@google/genai`, `dotenv`,
  `GEMINI_API_KEY` dan `GEMINI_TIMEOUT_MS` sudah dihapus. Tidak ada variabel lingkungan yang wajib.
- Kuis berjalan di browser; FAQ statis (`src/data/faq.ts`) menggantikan chat.
- Dipertahankan: kontrol keamanan umum (ID request, log aman, penanganan error, rate limit, batas body, `TRUST_PROXY`,
  shutdown), penyajian produksi tanpa bundel/sourcemap server, peringatan medis, label data demo PMI.
- `metadata.json`: capability `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` (konfigurasi AI Studio) dihapus dan deskripsi
  disesuaikan.
- Referensi AI yang sengaja tersisa: kutipan hero `"AI bisa bikin segalanya, tapi belum bisa bikin setetes darah"`
  (retorika, bukan fitur), catatan riwayat di README dan docs, dan `.env.local` lokal milik pengguna (tidak disentuh).
- Key lama: bila masih aktif di konsol Google, cabut secara manual; tidak dilakukan otomatis.

## Pembaruan

Server Express yang dipertahankan setelah penghapusan AI kemudian juga dihapus; situs kini sepenuhnya statis
([docs/static-migration.md](static-migration.md)). Bagian "Dipertahankan" dan "Backend" di atas mencerminkan keadaan
pada saat penghapusan AI.
