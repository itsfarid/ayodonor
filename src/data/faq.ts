// Static FAQ. Every answer restates a claim already recorded in docs/medical-claims.md; nothing new is asserted.
// Where official sources disagree or are silent, the answer says so and sends the reader to PMI.

export type FaqCategory = "Sebelum donor" | "Syarat dan jeda" | "Saat dan sesudah donor" | "Info resmi";

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  /** Where the statement comes from; "Saran umum" means it is not an official source. */
  source: string;
}

export const FAQ_CATEGORIES: FaqCategory[] = ["Sebelum donor", "Syarat dan jeda", "Saat dan sesudah donor", "Info resmi"];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "diperiksa",
    category: "Sebelum donor",
    question: "Apa saja yang diperiksa sebelum donor?",
    answer:
      "Petugas menilai apakah kamu cukup sehat untuk donor dan mencatat faktor risiko, misalnya hemoglobin, tekanan darah, nadi, suhu, berat badan, dan riwayat kesehatan. Tujuannya melindungi pendonor dan penerima darah.",
    source: "Permenkes 91/2015; FAQ PMI",
  },
  {
    id: "persiapan",
    category: "Sebelum donor",
    question: "Apa yang perlu disiapkan sebelum donor?",
    answer:
      "PMI menganjurkan tidur cukup, makan, dan minum sebelum donor, serta menghindari aktivitas berat sesudahnya. Kami tidak menetapkan jumlah jam tidur atau gelas minum karena tidak ada angka resmi yang kami temukan.",
    source: "FAQ PMI",
  },
  {
    id: "umur",
    category: "Syarat dan jeda",
    question: "Berapa umur minimal untuk donor?",
    answer:
      "Umur minimal 17 tahun. Batas atas berbeda antar sumber (ada yang menyebut 60 tahun, ada yang menyebut perhatian khusus di atas 60 atau 65 tahun), jadi petugas PMI yang memutuskan.",
    source: "Permenkes 91/2015; FAQ PMI",
  },
  {
    id: "berat",
    category: "Syarat dan jeda",
    question: "Berapa berat badan minimal?",
    answer:
      "Batasnya bergantung pada volume donor: 45 kg untuk kantong 350 mL dan 55 kg untuk kantong 450 mL menurut Permenkes. Petugas yang menimbang dan memutuskan.",
    source: "Permenkes 91/2015",
  },
  {
    id: "jeda",
    category: "Syarat dan jeda",
    question: "Seberapa sering boleh donor?",
    answer:
      "Permenkes 91/2015 menyebut jeda minimal 2 bulan antar donor darah lengkap. Artikel Kemenkes (2025) menyebut 3 bulan. Karena berbeda, tanyakan jedamu ke petugas PMI.",
    source: "Permenkes 91/2015; Kemenkes Keslan 2025",
  },
  {
    id: "tato",
    category: "Syarat dan jeda",
    question: "Boleh donor kalau punya tato atau tindik?",
    answer:
      "Ada jeda setelah membuat tato, tindik, atau akupunktur. Permenkes menyebut 6 bulan (atau 4 bulan jika tes NAT hepatitis C negatif), sedangkan FAQ PMI menyebut 1 tahun. Tanyakan ke UTD PMI terdekat.",
    source: "Permenkes 91/2015; FAQ PMI",
  },
  {
    id: "haid",
    category: "Syarat dan jeda",
    question: "Bagaimana dengan haid?",
    answer:
      "Kami tidak menemukan ketentuan resmi yang menyebut haid secara khusus, jadi tidak bisa memastikannya. Tanyakan langsung ke petugas PMI.",
    source: "Tidak ditemukan di sumber resmi",
  },
  {
    id: "obat",
    category: "Syarat dan jeda",
    question: "Bagaimana kalau sedang sakit atau minum obat?",
    answer:
      "Penyakit dan pengobatan dinilai satu per satu oleh petugas berdasarkan jenis penyakit dan obatnya. Sebutkan semua obat yang kamu minum saat pemeriksaan.",
    source: "Permenkes 91/2015",
  },
  {
    id: "jarum",
    category: "Saat dan sesudah donor",
    question: "Takut jarum, bagaimana?",
    answer:
      "Kamu tidak sendirian. Beri tahu petugas bahwa kamu takut, tarik napas pelan, dan palingkan pandangan saat jarum dipasang. Rasanya berbeda-beda bagi tiap orang; kalau tidak nyaman, segera bilang ke petugas.",
    source: "Saran umum, bukan sumber resmi",
  },
  {
    id: "pusing",
    category: "Saat dan sesudah donor",
    question: "Bisakah pusing atau lemas setelah donor?",
    answer:
      "Sebagian orang bisa merasa pusing atau lemas. Istirahat sejenak, ikuti arahan petugas, dan hindari aktivitas berat. Kalau terasa berat atau tidak reda, segera minta bantuan petugas atau fasilitas kesehatan.",
    source: "Saran umum; FAQ PMI (hindari aktivitas berat)",
  },
  {
    id: "diet",
    category: "Saat dan sesudah donor",
    question: "Apakah donor darah bisa dipakai untuk diet?",
    answer: "Tidak. Donor darah bukan program diet dan tidak dianjurkan untuk tujuan itu. Alasan utama donor adalah membantu pasien.",
    source: "Saran umum, bukan sumber resmi",
  },
  {
    id: "skrining",
    category: "Saat dan sesudah donor",
    question: "Apakah pemeriksaan darah donor sama dengan cek kesehatan?",
    answer:
      "Setiap kantong darah diperiksa untuk HIV, hepatitis B, hepatitis C, dan sifilis demi keamanan penerima. Itu bukan pengganti pemeriksaan kesehatan pribadi. Jika ada hasil reaktif, petugas menyampaikannya lewat konseling.",
    source: "Permenkes 91/2015; kalimat \"bukan pengganti\" adalah rumusan AyoDonor",
  },
  {
    id: "komponen",
    category: "Saat dan sesudah donor",
    question: "Apa yang terjadi pada darah yang didonorkan?",
    answer:
      "Darah donor biasanya dipisah menjadi komponen (sel darah merah, plasma, trombosit) untuk pasien dengan kebutuhan berbeda. Keputusan transfusi selalu dibuat dokter.",
    source: "Permenkes 91/2015; contoh penggunaan adalah pengetahuan umum",
  },
  {
    id: "resmi",
    category: "Info resmi",
    question: "Di mana mencari lokasi dan stok darah yang resmi?",
    answer:
      "Buka ayodonor.pmi.or.id atau hubungi UTD PMI setempat. Data lokasi dan stok di situs ini hanya contoh yang belum diverifikasi.",
    source: "Portal PMI AyoDonor",
  },
];

/** Case-insensitive search over question and answer text. An empty query returns everything. */
export function searchFaq(items: FaqItem[], query: string): FaqItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((i) => `${i.question} ${i.answer} ${i.category}`.toLowerCase().includes(q));
}
