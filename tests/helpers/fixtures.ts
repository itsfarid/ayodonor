import fs from "fs";
import os from "os";
import path from "path";

export const SERVER_MARKER = "SERVER_SOURCE_MARKER_DO_NOT_SERVE";
export const ENV_MARKER = "FAKE_TEST_ENV_VALUE_DO_NOT_SERVE";

export interface StaticFixture {
  root: string;
  publicDir: string;
  cleanup: () => void;
}

/**
 * Builds a throwaway "dist" tree mirroring the real layout:
 *   <root>/public/index.html, public/assets/app.js   (public)
 *   <root>/server/index.cjs(.map), <root>/.env.local  (must never be served)
 * All values are fake markers, never real secrets.
 */
export function createStaticFixture(): StaticFixture {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ayodonor-fixture-"));
  const publicDir = path.join(root, "public");
  fs.mkdirSync(path.join(publicDir, "assets"), { recursive: true });
  fs.mkdirSync(path.join(root, "server"), { recursive: true });
  fs.writeFileSync(path.join(publicDir, "index.html"), "<!doctype html><title>fixture</title><div id=root></div>");
  fs.writeFileSync(path.join(publicDir, "assets", "app.js"), "console.log('app');");
  fs.writeFileSync(path.join(root, "server", "index.cjs"), `// ${SERVER_MARKER}`);
  fs.writeFileSync(path.join(root, "server", "index.cjs.map"), `{"sourcesContent":["${SERVER_MARKER}"]}`);
  fs.writeFileSync(path.join(root, ".env.local"), `GEMINI_API_KEY=${ENV_MARKER}`);
  return { root, publicDir, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
