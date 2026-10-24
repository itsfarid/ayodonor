# Bukti uji rate limit

## Status saat ini

Pembatas laju (`express-rate-limit`) dan seluruh server Express **sudah dihapus** saat migrasi ke situs statis
([docs/static-migration.md](static-migration.md)); tidak ada lagi endpoint yang perlu dibatasi. Bila perlu pembatasan
untuk situs yang dideploy, atur di tingkat hosting (Cloudflare). Tes rate limit lama ada di riwayat Git. Konfigurasi terakhirnya:
`windowMs = 60_000`, `limit = 60` untuk `/api`; sebelum itu limit 10 untuk endpoint AI `/api/gemini/*`.

## File percobaan lama (tidak diubah, tidak di-commit)

`rate_test_result.txt` dan `rate_test_result2.txt` (Juli 2026) hanya berisi 11 baris `Request N: <status>`.

| File | Isi | Yang dibuktikan |
|---|---|---|
| `rate_test_result.txt` | 2 x 200 lalu 9 x 500, **tanpa 429** | Hanya bahwa panggilan Gemini gagal (500). Tidak ada 429 pada 11 request, padahal limit 10/menit: server saat itu mungkin versi lama, atau request tersebar lebih dari 60 detik. Tidak konklusif |
| `rate_test_result2.txt` | 10 x 500 lalu 429 pada request ke-11 | Konsisten dengan limit 10, tetapi tidak mencatat endpoint, payload, waktu, atau header; tidak bisa direproduksi |

Status HTTP saja bukan bukti pembatasan yang benar. Tes yang dapat diulang untuk server lama ada di riwayat Git (sebelum commit
`refactor(server): remove obsolete production Express runtime`) dan tidak lagi berlaku.
