export const LIMITS = {
  nameChars: 50,
  messageChars: 500,
  historyItems: 20,
  historyItemChars: 2000,
  /** JSON body size caps, enforced by express.json before any handler runs. */
  evaluateBodyBytes: "4kb",
  chatBodyBytes: "96kb",
} as const;

const QUIZ_ANSWER_VALUES = new Set(["safe", "unsafe", ""]);
const HISTORY_ROLES = new Set(["user", "model"]);

export type QuizAnswer = "safe" | "unsafe" | "";

export interface EvaluateInput {
  name?: string;
  ageWeight: QuizAnswer;
  sleep: QuizAnswer;
  meds: QuizAnswer;
  recency: QuizAnswer;
}

export interface ChatInput {
  message: string;
  history: Array<{ role: "user" | "model"; text: string }>;
}

export type Validation<T> = { ok: true; value: T } | { ok: false; error: string };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

export function validateEvaluate(body: unknown): Validation<EvaluateInput> {
  const invalid = { ok: false as const, error: "Data jawaban kuis tidak valid." };
  if (!isRecord(body)) return invalid;

  const answers: Partial<Record<"ageWeight" | "sleep" | "meds" | "recency", QuizAnswer>> = {};
  for (const key of ["ageWeight", "sleep", "meds", "recency"] as const) {
    const v = body[key];
    if (typeof v !== "string" || !QUIZ_ANSWER_VALUES.has(v)) return invalid;
    answers[key] = v as QuizAnswer;
  }

  let name: string | undefined;
  if (body.name !== undefined && body.name !== null) {
    if (typeof body.name !== "string") return invalid;
    if (body.name.length > LIMITS.nameChars) {
      return { ok: false, error: `Nama terlalu panjang (maks ${LIMITS.nameChars} karakter).` };
    }
    name = body.name.trim() || undefined;
  }

  return { ok: true, value: { name, ...(answers as Omit<EvaluateInput, "name">) } };
}

export function validateChat(body: unknown): Validation<ChatInput> {
  if (!isRecord(body)) return { ok: false, error: "Permintaan chat tidak valid." };

  const { message, history } = body;
  if (typeof message !== "string" || message.trim() === "") {
    return { ok: false, error: "Pesan tidak boleh kosong." };
  }
  if (message.length > LIMITS.messageChars) {
    return {
      ok: false,
      error: `Pesan terlalu panjang, coba dipersingkat ya (maks ${LIMITS.messageChars} karakter).`,
    };
  }

  if (history === undefined) return { ok: true, value: { message, history: [] } };
  if (!Array.isArray(history)) return { ok: false, error: "Riwayat chat tidak valid." };
  if (history.length > LIMITS.historyItems) {
    return { ok: false, error: `Riwayat chat terlalu panjang (maks ${LIMITS.historyItems} pesan).` };
  }

  const cleaned: ChatInput["history"] = [];
  for (const item of history) {
    if (
      !isRecord(item) ||
      typeof item.role !== "string" ||
      !HISTORY_ROLES.has(item.role) ||
      typeof item.text !== "string" ||
      item.text.length === 0
    ) {
      return { ok: false, error: "Riwayat chat tidak valid." };
    }
    if (item.text.length > LIMITS.historyItemChars) {
      return {
        ok: false,
        error: `Satu pesan di riwayat terlalu panjang (maks ${LIMITS.historyItemChars} karakter).`,
      };
    }
    cleaned.push({ role: item.role as "user" | "model", text: item.text });
  }
  return { ok: true, value: { message, history: cleaned } };
}
