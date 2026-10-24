import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import {
  allQuizAnswersSafe,
  buildChatFallback,
  buildQuizSummary,
  type QuizAnswer,
  type QuizAnswers,
} from "../shared/content";
import { buildEvaluatePrompt, CHAT_SYSTEM_INSTRUCTION, EVALUATE_SYSTEM_INSTRUCTION } from "../server/prompts";

// Phrases that would present a quiz result as medical clearance, certification or a guarantee.
const CLEARANCE_CLAIMS = [/\blolos\b/i, /100\s?%/, /\bpasti\b/i, /fit luar dalam/i, /sertifikat/i, /\btidak layak\b/i, /memenuhi syarat/i, /aman (untuk )?donor/i];

const VALUES: QuizAnswer[] = ["safe", "unsafe"];
const ALL_COMBOS: QuizAnswers[] = VALUES.flatMap((ageWeight) =>
  VALUES.flatMap((sleep) => VALUES.flatMap((meds) => VALUES.map((recency) => ({ ageWeight, sleep, meds, recency }))))
);

describe("quiz summary wording", () => {
  it("covers all 16 answer combinations", () => {
    expect(ALL_COMBOS).toHaveLength(16);
  });

  it.each(ALL_COMBOS.map((c) => [JSON.stringify(c), c] as const))("never claims clearance (%s)", (_label, combo) => {
    const text = buildQuizSummary("Tester", combo);
    for (const claim of CLEARANCE_CLAIMS) expect(text).not.toMatch(claim);
    expect(text).toMatch(/petugas PMI|PMI/);
    expect(text).toMatch(/bukan (keputusan|berarti)/i);
  });

  it("uses the same non-committal framing for the 'all safe' case", () => {
    const all = ALL_COMBOS.find(allQuizAnswersSafe)!;
    const text = buildQuizSummary(undefined, all);
    expect(text).toContain("bukan keputusan kelayakan");
    expect(text).toContain("Sobat");
  });

  it("does not assert unverified criteria (haid, jam tidur, jeda tato dalam angka)", () => {
    for (const combo of ALL_COMBOS) {
      const text = buildQuizSummary("T", combo);
      expect(text).not.toMatch(/haid|menstruasi/i);
      expect(text).not.toMatch(/\b\d+\s*jam\b/i);
      expect(text).not.toMatch(/\b\d+\s*(bulan|hari|minggu)\b/i);
    }
  });
});

describe("chat fallback wording", () => {
  const probes = ["donor bikin gemuk?", "takut jarum", "habis donor pusing", "boleh donor kalau bertato?", "lagi haid boleh donor?", "syarat donor apa?", "resep es cendol"];

  it.each(probes)("is safe for %j", (q) => {
    const text = buildChatFallback(q);
    for (const claim of CLEARANCE_CLAIMS) expect(text).not.toMatch(claim);
    expect(text).not.toMatch(/kolesterol|plak|kulit cerah|stamina|bakar|kalori|3 nyawa|\b\d+\s*(bulan|jam)\b/i);
  });

  it("does not give a tattoo waiting period it cannot source", () => {
    expect(buildChatFallback("tato boleh donor?")).toMatch(/berbeda antar sumber/);
  });

  it("does not present donation as a diet", () => {
    expect(buildChatFallback("bikin gemuk gak?")).toMatch(/bukan program diet/);
  });
});

describe("Gemini prompts", () => {
  const prompt = buildEvaluatePrompt("Tester", { ageWeight: "safe", sleep: "safe", meds: "safe", recency: "safe" }, true);

  it("carry the safety rules and the disclaimer", () => {
    for (const text of [EVALUATE_SYSTEM_INSTRUCTION, CHAT_SYSTEM_INSTRUCTION]) {
      expect(text).toMatch(/bukan dokter/i);
      expect(text).toMatch(/kolesterol/i); // listed as a claim to refuse
      expect(text).toMatch(/ayodonor\.pmi\.or\.id/);
    }
    expect(EVALUATE_SYSTEM_INSTRUCTION).toMatch(/bukan diagnosis atau keputusan medis/i);
  });

  it("do not embed unverified numeric thresholds", () => {
    expect(prompt).not.toMatch(/17-60|45 ?kg|5 jam|haid|minimal 2 bulan|6 bulan/i);
    expect(prompt).toMatch(/BUKAN keputusan kelayakan/);
  });
});

describe("no clearance claims in server or shared sources", () => {
  const roots = ["server", "shared"];
  const files = roots.flatMap((dir) =>
    fs.readdirSync(path.join(__dirname, "..", dir)).filter((f) => f.endsWith(".ts")).map((f) => path.join(__dirname, "..", dir, f))
  );

  it.each(files.map((f) => [path.relative(path.join(__dirname, ".."), f), f] as const))("%s", (_rel, file) => {
    const src = fs.readFileSync(file, "utf8");
    for (const banned of [/100% ?lolos/i, /Fit luar dalam/i, /PMI READY PARTNER/i, /darah kotor/i]) {
      expect(src).not.toMatch(banned);
    }
  });
});
