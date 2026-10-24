import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createApp, type GeminiClientLike } from "./server/app";

dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ quiet: true });

const PORT = 3000;

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
  const mode = process.env.NODE_ENV !== "production" ? "development" : "production";

  const app = await createApp({
    mode,
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
  if (mode === "production") console.log("Serving production static assets from dist.");

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AyoDonor application server runs on: http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical server starting error:", error);
});
