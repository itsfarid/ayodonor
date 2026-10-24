# Tinjauan syarat alat AI (provenans kode)

Dibuat 24 Oktober 2026. Ini ringkasan teks syarat resmi, **bukan nasihat hukum** dan bukan kesimpulan hukum. Tujuannya mencatat apa yang
benar-benar tertulis dan apa yang belum bisa dipastikan, untuk pertanyaan 3-5 di
[docs/open-source-readiness-audit.md](open-source-readiness-audit.md#113-daftar-pertanyaan-yang-harus-dijawab-pemelihara).
Tidak ada `LICENSE` yang ditambahkan.

## Cara memverifikasi

Untuk tiap sumber, saya mengambil **salinan arsip Internet Archive (Wayback Machine) yang paling dekat dengan tanggal pemakaian**, dan membandingkannya dengan versi
yang tayang hari ini. Teks diekstrak dan dibaca langsung; ringkasan di bawah memparafrase, bukan mengutip panjang. Tanggal penggunaan diambil dari riwayat Git:

| Alat | Bukti di riwayat Git | Waktu |
|---|---|---|
| Google AI Studio | Commit `33b6cb5` "Add AyoDonor app from AI Studio." dan README awalnya | 16 Jul 2026, 05:43 WIB (= 15 Jul 22:43 UTC) |
| Cursor | Trailer `Co-authored-by: Cursor` pada 3 commit: `33b6cb5`, `5c1874b`, `efe2653` | 16 Jul 2026, 05:43-05:53 WIB |
| Anthropic / Claude Code | Trailer `Co-Authored-By: Claude Sonnet 5.5` pada 48 commit | 24 Okt 2026, 07:00-14:22 WIB (= 00:00-07:22 UTC) |

Trailer commit hanya membuktikan alat itu tercatat membantu; **jenis akun/paket yang dipakai tidak tercatat di mana pun** di repositori (lihat "Belum terselesaikan").

## 1. Google AI Studio / Gemini API

| Dokumen | URL resmi | Arsip yang dipakai | Versi |
|---|---|---|---|
| Gemini API Additional Terms of Service | <https://ai.google.dev/gemini-api/terms> | [snapshot 16 Jul 2026 09:35 UTC](https://web.archive.org/web/20260716093550/https://ai.google.dev/gemini-api/terms) | "Effective March 23, 2026"; halaman "Last updated 2026-04-28". Versi tayang hari ini menunjukkan tanggal yang sama. |
| Google APIs Terms of Service ("API Terms", induk dari di atas) | <https://developers.google.com/terms> | [snapshot 19 Jul 2026](https://web.archive.org/web/20260719131806/https://developers.google.com/terms) (terdekat yang tersedia) | "Last modified: November 9, 2021" |
| Generative AI Additional Terms (Google) | <https://policies.google.com/terms/generative-ai> | [snapshot 17 Jul 2026](https://web.archive.org/web/20260717005203/https://policies.google.com/terms/generative-ai) | Last Modified 9 Agt 2023; halaman menyatakan tidak berlaku lagi sejak Google ToS diperbarui 22 Mei 2024, kecuali untuk mitra bisnis. **Tidak relevan** untuk AI Studio, yang diatur dokumen di atas. |

Keduanya (Gemini API Additional Terms dan API Terms) wajib diterima untuk memakai Google AI Studio, menurut paragraf pembuka dokumen pertama.

**Bagian relevan (ringkasan):**
- *Use of Generated Content* (Gemini): Google tidak mengklaim kepemilikan atas konten yang dihasilkan; konten yang sama atau mirip bisa dihasilkan untuk pengguna lain dan Google mencadangkan hak itu; pengguna harus mematuhi hukum, penggunaan konten yang dihasilkan (termasuk kode) harus dengan kehati-hatian, dan pengguna bertanggung jawab atas penggunaannya serta penggunaan oleh siapa pun yang menerimanya. Atribusi kepada pengguna akhir bisa diwajibkan bila keluaran dikembalikan lewat panggilan API.
- *Use Restrictions* (Gemini): AI Studio dan Gemini API ditujukan bagi pengembang untuk tujuan **profesional atau bisnis, bukan konsumen**; dilarang membuat model pesaing atau merekayasa balik; dilarang memakai layanan untuk **praktik klinis atau memberi saran medis**.
- *Unpaid Services* (Gemini): interaksi langsung dengan AI Studio termasuk layanan gratis; Google boleh memakai masukan dan keluaran untuk pengembangan produk dan peninjau manusia bisa membacanya, dan lisensi di API Terms "Submission of Content" meluas ke keluaran. (Bagian *Paid Services* berlaku bila akun terhubung proyek Cloud berpenagihan; tidak diketahui untuk kasus ini.)
- API Terms 3c *Ownership*: Google tidak memperoleh kepemilikan atas API Client milik pengguna. 3b/*Submission of Content*: Google tidak memperoleh kepemilikan hak kekayaan intelektual atas konten yang dikirim, tetapi mendapat lisensi luas untuk menjalankan dan memperbaiki layanan.
- API Terms: kredensial pengembang **tidak boleh disematkan di proyek open source**. Ini relevan untuk kunci lama (tidak ada di repositori; lihat audit bagian 4).

**Apakah mengatur kepemilikan, hak atas keluaran, redistribusi, lisensi open source?**
- Kepemilikan/hak atas keluaran: **ya, terbatas.** Google menyatakan tidak mengklaim kepemilikan; dokumen tidak menyatakan bahwa pengguna *memiliki* keluaran dan tidak menetapkan pengalihan hak.
- Redistribusi/lisensi open source atas keluaran: **tidak dibahas** (kata "open source" di API Terms hanya soal perangkat lunak OSS dalam API dan larangan menyematkan kredensial; nol sebutan di Gemini Additional Terms).
- Tidak ditemukan jaminan tidak melanggar hak pihak ketiga, pembahasan hak cipta atas keluaran, maupun ganti rugi untuk pengguna (pembacaan fokus pada bagian yang disebut di atas, bukan seluruh dokumen).

**Belum terselesaikan (UNVERIFIED):**
- Paket yang dipakai (gratis/*Unpaid* atau berpenagihan/*Paid*) dan apakah akun Workspace; syaratnya berbeda untuk data yang dipakai Google.
- Apakah proyek pribadi edukatif memenuhi frasa "profesional atau bisnis, bukan konsumen". Teks tidak menjelaskan penerapannya untuk proyek pribadi.
- Aplikasi awal memakai Gemini di sisi server untuk fitur kuis dan chat (`docs/ai-removal.md`). Larangan "praktik klinis atau saran medis" mungkin relevan bagi pemakaian itu; penerapannya tidak dinilai di sini. Fitur AI sudah dihapus, tetapi riwayat memuatnya.
- Berkas templat AI Studio (README awal, banner, komentar `.env.example`, `metadata.json`, konfigurasi Vite) mungkin berasal dari templat Google; lisensi templat itu **tidak diverifikasi**. Dokumentasi Google menyatakan kode contoh di dokumentasinya berlisensi Apache 2.0 dan teksnya CC BY 4.0, tetapi tidak terbukti bahwa templat aplikasi yang dihasilkan memakai lisensi itu. Halaman AI Studio Build yang diarsipkan tidak memuat pernyataan lisensi atau kepemilikan untuk aplikasi yang dibuat.

## 2. Cursor (Anysphere, Inc.)

| Dokumen | URL resmi | Arsip yang dipakai | Versi |
|---|---|---|---|
| Terms of Service | <https://cursor.com/terms-of-service> | [snapshot 16 Jul 2026 09:39 UTC](https://web.archive.org/web/20260716093937/https://cursor.com/terms-of-service) | "Last updated January 13, 2026" |
| (versi tayang hari ini) | sama | diambil 24 Okt 2026 | "Last updated September 3, 2026"; teks bagian 1.2, 1.4, dan 5.3 **identik** dengan versi Juli; versi baru menambahkan rujukan ke Acceptable Use Policy dan perubahan di bagian lain yang tidak saya telaah. |

**Bagian relevan:**
- 1.2 *Content*: "Suggestions" = kode/keluaran dari masukan pengguna; pengguna menjamin berhak atas masukan yang dikirim.
- 1.3: Anysphere tidak memakai konten untuk melatih model tanpa persetujuan eksplisit pengguna.
- 1.4 *Limitations for Suggestions*: saran dihasilkan mesin dan **bisa mirip atau sama dengan saran untuk pelanggan lain**, dan tidak ada hak atas saran yang diberikan kepada pelanggan lain; pengguna bertanggung jawab mengevaluasi dan menanggung risiko penggunaan saran.
- 5.3 *Content*: pengguna mempertahankan hak atas masukannya, dan Anysphere **mengalihkan kepada pengguna** semua hak, kepemilikan, dan kepentingannya, "jika ada", atas Suggestions.
- 13: pengguna mengganti rugi Anysphere atas penggunaannya; tidak ada ganti rugi balik atas pelanggaran hak pihak ketiga dalam teks yang dibaca.

**Apakah mengatur kepemilikan, hak atas keluaran, redistribusi, lisensi open source?**
- Kepemilikan/hak atas keluaran: **ya** (pengalihan hak Anysphere kepada pengguna, terbatas pada hak yang dimiliki Anysphere "jika ada").
- Redistribusi/lisensi open source: **tidak dibahas** (nol sebutan "open source").

**Belum terselesaikan (UNVERIFIED):** apakah pengguna terikat Terms ini atau perjanjian lain (paket Teams/Enterprise); tidak ada bukti pada commit bahwa versi 13 Jan 2026 tetap berlaku tanpa perubahan tak bertanggal hingga 16 Jul 2026 (arsip diambil beberapa jam setelah commit; tanggal "Last updated" mendahului commit); pengalihan hanya mencakup hak Anysphere, bukan hak model-model pihak ketiga yang dipanggil lewat Cursor; model mana yang dipakai pada 3 commit itu tidak tercatat.

## 3. Anthropic / Claude Code

Halaman Claude Code ([Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance), [arsip 24 Okt 2026](https://web.archive.org/web/20261024042054/https://code.claude.com/docs/en/legal-and-compliance)) menyatakan penggunaan Claude Code tunduk pada **Commercial Terms of Service** (pengguna Team, Enterprise, dan Claude API) atau **Consumer Terms of Service** (pengguna Free, Pro, Max), serta Anthropic Usage Policy. Jenis akun untuk 48 commit **tidak tercatat**, jadi kedua dokumen dirangkum.

| Dokumen | URL resmi | Arsip yang dipakai | Versi |
|---|---|---|---|
| Consumer Terms of Service | <https://www.anthropic.com/legal/consumer-terms> | [snapshot 23 Okt 2026](https://web.archive.org/web/20261023163533/https://www.anthropic.com/legal/consumer-terms) | "Effective Oct 8, 2025"; teks arsip **identik** dengan versi tayang 24 Okt 2026 |
| Commercial Terms of Service | <https://www.anthropic.com/legal/commercial-terms> | [snapshot 23 Okt 2026](https://web.archive.org/web/20261023155143/https://www.anthropic.com/legal/commercial-terms) | "Effective Jun 17, 2025"; teks arsip **identik** dengan versi tayang 24 Okt 2026 |

**Bagian relevan:**
- Consumer, §4 *Inputs, Outputs, Actions, and Materials* (bagian "Rights and Responsibilities"): pengguna mempertahankan hak atas masukan, dan **dengan syarat mematuhi Terms, Anthropic mengalihkan semua hak, kepemilikan, dan kepentingannya, "jika ada", atas keluaran**. Pengguna bertanggung jawab atas masukan dan tindakan. Anthropic boleh memakai Materials untuk melatih model kecuali pengguna menolak lewat pengaturan akun (dengan pengecualian tertentu). Disclaimer: layanan dan keluaran disediakan apa adanya; pengguna menanggung risiko; pengguna mengganti rugi pihak Anthropic. Tidak ada ganti rugi dari Anthropic atas klaim kekayaan intelektual terhadap pengguna dalam teks yang saya baca (tidak ditelusuri menyeluruh).
- Consumer, "Business Domains": surel milik pemberi kerja atau organisasi dapat menautkan akun ke akun enterprise organisasi, dan administratornya dapat mengakses Materials.
- Commercial, §B *Customer Content*: Customer **memiliki Outputs** (sejauh diizinkan hukum), Anthropic menyangkal hak atas Customer Content, dan dengan syarat kepatuhan mengalihkan hak miliknya "jika ada" atas Outputs. Anthropic tidak melatih model dengan Customer Content dari Services.
- Commercial, §D.3: tanggung jawab Customer mengevaluasi kesesuaian Outputs sebelum dipakai atau dibagikan.
- Commercial, §K.1 *Claims Against Customer*: Anthropic membela dan mengganti rugi Customer atas klaim pihak ketiga bahwa **penggunaan berbayar** layanan sesuai Terms, atau Outputs hasil penggunaan itu, melanggar kekayaan intelektual, dengan pengecualian di §K.3 (mis. modifikasi Outputs, kombinasi dengan teknologi atau konten lain, masukan pelanggan).

**Apakah mengatur kepemilikan, hak atas keluaran, redistribusi, lisensi open source?**
- Kepemilikan/hak atas keluaran: **ya**, pada kedua dokumen (pengalihan hak Anthropic "jika ada"; Commercial juga menyatakan Customer "memiliki" Outputs sejauh diizinkan hukum).
- Redistribusi/lisensi open source atas keluaran: **tidak dibahas** (Consumer hanya menyebut perangkat lunak OSS di software Anthropic; Commercial nol sebutan).
- Perlindungan klaim IP: hanya di Commercial dan hanya untuk penggunaan berbayar dengan pengecualian.

**Belum terselesaikan (UNVERIFIED):**
- Jenis akun/paket yang dipakai (Consumer Pro/Max, atau Commercial/API/Team/Enterprise), dan apakah akun tertaut ke organisasi lewat domain surel (lihat "Business Domains"); itu menentukan dokumen yang berlaku dan siapa yang memegang hak.
- Arsip yang ada bertanggal 23-24 Okt 2026 (identik dengan versi tayang); tanggal efektif (Okt 2025 / Jun 2025) mendahului pemakaian, jadi versi itu **sangat mungkin** berlaku saat 48 commit dibuat. Belum ada bukti terpisah untuk tiap jam commit.
- Pengalihan hanya mencakup hak Anthropic; tidak menjamin keluaran bebas dari hak pihak ketiga atau berhak cipta.

## 4. Syarat kontrak vs hukum hak cipta vs asumsi

- **Syarat kontrak** (di atas) mengatur hubungan Anda dengan penyedia alat: siapa yang mengklaim apa *di antara para pihak*. Ketiganya menyatakan penyedia tidak mengklaim, atau mengalihkan, hak yang mereka miliki atas keluaran ("jika ada"). Tidak satu pun menyatakan bahwa keluaran **berhak cipta**, bahwa keluaran **bebas dari hak pihak ketiga**, atau mengatur **lisensi open source** tertentu. Kontrak tidak bisa memberi hak yang tidak dimiliki penyedia.
- **Hukum hak cipta** menentukan apakah keluaran AI dilindungi dan siapa penciptanya; ini bukan dijawab oleh syarat penyedia. Untuk AS, US Copyright Office menerbitkan *Copyright and Artificial Intelligence, Part 2: Copyrightability* (29 Jan 2025; [halaman resmi](https://www.copyright.gov/ai/)); saya **hanya memverifikasi judul dan tanggalnya**, bukan isi kesimpulannya. Untuk Indonesia, sumber sekunder yang saya temukan (artikel akademik dan berita hukum, bukan teks resmi atau putusan) menyatakan UU 28/2014 mendefinisikan pencipta sebagai orang dan belum mengatur karya AI secara eksplisit, serta ada rancangan revisi yang membahasnya; status terbarunya **tidak diverifikasi**. Perlakuan di yurisdiksi pemelihara dan pengguna lain tetap UNVERIFIED.
- **Asumsi yang tidak boleh dibuat** dari dokumen ini: bahwa kode hasil AI otomatis bebas masalah lisensi; bahwa menyebutnya "milik Anda" membuat lisensi MIT sah atas seluruh isinya; bahwa keluaran tidak mirip dengan kode berlisensi lain (ketiga syarat justru menyebut keluaran bisa mirip dengan yang diberikan ke pengguna lain). Pemindaian kemiripan kode belum dilakukan (audit bagian 11.1).

## 5. Yang belum terselesaikan dan perlu keputusan pemelihara

1. Tentukan dan catat **jenis akun/paket** yang dipakai tiap alat pada tanggal pembuatan (Google: unpaid atau paid, proyek Cloud berpenagihan; Cursor: individu atau organisasi; Anthropic: Consumer atau Commercial, dan apakah akun tertaut ke organisasi). Tanpa itu, dokumen yang berlaku tidak bisa ditetapkan.
2. Putuskan apakah frasa "profesional atau bisnis, bukan konsumen" pada Gemini API Additional Terms perlu ditanyakan ke Google atau dikonsultasikan kepada penasihat hukum.
3. Ambil keputusan tentang **templat AI Studio** (README awal, `metadata.json`, komentar templat): tetap, ganti, atau hapus, serta apakah lisensinya perlu dikonfirmasi. (Perubahan kode di luar lingkup tinjauan ini.)
4. Putuskan perlunya nasihat hukum tentang status hak cipta kode yang sebagian besar dihasilkan AI dan dampaknya pada klaim lisensi MIT.
5. Simpan salinan arsip (tautan di atas) sebagai bukti versi yang dibaca. Salinan ini diambil hari ini; arsip tidak membuktikan apa yang Anda setujui pada saat itu.

Kesimpulan untuk `LICENSE`: pada bagian yang dibaca dan pencarian kata "open source", **tidak ditemukan larangan eksplisit** terhadap lisensi terbuka atas keluaran (topiknya tidak dibahas; seluruh dokumen, Usage Policy Anthropic, dan Prohibited Use Policy Google tidak dibaca tuntas), tetapi syarat-syarat itu **tidak memberi dasar** untuk menjamin kepemilikan atau lisensi; keputusan tetap tertunda sampai poin 1-4 dijawab dan pertanyaan lain di audit (pemegang hak, organisasi, kemiripan kode) selesai.
