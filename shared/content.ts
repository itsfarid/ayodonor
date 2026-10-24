// User-facing text shared by the server fallbacks and the client offline mode.
//
// Medical wording rules (see docs/medical-claims.md for sources and open questions):
// - never state or imply that the quiz clears someone to donate; the PMI officer decides;
// - state only criteria backed by an official source; where sources differ, say so
//   and point to PMI instead of picking a number;
// - make no personal health-benefit claims.

export const MEDICAL_DISCLAIMER =
  "Ini bukan diagnosis atau keputusan medis. Kelayakan donor ditentukan oleh petugas PMI lewat pemeriksaan langsung.";

export const OFFLINE_NOTICE =
  "Penjelasan AI sedang tidak tersedia, jadi ini ringkasan otomatis yang ditulis tim AyoDonor (bukan hasil AI).";

export const OFFICIAL_INFO_HINT = "Info resmi: ayodonor.pmi.or.id atau hubungi UTD PMI terdekat.";

export type QuizAnswer = "safe" | "unsafe" | "";

export interface QuizAnswers {
  ageWeight: QuizAnswer;
  sleep: QuizAnswer;
  meds: QuizAnswer;
  recency: QuizAnswer;
}

export function allQuizAnswersSafe(a: QuizAnswers): boolean {
  return a.ageWeight === "safe" && a.sleep === "safe" && a.meds === "safe" && a.recency === "safe";
}

/** Deterministic quiz summary. It never says the person is eligible or ineligible. */
export function buildQuizSummary(name: string | undefined, answers: QuizAnswers): string {
  const who = name || "Sobat";

  if (allQuizAnswersSafe(answers)) {
    return `### 🩸 Terima kasih sudah mencoba, **${who}**!

Dari 4 pertanyaan singkat ini, belum ada jawabanmu yang jelas menjadi penghalang. **Tapi ini bukan keputusan kelayakan** — empat pertanyaan tidak mencakup semua kriteria (misalnya riwayat penyakit, kehamilan atau menyusui, dan faktor risiko lain).

*   Keputusan akhir ada di petugas PMI setelah pemeriksaan langsung (mis. hemoglobin, tekanan darah, riwayat kesehatan).
*   Datanglah dalam kondisi sehat dan jawab pertanyaan petugas dengan jujur.
*   ${OFFICIAL_INFO_HINT}`;
  }

  const notes: string[] = [];
  if (answers.ageWeight !== "safe") {
    notes.push(
      "*   **Usia / berat badan:** Syarat umumnya minimal 17 tahun. Batas berat badan bergantung pada jenis dan volume donor (mis. 45 kg atau 55 kg menurut Permenkes 91/2015). Petugas yang menimbang dan memutuskan."
    );
  }
  if (answers.sleep !== "safe") {
    notes.push(
      "*   **Istirahat / kondisi hari ini:** PMI menganjurkan tidur cukup sebelum donor. Kalau hari ini kurang fit, pertimbangkan menunda dan tanyakan ke petugas."
    );
  }
  if (answers.meds !== "safe") {
    notes.push(
      "*   **Sakit / obat:** Kondisi sakit atau pengobatan dinilai satu per satu oleh petugas (jenis penyakit dan obatnya). Sebutkan semua obat yang kamu minum saat pemeriksaan."
    );
  }
  if (answers.recency !== "safe") {
    notes.push(
      "*   **Jeda donor / tato / tindik:** Ada jeda minimal setelah donor terakhir dan setelah tato, tindik, atau akupunktur. Lamanya berbeda antar sumber, jadi tanyakan ke PMI sebelum datang."
    );
  }

  return `### 🩸 Catatan untuk **${who}**

Dari jawabanmu, ada hal yang sebaiknya kamu tanyakan dulu ke petugas PMI sebelum datang:

${notes.join("\n")}

**Ini bukan berarti kamu tidak bisa donor** — hanya saran untuk bertanya dulu. ${OFFICIAL_INFO_HINT}`;
}

const CHAT_KEYWORDS = [
  "donor", "darah", "jarum", "sakit", "lemas", "lemes", "pusing", "haid", "obat", "tato", "tindik", "tensi",
  "hb", "gemuk", "berat", "kelayakan", "tidur", "pmi", "kesehatan", "tubuh", "nyawa", "pahlawan", "hero",
  "manfaat", "syarat", "plasma", "trombosit", "kantong",
];

/** Canned chat replies, used only when the AI is unavailable. They are labelled as automatic in the UI. */
export function buildChatFallback(message: string): string {
  const msg = (message || "").toLowerCase();
  const related = CHAT_KEYWORDS.some((kw) => msg.includes(kw));

  if (!related) {
    return `### 🥤 Waduh, di luar topik nih

Asisten ini khusus membahas donor darah dan persiapannya. Coba tanya, misalnya:

*   'Takut jarum suntik, gimana dong?'
*   'Apa yang diperiksa sebelum donor?'
*   'Habis donor sebaiknya ngapain?'`;
  }

  if (msg.includes("gemuk") || msg.includes("diet")) {
    return `### 🛑 Soal 'donor bikin gemuk / bikin kurus'

Donor darah **bukan program diet** dan tidak dianjurkan untuk tujuan itu. Alasan donor sebaiknya karena ingin membantu pasien yang membutuhkan darah. ${OFFICIAL_INFO_HINT}`;
  }

  if (msg.includes("jarum") || msg.includes("takut")) {
    return `### 💉 Takut jarum? Kamu tidak sendirian

Beberapa hal yang sering membantu:

1.  Bilang ke petugas kalau kamu takut — mereka terbiasa dengan itu.
2.  Tarik napas pelan dan palingkan pandangan saat jarum dipasang.
3.  Rasanya berbeda-beda bagi tiap orang. Kalau merasa pusing atau tidak nyaman, segera beri tahu petugas.`;
  }

  if (msg.includes("lemas") || msg.includes("lemes") || msg.includes("pusing")) {
    return `### 🌀 Lemas atau pusing setelah donor?

Sebagian orang memang bisa merasa pusing atau lemas. Beberapa hal yang umum dianjurkan:

*   Tidur cukup dan makan sebelum donor.
*   Istirahat sejenak setelah donor dan ikuti arahan petugas.
*   Kalau pusingnya berat atau tidak reda, segera hubungi petugas atau fasilitas kesehatan.

Ini informasi umum, bukan nasihat medis pribadi.`;
  }

  if (msg.includes("tato") || msg.includes("tindik")) {
    return `### 🎨 Tato atau tindik dan donor darah

Setelah membuat tato, tindik, atau akupunktur ada **jeda sebelum boleh donor**. Lamanya berbeda antar sumber resmi, jadi kami tidak menyebut angka di sini. Tanyakan ke UTD PMI terdekat. ${OFFICIAL_INFO_HINT}`;
  }

  if (msg.includes("haid") || msg.includes("menstruasi")) {
    return `### Soal haid dan donor darah

Kami belum menemukan ketentuan resmi yang menyebut haid secara khusus, jadi kami tidak bisa memastikannya. Tanyakan langsung ke petugas PMI. ${OFFICIAL_INFO_HINT}`;
  }

  return `### 🩸 Jawaban otomatis singkat

AI sedang tidak tersedia, jadi ini jawaban umum: sebelum donor, petugas PMI akan memeriksa kondisimu (mis. hemoglobin, tekanan darah, riwayat kesehatan) dan merekalah yang memutuskan. ${OFFICIAL_INFO_HINT}`;
}
