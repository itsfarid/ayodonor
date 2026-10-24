import type { Server } from "http";
import { logEvent } from "./logger";

export interface ShutdownOptions {
  /** Maximum time to let in-flight requests finish before connections are cut. */
  timeoutMs: number;
  onExit: (code: number) => void;
}

/**
 * Returns an idempotent shutdown function: stops accepting new connections, lets
 * in-flight requests finish for up to `timeoutMs`, then reports exit code 0 (clean)
 * or 1 (forced / close error) through `onExit`.
 */
export function createShutdown(server: Server, options: ShutdownOptions): (signal: string) => void {
  let started = false;
  return (signal: string) => {
    if (started) return;
    started = true;
    logEvent("info", "shutdown_started", { signal, timeoutMs: options.timeoutMs });

    const forceTimer = setTimeout(() => {
      logEvent("error", "shutdown_forced", { timeoutMs: options.timeoutMs });
      clearInterval(idleSweep);
      server.closeAllConnections();
      options.onExit(1);
    }, options.timeoutMs);

    // Keep-alive connections that become idle after their last response would otherwise hold
    // server.close() open until the deadline, so sweep them while shutting down.
    const idleSweep = setInterval(() => server.closeIdleConnections(), 50);

    server.close((err) => {
      clearTimeout(forceTimer);
      clearInterval(idleSweep);
      logEvent(err ? "error" : "info", "shutdown_complete", { clean: !err });
      options.onExit(err ? 1 : 0);
    });
    server.closeIdleConnections();
  };
}
