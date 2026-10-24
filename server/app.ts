import { randomUUID } from "crypto";
import express, { type Express, type RequestHandler } from "express";
import fs from "fs";
import path from "path";
import rateLimit from "express-rate-limit";
import { errorBody, errorHandler } from "./errors";
import { logEvent } from "./logger";

/** JSON body cap for /api. No endpoint reads a body today; this keeps junk requests cheap and rejected with 413/400. */
export const API_BODY_LIMIT = "1kb";
export const DEFAULT_API_RATE_LIMIT = { windowMs: 60 * 1000, limit: 60 } as const;

export interface AppOptions {
  mode: "development" | "production";
  /** Development only: creates the middleware that serves the Vite dev build. */
  createDevMiddleware?: () => Promise<RequestHandler>;
  staticDir?: string;
  rateLimit?: { windowMs: number; limit: number };
  /**
   * Reverse-proxy hops to trust when deriving the client IP (rate limiting).
   * 0 (default) ignores X-Forwarded-For entirely. Set it to the real number of proxies in front of the app.
   */
  trustProxyHops?: number;
  /** Emit one structured log line per request (no bodies, no query strings). Default true. */
  logRequests?: boolean;
}

export async function createApp(options: AppOptions): Promise<Express> {
  const app = express();
  app.disable("x-powered-by");
  if (options.trustProxyHops && options.trustProxyHops > 0) {
    app.set("trust proxy", options.trustProxyHops);
  }

  // Request ID + one structured log line per request (never bodies or query strings).
  app.use((req, res, next) => {
    const requestId = randomUUID();
    res.locals.requestId = requestId;
    res.setHeader("X-Request-Id", requestId);
    if (options.logRequests !== false) {
      const started = process.hrtime.bigint();
      res.on("finish", () => {
        logEvent("info", "request", {
          requestId,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Number((process.hrtime.bigint() - started) / 1_000_000n),
        });
      });
    }
    next();
  });

  // --- API: general controls apply to everything under /api, before any parsing ---
  const apiLimiter = rateLimit({
    windowMs: options.rateLimit?.windowMs ?? DEFAULT_API_RATE_LIMIT.windowMs,
    limit: options.rateLimit?.limit ?? DEFAULT_API_RATE_LIMIT.limit,
    message: errorBody("rate_limited", "Terlalu banyak permintaan, coba lagi sebentar ya."),
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api", apiLimiter, express.json({ limit: API_BODY_LIMIT }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "AyoDonor server running gracefully!" });
  });

  // Anything else under /api does not exist (the former /api/gemini/* endpoints were removed).
  app.use("/api", (req, res) => {
    res.status(404).json(errorBody("not_found", "Endpoint tidak ditemukan."));
  });

  // --- Static Asset Serving & Dev Server Setup ---

  if (options.mode === "development") {
    if (!options.createDevMiddleware) {
      throw new Error("createDevMiddleware is required in development mode.");
    }
    app.use(await options.createDevMiddleware());
  } else {
    const staticDir = options.staticDir ?? path.join(process.cwd(), "dist", "public");
    const indexFile = path.join(staticDir, "index.html");
    if (!fs.existsSync(indexFile)) {
      throw new Error(
        `Production build not found: ${indexFile} is missing. Run "npm run build" before starting in production mode.`
      );
    }

    // Defense in depth: never serve dotfiles (.env*) or source maps, even if one
    // ends up inside the public directory by mistake.
    app.use((req, res, next) => {
      if (/(^|\/)\./.test(req.path) || /\.map$/i.test(req.path)) {
        return res.status(404).type("text/plain").send("Not found");
      }
      next();
    });
    app.use(express.static(staticDir, { index: false, dotfiles: "ignore" }));

    // SPA routes only: extension-less GET paths get index.html; missing files get a real 404.
    app.get("*", (req, res, next) => {
      if (path.extname(req.path)) return next();
      res.sendFile(indexFile);
    });
    app.use((req, res) => {
      res.status(404).type("text/plain").send("Not found");
    });
  }

  app.use(errorHandler);

  return app;
}
