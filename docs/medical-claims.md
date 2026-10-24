# Daftar klaim kesehatan, sumber, dan status verifikasi

AyoDonor adalah proyek edukasi independen. Ia **bukan** layanan medis, **tidak** berafiliasi dengan PMI/Kemenkes, dan **tidak**
menyatakan seseorang layak donor. Dokumen ini mencatat klaim kesehatan yang benar-benar tampil di situs, dasarnya, dan celahnya.
Audit terakhir: **24 Oktober 2026** (tanggal akses semua sumber).

> **Status tinjauan:** isi situs ini **belum ditinjau oleh tenaga medis atau pihak PMI**. Verifikasi di bawah hanya
> mencocokkan teks situs dengan sumber yang tertulis; itu bukan sertifikasi medis.

## 1. Sumber dan cara dibuka

Laporan lama tidak dianggap benar; semua sumber dibuka ulang pada 24 Oktober 2026. Kolom "Cara dibaca" menyatakan seberapa
langsung bacaannya.

| ID | Sumber, penerbit, URL | Terbit | Cara dibaca | Keterbatasan |
|---|---|---|---|---|
| `permenkes` | Permenkes No. 91 Tahun 2015 tentang Standar Pelayanan Transfusi Darah. Kemenkes RI. <https://jdih.kemkes.go.id/documents/peraturan-menteri-kesehatan-nomor-91-tahun-2015> | Ditetapkan 31 Des 2015, diundangkan 13 Jan 2016; status JDIH "Berlaku", tanpa relasi mengubah/dicabut | Halaman JDIH dibuka; **PDF lengkap (290 hlm) diunduh dari JDIH dan dibaca sebagai teks**, nomor halaman dicocokkan dengan nomor cetak di bagian atas halaman | Terbitan 2015. Regulasi yang lebih baru tidak diperiksa. Tidak menyebut haid atau menyusui |
| `pmi-faq` | FAQ Donor Darah, PMI AyoDonor. <https://ayodonor.pmi.or.id/?page=faq> | Tanpa tanggal | HTML mentah diunduh dan dibaca | Tanpa tanggal; berbeda dari Permenkes di beberapa angka; satuan waktu kehamilan tidak tertulis |
| `pmi-stok` | Stok Darah, PMI AyoDonor. <https://ayodonor.pmi.or.id/?page=stok> | Tanpa tanggal; kolom "Update" kosong | HTML mentah diunduh dan dibaca | Tabel dimuat dinamis dan kosong; tidak ada angka stok yang disalin. Memuat disclaimer bahwa stok dapat berubah sewaktu-waktu |
| `pmi-kontak` | Kontak PMI: daftar UDD/UTD, PMI AyoDonor. <https://ayodonor.pmi.or.id/?page=kontak> | Tanpa tanggal | HTML mentah diunduh dan di-parse (228 baris: nama, provinsi, alamat, telepon) | Tanpa koordinat dan jam layanan; bisa belum lengkap atau berubah; ada salah eja di sumber ("Jakarta Tmur"); tidak dikonfirmasi ke tiap unit |
| `who-safety` | WHO, Blood safety and availability (lembar fakta). <https://www.who.int/news-room/fact-sheets/detail/blood-safety-and-availability> | Halaman bertanggal 12 Jun 2026 | Dibuka lewat alat pengambil halaman (isi diringkas oleh alat) | Tidak memuat kriteria pendonor dan tidak menyebut manfaat bagi pendonor |
| `who-guidelines` | WHO, Blood donor selection: guidelines on assessing donor suitability for blood donation. <https://www.who.int/publications/i/item/blood-donor-selection-guidelines-on-assessing-donor-suitability-for-blood-donation> | 1 Jan 2012 (118 hlm, ISBN 9789241548519) | Halaman ringkasan dibuka lewat alat pengambil halaman | **PDF lengkap tidak dibuka**; halaman ringkasan tidak memuat angka kriteria |
| `who-eligibility` | WHO, Who can give blood? <https://www.who.int/campaigns/world-blood-donor-day/who-can-give-blood> | Tanpa tanggal (hanya © 2026) | Dibuka lewat alat pengambil halaman | Angka umum dan bervariasi antar negara; tidak membahas obat, haid, atau jeda antar donor |
| `kemkes-benefit` | Kemenkes, Apa Saja Keuntungan Donor Darah, Yuk Kita Cek! <https://keslan.kemkes.go.id/view_artikel/2637/apa-saja-keuntungan-donor-darah-yuk-kita-cek> | 24 Jul 2023 (penulis RSUP Prof. dr. I.G.N.G. Ngoerah; terbit di Ditjen Kesehatan Lanjutan) | Dibuka lewat alat pengambil halaman | Klaim manfaat tanpa rujukan studi per klaim; daftar pustaka umum |
| `kemkes-syarat` | Kemenkes, Syarat dan Manfaat Donor Darah. <https://keslan.kemkes.go.id/view_artikel/4115/syarat-dan-manfaat-donor-darah> | 21 Mei 2025 (penulis RSUP dr. Soeradji Tirtonegoro Klaten) | Dibuka lewat alat pengambil halaman | Ketidakkonsistenan internal (tekanan darah, batas Hb); klaim manfaat tanpa rujukan per klaim |
| `kemkes-pers` | Kemenkes, Kemenkes Ajak Masyarakat Bantu Sesama Lewat Kegiatan Donor Darah. <https://kemkes.go.id/id/kemenkes-ajak-masyarakat-bantu-sesama-lewat-kegiatan-donor-darah> | 15 Jun 2022 | Dibuka lewat alat pengambil halaman | Pernyataan lisan pejabat, bukan standar atau penelitian |

