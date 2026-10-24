import { afterEach, describe, expect, it, vi } from "vitest";
import { LOCATE_OPTIONS, locate } from "../src/lib/geolocation";

afterEach(() => vi.restoreAllMocks());

type Ok = (p: unknown) => void;
type Fail = (e: unknown) => void;
const fake = (impl: (ok: Ok, fail: Fail, options?: PositionOptions) => void) => ({ getCurrentPosition: impl }) as unknown as Geolocation;
const fix = (latitude: number, longitude: number, accuracy = 30) => fake((ok) => ok({ coords: { latitude, longitude, accuracy } }));

describe("locate", () => {
  it("succeeds with valid coordinates and keeps latitude and longitude in the right slots", async () => {
    // Deliberately asymmetric: latitude -6.9 (Bandung), longitude 107.6.
    const result = await locate(fix(-6.9, 107.6, 45));
    expect(result).toEqual({ ok: true, position: { lat: -6.9, lng: 107.6, accuracyM: 45 } });
  });

  it("reports a missing accuracy as null instead of inventing one", async () => {
    const result = await locate(fake((ok) => ok({ coords: { latitude: -6.9, longitude: 107.6 } })));
    expect(result).toEqual({ ok: true, position: { lat: -6.9, lng: 107.6, accuracyM: null } });
  });

  it.each([
    [1, "denied"],
    [2, "unavailable"],
    [3, "timeout"],
    [99, "unavailable"],
  ])("maps error code %i to %s", async (code, reason) => {
    expect(await locate(fake((_ok, fail) => fail({ code })))).toEqual({ ok: false, reason });
  });

  it("reports unsupported browsers (no geolocation object, or no getCurrentPosition)", async () => {
    expect(await locate(undefined as unknown as Geolocation)).toEqual({ ok: false, reason: "unsupported" });
    expect(await locate({} as Geolocation)).toEqual({ ok: false, reason: "unsupported" });
  });

  it.each([
    ["NaN latitude", NaN, 107.6],
    ["latitude out of range", 106.8, 91],
    ["longitude out of range", -6.2, 200],
    ["swapped Indonesian coordinates", 106.8444, -6.1844],
    ["(0, 0)", 0, 0],
  ])("rejects invalid coordinates: %s", async (_label, latitude, longitude) => {
    expect(await locate(fix(latitude, longitude))).toEqual({ ok: false, reason: "invalid" });
  });

  it("rejects a position object with no coords at all", async () => {
    expect(await locate(fake((ok) => ok({})))).toEqual({ ok: false, reason: "invalid" });
  });

  it("treats a synchronous throw (e.g. insecure context) as unavailable and never rejects", async () => {
    const geo = fake(() => {
      throw new Error("insecure");
    });
    await expect(locate(geo)).resolves.toEqual({ ok: false, reason: "unavailable" });
  });

  it("asks for a fresh, coarse fix with a timeout: no cached position, no GPS wait", async () => {
    let seen: PositionOptions | undefined;
    await locate(fake((ok, _f, options) => {
      seen = options;
      ok({ coords: { latitude: -6.9, longitude: 107.6, accuracy: 10 } });
    }));
    expect(seen).toBe(LOCATE_OPTIONS);
    expect(LOCATE_OPTIONS.maximumAge).toBe(0);
    expect(LOCATE_OPTIONS.enableHighAccuracy).toBe(false);
    expect(LOCATE_OPTIONS.timeout).toBeGreaterThan(0);
  });

  it("does not request anything until it is called, and never uses the network or the console", async () => {
    const getCurrentPosition = vi.fn((ok: Ok) => ok({ coords: { latitude: -6.9, longitude: 107.6, accuracy: 5 } }));
    const geo = { getCurrentPosition } as unknown as Geolocation;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const logs = [vi.spyOn(console, "log"), vi.spyOn(console, "error"), vi.spyOn(console, "warn"), vi.spyOn(console, "info")];
    expect(getCurrentPosition).not.toHaveBeenCalled();
    await locate(geo);
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    for (const spy of logs) expect(spy).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("never substitutes a default position on failure", async () => {
    for (const code of [1, 2, 3]) {
      const result = await locate(fake((_ok, fail) => fail({ code })));
      expect(result.ok).toBe(false);
      expect(result).not.toHaveProperty("position");
    }
  });
});
