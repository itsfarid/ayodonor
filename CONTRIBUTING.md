# Berkontribusi ke AyoDonor

Terima kasih sudah mau membantu. AyoDonor adalah proyek pribadi yang menerima kontribusi dari luar, dan proyek edukasi donor darah yang dibuat hati-hati: kesalahan kecil pada konten
medis atau data lokasi bisa menyesatkan orang. Karena itu aturan di bawah lebih ketat untuk **konten dan data** daripada untuk kode.

> Status: kode proyek berlisensi MIT ([LICENSE](LICENSE)); data UDD/UTD dan materi pihak ketiga tidak dicakup (lihat [README](README.md#lisensi)). Tanyakan pemelihara lewat Issue
> sebelum mengirim kontribusi besar.

## Ruang lingkup

Diterima: perbaikan bug, aksesibilitas, performa, tes, dokumentasi, koreksi konten **dengan sumber**, dan perbaikan data yang bisa
dibuktikan dari sumbernya. Di luar lingkup tanpa diskusi dulu: fitur yang menyiratkan keputusan kelayakan medis, tampilan stok darah,
pelacakan pengguna, layanan AI, server atau basis data (situs ini statis), dan halaman baru dalam jumlah banyak.

## Menyiapkan lingkungan

Prasyarat dan versi Node ada di [README](README.md#menjalankan). Tidak ada environment variable dan tidak ada API key
([.env.example](.env.example)).

```bash
npm install
npm run dev
```

## Perintah yang tersedia

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server Vite, http://localhost:5173 |
| `npm run lint` | Pengecekan tipe (`tsc --noEmit`) |
| `npm test` | Semua tes (vitest) |
| `npm run build` | Build produksi ke `dist/` |
| `npm run preview` | Sajikan `dist/`, http://localhost:4173 |
| `npm run check:seo -- <url>` | Audit SEO situs yang berjalan (lihat [docs/seo.md](docs/seo.md)) |
| `npm run check:links` | Cek URL sumber (butuh jaringan; jalankan bila mengubah `src/data/sources.ts`) |

Tidak ada formatter atau linter gaya otomatis; ikuti gaya berkas di sekitar perubahanmu.

## Syarat sebelum mengirim pull request

1. Jalankan `npm run lint`, `npm test`, dan `npm run build`; semuanya harus lulus. Tulis hasilnya di deskripsi PR (perintah dan ringkasan, bukan sekadar "sudah dites").
2. Beri tes untuk perubahan kode yang bermakna bila praktis. Tes ada di `tests/`.
3. Satu PR, satu tujuan. Jangan campur perubahan yang tidak terkait (mis. pemformatan ulang berkas lain).
4. Jangan mengubah `package-lock.json` atau versi dependensi kecuali itu tujuan PR-nya.
5. Jangan meng-commit rahasia, `.env*` (kecuali `.env.example`), kunci, token, berkas log, atau data pribadi. Berkas seperti `.wrangler/` dan `dist/` sudah diabaikan Git.

## Alur cabang dan pull request

Belum ada aturan penamaan cabang, jumlah reviewer, atau waktu tinjau yang ditetapkan pemelihara; jangan mengandalkan yang tidak tertulis di sini.
Praktiknya: fork atau buat cabang topik, buka pull request, jelaskan apa dan mengapa, dan pemelihara menentukan cabang tujuan
(repositori memakai `main` dan `dev`). Pesan commit: riwayat memakai awalan seperti `feat:`, `fix:`, `docs:`, `chore:`, `style:`
(48 dari 56 commit); itu **saran**, bukan keharusan.

## Laporan bug dan permintaan fitur

Buka Issue di repositori. Untuk bug: halaman/URL, langkah yang membuat masalah muncul, hasil yang diharapkan dan yang terjadi, browser dan perangkat.
Untuk fitur: masalah pengguna yang ingin dipecahkan. **Kerentanan keamanan jangan dilaporkan lewat Issue publik**; lihat [SECURITY.md](SECURITY.md).
Jangan menempelkan data pribadi, kunci, atau token di Issue.

## Kontribusi konten medis

- Setiap klaim kesehatan harus punya sumber yang bisa dibuka dan dicatat di [docs/medical-claims.md](docs/medical-claims.md) dan `src/data/sources.ts`
  (judul, penerbit, tanggal akses, keterbatasan). Bila sumber berbeda angka, tampilkan perbedaannya; jangan memilih satu angka tanpa dasar.
- Jangan menambah klaim manfaat kesehatan pribadi, janji kelayakan ("pasti boleh donor"), atau angka tanpa sumber. `tests/claims.test.ts` menjaga beberapa klaim yang sudah dihapus agar tidak kembali.
- Penjelasan harus bahasa Indonesia yang natural dan tidak menyiratkan keputusan medis atau afiliasi dengan PMI/Kemenkes.

## Kontribusi data dan aset

- **Data UDD/UTD** (`src/data/utd.ts`): disalin apa adanya dari halaman Kontak PMI; jangan mengarang, menebak, atau "memperbaiki" ejaan tanpa sumber.
  Perubahan harus disertai bukti (URL sumber dan tanggal akses). Jangan menambah `coordinates` kecuali dari sumber yang bisa dikutip; jangan menambah informasi stok.
  `tests/utd-data.test.ts` memeriksa aturan ini.
- **Sebelum menambah data, gambar, ikon, font, atau teks dari luar**: pastikan kamu tahu sumbernya dan **berhak mendistribusikannya ulang**.
  Data yang bisa dibuka publik belum tentu boleh disebarkan ulang. Cantumkan sumber, lisensi, dan atribusi yang dibutuhkan di PR. Materi dengan lisensi tidak jelas tidak akan diterima.
- Jangan menambah data pribadi individu (nama, telepon, alamat orang).
- Dengan mengirim kontribusi kamu menyatakan bahwa kamu berhak menyumbangkannya; kontribusi kode dilisensikan di bawah lisensi MIT proyek ([LICENSE](LICENSE)).

## Perilaku

Dengan berpartisipasi kamu setuju pada [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
