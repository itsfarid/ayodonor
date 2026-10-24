# Audit kesiapan open source

Dibuat 24 Oktober 2026 pada `dev` @ `f520e81`. Isi hanya fakta yang diperiksa langsung di repositori, riwayat Git, dan
halaman publik yang dirujuk; kesimpulan yang tidak bisa dibuktikan ditandai **UNVERIFIED**. Tidak ada nilai rahasia di
dokumen ini (bila ada temuan, hanya jenis, lokasi, dan bentuknya yang dicatat).

**Keputusan pemelihara yang sudah dicatat (24 Okt 2026, belum dibuktikan oleh berkas):** AyoDonor adalah proyek pribadi yang menerima
kontribusi luar; produksi tidak diubah; pemelihara akan meminta klarifikasi kepada PMI tentang redistribusi data; data fasilitas UDD/UTD
yang dipublikasikan PMI **tidak otomatis dianggap data pribadi (PII) atau terlarang untuk diredistribusi**; dataset tidak dihapus atau diubah
selama izin menunggu; tidak ada publikasi atau perubahan visibilitas tanpa persetujuan eksplisit. Status "proyek pribadi" adalah pernyataan
pemelihara, bukan sesuatu yang bisa diverifikasi dari repositori. Pertanyaan kepemilikan kode 3-9 di bagian 11.3 **tetap terbuka**.

**Kesimpulan:** repositori **belum boleh dinyatakan siap publikasi**. Tidak ditemukan rahasia yang bocor, tetapi ada dua
blocker kritis yang butuh keputusan atau bukti dari pemelihara (hak redistribusi data UDD/UTD, dan kepemilikan/lisensi kode),
serta satu pengaturan yang belum ada (jalur pelaporan kerentanan privat). Lihat bagian 8. **Pembaruan lanjutan** (bagian 10-12):
pemisahan dataset diperiksa dan terbukti **layak tanpa mengubah perilaku** pada salinan percobaan, provenans kode ditelusuri dari
riwayat, dan kriteria rilis konkret dirumuskan. Tidak satu pun blocker dinyatakan selesai: tidak ada bukti izin atau kepemilikan baru.

## 1. Gambaran repositori

- Situs statis edukasi donor darah berbahasa Indonesia (React 19, Vite 6, Tailwind 4, TypeScript 5.8), lima halaman:
  `/`, `/panduan`, `/fakta-mitos`, `/lokasi`, `/tentang`. Kuis dihitung di browser; tidak ada server, basis data, API key, atau AI.
  Dideploy sebagai Worker Cloudflare hanya-aset (`wrangler.jsonc`, `ayodonor.web.id`).
- Remote: `origin = git@github.com:itsfarid/ayodonor.git`. **Repositori GitHub saat ini privat** (`gh repo view`: `isPrivate: true`,
  `licenseInfo: null`, tanpa deskripsi atau homepage; Issues aktif, Discussions nonaktif).
- Cabang `main` dan `dev` sama di `f520e81`; 56 commit sejak 2026-05-27. Working tree: hanya dua berkas tak terlacak milik
  pengguna (`rate_test_result.txt`, `rate_test_result2.txt`), tidak disentuh.
- Struktur terlacak: `src/` (34 berkas), `tests/` (15), `docs/` (9 sebelum audit ini), `public/` (3), `scripts/` (2), `shared/`,
  dan berkas konfigurasi. Tidak ada gambar, font, atau biner terlacak.

## 2. Inventaris dokumentasi

| Item | Status |
|---|---|
| `README.md` | Ada (Indonesia). Perlu: prasyarat Node tidak akurat untuk tes, tidak ada bagian lisensi, kontribusi, keamanan, atau sumber data. |
| `LICENSE` | **Tidak ada.** `package.json` tanpa field `license`; GitHub: `licenseInfo: null`. Tanpa lisensi, hak cipta default berlaku. |
| `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md` | Tidak ada. |
| `AGENTS.md` / `CLAUDE.md` | Tidak ada. |
| `.env.example` | Ada; menyatakan tidak ada variabel yang dibutuhkan. |
| `docs/` | `medical-claims.md` (klaim dan sumber), `locator-audit.md`, `seo.md`, `seo-prerender-proposal.md`, `static-deployment.md`, `static-migration.md`, `ai-removal.md`, `design-direction.md`, `rate-limit-evidence.md`. |
| CI (`.github/`) | **Tidak ada.** Semua pemeriksaan dijalankan manual. |
| Ketidakkonsistenan | `package.json` bernama `react-example` (sisa templat); `metadata.json` dan satu komentar di `vite.config.ts` adalah sisa AI Studio; `docs/static-deployment.md` berjudul "Cloudflare Pages" padahal isinya sebagian besar Workers; `.env.example` dan `docs/ai-removal.md` menyebut `.env.local` lama. |

