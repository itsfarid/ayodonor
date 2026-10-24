# Usulan: prerender isi halaman (belum dikerjakan)

Status: **usulan**, menunggu persetujuan. Tidak ada kode untuk ini di repositori.

## Masalah

HTML mentah tiap halaman hanya berisi head dan `<div id="root"></div>`. Isi (judul, teks edukasi, FAQ, tautan) baru ada setelah
JavaScript berjalan. Googlebot merender JavaScript sehingga situs tetap bisa diindeks, tetapi: render terjadi setelah perayapan
awal dan bisa tertunda atau gagal; crawler/pratinjau/agen yang tidak menjalankan JavaScript tidak melihat isi; dan LCP
bergantung pada unduh serta eksekusi bundel 94 kB gzip. Ini risiko, bukan bukti halaman tidak terindeks.

## Opsi

| Opsi | Cara | Biaya | Risiko |
|---|---|---|---|
| **A. Prerender saat build (disarankan)** | Plugin build memanggil `renderToString(<App path=…/>)` dari `react-dom/server` per rute dan menulis hasilnya ke `#root` di tiap `*.html`; klien memakai `hydrateRoot` | Sedang: ~1 plugin kecil + satu `entry-server.tsx`, tanpa dependensi baru | Hidrasi: komponen yang membaca `window`, `Date`, atau state awal berbeda harus aman (mis. tahun di footer, pencari lokasi, kuis); mismatch bisa memunculkan peringatan atau layout shift |
| B. Framework SSG (mis. Astro/Next export) | Migrasi | Besar | Mengganti router, build, dan model deployment; di luar lingkup |
| C. Tetap seperti sekarang + `<noscript>` | Sudah ada | Nol | Isi tetap bergantung JavaScript |

## Rencana opsi A (bila disetujui)

1. Bangun `src/entry-server.tsx` yang mengekspor `render(path)`; `App` sudah menerima `path`, dan router membaca `initialPath`.
2. Di `vite.config.ts` (plugin `ayodonor-route-html`), setelah build klien, bundel entry server dengan `build.ssr` ke direktori
   sementara (bukan ke `dist/`), panggil `render` untuk lima rute dan `404`, dan sisipkan HTML ke `<div id="root">`.
3. `main.tsx`: `hydrateRoot` bila `#root` sudah berisi anak, selain itu `createRoot`.
4. Audit hidrasi: `new Date().getFullYear()` di footer (aman selama build dan klien di tahun yang sama; atau pindah ke
   teks tetap), `window.location` di `Router` (sudah dijaga `initialPath`), pencari lokasi (state awal kosong, tidak ada data di
   HTML), kuis (state awal kosong).
5. Tes: HTML mentah tiap rute memuat `<h1>` dan teks utamanya; tidak ada peringatan hidrasi di jsdom/browser; tes `dist/` yang
   ada (tanpa secret, tanpa file server) tetap lulus; `tests/static-build.test.ts` memeriksa bahwa bundel server tidak ikut ke `dist/`.
6. Verifikasi: Lighthouse mobile sebelum/sesudah (LCP, CLS), `curl` HTML mentah, URL Inspection (HTML render vs mentah),
   keyboard dan screen reader (fokus ke `<main>` saat pindah halaman tetap bekerja).

## Yang sengaja tidak termasuk

Data 228 UDD/UTD tidak dimasukkan ke HTML statis (halaman akan berisi daftar alamat panjang yang "bisa belum lengkap"; nilai
SEO-nya tidak jelas dan risiko konten tipis nyata). Halaman `/lokasi` tetap pencari: judul, pengantar, sumber, tanggal akses, dan
catatan stok dirender; daftar hanya setelah pengguna mencari.

## Keputusan yang diminta

Setujui, tolak, atau ubah opsi A. Bila disetujui, kerjakan di commit terpisah dari perbaikan SEO ringan, dengan uji regresi
di atas, dan jangan digabung dengan deployment tanpa persetujuan.
