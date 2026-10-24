import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// Repository-wide guard against re-introducing claims that were removed because they were
// unsupported, misleading or implied official status. See docs/medical-claims.md.
const ROOT = path.join(__dirname, "..");

function listFiles(dir: string, exts: string[]): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return listFiles(full, exts);
    return exts.some((x) => e.name.endsWith(x)) ? [full] : [];
  });
}

const FILES = [
  ...listFiles(path.join(ROOT, "src"), [".ts", ".tsx", ".css"]),
  ...listFiles(path.join(ROOT, "shared"), [".ts"]),
  path.join(ROOT, "index.html"),
];

interface Rule {
  name: string;
  pattern: RegExp;
}

const BANNED: Rule[] = [
  { name: "fake certification", pattern: /sertifikat kelayakan|sertifikat donor/i },
  { name: "guaranteed eligibility", pattern: /100\s?%\s?(lolos|siap)|siap jadi hero|fit luar dalam|berstandar aman/i },
  { name: "official-status/affiliation", pattern: /PMI READY PARTNER|STANDAR REKOMENDASI PMI|PREMIUM COMPLIANT|HEALTH SENTINEL|SENTINEL-v\d/i },
  { name: "invented tiers/codes", pattern: /PLATINUM|HERO-2026|kode verifikasi|verification code/i },
  { name: "unsupported benefit claims", pattern: /glow-?up|darah kotor|kulit cerah|stamina (malah )?tambah|\bplak\b|reset pabrik/i },
  { name: "free check-up framing", pattern: /mini medical|medical check[- ]?up|check ?up gratis|terproteksi dari/i },
  { name: "unverified numeric criteria", pattern: /\b5 jam\b|56 hari|BB >= 45/i },
  { name: "live/official labels on demo data", pattern: /real-?time|kontak resmi|cek stok darah|buka 24 jam/i },
];

// Lines that explicitly DENY a claim are fine (e.g. "AyoDonor tidak mengklaim ... kolesterol").
const DENIAL = /tidak (kami )?(mengulang|menjanjikan)|tanpa rujukan|tidak mengklaim|jangan (pernah )?(mengklaim|menyebut|mengarang)|bukan (sertifikat|pengganti)/i;

describe("claims that must not reappear", () => {
  for (const rule of BANNED) {
    it(`no ${rule.name}`, () => {
      const hits: string[] = [];
      for (const file of FILES) {
        fs.readFileSync(file, "utf8")
          .split("\n")
          .forEach((line, i) => {
            if (rule.pattern.test(line) && !DENIAL.test(line)) {
              hits.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 100)}`);
            }
          });
      }
      expect(hits).toEqual([]);
    });
  }

  it("only quotes the 17-60 age range when attributed to its source (PMI)", () => {
    const hits: string[] = [];
    for (const file of FILES) {
      fs.readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/17 sampai 60|17-60/.test(line) && !/PMI|FAQ|^\s*pmi:/.test(line)) hits.push(`${path.relative(ROOT, file)}:${i + 1}`);
        });
    }
    expect(hits).toEqual([]);
  });

  it("never presents cholesterol benefits outside an explicit denial", () => {
    const hits: string[] = [];
    for (const file of FILES) {
      fs.readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/kolesterol/i.test(line) && !DENIAL.test(line) && !/atau menambah stamina|kolesterol,/.test(line)) {
            hits.push(`${path.relative(ROOT, file)}:${i + 1}`);
          }
        });
    }
    expect(hits).toEqual([]);
  });
});