## 3. Alur pengembangan dan pengujian (diverifikasi)

Pengelola paket: npm (`package-lock.json`). Skrip di `package.json`: `dev`, `build`, `preview`, `clean`, `check:links`
(manual, butuh jaringan), `check:seo`, `lint` (`tsc --noEmit`), `test` (`vitest run`). Tidak ada skrip format/lint gaya (ESLint/Prettier tidak ada).
Versi Node: tidak ada field `engines`, `.nvmrc`, atau CI. Dari `engines` dependensi terpasang: `vitest` 5.0.5 butuh
`^22.12 || ^24 || >=26`; `jsdom` 30.1.3 (untuk tes UI) butuh `^22.22.2 || ^24.15 || >=26`; `@vitejs/plugin-react` 5.2.0 butuh
`^20.19 || >=22.12`. Jadi README lama ("Node 22.12+") kurang tepat untuk tes. Yang benar-benar dijalankan: Node 26.8.2, npm 11.19.1.
Hasil pemeriksaan ada di laporan akhir tugas ini (224 tes, `tsc`, build).

## 4. Temuan Git dan rahasia

Metode (lokal, tanpa layanan pihak ketiga): `git log --all -G<pola>` untuk pola kunci umum (Google `AIza…`, `sk-…`, GitHub
`ghp_`/`github_pat_`, AWS `AKIA…`, Slack `xox…`, blok kunci privat, token Cloudflare, URL basis data, `Bearer`, pasangan
`key=value` panjang, `password=`), pemeriksaan semua nama berkas yang pernah ada (94) untuk `.env*`, kunci, sertifikat,
`.wrangler`, serta pemindaian tree saat ini untuk surel, jalur lokal, dan IP internal. `gitleaks`/`trufflehog` tidak
terpasang (**BLOCKED**, dan tidak dipasang).

| Temuan | Lokasi | Penilaian |
|---|---|---|
| Pola kunci API nyata (semua pola di atas) | Tree dan seluruh riwayat | **Tidak ada kecocokan.** |
| `GEMINI_API_KEY=…` | Commit `33b6cb5`, `c289443`, `713e107`, `833e0ac` (`.env.example` dan tes lama yang menulis `.env.local` sementara) | **Placeholder/fixture** (panjang 16–19 karakter, bentuk placeholder); bukan kunci. |
| `.env.local` | Hanya di disk lokal; diabaikan Git (`.env*`); **tidak pernah** ada di riwayat (diperiksa nama berkas dan pencarian nilai di semua commit: 0 kecocokan) | Berisi `GEMINI_API_KEY` (53 karakter) dan `APP_URL`. Menurut `docs/ai-removal.md` itu kunci lama yang sudah tidak dipakai. **Tidak terpapar lewat repositori.** Validitas tidak diuji (sesuai aturan). Saran kebersihan: cabut kunci itu di konsol Google bila masih aktif. |
| Surel penulis commit | Metadata Git (bukan berkas): 55 commit dengan alias `duck.com`, 1 commit dengan surel Gmail pribadi | Akan terlihat publik bila riwayat dipublikasikan. Bukan rahasia, tetapi privasi: keputusan pemelihara (riwayat tidak ditulis ulang di sini). |
| Surel, jalur lokal, IP/host internal di berkas terlacak | Tree saat ini | Tidak ada (hanya `localhost:5173/4173` di dokumentasi). |
| `rate_test_result*.txt` | Tak terlacak, milik pengguna | 11 baris status HTTP; tidak berisi rahasia; jangan dipublikasikan. |
| Kredensial Cloudflare | Tree dan riwayat | Tidak ada; `wrangler.jsonc` hanya `name`, `compatibility_date`, `assets`. |

Riwayat juga memuat kode lama (server Express, integrasi Gemini) yang sudah dihapus (`docs/ai-removal.md`); tidak ada rahasia di sana.

## 5. Temuan dependensi

- Lockfile ada dan konsisten: `npm ls --all` exit 0; `npm install --package-lock-only --dry-run` tidak mengubah `package-lock.json`.
- `npm audit` (mengirim nama dan versi paket ke registry npm, bukan isi repositori), 24 Okt 2026: **0 kerentanan** (low/moderate/high/critical = 0).
  Ini hanya mencerminkan basis advisori npm pada saat itu, bukan jaminan.
