#!/usr/bin/env node
// Repeatable production smoke test: builds the app, starts the BUILT server with NODE_ENV unset
// (exactly what `npm start` does), and checks routes and sensitive-path exposure.
// Never calls Gemini: GEMINI_API_KEY is forced empty and no AI endpoint is requested.
//
// Usage: npm run smoke:prod [-- --skip-build]
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const skipBuild = process.argv.includes("--skip-build");
const failures = [];
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures.push(name);
};

if (!skipBuild) {
  const build = spawnSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
  if (build.status !== 0) {
    console.error("Build failed; aborting smoke test.");
    process.exit(1);
  }
}

if (!existsSync(join(root, "dist", "server", "index.cjs"))) {
  console.error("dist/server/index.cjs not found; run `npm run build` first.");
  process.exit(1);
}

const port = await new Promise((resolve) => {
  const s = createServer();
  s.listen(0, "127.0.0.1", () => {
    const { port } = s.address();
    s.close(() => resolve(port));
  });
});

const env = { ...process.env, PORT: String(port), HOST: "127.0.0.1", GEMINI_API_KEY: "" };
delete env.NODE_ENV; // `npm start` does not set it; the built bundle must still run in production mode.

let output = "";
const child = spawn("node", ["--enable-source-maps", "dist/server/index.cjs"], { cwd: root, env });
child.stdout.on("data", (d) => (output += d));
child.stderr.on("data", (d) => (output += d));
const exited = new Promise((resolve) => child.on("exit", (code, signal) => resolve({ code, signal })));

const base = `http://127.0.0.1:${port}`;
async function waitReady() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${base}/api/health`)).ok) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

try {
  const ready = await waitReady();
  check("server becomes ready", ready);
  if (ready) {
    check("production mode (no Vite dev server)", !/Vite development/i.test(output) && /production/.test(output));

    const health = await fetch(`${base}/api/health`);
    check("GET /api/health", health.status === 200 && (await health.json()).status === "ok");

    const home = await fetch(`${base}/`);
    const html = await home.text();
    check("GET / serves built index.html", home.status === 200 && /<div id="root">/.test(html));

    const assetDir = join(root, "dist", "public", "assets");
    const jsAsset = existsSync(assetDir) ? readdirSync(assetDir).find((f) => f.endsWith(".js")) : undefined;
    if (jsAsset) {
      const res = await fetch(`${base}/assets/${jsAsset}`);
      check("GET built JS asset", res.status === 200 && /javascript/.test(res.headers.get("content-type") ?? ""));
    } else {
      check("GET built JS asset", false, "no JS asset found in dist/public/assets");
    }

    for (const p of [
      "/server/index.cjs",
      "/server/index.cjs.map",
      "/index.cjs.map",
      "/server.cjs",
      "/server.cjs.map",
      "/.env",
      "/.env.local",
      "/%2e%2e/.env.local",
      "/%2e%2e/server/index.cjs",
    ]) {
      const res = await fetch(`${base}${p}`);
      const body = await res.text();
      check(`not served: ${p}`, res.status === 404 && !/sourcesContent|GEMINI_API_KEY/.test(body), `status ${res.status}`);
    }
  }

  // Graceful shutdown: SIGTERM must end the process cleanly (exit code 0) within 5 seconds.
  child.kill("SIGTERM");
  const result = await Promise.race([exited, new Promise((r) => setTimeout(() => r("timeout"), 5000))]);
  check("graceful shutdown on SIGTERM (exit 0)", result !== "timeout" && result.code === 0, JSON.stringify(result));
} finally {
  if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
}

console.log(failures.length ? `\n${failures.length} check(s) failed.` : "\nAll smoke checks passed.");
process.exit(failures.length ? 1 : 0);
