# Kebijakan keamanan

## Melaporkan kerentanan

**Jangan melaporkan dugaan kerentanan lewat Issue, pull request, atau diskusi publik.** Laporkan secara privat agar masalah bisa
diperbaiki sebelum diketahui luas.

**Status jalur privat: belum dikonfigurasi.** Per 24 Oktober 2026 repositori ini masih privat dan fitur *private vulnerability reporting*
GitHub belum aktif (dicek lewat API GitHub; tidak ada jaminan fitur itu tersedia sebelum repositori dipublikasikan). Tidak ada surel keamanan yang ditetapkan,
dan dokumen ini sengaja tidak mencantumkan kontak yang belum ada.

> **Tindakan pemelihara (wajib sebelum publikasi):** aktifkan *Private vulnerability reporting* di Settings → Code security (GitHub),
> atau tetapkan kontak keamanan yang benar-benar dipantau, lalu perbarui bagian ini dengan cara yang tepat.

Sampai jalur privat ada, bila kamu menemukan masalah: buka Issue publik **hanya** dengan kalimat bahwa kamu ingin melaporkan masalah keamanan,
**tanpa** rincian teknis, bukti, atau data, dan tunggu pemelihara menghubungimu lewat jalur privat. Jangan mengeksploitasi
masalah di situs produksi di luar yang diperlukan untuk membuktikannya.

## Isi laporan yang berguna

- Jenis masalah dan dampaknya, mis. XSS, kebocoran rahasia, kelemahan header, dependensi rentan.
- URL atau berkas yang terdampak, dan versi/commit bila diketahui.
- Langkah mereproduksi yang minimal.
- Saran perbaikan, bila ada.

## Menghindari kebocoran rahasia atau data pribadi

Jangan menempelkan kunci API, token, kata sandi, isi `.env*`, atau data pribadi di Issue atau PR. Bila kamu menemukan rahasia asli di repositori atau
riwayatnya, laporkan jenis dan lokasinya (berkas dan commit) **tanpa menyalin nilainya**. Pemelihara perlu mencabut atau memutar kredensial itu; menghapus
berkas saja tidak cukup karena riwayat Git tetap menyimpannya.

## Pengungkapan bertanggung jawab

Mohon beri pemelihara waktu yang wajar untuk memperbaiki sebelum mengungkap detail ke publik. Pemelihara belum menetapkan tenggat respons atau perbaikan, jadi
tidak ada janji waktu di sini.

## Versi yang didukung

Tidak ada rilis bertag (0 tag Git; `package.json` bernama versi `0.0.0` dan `private`). Yang dipelihara hanyalah kode terbaru di cabang `main`
yang dideploy ke <https://ayodonor.web.id>.

## Ruang lingkup

Situs ini statis: tanpa server aplikasi, basis data, akun pengguna, atau API key; kuis diproses di browser. Yang relevan: kode klien,
header di `public/_headers`, konfigurasi `wrangler.jsonc`, dependensi npm, dan kebocoran rahasia. Kesalahan informasi medis atau data lokasi
bukan kerentanan keamanan; laporkan lewat Issue biasa dengan sumbernya (lihat [CONTRIBUTING.md](CONTRIBUTING.md)).