- Lisensi dependensi (225 paket di lockfile): MIT 187, Apache-2.0 6, ISC 8, BSD 4, BlueOak 3, MIT-0 2, 0BSD 1, CC0 1, **MPL-2.0 12**
  (`lightningcss` dan varian biner, perkakas build Tailwind), **CC-BY-4.0 1** (`caniuse-lite`, data untuk browserslist). Semuanya perkakas
  build yang tidak dimodifikasi dan tidak dikirim ke `dist/`; tidak menghalangi lisensi MIT untuk kode proyek. React, React DOM, dan
  lucide-react (MIT/ISC) ikut dibundel ke `dist/`; Vite membuang komentar lisensi, jadi pemberitahuan lisensi pihak ketiga tidak ada di
  keluaran (non-blocker; lihat rekomendasi).
- Catatan kebersihan: dependensi `motion` terdaftar tetapi tidak diimpor di `src/` dan tidak ada di bundel; `vite` terdaftar ganda
  (`dependencies` dan `devDependencies`); perkakas build ada di `dependencies`. Tidak diubah di sini.

## 6. Provenans data dan aset

| Materi | Sumber | Lisensi / izin | Status |
|---|---|---|---|
| Daftar 228 UDD/UTD (`src/data/utd.ts`): nama, provinsi, alamat, telepon | Halaman Kontak PMI, `https://ayodonor.pmi.or.id/?page=kontak`, dibuka 24 Okt 2026; disalin apa adanya (ejaan sumber dipertahankan) | Halaman sumber **tidak memuat pernyataan hak cipta, lisensi, atau syarat penggunaan** (diperiksa lewat pengambilan halaman; tidak ada teks tersebut). `robots.txt`-nya hanya berisi komentar "content signals" tanpa aturan. Tidak ada bukti izin redistribusi. | **UNVERIFIED.** Data kontak fasilitas yang dipublikasikan PMI; 8 baris memuat nomor berformat ponsel/WhatsApp, dicatat hanya agar bisa ditanyakan saat klarifikasi ke PMI (bagian 10). Blocker, bagian 8. |
| Teks edukasi (`src/data/faq.ts`, `myths.ts`, `shared/content.ts`, halaman) | Ditulis proyek berdasarkan Permenkes 91/2015, FAQ PMI, WHO, artikel Kemenkes (`src/data/sources.ts`, dicatat per klaim di `docs/medical-claims.md`) | Parafrase dengan tautan sumber; tidak ada penyalinan massal yang teridentifikasi, tetapi **belum dibandingkan baris demi baris dengan sumber** | **UNVERIFIED** (kemiripan redaksional dengan FAQ PMI belum diaudit). Belum ditinjau tenaga medis (dinyatakan di `docs/medical-claims.md`). |
| Metadata sumber (judul, penerbit, tanggal akses) | Halaman-halaman sumber | Fakta bibliografis | Rendah risiko |
| Ikon, favicon, ilustrasi (`public/favicon.svg`, `heroCardSvg.ts`, `ComponentsFigure.tsx`, `DropMark`) | SVG inline buatan proyek (favicon ditambahkan 24 Okt 2026 oleh penulis repo) | Tidak ada aset pihak ketiga terlacak; ikon `lucide-react` (ISC) hanya di `HeroCard.tsx` | Tidak ada masalah ditemukan; asal desain asli tidak bisa dibuktikan dari riwayat selain commit penulis |
| Font | Font sistem; tanpa `@font-face` atau host font | — | Tidak ada masalah |
| Gambar/biner | Tidak ada terlacak | — | — |
| Kode awal dari Google AI Studio | Commit `33b6cb5` "Add AyoDonor app from AI Studio" (6.798 baris: `App.tsx`, `HeroCard.tsx`, `PmiLocator.tsx`, `server.ts`, konfigurasi). Sebagian besar sudah ditulis ulang, tetapi `tsconfig.json`, sebagian `vite.config.ts`, `package.json`, `index.html` masih berasal dari sana | Tidak ada header lisensi di seluruh riwayat. Syarat kepemilikan/penggunaan keluaran AI Studio **tidak diverifikasi** di sini | **UNVERIFIED.** Pemelihara perlu memastikan hak atas kode awal itu. |

Nama proyek: situs resmi PMI sendiri bernama "PMI AyoDonor" (`ayodonor.pmi.or.id`). Repositori ini memakai nama "AyoDonor" dan sudah
menyatakan independensi di README/situs. Risiko kebingungan merek/nama adalah **UNVERIFIED** dan bukan penilaian hukum; pertimbangkan oleh pemelihara.

