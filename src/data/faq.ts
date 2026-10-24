// Static FAQ. Every answer states only what the cited sources say (see docs/medical-claims.md).
// Where sources disagree or are silent, the answer says so and sends the reader to PMI. Nothing here is a
// eligibility decision.
import type { SourceRef } from "./sources";

export type FaqCategory = "Sebelum donor" | "Syarat dan jeda" | "Saat dan sesudah donor" | "Info resmi";

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  /** Sources that support the answer, shown as links next to it. */
  refs: SourceRef[];
  /** Honest label for parts that are general advice or AyoDonor's own wording. */
  note?: string;
}

export const FAQ_CATEGORIES: FaqCategory[] = ["Sebelum donor", "Syarat dan jeda", "Saat dan sesudah donor", "Info resmi"];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "diperiksa",
    category: "Sebelum donor",
    question: "Apa saja yang diperiksa sebelum donor?",
    answer:
      "Petugas menilai apakah kamu cukup sehat untuk donor lewat pemeriksaan fisik dan kuesioner kesehatan. PMI menyebut yang diperiksa antara lain suhu tubuh, denyut nadi, tekanan darah, dan kadar hemoglobin. Tujuan seleksi donor adalah melindungi pendonor dan pasien.",
    refs: [
      { id: "permenkes", locator: "hal. 23, 56-57" },
      { id: "pmi-faq" },
      { id: "who-guidelines" },
    ],
  },
  {
    id: "persiapan",
    category: "Sebelum donor",
    question: "Apa yang perlu disiapkan sebelum donor?",
    answer:
      "PMI menganjurkan tidur nyenyak di malam sebelumnya, makan pagi atau siang sebelum donor, dan banyak minum (misalnya jus atau susu) sebelum dan sesudahnya, lalu menghindari aktivitas fisik berat setelah donor. Artikel Kemenkes (2025) menambahkan menghindari olahraga berat dan alkohol minimal satu hari sebelum donor. Tidak ada angka jam tidur atau gelas minum yang kami temukan.",
    refs: [{ id: "pmi-faq" }, { id: "kemkes-syarat" }],
  },
  {
    id: "umur",
    category: "Syarat dan jeda",
    question: "Berapa umur minimal dan maksimal untuk donor?",
    answer:
      "Umur minimal 17 tahun menurut Permenkes dan PMI. Batas atas berbeda: Permenkes menyebut donor pertama di atas 60 tahun dan donor ulang di atas 65 tahun dapat donor dengan perhatian khusus berdasarkan pertimbangan medis; PMI menyebut 17 sampai 60 tahun (sampai 65 untuk donor rutin); WHO menyebut umumnya 18 sampai 65 tahun dan bervariasi antar negara. Petugas PMI yang memutuskan.",
    refs: [{ id: "permenkes", locator: "hal. 56" }, { id: "pmi-faq" }, { id: "who-eligibility" }],
  },
  {
    id: "berat",
    category: "Syarat dan jeda",
    question: "Berapa berat badan minimal?",
    answer:
      "Permenkes: 45 kg untuk kantong 350 mL dan 55 kg untuk kantong 450 mL (dan donor apheresis). PMI menyebut minimal 45 kg untuk donor darah. WHO menyebut umumnya 50 kg, dengan sebagian negara menerima 45 kg untuk 350 mL. Petugas yang menimbang dan memutuskan.",
    refs: [{ id: "permenkes", locator: "hal. 56-57" }, { id: "pmi-faq" }, { id: "who-eligibility" }],
  },
  {
    id: "hb",
    category: "Syarat dan jeda",
    question: "Berapa kadar hemoglobin (Hb) yang diminta?",
    answer:
      "Permenkes dan FAQ PMI menyebut 12,5 sampai 17 g/dL. WHO menyebut banyak negara memakai minimal 12,0 g/dL untuk perempuan dan 13,0 g/dL untuk laki-laki. Hb diperiksa petugas pada hari donor; kamu tidak perlu menebaknya.",
    refs: [{ id: "permenkes", locator: "hal. 57" }, { id: "pmi-faq" }, { id: "who-eligibility" }],
  },
  {
    id: "jeda",
    category: "Syarat dan jeda",
    question: "Seberapa sering boleh donor?",
    answer:
      "Permenkes menyebut jeda minimal 2 bulan antar donor darah lengkap, maksimal 6 kali per tahun untuk laki-laki dan 4 kali per tahun untuk perempuan. FAQ PMI juga menyebut 2 bulan, sedangkan artikel Kemenkes (2025) menyebut 3 bulan. Karena berbeda, tanyakan jedamu ke petugas PMI.",
    refs: [{ id: "permenkes", locator: "hal. 64" }, { id: "pmi-faq" }, { id: "kemkes-syarat" }],
  },
  {
    id: "tato",
    category: "Syarat dan jeda",
    question: "Boleh donor kalau punya tato atau tindik?",
    answer:
      "Ada jeda setelah membuat tato, tindik, atau akupunktur, dan lamanya berbeda antar sumber: Permenkes menyebut 6 bulan (atau 4 bulan jika tes NAT hepatitis C pada bulan ke-4 negatif), FAQ PMI menyebut 1 tahun, WHO menyebut 6 bulan. Tanyakan ke UTD PMI terdekat.",
    refs: [{ id: "permenkes", locator: "hal. 59" }, { id: "pmi-faq" }, { id: "who-eligibility" }],
  },
  {
    id: "hamil",
    category: "Syarat dan jeda",
    question: "Bagaimana kalau hamil atau menyusui?",
    answer:
      "Permenkes menyebut jeda 6 bulan setelah melahirkan atau penghentian kehamilan, dan tidak menyebut menyusui. FAQ PMI menyebut jeda setelah melahirkan (satuan waktunya tidak tertulis) dan 3 bulan setelah berhenti menyusui. WHO tidak menganjurkan donor saat menyusui. Tanyakan ke petugas PMI.",
    refs: [{ id: "permenkes", locator: "hal. 60" }, { id: "pmi-faq" }, { id: "who-eligibility" }],
  },
  {
    id: "demam",
    category: "Syarat dan jeda",
    question: "Bagaimana kalau sedang demam atau flu?",
    answer:
      "Kamu perlu menunda. Permenkes menyebut demam di atas 38 derajat C dan penyakit mirip flu menunggu 2 minggu setelah gejala hilang; FAQ PMI menyebut 1 minggu setelah sembuh. Jeda berbeda, jadi tanyakan ke petugas.",
    refs: [{ id: "permenkes", locator: "hal. 60" }, { id: "pmi-faq" }, { id: "who-eligibility" }],
  },
  {
    id: "haid",
    category: "Syarat dan jeda",
    question: "Bagaimana dengan haid?",
    answer:
      "Kata haid atau menstruasi tidak ada di Permenkes 91/2015, FAQ PMI, maupun halaman WHO yang kami baca, jadi kami tidak bisa memastikannya. Tanyakan langsung ke petugas PMI.",
    refs: [{ id: "permenkes" }, { id: "pmi-faq" }, { id: "who-eligibility" }],
    note: "Tidak ditemukan di sumber yang dibaca",
  },
  {
    id: "obat",
    category: "Syarat dan jeda",
    question: "Bagaimana kalau sedang sakit atau minum obat?",
    answer:
      "Penyakit dan pengobatan dinilai petugas berdasarkan penyakitnya, jenis obat, dan dampaknya bagi penerima. Formulir kuesioner donor dalam Permenkes menanyakan antara lain antibiotik, obat infeksi lain, dan aspirin. Untuk donor trombosit apheresis, FAQ PMI menyebut tidak minum aspirin atau antibiotik dalam satu minggu terakhir. Sebutkan semua obat yang kamu minum saat pemeriksaan.",
    refs: [{ id: "permenkes", locator: "hal. 60, formulir 3.2 hal. 277" }, { id: "pmi-faq" }],
  },
  {
    id: "jarum",
    category: "Saat dan sesudah donor",
    question: "Takut jarum, bagaimana?",
    answer:
      "Kamu tidak sendirian. Beri tahu petugas bahwa kamu takut, tarik napas pelan, dan palingkan pandangan saat jarum dipasang. Rasanya berbeda-beda bagi tiap orang; kalau tidak nyaman, segera bilang ke petugas.",
    refs: [],
    note: "Saran umum, bukan dari sumber resmi",
  },
  {
    id: "pusing",
    category: "Saat dan sesudah donor",
    question: "Bisakah pusing atau lemas setelah donor?",
    answer:
      "Permenkes mewajibkan UTD memberi tahu pendonor tentang risiko potensial donor. Sebagian orang bisa merasa pusing atau lemas. Istirahat sejenak, ikuti arahan petugas, dan hindari aktivitas berat (saran PMI). Kalau terasa berat atau tidak reda, segera minta bantuan petugas atau fasilitas kesehatan.",
    refs: [{ id: "permenkes", locator: "hal. 54" }, { id: "pmi-faq" }],
    note: "Selebihnya saran umum, bukan nasihat medis pribadi",
  },
  {
    id: "pulih",
    category: "Saat dan sesudah donor",
    question: "Berapa lama tubuh mengganti darah yang didonorkan?",
    answer:
      "FAQ PMI menyebut volume darah diganti dalam 48 jam dan sel darah merah yang hilang diganti sepenuhnya dalam 4 sampai 8 minggu. Itu sebabnya ada jeda minimal antar donor.",
    refs: [{ id: "pmi-faq" }, { id: "permenkes", locator: "hal. 64" }],
  },
  {
    id: "manfaat",
    category: "Saat dan sesudah donor",
    question: "Apakah donor darah memberi manfaat kesehatan pribadi?",
    answer:
      "AyoDonor tidak menjanjikannya. Dua artikel Kemenkes menyebut manfaat seperti penurunan kolesterol, jantung, kanker, dan kalori tanpa rujukan studi per klaim, sedangkan lembar fakta WHO tidak menyebut manfaat bagi pendonor. Karena buktinya tidak kami temukan, kami tidak mengulang klaim itu, dan donor tidak boleh dipakai sebagai cara diet atau pengganti pemeriksaan kesehatan. Alasan utama donor adalah membantu pasien.",
    refs: [{ id: "kemkes-benefit" }, { id: "kemkes-syarat" }, { id: "who-safety" }],
    note: "Kesimpulan ini adalah penilaian AyoDonor atas sumber",
  },
  {
    id: "skrining",
    category: "Saat dan sesudah donor",
    question: "Apakah pemeriksaan darah donor sama dengan cek kesehatan?",
    answer:
      "Setiap kantong darah wajib diuji saring untuk HBsAg (hepatitis B), anti-HIV, anti-HCV (hepatitis C), dan sifilis; kantong yang reaktif tidak dikeluarkan. Itu untuk keamanan darah bagi penerima. Jika ada hasil reaktif, UTD menyampaikannya lewat konseling. AyoDonor tidak menyarankan donor sebagai pengganti pemeriksaan kesehatan pribadi.",
    refs: [{ id: "permenkes", locator: "hal. 28, 55" }, { id: "who-safety" }],
    note: "Kalimat terakhir adalah sikap AyoDonor; FAQ PMI menyebut pemeriksaan sebelum donor sebagai pemeriksaan kesehatan gratis",
  },
  {
    id: "komponen",
    category: "Saat dan sesudah donor",
    question: "Apa yang terjadi pada darah yang didonorkan?",
    answer:
      "Darah lengkap dapat diolah menjadi komponen darah (misalnya sel darah merah, plasma, trombosit) sehingga satu donasi dapat melayani lebih dari satu pasien. Keputusan transfusi selalu dibuat dokter.",
    refs: [{ id: "permenkes", locator: "hal. 54" }, { id: "who-safety" }],
    note: "Kalimat tentang dokter adalah pengetahuan umum",
  },
  {
    id: "nyawa",
    category: "Saat dan sesudah donor",
    question: "Benarkah satu kantong darah bisa menyelamatkan 3 nyawa?",
    answer:
      "Itu pernyataan pejabat Kemenkes dalam acara donor darah (Juni 2022): satu kantong dapat menyelamatkan setidaknya 3 nyawa. WHO menjelaskan bahwa pemisahan menjadi komponen memungkinkan satu donasi melayani lebih dari satu pasien, tetapi tidak menyebut angka. Jumlah sebenarnya bergantung pada kebutuhan pasien. Kami tidak menemukan pernyataan angka ini dari PMI.",
    refs: [{ id: "kemkes-pers" }, { id: "who-safety" }],
  },
  {
    id: "resmi",
    category: "Info resmi",
    question: "Di mana mencari lokasi dan stok darah yang resmi?",
    answer:
      "Buka ayodonor.pmi.or.id atau hubungi UTD PMI setempat. PMI sendiri menyatakan stok dapat berubah sewaktu-waktu dan menyarankan menghubungi UTD terkait. Data lokasi dan stok di situs ini hanya contoh yang belum diverifikasi.",
    refs: [{ id: "pmi-stok" }, { id: "pmi-faq" }],
  },
];

/** Case-insensitive search over question, answer and category. An empty query returns everything. */
export function searchFaq(items: FaqItem[], query: string): FaqItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((i) => `${i.question} ${i.answer} ${i.category}`.toLowerCase().includes(q));
}
