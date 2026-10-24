# Daftar klaim kesehatan dan sumbernya

AyoDonor adalah proyek edukasi independen. Ia **bukan** layanan medis, **tidak** berafiliasi dengan PMI/Kemenkes,
dan **tidak** menyatakan seseorang layak donor. Dokumen ini mencatat klaim kesehatan yang masih ada di aplikasi,
dasarnya, dan celah verifikasinya. Terakhir diperbarui: 24 Oktober 2026.

> **Status verifikasi:** sumber di bawah dikumpulkan lewat riset web otomatis (halaman dibuka dan dibaca oleh
> asisten AI), **belum ditinjau oleh tenaga medis atau pihak PMI**. Nomor halaman Permenkes adalah nomor cetak pada
> Lampiran menurut pembacaan teks hasil ekstraksi PDF dan bisa meleset satu halaman. Sebelum peluncuran publik,
> sebaiknya klaim di tabel "Dipertahankan" ditinjau oleh pihak yang berwenang.

## Sumber yang dibuka

| # | Sumber | Penerbit | Tanggal | Jenis |
|---|---|---|---|---|
| S1 | Permenkes No. 91 Tahun 2015 tentang Standar Pelayanan Transfusi Darah ([PDF BPK](https://peraturan.bpk.go.id/Download/107583/Permenkes%20Nomor%2091%20Tahun%202015.pdf), [halaman JDIH](https://peraturan.bpk.go.id/Details/116661/permenkes-no-91-tahun-2015)) | Kemenkes RI | ditetapkan 31 Des 2015, diundangkan 13 Jan 2016 | Regulasi (utama). Status "Berlaku"; tidak ditemukan perubahan/pencabutan, tetapi itu **belum terbukti** |
| S2 | FAQ Donor Darah, PMI AyoDonor (https://ayodonor.pmi.or.id/?page=faq) | PMI | tanpa tanggal | Portal resmi PMI |
| S3 | Stok Darah, PMI AyoDonor (https://ayodonor.pmi.or.id/?page=stok) | PMI | tanpa tanggal | Portal resmi PMI. Memuat disclaimer bahwa stok dapat berubah sewaktu-waktu |
| S4 | [Syarat dan Manfaat Donor Darah](https://keslan.kemkes.go.id/view_artikel/4115/syarat-dan-manfaat-donor-darah) | Kemenkes (Keslan) | 21 Mei 2025 | Artikel edukasi |
| S5 | [Apa Saja Keuntungan Donor Darah](https://keslan.kemkes.go.id/view_artikel/2637/apa-saja-keuntungan-donor-darah-yuk-kita-cek) | Kemenkes (Keslan) | 24 Jul 2023 | Artikel edukasi, tanpa rujukan studi spesifik |
| S6 | [Kemenkes ajak masyarakat bantu sesama lewat donor darah](https://kemkes.go.id/id/kemenkes-ajak-masyarakat-bantu-sesama-lewat-kegiatan-donor-darah) | Kemenkes | 15 Jun 2022 | Siaran pers |

Tidak diverifikasi: teks UU 17/2023 dan PP 28/2024 (hanya terlihat lewat kutipan sekunder).

## Klaim yang dipertahankan

| Klaim di aplikasi | Dasar | Catatan / celah |
|---|---|---|
| Kantong donor sekitar 350 mL atau 450 mL | S1 (volume 450 mL ±10% atau 350 mL ±10%) | - |
| Sel darah merah pengganti terbentuk dalam sekitar 4-8 minggu | S2 | Hanya satu sumber, tanpa tanggal |
| Jeda minimal antar donor darah lengkap 2 bulan; sumber lain menyebut 3 bulan | S1 (2 bulan, laki-laki dan perempuan); S4 (3 bulan / 12 minggu) | **Sumber berbeda.** UI menyebut keduanya dan menyuruh bertanya ke petugas |
| Umur minimal 17 tahun | S1, S2 | Batas atas **tidak** dinyatakan (S1: tanpa batas tegas, perhatian khusus bila >60 pertama kali / >65 ulang; S2: 17-60; S4: 17-60). Persetujuan orang tua untuk usia 17 tidak ditemukan di sumber resmi |
| Berat badan minimal 45 kg, dan bisa 55 kg untuk 450 mL | S1 (≥55 kg untuk 450 mL, ≥45 kg untuk 350 mL); S2, S4 (45 kg) | Bergantung volume dan jenis donor |
| Hemoglobin umumnya 12,5-17 g/dL | S1, S2, S4 | Konsisten di tiga sumber |
| Tekanan darah, nadi, suhu "diukur/diperiksa petugas" (tanpa angka) | S1 | Angka **sengaja tidak ditampilkan**: S1 (90-160 / 60-100 mmHg), S2 (100-180 / 70-100) dan S4 berbeda |
| PMI menganjurkan tidur cukup sebelum donor (tanpa jam) | S2 | Tidak ada syarat jam tidur resmi yang ditemukan |
| Sakit/obat dinilai petugas satu per satu | S1 (pengobatan dinilai menurut penyakit, jenis obat, dampak ke penerima) | Antibiotik tidak disebut di S1; durasi tidak disebut untuk donor darah lengkap |
| Ada jeda setelah tato/tindik/akupunktur; lama berbeda antar sumber | S1 (6 bulan, atau 4 bulan dengan hasil NAT hepatitis C negatif); S2 (1 tahun) | **Sumber berbeda.** Kuis memakai rentang paling hati-hati (1 tahun) |
| Setiap kantong diskrining HIV, hepatitis B, hepatitis C, sifilis; hasil reaktif disampaikan lewat konseling | S1 (skrining minimal dan ketentuan pemberitahuan) | - |
| Skrining itu "bukan pengganti pemeriksaan kesehatan pribadi" | **Rumusan kami sendiri** | S1 tidak menyatakannya; S2/S4 menyebut donor sebagai bentuk pemeriksaan. Perlu ditinjau ahli |
| "Hingga 3 nyawa per kantong" | S6 (pejabat Kemenkes: "setidaknya 3 nyawa"); S5 mengaitkan "hingga tiga nyawa" dengan American Red Cross | Pernyataan PMI sendiri tidak ditemukan |
| Komponen darah (PRC, plasma, trombosit) dan contoh penggunaannya | S1 menyebut komponen dan standar mutunya | **Contoh penggunaan adalah pengetahuan umum, tidak bersumber ke halaman resmi.** Perlu ditinjau |
| Sebagian orang bisa pusing/lemas setelah donor; istirahat dan ikuti petugas (FAQ) | Pengetahuan umum; S2 menganjurkan menghindari aktivitas berat | Tidak bersumber resmi. Perlu ditinjau |
| Rasa jarum berbeda-beda | Pengetahuan umum | Bukan klaim medis |
| Stok dan lokasi resmi ada di ayodonor.pmi.or.id | S2, S3 | Hanya mengarahkan; tidak menyalin data |

## Klaim yang dihapus

| Klaim lama | Alasan |
|---|---|
| "Sertifikat Kelayakan Digital", "100% Lolos", "berstandar aman mendonorkan", Platinum, Premium Compliant, Health Sentinel, kode verifikasi | Tidak ada dasar; menyiratkan izin medis dan status resmi |
| "PMI READY PARTNER", "STANDAR REKOMENDASI PMI", "2026 UPDATE" | Menyiratkan afiliasi/endorsement yang tidak ada |
| "Fit luar dalam", "Mantap Jiwa... memenuhi syarat awal" | Kesimpulan medis dari satu jawaban |
| Menurunkan kolesterol, mencegah plak arteri | S5 memuatnya, tetapi tanpa rujukan studi dan bukan standar klinis; tidak diulang |
| "Darah kotor tersaring", kulit cerah/glow-up, stamina bertambah, bakar kalori/diet | Tidak ada dukungan; S1 tidak menjanjikan manfaat pribadi |
| "Mini medical check-up gratis", "terproteksi dari HIV/hepatitis", "gratis" | Skrining ditujukan bagi keamanan penerima; klaim gratis tidak bersumber |
| Simulator komposisi 45% / 50% / 5% | Persentase karangan. S1 memberi volume PRC (mis. 280 ±50 mL dari 450 mL) dan TC (>40 mL per kantong tunggal); tidak ada pembagian persentase |
| 17-60 tahun, tidur 5 jam, haid sebagai penghalang, jeda tato 6 bulan, "56 hari regenerasi", suhu/tensi rentang tunggal | Tidak didukung atau bertentangan antar sumber resmi |
| "Real-time", "Kontak resmi", "Buka 24 jam", "SENTINEL ACTIVE", watermark koordinat | Data lokasi demo tidak diverifikasi |

## Celah verifikasi yang masih terbuka

1. Batas atas usia dan persetujuan orang tua untuk usia 17 tahun.
2. Haid dan menyusui sebagai kriteria (tidak ditemukan di sumber resmi mana pun yang dibuka).
3. Antibiotik/obat tertentu untuk donor darah lengkap (durasi).
4. Hubungan S1 dengan regulasi yang lebih baru (UU 17/2023 dan turunannya) belum diperiksa teksnya.
5. Pernyataan "3 nyawa" dari PMI sendiri.
6. Alamat, telepon, jam layanan, dan koordinat 7 lokasi contoh di `PmiLocator.tsx`: **tidak diverifikasi** (dan stoknya fiktif).
7. Tinjauan oleh tenaga medis/PMI atas seluruh teks edukasi dan FAQ.

## Aliran data pribadi (ringkas)

- Nama panggilan dan 4 jawaban kuis hanya diproses di browser; tidak dikirim ke server mana pun. Tidak ada layanan AI.
- Situs statis: tidak ada server aplikasi atau basis data. Penyedia hosting dapat mencatat metadata teknis permintaan.
- Lokasi pengguna hanya diproses di browser.
- Browser memuat font dari Google Fonts.

Catatan riwayat: versi sebelumnya mengirim nama, jawaban kuis, dan pesan chat ke Google Gemini API. Fitur itu telah dihapus.