## 7. Rekomendasi lisensi dan cakupan

- **Kode proyek sendiri** (`src/`, `tests/`, `scripts/`, `vite.config.ts`, `vitest.config.ts`, `wrangler.jsonc`, konfigurasi): **MIT** cocok
  untuk tujuan terbuka-dan-permisif, dan kompatibel dengan seluruh dependensi (bagian 5). **Belum diterapkan**, karena dua hal belum bisa
  dibuktikan: (a) pemegang hak cipta (riwayat hanya memuat nama penulis commit "Farid | Iamjustzero" dan "Farid"; nama hukum, afiliasi organisasi
  yang mungkin punya hak, atau kontributor lain tidak diverifikasi) dan (b) hak atas kode awal AI Studio. Tahun 2026 terverifikasi (commit pertama 27 Mei 2026).
- **Data UDD/UTD**: **jangan dicakup lisensi kode.** Sampai izin/ketentuan sumber jelas, jangan menyatakan lisensi untuk dataset ini.
- **Teks edukasi dan dokumentasi**: pemelihara perlu memilih (mis. lisensi konten terpisah seperti CC BY 4.0, atau sama dengan kode). Tidak diputuskan di sini.
- **Dependensi dan sumber**: tetap di bawah lisensi masing-masing; tautan sumber bukan pemberian lisensi.
- Teks MIT standar siap pakai begitu pemelihara mengonfirmasi pemegang hak (satu baris yang harus diisi):

  ```
  MIT License

  Copyright (c) 2026 <PEMEGANG HAK CIPTA, dikonfirmasi pemelihara>

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation
  files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy,
  modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software
  is furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR
  IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  ```

  Bila data UDD/UTD dikecualikan, tambahkan catatan di `LICENSE`/README bahwa `src/data/utd.ts` tidak dicakup lisensi kode.

## 8. Blocker rilis

**Kritis** (jangan publikasikan sebelum diputuskan):
1. **Hak redistribusi data UDD/UTD tidak terverifikasi.** Situs sumber tidak menyatakan lisensi/syarat; repositori publik akan menjadikan 228 baris itu dataset yang bisa diunduh dan dilisensikan ulang oleh orang lain.
2. **Lisensi kode belum ditetapkan, dan kepemilikan belum dikonfirmasi** (pemegang hak, afiliasi, kode awal AI Studio). Tanpa `LICENSE`, repositori publik bukan open source.

**Penting, bukan kritis:**
3. **Jalur pelaporan kerentanan privat belum ada.** `gh api .../private-vulnerability-reporting` menjawab 404 (tidak aktif atau tidak tersedia untuk repositori privat saat ini); tidak ada surel keamanan yang dapat dibuktikan. Pemelihara harus mengaktifkannya atau menetapkan kontak (lihat `SECURITY.md`).
4. **Kontak penegakan Code of Conduct belum ada.** `CODE_OF_CONDUCT.md` memakai teks resmi tanpa kontak karangan; pemelihara harus menambahkannya.
5. **Metadata riwayat memuat dua surel penulis** (alias duck.com dan Gmail pribadi). Putuskan apakah diterima atau riwayat perlu dibersihkan (di luar lingkup; tidak dilakukan otomatis).

## 9. Langkah perbaikan yang disarankan

1. Putuskan data UDD/UTD: minta izin tertulis/konfirmasi ke PMI (kontak lewat situs resmi PMI), atau jangan sertakan `src/data/utd.ts` di repositori publik (mis. repositori publik tanpa dataset dengan instruksi mengisinya), atau dapatkan dasar hukum yang jelas. Jangan menghapus otomatis.
2. Konfirmasi pemegang hak cipta dan hak atas kode awal AI Studio; lalu tambahkan `LICENSE` (teks di bagian 7) dan field `license` di `package.json`.
3. Aktifkan Private Vulnerability Reporting di Settings → Code security setelah repositori publik, atau tetapkan surel keamanan, lalu perbarui `SECURITY.md`.
4. Tetapkan kontak penegakan di `CODE_OF_CONDUCT.md`, dan periksa ketentuan lisensi teks Contributor Covenant 2.1 di situs resminya (di sini hanya teks dan atribusinya yang dipakai; pernyataan lisensinya tidak berhasil diverifikasi).
5. Cabut kunci Gemini lama di `.env.local` bila masih aktif (kebersihan).
6. Opsional: tambahkan CI (lint, tes, build) dengan versi Node eksplisit dan `engines`; ganti nama paket `react-example`; hapus `metadata.json`/komentar AI Studio; rapikan dependensi (`motion`, `vite` ganda); hasilkan pemberitahuan lisensi pihak ketiga untuk bundel; audit kemiripan teks FAQ dengan sumber; pertimbangkan nama proyek terhadap "PMI AyoDonor".
7. Setelah semua di atas selesai: ulangi pemindaian rahasia pada riwayat terbaru sebelum mengubah visibilitas.

