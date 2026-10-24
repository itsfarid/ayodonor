# Arah desain: publikasi edukasi kesehatan masyarakat

Catatan ini ditulis sebelum redesain dikerjakan dan diperbarui sesudahnya. Isi edukasi, sumber, dan batasan medis tidak
berubah; yang berubah adalah tampilan, urutan penyajian, dan semantik HTML.

## Masalah pada desain sebelumnya (baseline)

1. **Terbaca seperti landing page SaaS/promosi.** Hero merah bergradien dengan blur, pembatas gelombang, kaca buram,
   "maskot" tetes darah tersenyum (Droppy), dan slogan "Real-Life Hero". Nada promosi bertentangan dengan isi yang
   justru berhati-hati secara medis.
2. **Merah di mana-mana.** Hero, tombol, badge, tab, kartu mitos, dan header kuis semuanya merah, sehingga merah tidak
   lagi menandai hirarki atau tujuan.
3. **Semua hal berupa kartu membulat dengan bayangan.** Fakta, peringatan, definisi, dan penjelasan umum tampil dalam
   wadah yang sama, sehingga makna yang berbeda (peringatan vs penjelasan vs catatan redaksi) tidak terbedakan.
4. **Emoji sebagai sistem ikon** (🩸💡🔄🧪🎮🦸🚀🟢❌📍🧭) dan ikon dekoratif tanpa fungsi.
5. **Statistik besar dengan keterangan kecil.** "Setidaknya 3 Nyawa" ditampilkan 24 px tebal sementara kualifikasinya
   ("kata pejabat Kemenkes, bukan hasil penelitian") hanya 12 px.
6. **Konten penting tersembunyi di balik tab.** Tiga topik dasar (setelah donor, kenapa dibutuhkan, sebelum donor)
   hanya terlihat satu per satu, dan tab tidak memakai semantik `tablist`/`tab`/`tabpanel`.
7. **Urutan tidak mengikuti perjalanan pembaca.** Contoh lokasi (data demo yang belum diverifikasi) diletakkan sebelum
   penjelasan dasar. Ada "simulator kelayakan" dan "pahlawan" yang menyiratkan penilaian kelayakan.
8. **Peta ala radar** (jaring, animasi `ping`/`spin`/`bounce`/radar sweep, pulau gambar-tangan yang tidak akurat) pada
   data yang fiktif: efek dramatis tanpa fungsi.
9. **Daftar sumber tampil sebagai tumpukan kartu abu-abu.** Tidak ada pengelompokan menurut jenis (regulasi,
   pedoman, panduan praktis PMI, artikel Kemenkes), dan keterbatasan sumber tidak lebih menonjol daripada metadata lain.
10. **Aksesibilitas.** Elemen `role="button"` yang membungkus tautan (interaktif bersarang), `<li>` di luar `<ul>` pada
    hasil kuis, fokus hilang setelah menjawab pertanyaan kuis, tidak ada tautan lewati-ke-konten, banyak teks 9-11 px,
    animasi tak henti (`animate-pulse`, `animate-bounce`, `animate-ping`) tanpa penghormatan pada
    `prefers-reduced-motion`.
11. **Font pihak ketiga.** `index.css` mengimpor Inter dan JetBrains Mono dari Google Fonts: ketergantungan eksternal
    (dan pengungkapan IP pengunjung ke Google) hanya demi tampilan.
12. **`<main>` hanya membungkus bagian dasar;** hirarki heading tidak konsisten (h4/h5 tanpa h3 di bagian lokasi).

## Arah visual: "edisi cetak yang tenang"

- **Permukaan:** kertas hangat (`--paper`), dengan permukaan lekuk (`--paper-sunk`) hanya untuk alat interaktif (kuis,
  pemilih lokasi). Pemisah berupa garis tipis; bayangan tidak dipakai.
- **Warna:** arang hangat untuk teks; **burgundi** hanya untuk identitas, tautan penting, dan tindakan utama;
  **biru-hijau tua** (teal) untuk navigasi, label teknis, dan catatan informasi; **ocher** hanya untuk peringatan
  dan data demo/fiktif. Kontras teks diperiksa terhadap WCAG AA.
- **Tipografi:** serif sistem (Iowan Old Style / Palatino / Georgia) untuk judul editorial; sans sistem untuk teks
  dan navigasi; monospace sistem hanya untuk label kecil, nomor bagian, dan metadata. Tanpa font eksternal.
- **Tata letak:** kolom editorial. Judul bagian di kolom kiri (bernomor), isi di kolom baca (maks. ~68 karakter);
  hero asimetris; ringkasan tiga butir dengan garis pemisah vertikal; mitos/fakta sebagai daftar definisi; FAQ sebagai
  akordeon bergaris; sumber sebagai daftar rujukan yang dikelompokkan menurut jenis.
- **Variasi komponen yang disengaja:** (1) teks baca, (2) daftar berpemisah, (3) callout *catatan* (teal),
  (4) callout *perhatian* (ocher), (5) alat interaktif (kertas lekuk), (6) rujukan, (7) tabel perbandingan.
- **Ilustrasi:** satu skema SVG orisinal: kantong darah lengkap yang dipisah menjadi tiga komponen (sel darah merah,
  plasma, trombosit), sesuai isi yang sudah bersumber (WHO; Permenkes hal. 54). Diberi keterangan "skema, bukan skala".
- **Gerak:** tidak ada animasi dekoratif. Transisi warna 120 ms saja, dimatikan bila pengguna meminta gerak berkurang.
- **Mode gelap:** aplikasi sebelumnya tidak mendukungnya, sehingga tidak ditambahkan (`color-scheme: light`).

## Urutan halaman (mengikuti perjalanan pembaca)

1. Hero: apa itu AyoDonor, siapa di baliknya (independen), tindakan berikutnya.
2. Sekilas: tiga hal dengan kualifikasi dan sumbernya di tempat yang sama.
3. Dasar-dasar (3 bagian, semuanya terlihat): setelah donor, kenapa dibutuhkan, sebelum donor.
4. Mitos & fakta umum.
5. Kuis panduan awal (bukan keputusan kelayakan).
6. FAQ.
7. Sumber informasi (daftar rujukan, tabel perbedaan antar sumber, klaim yang tidak diulang).
8. Kapan menghubungi PMI + contoh lokasi (data demo yang belum diverifikasi).
9. Privasi & data, lalu footer.

## Batasan yang dijaga

- Tidak ada klaim medis, statistik, lokasi, atau afiliasi baru. Teks edukasi dipindahkan, bukan ditulis ulang, kecuali
  slogan promosi dan label yang menyiratkan penilaian kelayakan ("simulator kelayakan", "pahlawan", "Real-Life Hero").
- Semua tautan sumber, locator halaman, dan kualifikasi tetap menempel pada klaimnya.
- Tetap situs statis: tanpa server, API, AI, atau dependensi baru. Header keamanan tidak diubah.

## Keterbatasan yang diketahui

Lihat bagian "Catatan" pada laporan akhir tugas ini untuk hal yang tidak bisa diverifikasi (mis. tinjauan oleh tenaga
medis, pembaca layar sungguhan).
