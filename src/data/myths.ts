// Common beliefs and what the sources support. Wording is unchanged from the original single-page version.
export interface Myth {
  id: string;
  myth: string;
  fact: string;
}

export const MYTHS: Myth[] = [
  {
    id: "gemuk",
    myth: "Katanya: donor bikin gemuk?",
    fact: "Donor darah bukan program diet dan tidak dianjurkan untuk tujuan itu. Alasan utama donor adalah membantu pasien.",
  },
  {
    id: "jarum",
    myth: "Katanya: jarumnya besar dan sakit?",
    fact: "Rasanya berbeda-beda. Sebagian orang hanya merasakan sensasi singkat saat jarum masuk, sebagian lain lebih tidak nyaman. Bilang ke petugas kalau kamu takut.",
  },
  {
    id: "lemas",
    myth: "Katanya: bikin lemas berhari-hari?",
    fact: "Sebagian orang bisa merasa pusing atau lemas setelah donor. Tidur cukup, makan, dan minum sebelum donor, istirahat sesudahnya, dan ikuti arahan petugas. Kalau terasa berat atau tidak reda, segera minta bantuan.",
  },
];