## 10. Dataset UDD/UTD: pemisahan dan redistribusi (lanjutan, 24 Okt 2026)

Tidak ada rekaman yang dihapus, diubah, atau dipindahkan di repositori ini. Semua percobaan dilakukan pada salinan `git archive HEAD` di luar repositori.

### 10.1 Fakta terverifikasi

| Pertanyaan | Temuan |
|---|---|
| Berkas yang memuat 228 rekaman | **Satu**: `src/data/utd.ts` (272 baris, ~28 kB). Baris 33-262 = 228 larik `[no, nama, provinsi, alamat, telepon]`; sisanya tipe (`UtdRecord`, `UtdCoordinates`), konstanta (`UTD_SOURCE_ID`, `UTD_SOURCE_URL`, `UTD_RETRIEVED_ON`), dan `UTD_RECORDS` (memetakan larik ke objek). Tidak ada salinan data di berkas kode lain. |
| Kode yang bergantung | Hanya dua impor: `src/components/PmiLocator.tsx` (`UTD_RECORDS`, `UTD_RETRIEVED_ON`, tipe `UtdRecord`; dirender oleh `src/pages/LocationsPage.tsx`) dan `src/pages/HomePage.tsx` (`UTD_RECORDS.length` untuk teks "228 unit"). |
| Metadata terkait (bukan rekaman) | `src/data/sources.ts` (entri `pmi-kontak`, menyebut 228 baris) dan `docs/medical-claims.md` (rujukan teks). |
| Tes yang bergantung pada isi data | `tests/utd-data.test.ts` (7 tes), `tests/pmilocator.test.tsx` (blok "shipped data" memakai rekaman asli, selain fixture sintetis), `tests/routing.test.tsx` (1 tes: pencarian "makassar" harus menemukan `UDD PMI Kota Makassar`). |
| Kutipan data di dokumen | `docs/locator-audit.md` memuat 7 baris perbandingan berisi alamat dan telepon 7 unit (dari halaman PMI); `docs/medical-claims.md` dan `docs/seo.md` hanya menyebut dataset/sumbernya. |
| Keluaran build | Data ikut dibundel ke `dist/assets/index-*.js`. **Situs produksi saat ini sudah menyajikannya ke publik** (bundel produksi diambil dan memuat rekaman; 24 Okt 2026). Jadi pertanyaan hak redistribusi berlaku juga untuk situs yang berjalan, bukan hanya untuk repositori publik. |
| Riwayat Git | Rekaman masuk lewat satu commit (`1e77f5d`, 24 Okt 2026) dan ada di **16 commit** (`1e77f5d` sampai `HEAD`) serta di `origin/main` dan `origin/dev` (repositori privat). Menghapus berkas dari `HEAD` **tidak** mengeluarkan data dari riwayat. Riwayat lebih lama memuat data demo tak bersumber (7 lokasi) yang sudah diganti; itu masalah akurasi, bukan lisensi. |
| Informasi pribadi/sensitif | Semua 228 baris adalah unit PMI (227 berawalan "UDD PMI", 1 "UDD PUSAT"), 39 provinsi. Tidak ada surel, nama orang, atau kata kontak-pribadi (`CP`, `a.n.`, `up.`) yang terdeteksi; "Komp." di alamat berarti kompleks rumah sakit, bukan perumahan. **Catatan:** 8 rekaman (no. 2, 70, 71, 109, 138, 185, 188, 190) memuat nomor berformat ponsel, satu berlabel "WA:". Data ini dipublikasikan PMI sebagai kontak unit dan **tidak diklasifikasikan sebagai PII**; sifat nomornya hanya dicatat sebagai pertanyaan untuk PMI (UNVERIFIED). 12 rekaman tanpa telepon. |
| Sumber dan syarat redistribusi | Sumber: halaman Kontak PMI (`https://ayodonor.pmi.or.id/?page=kontak`), tanpa tanggal terbit. Halaman itu dan situsnya **tidak memuat pernyataan hak cipta, lisensi, atau syarat penggunaan** yang ditemukan; `robots.txt`-nya hanya berisi komentar "content signals" tanpa aturan. Izin redistribusi **tidak dapat dibuktikan dari bukti yang ada** di repositori atau di situs sumber. Tidak ada bukti izin tertulis dari PMI di repositori. |

