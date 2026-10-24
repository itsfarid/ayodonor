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
