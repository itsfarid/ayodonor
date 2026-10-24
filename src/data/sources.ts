// Sources shown to users. Every entry was opened on ACCESSED_ON; see docs/medical-claims.md for how each was read,
// what it supports and its limits. Do not add a source here without opening and reading it first.

export const ACCESSED_ON = "24 Oktober 2026";

export type SourceKind = "Regulasi Indonesia" | "Pedoman internasional" | "Panduan praktis PMI" | "Artikel edukasi Kemenkes" | "Siaran pers Kemenkes";

export interface Source {
  id: string;
  /** Short label used in links next to claims. */
  label: string;
  title: string;
  publisher: string;
  kind: SourceKind;
  url: string;
  /** Publication date as shown by the source, or a statement that none is shown. */
  published: string;
  accessed: string;
  /** What AyoDonor uses it for. */
  supports: string;
  /** Known limits of the source. */
  limits: string;
}

export const SOURCES: Source[] = [
  {
    id: "permenkes",
    label: "Permenkes 91/2015",
    title: "Peraturan Menteri Kesehatan No. 91 Tahun 2015 tentang Standar Pelayanan Transfusi Darah",
    publisher: "Kementerian Kesehatan RI (JDIH Kemenkes)",
    kind: "Regulasi Indonesia",
    url: "https://jdih.kemkes.go.id/documents/peraturan-menteri-kesehatan-nomor-91-tahun-2015",
    published: "Ditetapkan 31 Des 2015, diundangkan 13 Jan 2016; status di JDIH: Berlaku",
    accessed: ACCESSED_ON,
    supports:
      "Kriteria seleksi donor (usia, berat badan, tekanan darah, nadi, suhu, Hb), jeda dan frekuensi donor, penolakan sementara (tato/tindik, kehamilan, demam, pengobatan), skrining IMLTD, volume kantong, komponen darah.",
    limits:
      "Terbitan 2015. Halaman JDIH tidak mencantumkan perubahan atau pencabutan, tetapi kami tidak memeriksa regulasi yang lebih baru. Tidak menyebut haid atau menyusui.",
  },
  {
    id: "pmi-faq",
    label: "FAQ PMI",
    title: "FAQ Donor Darah, PMI AyoDonor",
    publisher: "Palang Merah Indonesia (PMI)",
    kind: "Panduan praktis PMI",
    url: "https://ayodonor.pmi.or.id/?page=faq",
    published: "Tidak ada tanggal pada halaman",
    accessed: ACCESSED_ON,
    supports: "Persiapan sebelum dan sesudah donor, pemulihan darah, pemeriksaan sebelum donor, penundaan setelah tato/tindik, menyusui, demam.",
    limits:
      "Tanpa tanggal. Angkanya berbeda dari Permenkes pada beberapa hal (lihat tabel perbedaan). Satuan waktu untuk kehamilan tidak tertulis.",
  },
  {
    id: "pmi-stok",
    label: "Stok Darah PMI",
    title: "Stok Darah, PMI AyoDonor",
    publisher: "Palang Merah Indonesia (PMI)",
    kind: "Panduan praktis PMI",
    url: "https://ayodonor.pmi.or.id/?page=stok",
    published: "Tidak ada tanggal; kolom \"Update\" kosong saat dibuka",
    accessed: ACCESSED_ON,
    supports: "Tempat mencari stok darah resmi; PMI menyatakan stok dapat berubah sewaktu-waktu dan menyarankan menghubungi UTD terkait.",
    limits: "Data stok dimuat dinamis; isi tabel tidak terbaca saat kami membukanya, jadi tidak ada angka stok yang kami salin.",
  },
  {
    id: "who-safety",
    label: "WHO: Blood safety and availability",
    title: "Blood safety and availability (lembar fakta)",
    publisher: "World Health Organization (WHO)",
    kind: "Pedoman internasional",
    url: "https://www.who.int/news-room/fact-sheets/detail/blood-safety-and-availability",
    published: "Halaman bertanggal 12 Juni 2026",
    accessed: ACCESSED_ON,
    supports:
      "Donor sukarela tanpa bayaran sebagai dasar pasokan yang aman; skrining semua donasi untuk HIV, hepatitis B, hepatitis C, dan sifilis; pemisahan darah lengkap menjadi komponen sehingga dapat melayani lebih dari satu pasien.",
    limits: "Tidak memuat kriteria pendonor (usia, berat badan, Hb) dan tidak menyebut manfaat kesehatan bagi pendonor.",
  },
  {
    id: "who-guidelines",
    label: "WHO: Blood donor selection",
    title: "Blood donor selection: guidelines on assessing donor suitability for blood donation",
    publisher: "World Health Organization (WHO)",
    kind: "Pedoman internasional",
    url: "https://www.who.int/publications/i/item/blood-donor-selection-guidelines-on-assessing-donor-suitability-for-blood-donation",
    published: "1 Januari 2012 (118 halaman, ISBN 9789241548519)",
    accessed: ACCESSED_ON,
    supports: "Tujuan seleksi donor: melindungi pasokan darah, penerima, dan pendonor sambil menghindari penolakan yang tidak perlu.",
    limits: "Kami hanya membuka halaman ringkasannya, bukan PDF lengkap. Halaman itu sendiri tidak menyebut angka kriteria.",
  },
  {
    id: "who-eligibility",
    label: "WHO: Who can give blood",
    title: "Who can give blood?",
    publisher: "World Health Organization (WHO), World Blood Donor Day",
    kind: "Pedoman internasional",
    url: "https://www.who.int/campaigns/world-blood-donor-day/who-can-give-blood",
    published: "Tidak ada tanggal pada halaman (hanya © 2026)",
    accessed: ACCESSED_ON,
    supports:
      "Gambaran umum kelayakan menurut WHO (usia, berat badan, Hb, tato/tindik, kehamilan, perjalanan) dan penegasan bahwa aturan layanan darah nasional/lokal yang berlaku.",
    limits: "Angkanya bersifat umum dan bervariasi antar negara; tidak membahas obat, haid, atau jeda antar donor.",
  },
  {
    id: "kemkes-benefit",
    label: "Kemenkes: Keuntungan Donor Darah (2023)",
    title: "Apa Saja Keuntungan Donor Darah, Yuk Kita Cek!",
    publisher: "Ditjen Kesehatan Lanjutan, Kemenkes RI (penulis: RSUP Prof. dr. I.G.N.G. Ngoerah)",
    kind: "Artikel edukasi Kemenkes",
    url: "https://keslan.kemkes.go.id/view_artikel/2637/apa-saja-keuntungan-donor-darah-yuk-kita-cek",
    published: "24 Juli 2023",
    accessed: ACCESSED_ON,
    supports: "Hanya sebagai contoh klaim manfaat yang tidak kami ulang.",
    limits:
      "Menyebut manfaat kolesterol, jantung, kalori, dan kanker tanpa rujukan studi per klaim; daftar pustaka berisi sumber umum yang tidak dikaitkan dengan klaim tertentu.",
  },
  {
    id: "kemkes-syarat",
    label: "Kemenkes: Syarat dan Manfaat (2025)",
    title: "Syarat dan Manfaat Donor Darah",
    publisher: "Ditjen Kesehatan Lanjutan, Kemenkes RI (penulis: RSUP dr. Soeradji Tirtonegoro Klaten)",
    kind: "Artikel edukasi Kemenkes",
    url: "https://keslan.kemkes.go.id/view_artikel/4115/syarat-dan-manfaat-donor-darah",
    published: "21 Mei 2025",
    accessed: ACCESSED_ON,
    supports: "Pembanding untuk jeda donor (3 bulan), usia, berat badan, dan saran persiapan (hindari olahraga berat dan alkohol satu hari sebelumnya).",
    limits:
      "Memuat ketidakkonsistenan internal (rentang tekanan darah dan batas Hb) dan klaim manfaat tanpa rujukan per klaim; tidak membahas tato atau durasi obat.",
  },
  {
    id: "kemkes-pers",
    label: "Kemenkes: siaran pers (2022)",
    title: "Kemenkes Ajak Masyarakat Bantu Sesama Lewat Kegiatan Donor Darah",
    publisher: "Kementerian Kesehatan RI",
    kind: "Siaran pers Kemenkes",
    url: "https://kemkes.go.id/id/kemenkes-ajak-masyarakat-bantu-sesama-lewat-kegiatan-donor-darah",
    published: "15 Juni 2022",
    accessed: ACCESSED_ON,
    supports: "Pernyataan pejabat Kemenkes bahwa satu kantong darah dapat menyelamatkan setidaknya 3 nyawa.",
    limits: "Pernyataan lisan pejabat dalam acara, bukan standar atau penelitian; PMI tidak kami temukan menyatakan hal yang sama.",
  },
];