"Dibuka lewat alat pengambil halaman" berarti isi diringkas oleh alat; angka penting dari halaman itu sebaiknya dibaca ulang
di sumbernya sebelum peluncuran. Semua URL diperiksa dengan `npm run check:links` pada tanggal akses; beberapa situs Kemenkes menjawab 403 terhadap skrip meski terbuka di browser.

## 2. Inventaris klaim yang tampil di situs

Status: **Didukung** = sesuai teks sumber yang dibaca; **Sebagian** = sebagian didukung atau sumber berbeda; **Editorial** =
rumusan/sikap AyoDonor, bukan klaim sumber; **Tidak ditemukan** = sumber yang dibaca tidak menyebutnya.

| # | Klaim/topik (lokasi) | Sumber dan lokasi | Status | Tindakan |
|---|---|---|---|---|
| C1 | Kantong donor sekitar 350 atau 450 mL (tab Setelah Donor, Kenapa Dibutuhkan) | `permenkes` hal. 64 (450 ±10%, 350 ±10%) | Didukung | Tautan sumber ditambahkan |
| C2 | Volume diganti 48 jam; sel darah merah 4-8 minggu (tab Setelah Donor, FAQ) | `pmi-faq` | Didukung (satu sumber, tanpa tanggal) | Tautan ditambahkan |
| C3 | Jeda donor: 2 bulan (Permenkes) vs 3 bulan (Kemenkes 2025); maks 6/4 kali setahun (FAQ, tab, kuis) | `permenkes` hal. 64; `pmi-faq`; `kemkes-syarat` | Sebagian (sumber berbeda) | Kedua angka ditampilkan; tidak memilih |
| C4 | Umur minimal 17 tahun; batas atas berbeda (FAQ, kuis, tabel) | `permenkes` hal. 56; `pmi-faq`; `who-eligibility`; `kemkes-syarat` | Sebagian (batas atas berbeda) | Perbedaan ditampilkan |
| C5 | Berat badan 45/55 kg (Permenkes), 45 kg (PMI), ~50 kg (WHO) (FAQ, kuis, tab) | `permenkes` hal. 56-57; `pmi-faq`; `who-eligibility` | Sebagian | Perbedaan ditampilkan |
| C6 | Hb 12,5-17 g/dL (Permenkes, PMI); WHO: banyak negara min. 12,0 (P)/13,0 (L) (FAQ, tab) | `permenkes` hal. 57; `pmi-faq`; `who-eligibility` | Sebagian | Perbedaan ditampilkan; "umumnya" dihapus |
| C7 | Tekanan darah, nadi, suhu diperiksa petugas (tab, FAQ) | `permenkes` hal. 57; `pmi-faq` | Didukung; **angka tekanan darah sengaja tidak jadi aturan** karena tiga sumber berbeda | Hanya ada di tabel perbandingan |
| C8 | Tato/tindik/akupunktur: 6 bulan (4 bulan bila NAT negatif) vs 1 tahun vs WHO 6 bulan (FAQ, kuis, tabel) | `permenkes` hal. 59; `pmi-faq`; `who-eligibility` | Sebagian | Perbedaan ditampilkan; kuis memakai rentang "beberapa bulan hingga 1 tahun" |
| C9 | Kehamilan: 6 bulan setelah melahirkan (Permenkes); menyusui: 3 bulan setelah berhenti (PMI), tidak dianjurkan (WHO) (FAQ, tabel) | `permenkes` hal. 60; `pmi-faq`; `who-eligibility` | Sebagian | Perbedaan ditampilkan |
| C10 | Demam/flu: 2 minggu (Permenkes) vs 1 minggu (PMI) (FAQ, tabel) | `permenkes` hal. 60; `pmi-faq` | Sebagian | Perbedaan ditampilkan |
| C11 | Haid: tidak disebut (FAQ, tabel) | Teks Permenkes dicari ("haid", "menstru": 0 hasil); `pmi-faq`; `who-eligibility` | Tidak ditemukan | Dinyatakan "tidak ditemukan", bukan larangan atau izin |
| C12 | Obat/antibiotik dinilai petugas; formulir kuesioner menanyakan antibiotik, obat infeksi lain, aspirin; donor trombosit: tanpa aspirin/antibiotik 1 minggu (FAQ, kuis) | `permenkes` hal. 60 dan formulir 3.2 hal. 277; `pmi-faq` | Didukung (jendela waktu pada formulir tidak dikutip karena tata letak teks ambigu) | Tautan ditambahkan |
| C13 | Persiapan: tidur nyenyak, makan, banyak minum, hindari aktivitas berat (PMI); hindari olahraga berat dan alkohol 1 hari sebelum (Kemenkes 2025) (FAQ, kuis) | `pmi-faq`; `kemkes-syarat` | Didukung; **tanpa angka jam tidur** (tidak ada angka resmi) | Tautan ditambahkan |
| C14 | Seleksi donor bertujuan melindungi pendonor dan pasien (tab, FAQ) | `permenkes` hal. 23; `who-guidelines` | Didukung | Tautan ditambahkan |
| C15 | Setiap kantong diuji saring HBsAg, anti-HIV, anti-HCV, sifilis; hasil reaktif lewat konseling (tab, FAQ) | `permenkes` hal. 28, 55; `who-safety` | Didukung | Tautan ditambahkan |
| C16 | Skrining bukan pengganti pemeriksaan kesehatan pribadi (tab, FAQ) | Rumusan AyoDonor; `pmi-faq` justru menyebut pemeriksaan sebelum donor sebagai "pemeriksaan kesehatan gratis" | Editorial | Dilabeli; tidak pernah menyatakan donor sebagai pengganti cek pribadi |
| C17 | Darah lengkap dapat diolah menjadi komponen; satu donasi dapat melayani lebih dari satu pasien (stats, tab, FAQ) | `permenkes` hal. 54; `who-safety` | Didukung | Tautan ditambahkan |
| C18 | Keputusan transfusi dibuat dokter (tab, FAQ) | Pengetahuan umum | Editorial | Dilabeli |
| C19 | "Setidaknya 3 nyawa per kantong" (stats, FAQ) | `kemkes-pers` (ucapan pejabat, 2022); WHO tanpa angka; PMI: tidak ditemukan | Sebagian | Diubah dari "hingga 3 nyawa" ke kata-kata pejabat; ditandai bukan hasil penelitian |
| C20 | Tanpa janji manfaat kesehatan pribadi (tab, FAQ, sumber) | `who-safety` (tidak menyebut manfaat); `kemkes-benefit`/`kemkes-syarat` memuatnya tanpa rujukan per klaim | Editorial (penilaian atas bukti) | Dijelaskan terbuka; klaim tidak diulang |
| C21 | Donor bukan program diet | Pengetahuan umum; `kemkes-benefit`/`kemkes-syarat` menyebut pembakaran kalori tanpa rujukan studi | Editorial | Dilabeli; konflik dengan artikel Kemenkes dicatat |
| C22 | Takut jarum / pusing atau lemas setelah donor: saran umum | `permenkes` hal. 54 (UTD wajib menginformasikan risiko); `pmi-faq` (hindari aktivitas berat) | Editorial / saran umum | Dilabeli "saran umum, bukan nasihat medis pribadi" |
| C23 | Lokasi dan stok resmi ada di ayodonor.pmi.or.id | `pmi-stok`, `pmi-faq` | Didukung | Tautan ditambahkan |

