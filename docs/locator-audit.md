# Audit pencari lokasi PMI (`PmiLocator`)

Ditulis 24 Oktober 2026, sebelum perbaikan. Dasar: pembacaan kode `src/components/PmiLocator.tsx` (versi di commit `6eacae2`),
tes yang ada, dan pembukaan halaman resmi PMI.

## Akar masalah yang terkonfirmasi

Urutan koordinat **bukan** penyebabnya. Kode memetakan `position.coords.latitude` ke `lat` dan `longitude` ke `lng`, dan
fungsi Haversine memakai urutan `(lat1, lon1, lat2, lon2)`; tes jarak yang ada cocok dengan nilai referensi (Jakarta-Bandung
117,6 km). Penyebab sebenarnya:

1. **Data yang dibandingkan tidak terverifikasi dan terbatas.** Daftar hanya berisi 7 kota dengan koordinat yang tidak
   punya sumber. Siapa pun di luar 7 kota itu tetap mendapat daftar terurut dengan satu unit "teratas", betapa pun jauhnya
   (Makassar untuk pengguna di Papua, ribuan km). Yang ada hanya satu kotak peringatan bila jaraknya > 100 km; baris
   berjarak ribuan km tetap tampil dengan "≈ N km", dan unit teratas otomatis menjadi "Lokasi terpilih".
2. **Posisi lama tetap tampil setelah percobaan gagal.** `userLocation` hanya diisi saat sukses dan tidak dikosongkan saat
   percobaan berikutnya gagal atau dimulai. Setelah satu fix lama/salah, kegagalan berikutnya tetap menampilkan jarak dari
   koordinat lama seolah masih berlaku.
3. **Akurasi posisi diabaikan.** `coords.accuracy` tidak pernah dibaca. Di desktop tanpa GPS, browser sering memberi posisi
   dari IP/Wi-Fi yang bisa meleset puluhan sampai ratusan km; aplikasi memperlakukannya sebagai titik pasti.
4. **Penanganan galat dangkal.** Hanya `PERMISSION_DENIED` yang dibedakan; `TIMEOUT` dan `POSITION_UNAVAILABLE` memakai pesan
   generik yang menyalahkan izin. Opsi `enableHighAccuracy: true` dengan `timeout: 8000` membuat timeout sering terjadi di
   perangkat tanpa GPS.
5. **Tidak ada validasi koordinat.** Nilai `NaN`, di luar rentang, atau tertukar (bujur Indonesia 95-141 tidak mungkin
   lintang) langsung dipakai.
6. **Diagram "peta" menyiratkan akurasi.** Pin dipaksa ke area 5-95% sehingga posisi di luar Indonesia tampak berada di dalam.
7. **Stok fiktif** ("Aman/Cukup/Kritis") ditampilkan per unit dengan warna status, meski dilabeli fiktif.

Tidak mungkin dipastikan dari kode saja posisi persis yang dilaporkan browser pada kasus Makassar; sebab 1-4 di atas
sudah cukup menjelaskan hasilnya untuk posisi mana pun.

## Audit tujuh lokasi demo terhadap halaman resmi PMI

Sumber: halaman "Kontak PMI" di situs resmi PMI AyoDonor, https://ayodonor.pmi.or.id/?page=kontak (228 baris: nama UDD/UTD,
provinsi, alamat, telepon; tanpa koordinat, tanpa tanggal terbit). Dibuka 24 Oktober 2026.

| Data demo lama | Halaman resmi PMI | Hasil |
|---|---|---|
| UTD PMI DKI Jakarta, Jl. Kramat Raya No.47, (021) 3906350 | UDD PMI Provinsi DKI Jakarta, Jl.Kramat Raya No. 47, (021) 906666/327711 | Telepon beda |
| UDD PMI Kota Bandung, Jl. Aceh No.79, (022) 4207052 | Jl. Aceh No. 79 Bandung, (022) 4207052 | Cocok |
| UTD PMI Kota Surabaya, Jl. Embong Ploso No.7-15, (031) 5313555 | UDD PMI Kota Surabaya, Jl. Embong Ploso No. 7-15, (031) 5313289/5323994 | Telepon beda |
| UTD PMI Kota Yogyakarta, Jl. Tegalgendu No.25, (0274) 372176 | UDD PMI Kota Yogyakarta, Jl. Tegalgendu No. 25 Kotagede, (0274) 372176/379212 | Cocok sebagian |
| UTD PMI Kota Semarang, Jl. Sugiopranoto No.31, (024) 3515050 | UDD PMI Kota Semarang, Jl. MGR. Soegiopranoto No.35, (024) 3515050/3542752 | Nomor jalan beda |
| UTD PMI Kota Medan, Jl. Palang Merah No.17, (061) 4567232 | UDD PMI Kota Medan, Jl. Perintis Kemerdekaan No.37, (061) 6621918 | **Salah** |
| UTD PMI Kota Makassar, Jl. Kandea No.16, (0411) 3612502 | UDD PMI Kota Makassar, Jl. Lanto Daeng Pasewang No. 55, (0411) 852477 | **Salah** |

Koordinat ketujuhnya tidak punya sumber dan tidak ada di halaman resmi, sehingga tidak boleh dipakai untuk menghitung jarak.

## Keputusan

- Data demo dan stok fiktif **dihapus**. Tidak ada yang dipertahankan sebagai "contoh".
- Diganti daftar 228 UDD/UTD yang tercantum di halaman resmi di atas, disalin apa adanya (nama, provinsi, alamat, telepon),
  dengan URL sumber dan tanggal akses pada tiap rekaman. "Terverifikasi" di sini hanya berarti *tercantum di halaman resmi
  PMI pada tanggal itu*, bukan bahwa alamat atau telepon masih berlaku atau unit buka.
- Koordinat tidak ada di sumber resmi, jadi rekaman tidak memuat koordinat. Karena itu jarak dari posisi pengguna belum
  dapat dihitung secara jujur. Mekanisme lokasi (izin, galat, validasi, Haversine, pengurutan) tetap dibangun dan dites, dan
  aktif hanya untuk rekaman yang punya koordinat bersumber (`coordinates` + `coordinatesSource`); tombol lokasi tidak
  ditampilkan bila tidak ada satu pun.