export function getSource(id: string): Source {
  const s = SOURCES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown source id: ${id}`);
  return s;
}

/** A source plus an optional locator inside it (page, section). */
export interface SourceRef {
  id: string;
  locator?: string;
}

export interface CriteriaRow {
  criterion: string;
  permenkes: string;
  pmi: string;
  who: string;
  kemkes: string;
}

/** Side-by-side differences. AyoDonor does not choose a number; the UTD officer decides. */
export const CRITERIA_COMPARISON: CriteriaRow[] = [
  {
    criterion: "Usia",
    permenkes: "Minimal 17 tahun. Donor pertama >60 tahun atau donor ulang >65 tahun: perhatian khusus berdasarkan pertimbangan medis (hal. 56).",
    pmi: "17 sampai 60 tahun; sampai 65 tahun untuk donor rutin yang berhenti atas pertimbangan dokter.",
    who: "Umumnya 18 sampai 65 tahun; sebagian negara membolehkan 16-17 tahun dengan persetujuan, sebagian membatasi 60 tahun.",
    kemkes: "Minimal 17 tahun; donor pertama maks. 60 tahun; >60 (pertama) dan >65 (ulang) dengan perhatian khusus.",
  },
  {
    criterion: "Berat badan",
    permenkes: "45 kg untuk kantong 350 mL; 55 kg untuk kantong 450 mL dan donor apheresis (hal. 56-57).",
    pmi: "Minimal 45 kg (donor darah); 55 kg untuk donor trombosit apheresis.",
    who: "Umumnya minimal 50 kg; sebagian negara menerima 45 kg untuk kantong 350 mL.",
    kemkes: "Minimal 45 kg.",
  },
  {
    criterion: "Hemoglobin",
    permenkes: "12,5 sampai 17 g/dL (hal. 57).",
    pmi: "12,5 sampai 17,0 g/dL.",
    who: "Banyak negara memakai minimal 12,0 g/dL (perempuan) dan 13,0 g/dL (laki-laki).",
    kemkes: "Sekitar 12,5 sampai 17 g/dL (artikel juga menyebut batas atas 20, tidak konsisten).",
  },
  {
    criterion: "Tekanan darah",
    permenkes: "Sistolik 90-160 dan diastolik 60-100 mmHg, selisih lebih dari 20 mmHg (hal. 57).",
    pmi: "Sistolik 100-180 dan diastolik 70-100 mmHg (donor darah).",
    who: "Tidak disebut.",
    kemkes: "\"Normal\", sekitar 90/60 sampai 150/80 mmHg.",
  },
  {
    criterion: "Jeda antar donor darah lengkap",
    permenkes: "Minimal 2 bulan (laki-laki dan perempuan); maks. 6 kali/tahun (laki-laki) dan 4 kali/tahun (perempuan) (hal. 64).",
    pmi: "Minimal 2 bulan, mengutip Permenkes 91/2015.",
    who: "Tidak disebut.",
    kemkes: "Minimal 3 bulan (12 minggu) untuk donor ulang.",
  },
  {
    criterion: "Tato, tindik, akupunktur",
    permenkes: "6 bulan tanpa pemeriksaan NAT hepatitis C; 4 bulan jika NAT pada bulan ke-4 negatif (hal. 59).",
    pmi: "Tunggu 1 tahun.",
    who: "Penolakan 6 bulan untuk tato atau tindik baru.",
    kemkes: "Tidak disebut.",
  },
  {
    criterion: "Kehamilan dan menyusui",
    permenkes: "Kehamilan: 6 bulan setelah melahirkan atau penghentian kehamilan (hal. 60). Menyusui tidak disebut.",
    pmi: "Hamil: tunggu setelah melahirkan (satuan waktu tidak tertulis). Menyusui: tunggu 3 bulan setelah berhenti.",
    who: "Sebanyak bulan lamanya kehamilan; tidak dianjurkan saat menyusui, dengan jeda panjang setelah melahirkan.",
    kemkes: "Tidak boleh saat hamil atau menyusui.",
  },
  {
    criterion: "Demam dan flu",
    permenkes: "Demam >38 C dan flu-like illness: 2 minggu setelah gejala hilang (hal. 60).",
    pmi: "Tunggu 1 minggu setelah sembuh.",
    who: "Infeksi seperti flu atau pilek menyebabkan penolakan; lama tidak disebut.",
    kemkes: "Tidak disebut.",
  },
  {
    criterion: "Haid",
    permenkes: "Tidak disebut (kata haid/menstruasi tidak ada di teks).",
    pmi: "Tidak disebut.",
    who: "Tidak disebut.",
    kemkes: "Tidak ditemukan di artikel.",
  },
];
