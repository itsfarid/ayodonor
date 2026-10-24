import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const ROOT = path.join(__dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

function listFiles(dir: string, exts: string[]): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return listFiles(full, exts);
    return exts.some((x) => e.name.endsWith(x)) ? [full] : [];
  });
}

describe("no AI provider and no server runtime", () => {
  const pkg = JSON.parse(read("package.json"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  it("build is a plain Vite build and nothing starts a Node server", () => {
    expect(pkg.scripts.build).toBe("vite build");
    expect(pkg.scripts.start).toBeUndefined();
    expect(pkg.scripts.dev).toBe("vite");
    expect(fs.existsSync(path.join(ROOT, "server"))).toBe(false);
    expect(fs.existsSync(path.join(ROOT, "server.ts"))).toBe(false);
  });

  it("no source or config file references Gemini, a provider SDK, or the removed API", () => {
    const files = [
      ...listFiles(path.join(ROOT, "src"), [".ts", ".tsx", ".css"]),
      ...listFiles(path.join(ROOT, "shared"), [".ts"]),
      ...listFiles(path.join(ROOT, "public"), [".svg", ".txt", ".json", ""]).filter((f) => !f.endsWith("_headers")),
      path.join(ROOT, "index.html"),
      path.join(ROOT, "vite.config.ts"),
      path.join(ROOT, "metadata.json"),
    ];
    const hits = files.filter((f) => /gemini|genai|generativelanguage|GEMINI_API_KEY|\/api\//i.test(fs.readFileSync(f, "utf8")));
    expect(hits.map((f) => path.relative(ROOT, f))).toEqual([]);
  });

  it(".env.example assigns no secret or provider variable", () => {
    const assigned = read(".env.example")
      .split("\n")
      .filter((l) => /^[A-Z_]+=/.test(l.trim()));
    expect(assigned).toEqual([]);
  });
});
