import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createApp, type GeminiClientLike } from "./server/app";
import { loadConfig } from "./server/config";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

// Lazily initialize Gemini to prevent start crashes if GEMINI_API_KEY is not defined yet
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GeminiClientLike | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Using local fallbacks for AI features.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  // NODE_ENV is passed explicitly so the build-time `--define:process.env.NODE_ENV` in
  // `npm run build` pins the bundled server to production regardless of the runtime environment.
  const config = loadConfig({ ...process.env, NODE_ENV: process.env.NODE_ENV });

  const app = await createApp({
    mode: config.mode,
    staticDir: config.staticDir,
    getGeminiClient,
    createDevMiddleware: async () => {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      console.log("Vite development middleware integrated.");
      return vite.middlewares;
    },
  });
  if (config.mode === "production") console.log(`Serving production static assets from ${config.staticDir}.`);

  app.listen(config.port, config.host, () => {
    console.log(`AyoDonor server (${config.mode}) listening on http://${config.host}:${config.port}`);
  });
}

startServer().catch((error) => {
  console.error("Critical server starting error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
