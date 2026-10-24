#!/usr/bin/env node
// Manual check (needs network, not part of `npm test`): requests every source URL in src/data/sources.ts and
// reports the HTTP status. Run before publishing, and whenever a source is added.
//   npm run check:links
import { readFileSync } from "node:fs";

const text = readFileSync(new URL("../src/data/sources.ts", import.meta.url), "utf8");
const urls = [...text.matchAll(/url:\s*"(https:\/\/[^"]+)"/g)].map((m) => m[1]);
let failed = 0;
for (const url of urls) {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (AyoDonor link check)" }, signal: AbortSignal.timeout(30000) });
    const ok = res.status >= 200 && res.status < 400;
    if (!ok) failed++;
    console.log(`${ok ? "OK  " : "FAIL"} ${res.status} ${url}`);
  } catch (err) {
    failed++;
    console.log(`FAIL ERR ${url} (${err instanceof Error ? err.message : err})`);
  }
}
console.log(failed ? `\n${failed} of ${urls.length} link(s) failed.` : `\nAll ${urls.length} links reachable.`);
process.exit(failed ? 1 : 0);
