import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { allQuizAnswersSafe, buildQuizSummary, type QuizAnswer, type QuizAnswers } from "../shared/content";

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