## 3. Klaim yang dihapus atau ditulis ulang

Pada putaran ini:
- "Hingga 3 nyawa" menjadi "setidaknya 3 nyawa menurut pejabat Kemenkes (2022), bukan hasil penelitian".
- Deskripsi kegunaan tiap komponen darah (anemia berat, gangguan pembekuan, trombosit rendah) dihapus: tidak ada di sumber yang dibaca.
- "Hb umumnya 12,5-17 g/dL" menjadi "Permenkes: 12,5-17 g/dL" disertai angka WHO.
- "Skrining bukan pengganti cek kesehatan" tidak lagi dinyatakan sebagai fakta; kini sikap AyoDonor.

Sebelumnya (tetap berlaku): sertifikat/"100% lolos"/Platinum/kode verifikasi; "PMI READY PARTNER"; kolesterol, plak arteri, "darah kotor", kulit cerah,
stamina, kalori/diet; "mini medical check-up gratis" dan "terproteksi dari HIV"; simulator komposisi 45/50/5%; 17-60 tahun, tidur 5 jam, haid sebagai penghalang,
dan angka tunggal untuk tato/tekanan darah yang diperselisihkan; label "real-time", "kontak resmi", "Buka 24 jam" pada data demo.

## 4. Perbedaan antar sumber yang belum terselesaikan

