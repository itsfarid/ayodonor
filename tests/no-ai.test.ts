import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { createApp } from "../server/app";
import { loadConfig } from "../server/config";
import { createStaticFixture } from "./helpers/fixtures";

const ROOT = path.join(__dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

function listFiles(dir: string, exts: string[]): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return listFiles(full, exts);
    return exts.some((x) => e.name.endsWith(x)) ? [full] : [];
  });
}

describe("no AI provider dependency", () => {
  const pkg = JSON.parse(read("package.json"));

  it("package.json and the lockfile have no AI SDK or key-loading dependency", () => {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    for (const name of Object.keys(deps)) expect(name).not.toMatch(/genai|generative-ai|gemini|openai|anthropic|dotenv/i);
    const lock = JSON.parse(read("package-lock.json"));
    const locked = Object.keys(lock.packages);
    expect(locked.filter((n) => /@google\/genai|\/dotenv$/.test(n))).toEqual([]);
  });

  it("no source, script or config file references Gemini or a provider SDK", () => {
    const files = [
      ...listFiles(path.join(ROOT, "src"), [".ts", ".tsx", ".css"]),
      ...listFiles(path.join(ROOT, "server"), [".ts"]),
      ...listFiles(path.join(ROOT, "shared"), [".ts"]),
      ...listFiles(path.join(ROOT, "scripts"), [".mjs"]),
      path.join(ROOT, "server.ts"),
      path.join(ROOT, "index.html"),
      path.join(ROOT, "vite.config.ts"),
      path.join(ROOT, "metadata.json"),
    ];
    const hits = files.filter((f) => /gemini|genai|generativelanguage|GEMINI_API_KEY/i.test(fs.readFileSync(f, "utf8")));
    // scripts/smoke-*.mjs mention the removed /api/gemini/ path on purpose, to prove it stays 404.
    expect(hits.map((f) => path.relative(ROOT, f)).filter((f) => !f.startsWith("scripts/"))).toEqual([]);
  });

  it(".env.example assigns no secret or Gemini variable", () => {
    const assigned = read(".env.example")
      .split("\n")
      .filter((l) => /^[A-Z_]+=/.test(l.trim()));
    expect(assigned).toEqual([]);
  });

  it("the server module graph does not import an AI client", () => {
    for (const f of [...listFiles(path.join(ROOT, "server"), [".ts"]), path.join(ROOT, "server.ts")]) {
      expect(fs.readFileSync(f, "utf8"), f).not.toMatch(/from ["']@google\//);
    }
  });
});

describe("startup without any API key or provider environment", () => {
  it("loadConfig and createApp succeed with an empty environment", async () => {
    const config = loadConfig({}, ROOT);
    expect(config).toMatchObject({ mode: "development", port: 3000 });

    const fixture = createStaticFixture();
    const saved = { ...process.env };
    try {
      for (const k of Object.keys(process.env)) if (/GEMINI|GOOGLE|API_KEY/i.test(k)) delete process.env[k];
      const app = await createApp({ mode: "production", staticDir: fixture.publicDir, logRequests: false });
      expect(typeof app.listen).toBe("function");
    } finally {
      Object.assign(process.env, saved);
      fixture.cleanup();
    }
  });

  it("an obsolete GEMINI_API_KEY in the environment has no effect on configuration", () => {
    const a = loadConfig({}, ROOT);
    const b = loadConfig({ GEMINI_API_KEY: "ignored-test-value", GEMINI_TIMEOUT_MS: "5" }, ROOT);
    expect(b).toEqual(a);
  });
});