Diasumsikan, belum terverifikasi: nama, alamat, dan telepon unit adalah fakta kontak lembaga dan kemungkinan berisiko hukum rendah bila
dikutip dengan atribusi. Itu **bukan** kesimpulan hukum dan bukan izin; hanya PMI (atau penasihat hukum pemelihara) yang bisa
memastikannya. Kompilasi/ekstraksi massal dari sebuah situs bisa tunduk pada ketentuan situs itu sendiri.

### 10.2 Apakah dataset bisa dipisah tanpa mengubah perilaku? Ya (percobaan pada salinan)

Percobaan 1, pemisahan penuh: baris dipindah ke `src/data/utd.rows.ts` (`export const UTD_ROWS`), dan `utd.ts` mengimpornya.
Hasil pada salinan: ekspor modul identik byte demi byte (`UTD_RECORDS`, `UTD_RETRIEVED_ON`, `UTD_SOURCE_ID`, `UTD_SOURCE_URL`: JSON 53.686 B
sama), `tsc --noEmit` lulus, **225 tes lulus** (satu tes tambahan hanyalah pemindaian klaim di `content.test.ts` yang kini juga membaca berkas baru),
build sukses, ukuran bundel JS sama (304.502 B) dan kelima HTML (+404) identik selain nama berkas hash bundel.

Percobaan 2, varian publik dengan `UTD_ROWS = []`: `tsc` lulus dan build sukses, tetapi **10 tes gagal** (215 lulus): `tests/pmilocator.test.tsx` 7 (blok "shipped data" dan
satu tes fallback), `tests/utd-data.test.ts` 2 (metadata dan salinan resmi), `tests/routing.test.tsx` 1 (pencarian Makassar). Selain itu UI memakai `UTD_RECORDS.length`,
sehingga beranda dan pencari akan menampilkan "0 unit menurut halaman Kontak PMI", teks yang menyesatkan; varian publik butuh keadaan "dataset tidak disertakan"
(perubahan kode kecil, belum dibuat).

### 10.3 Rencana pemisahan minimal (usulan; belum diterapkan; perilaku repositori privat tetap)

0. **Jangan ubah apa pun sebelum keputusan.** Bila PMI memberi izin tertulis (kriteria D1 di bagian 12), pemisahan tidak perlu.
1. (Repo privat, tanpa perubahan perilaku; terverifikasi layak) Pindahkan hanya larik baris ke `src/data/utd.rows.ts`; `src/data/utd.ts` tetap menjadi satu-satunya modul yang diimpor komponen dan tes.
2. (Varian publik) Repositori publik dibuat sebagai **riwayat baru** (mis. ekspor `git archive` dari commit terpilih lalu `git init`), **bukan** dengan memublikasikan riwayat ini, karena 16 commit membawa data. Membersihkan riwayat yang ada (mis. `git filter-repo`) adalah keputusan terpisah dan tidak dilakukan di sini.
3. Ekspor publik mengecualikan `src/data/utd.rows.ts` (diganti stub kosong atau berkas contoh berlabel jelas), 7 baris kutipan di `docs/locator-audit.md`, dan tidak memuat `dist/`.
4. Tambahkan di varian publik: keadaan "dataset tidak disertakan" untuk beranda dan pencari lokasi, tes data-bergantung (10 tes di atas) dipindah ke lapisan privat atau dijaga oleh keberadaan dataset, dan dokumentasi skema (`UtdRecord`) beserta aturan "bawa datamu sendiri dan pastikan hakmu".
5. Cara menjaga dua repositori tetap sinkron (skrip ekspor dengan daftar pengecualian, atau submodul privat) dipilih pemelihara; skrip ekspor adalah yang paling sederhana. Build produksi tetap dari repositori privat.
6. Hak redistribusi **situs yang berjalan** tetap harus diselesaikan terpisah (bagian 10.1: bundel produksi sudah memuat data).

## 11. Provenans kode dan kepemilikan (lanjutan)

### 11.1 Fakta terverifikasi dari riwayat dan berkas