Ditampilkan apa adanya di bagian "Sumber informasi" situs. AyoDonor tidak memilih angka.

| Kriteria | Permenkes 91/2015 | FAQ PMI | WHO (Who can give blood) | Kemenkes 2025 |
|---|---|---|---|---|
| Usia | min. 17; >60 (pertama)/>65 (ulang) perhatian khusus | 17-60; sampai 65 donor rutin | umumnya 18-65, bervariasi | min. 17; maks. 60 donor pertama |
| Berat badan | 45 kg (350 mL), 55 kg (450 mL, apheresis) | 45 kg; 55 kg apheresis trombosit | umumnya 50 kg; sebagian 45 kg (350 mL) | 45 kg |
| Hb | 12,5-17 g/dL | 12,5-17,0 g/dL | banyak negara min. 12,0 (P)/13,0 (L) | sekitar 12,5-17 (juga menyebut 20) |
| Tekanan darah | 90-160 / 60-100 mmHg | 100-180 / 70-100 mmHg | tidak disebut | "normal", sekitar 90/60-150/80 |
| Jeda donor | 2 bulan; 6x (L), 4x (P) per tahun | 2 bulan | tidak disebut | 3 bulan |
| Tato/tindik | 6 bulan (4 bulan bila NAT negatif) | 1 tahun | 6 bulan | tidak disebut |
| Hamil/menyusui | hamil 6 bulan setelah melahirkan; menyusui tidak disebut | hamil (satuan tak tertulis); menyusui 3 bulan | sebanyak lama kehamilan; menyusui tidak dianjurkan | tidak boleh |
| Demam/flu | 2 minggu setelah gejala hilang | 1 minggu setelah sembuh | penolakan (lama tak disebut) | tidak disebut |
| Haid | tidak disebut | tidak disebut | tidak disebut | tidak ditemukan |

