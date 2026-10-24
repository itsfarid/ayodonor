#!/usr/bin/env node
// Repeatable development-mode smoke test: starts `tsx server.ts` with NODE_ENV unset and checks
// that the Vite dev middleware (and NOT the production static server) is serving.
// Counterpart of scripts/smoke-prod.mjs. The app needs no API keys or provider configuration.
//
// Usage: npm run smoke:dev
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const root = new URL("..", import.meta.url).pathname;
const failures = [];
const check = (name, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
  if (!ok) failures.push(name);
};

const port = await new Promise((resolve) => {
  const s = createServer();
  s.listen(0, "127.0.0.1", () => {
    const { port } = s.address();
    s.close(() => resolve(port));
  });
});

const env = { ...process.env, PORT: String(port) };
delete env.NODE_ENV;
delete env.HOST;

let output = "";
// `node --import tsx` runs the same code as `tsx server.ts` but without tsx's wrapper process,
// so SIGTERM reaches the server itself and the shutdown handler is what is actually tested.
const child = spawn(process.execPath, ["--import", "tsx", "server.ts"], { cwd: root, env });
child.stdout.on("data", (d) => (output += d));
child.stderr.on("data", (d) => (output += d));
const exited = new Promise((resolve) => child.on("exit", (code, signal) => resolve({ code, signal })));

const base = `http://127.0.0.1:${port}`;
async function waitReady() {
  for (let i = 0; i < 100; i++) {
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
    check("development mode with Vite middleware", /Vite development middleware integrated/.test(output) && /\(development\)/.test(output));
    check("binds loopback by default", output.includes(`http://127.0.0.1:${port}`));
    const home = await fetch(`${base}/`);
    const html = await home.text();
    check("GET / is served by Vite (HMR client present)", home.status === 200 && html.includes("/@vite/client"));
    const gone = await fetch(`${base}/api/gemini/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    check("removed AI endpoint /api/gemini/chat answers 404", gone.status === 404);
    const health = await fetch(`${base}/api/health`);
    check("GET /api/health", health.status === 200 && (await health.json()).status === "ok");
  }
  child.kill("SIGTERM");
  const result = await Promise.race([exited, new Promise((r) => setTimeout(() => r("timeout"), 8000))]);
  check("graceful shutdown on SIGTERM (exit 0)", result !== "timeout" && result.code === 0, JSON.stringify(result));
} finally {
  if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
}

console.log(failures.length ? `\n${failures.length} check(s) failed.` : "\nAll dev smoke checks passed.");
process.exit(failures.length ? 1 : 0);