- Repositori dibuat 26-27 Mei 2026 (commit `0616f03`, penulis "Farid", hanya `README.md` berisi judul). Kode awal masuk 16 Juli 2026 lewat
  commit `33b6cb5` "Add AyoDonor app from AI Studio." (15 berkas, 6.798 baris termasuk `package-lock.json`; kode: `src/App.tsx`, `HeroCard.tsx`, `PmiLocator.tsx`, `server.ts`, konfigurasi).
- README awal di commit itu menyatakan "Run and deploy your AI Studio app", memuat tautan aplikasi di AI Studio dan banner yang di-hotlink dari situs Google, serta `.env.example` dan `metadata.json` dengan kapabilitas AI Studio. Aplikasi awal memakai Gemini di sisi server.
  Tidak ada teks lisensi, header hak cipta, atau pernyataan kepemilikan di commit itu atau di seluruh riwayat (`SPDX`/`Licensed under`/`Copyright`: tidak ditemukan).
- **Keterlibatan alat AI tercatat pada 51 dari 56 commit** lewat trailer `Co-authored-by`: 48 commit "Claude Sonnet 5.5" (semuanya 24 Okt 2026) dan 3 commit "Cursor" (16 Juli 2026, termasuk `33b6cb5`). Artinya sebagian besar kode, tes, dan dokumen saat ini dihasilkan atau dibantu AI di bawah arahan pemelihara.
- Sisa kode awal: dengan `git blame -w -M -C` pada 7.064 baris berkas kode terlacak (src, shared, tests, scripts, konfigurasi), **372 baris (~5%)** masih berasal dari `33b6cb5`, terutama `Quiz.tsx` (82), `HeroCard.tsx` (67), `PmiLocator.tsx` (55), `GuideChapters.tsx` (35), `index.css` (27), `tsconfig.json` (26), `package.json` (21), `vite.config.ts` (19). Sisanya ditulis kemudian (mayoritas 24 Okt 2026). Satu komentar AI Studio dan `metadata.json` masih ada.
- Penulis commit: "Farid | Iamjustzero" (55 commit) dan "Farid" (1 commit, awal). Remote: akun GitHub `itsfarid`. Apakah itu orang yang sama dan siapa pemegang hak secara hukum **tidak tertulis** di mana pun di repositori.
- Kode pihak ketiga yang disalin: **tidak ditemukan** komentar atribusi, tautan "adapted from", atau potongan bertanda lisensi di `src/`, `shared/`, `scripts/`. Dependensi dikelola lewat npm dengan lisensi sendiri (bagian 5). Pemeriksaan kemiripan kode otomatis terhadap korpus berlisensi **NOT RUN** (tidak ada alatnya di sini; tidak bisa dibuktikan bebas dari kemiripan). Konfigurasi Vite/tsconfig/Tailwind berasal dari templat AI Studio dan bersifat umum.
- Satu artefak konten pihak ketiga pernah ada di riwayat: banner yang di-hotlink dari situs Google di README awal (sudah tidak ada di README saat ini).

### 11.2 Belum bisa dipastikan (UNVERIFIED)

Syarat resmi ketiga alat sudah dirangkum, dengan salinan arsip bertanggal, di [docs/ai-terms-review.md](ai-terms-review.md) (menjawab sebagian pertanyaan 3-4 di bawah): teksnya mengatur siapa yang mengklaim keluaran *di antara para pihak*, tidak membahas lisensi open source, dan jenis akun/paket yang dipakai tidak tercatat. Yang tetap belum pasti:

Syarat kepemilikan dan penggunaan keluaran Google AI Studio/Gemini, Cursor, dan Anthropic yang berlaku pada tanggal pembuatan (teksnya ada di tinjauan di atas, bukan kesimpulan); perlakuan hak cipta atas materi yang dihasilkan AI di yurisdiksi pemelihara; identitas pemegang hak; ada tidaknya klaim organisasi lain atas pekerjaan ini. Tidak ada kesimpulan hukum dibuat di sini.

### 11.3 Daftar pertanyaan yang harus dijawab pemelihara