## 5. Pencari UDD/UTD PMI (`PmiLocator.tsx`, `src/data/utd.ts`)

Rincian audit dan akar masalah: [locator-audit.md](locator-audit.md).

- Tujuh lokasi demo lama (alamat, telepon, koordinat, stok) **dihapus**. Dibandingkan dengan halaman Kontak PMI resmi, dua di
  antaranya salah (Medan, Makassar), tiga berbeda nomor jalan atau telepon, dan koordinat serta stok tidak punya sumber.
- Diganti 228 UDD/UTD yang tercantum di <https://ayodonor.pmi.or.id/?page=kontak> (diakses 24 Oktober 2026), disalin apa
  adanya: nama, provinsi, alamat, telepon, ditambah URL sumber dan tanggal akses pada tiap rekaman. "Terverifikasi" berarti
  *tercantum di halaman resmi pada tanggal itu*; bukan jaminan alamat/telepon masih berlaku atau jam layanan.
- Cakupan: sebanyak yang dimuat halaman sumber, yang tidak bertanggal dan bisa belum lengkap. Ejaan sumber dipertahankan
  (mis. "Jakarta Tmur"; kolom "Provinsi" sumber juga memuat nama kota untuk lima baris Jakarta).
- Koordinat: **tidak ada** di sumber, jadi tidak disimpan. Jarak dari posisi pengguna hanya dihitung untuk rekaman yang punya
  `coordinates` dengan `source` yang bisa dikutip; saat ini tidak ada, sehingga tombol lokasi tidak ditampilkan.
- Stok darah: tidak ditampilkan. Halaman stok PMI memuat tabel dinamis yang kosong saat dibuka.
- Untuk menambah koordinat: isi `coordinates: { lat, lng, source }` per rekaman dari sumber yang bisa dikutip, lalu tes data
  (`tests/utd-data.test.ts`) harus diubah dengan sengaja; tombol lokasi akan muncul otomatis.

## 6. Celah verifikasi yang masih terbuka

1. Tinjauan oleh tenaga medis/PMI atas seluruh teks, kuis, dan FAQ **belum dilakukan**.
2. Regulasi yang lebih baru dari Permenkes 91/2015 (termasuk turunan UU 17/2023) tidak diperiksa; JDIH hanya menyatakan "Berlaku".
3. PDF lengkap pedoman WHO (Blood donor selection, 2012) tidak dibuka; halaman WHO lain dibaca lewat alat yang meringkas isi.
4. Batas atas usia, persetujuan orang tua untuk usia 17, haid, menyusui menurut Permenkes, durasi obat untuk donor darah lengkap.
5. Pernyataan "3 nyawa" dari PMI sendiri.
6. Klaim editorial C16, C18, C20-C22 adalah penilaian AyoDonor, bukan kutipan sumber.
7. Daftar UDD/UTD belum dikonfirmasi ke tiap unit (alamat, telepon, jam layanan); koordinat unit belum ada, jadi jarak tidak dihitung.

## 7. Aliran data pribadi

- Nama panggilan dan 4 jawaban kuis hanya diproses di browser; tidak dikirim ke server mana pun. Tidak ada layanan AI.
- Situs statis: tidak ada server aplikasi atau basis data. Penyedia hosting dapat mencatat metadata teknis permintaan.
- Lokasi pengguna (hanya bila ada rekaman berkoordinat dan pengguna menekan tombolnya) hanya diproses di browser, tidak dikirim, dan tidak dicatat. Tautan Google Maps hanya memuat nama dan alamat unit.
- Situs memakai font bawaan perangkat; tidak ada font yang dimuat dari pihak ketiga. Tautan peta membuka Google Maps hanya saat diklik.

Catatan riwayat: versi awal mengirim nama, jawaban kuis, dan pesan chat ke Google Gemini API. Fitur itu telah dihapus.
