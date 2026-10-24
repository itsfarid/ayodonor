// User-facing quiz text (computed in the browser).
//
// Medical wording rules (see docs/medical-claims.md for sources and open questions):
// - never state or imply that the quiz clears someone to donate; the PMI officer decides;
// - state only criteria backed by an official source; where sources differ, say so
//   and point to PMI instead of picking a number;
// - make no personal health-benefit claims.

export const MEDICAL_DISCLAIMER =
  "Ini bukan diagnosis atau keputusan medis. Kelayakan donor ditentukan oleh petugas PMI lewat pemeriksaan langsung.";

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
    return `### Terima kasih sudah mencoba, **${who}**!

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

  return `### Catatan untuk **${who}**

Dari jawabanmu, ada hal yang sebaiknya kamu tanyakan dulu ke petugas PMI sebelum datang:

${notes.join("\n")}

**Ini bukan berarti kamu tidak bisa donor** — hanya saran untuk bertanya dulu. ${OFFICIAL_INFO_HINT}`;
}