1. Siapa pemegang hak cipta yang akan tertulis di `LICENSE` (nama hukum atau organisasi)? Apakah "Farid" dan "Farid | Iamjustzero" orang yang sama?
2. Adakah organisasi (pemberi kerja, sekolah, program, sponsor, acara) yang berhak atau berkeberatan atas karya ini, terutama karena aplikasi awal dibuat untuk acara terkait GCP (lihat `docs/ai-removal.md`)? Perlu persetujuan tertulis?
3. Apa syarat Google AI Studio/Gemini API yang berlaku pada 16 Juli 2026 tentang kepemilikan keluaran dan penggunaan kode hasil bangkitan untuk proyek terbuka? Simpan tautan dan tanggal versi syarat yang dibaca. Adakah batasan yang berlaku untuk kode awal ini?
4. Hal yang sama untuk Cursor (3 commit) dan Anthropic/Claude Code (48 commit): syarat kepemilikan dan penggunaan keluaran pada tanggal itu, dan apakah ada pembatasan untuk lisensi terbuka.
5. Apakah pemelihara perlu nasihat hukum soal status hak cipta atas kode yang sebagian besar dihasilkan AI, dan dampaknya pada lisensi MIT (pernyataan "hak cipta" atas materi yang mungkin tidak berhak cipta)?
6. Apakah ada potongan kode yang diketahui disalin dari proyek lain (tutorial, snippet, templat)? Bila ragu, jalankan pemindaian kemiripan atau tinjau manual file yang berasal dari `33b6cb5` (daftar di 11.1).
7. Apakah teks edukasi (FAQ, mitos, panduan) boleh dilisensikan di bawah lisensi yang sama dengan kode, atau terpisah? Perlu dibandingkan dengan FAQ PMI dan Permenkes agar bukan salinan.
8. Apakah nama "AyoDonor" boleh dipakai, mengingat situs resmi PMI juga bernama "PMI AyoDonor"? Apakah perlu nama lain atau pernyataan independensi yang lebih kuat?
9. Apakah kontributor luar akan diterima, dan di bawah mekanisme apa (pernyataan hak, DCO, atau CLA)? `CONTRIBUTING.md` kini hanya meminta pernyataan bahwa kontributor berhak menyumbang.

### 11.4 Keputusan lisensi: **tetap tertunda**

Rekomendasi bersyarat tidak berubah: **MIT hanya untuk kode proyek** (`src/`, `tests/`, `scripts/`, konfigurasi), dengan dataset UDD/UTD dan teks edukasi dikecualikan dan ditangani terpisah (bagian 7). Syaratnya jawaban 1-6 di atas mendukung. Sampai itu terpenuhi **tidak ada `LICENSE`** yang dibuat dan README tetap menyatakan "lisensi belum ditetapkan".

## 12. Kriteria rilis (konkret)

Repositori boleh disebut siap publikasi bila **semua** berikut terpenuhi dan dicatat di dokumen ini dengan tanggal:

**Data UDD/UTD**: salah satu dari
- D1. Izin tertulis atau pernyataan lisensi dari PMI yang mencakup penyimpanan dan redistribusi daftar di repositori terbuka (bukti disimpan atau ditautkan, siapa pemberi izin, dan ruang lingkupnya), **atau**
- D2. Repositori publik tidak memuat dataset **dan** tidak memuat riwayat yang memuatnya (riwayat baru), varian publik lulus `npm run lint`, `npm test`, `npm run build` dengan keadaan "dataset tidak disertakan" yang jujur, dan dokumentasi skema ada.
- Terpisah dari D1/D2: jawaban PMI atas klarifikasi (termasuk sifat 8 rekaman bernomor ponsel) dan keputusan tentang situs produksi yang sudah menyajikan data. Data tidak dihapus selama klarifikasi berlangsung.

**Kode**
- C1. Pemegang hak cipta ditetapkan secara tertulis (jawaban 1-2).
- C2. Syarat penggunaan keluaran alat AI (Google AI Studio/Gemini, Cursor, Anthropic) telah dibaca per tanggal pembuatan, dan tidak ada pembatasan yang menghalangi lisensi terbuka (jawaban 3-5), dicatat dengan tautan dan tanggal.
- C3. Tidak ada klaim pihak lain yang belum diselesaikan (jawaban 2, 6, 8).
- C4. `LICENSE` (MIT atau yang dipilih) ditambahkan dengan pemegang hak terverifikasi, field `license` di `package.json`, pengecualian data dan teks dinyatakan, dan README/CONTRIBUTING diperbarui.

**Lain-lain**
- S1. Pelaporan kerentanan privat aktif atau kontak keamanan dipantau, dan `SECURITY.md` diperbarui. S2. Kontak penegakan Code of Conduct ditetapkan.
- H1. Keputusan tentang surel penulis di metadata riwayat dicatat. H2. Pemindaian rahasia diulang pada riwayat yang akan dipublikasikan, termasuk memastikan `.env.local` tidak ada di dalamnya.
- V1. `npm run lint`, `npm test`, `npm run build` lulus pada commit yang akan dipublikasikan, dan visibilitas tidak diubah sebelum semua poin di atas selesai.
