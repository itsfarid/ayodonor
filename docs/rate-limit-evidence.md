# Bukti uji rate limit

## Konfigurasi sebenarnya (kode saat ini)

`server/app.ts`: `express-rate-limit` v8, `windowMs = 60_000`, `limit = 10`, penyimpanan memori, header standar
(`RateLimit-*`, `Retry-After`), satu instance untuk `POST /api/gemini/evaluate` dan `POST /api/gemini/chat`.
Limiter dipasang **sebelum** `express.json`, jadi permintaan rusak atau terlalu besar ikut dihitung.
Respons 429: `{success:false, code:"rate_limited", error:"..."}`.

## File percobaan lama (tidak diubah, tidak di-commit)

`rate_test_result.txt` dan `rate_test_result2.txt` (Juli 2026) hanya berisi 11 baris `Request N: <status>`.

| File | Isi | Yang dibuktikan |
|---|---|---|
| `rate_test_result.txt` | 2 x 200 lalu 9 x 500, **tanpa 429** | Hanya bahwa panggilan Gemini gagal (500). Tidak ada 429 pada 11 request, padahal limit 10/menit: server saat itu mungkin versi lama, atau request tersebar lebih dari 60 detik. Tidak konklusif |
| `rate_test_result2.txt` | 10 x 500 lalu 429 pada request ke-11 | Konsisten dengan limit 10, tetapi tidak mencatat endpoint, payload, waktu, atau header; tidak bisa direproduksi |

Status HTTP saja bukan bukti pembatasan yang benar. Bukti yang dapat diulang ada di `tests/validation.test.ts` dan
`tests/proxy-shutdown.test.ts`:

- 429 pada permintaan ke-(limit+1) beserta header `RateLimit-Limit` dan `Retry-After`;
- permintaan JSON rusak ikut dihitung;
- penghitung pulih setelah jendela berlalu (jam terkontrol, tanpa menunggu waktu nyata);
- `X-Forwarded-For` tidak bisa dipakai menghindari limit secara default; dengan `TRUST_PROXY=1` klien dibedakan.

Tes tidak memanggil Gemini asli dan tidak mengirim lonjakan ke layanan live.
