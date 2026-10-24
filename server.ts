import { createApp } from "./server/app";
import { loadConfig } from "./server/config";
import { createShutdown } from "./server/shutdown";

async function startServer() {
  // NODE_ENV is passed explicitly so the build-time `--define:process.env.NODE_ENV` in
  // `npm run build` pins the bundled server to production regardless of the runtime environment.
  const config = loadConfig({ ...process.env, NODE_ENV: process.env.NODE_ENV });

  const app = await createApp({
    mode: config.mode,
    staticDir: config.staticDir,
    trustProxyHops: config.trustProxyHops,
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

  const server = app.listen(config.port, config.host, () => {
    console.log(`AyoDonor server (${config.mode}) listening on http://${config.host}:${config.port}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    const hint = error.code === "EADDRINUSE" ? ` Port ${config.port} is already in use; set PORT to a free port.` : "";
    console.error(`Server failed to start (${error.code ?? "unknown error"}).${hint}`);
    process.exit(1);
  });

  const shutdown = createShutdown(server, { timeoutMs: 10_000, onExit: (code) => process.exit(code) });
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

startServer().catch((error) => {
  console.error("Critical server starting error:", error instanceof Error ? error.message : error);
  process.exit(1);
});
