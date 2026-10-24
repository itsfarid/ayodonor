import { describe, expect, it } from "vitest";
import { distanceKm, haversineKm, isValidCoordinates, sortByDistance } from "../src/lib/geo";

const JAKARTA = { lat: -6.1844, lng: 106.8444 };
const BANDUNG = { lat: -6.9103, lng: 107.6186 };
const SURABAYA = { lat: -7.2651, lng: 112.7423 };
const MAKASSAR = { lat: -5.1477, lng: 119.4327 };

describe("isValidCoordinates", () => {
  it("accepts ordinary Indonesian positions", () => {
    expect(isValidCoordinates(JAKARTA.lat, JAKARTA.lng)).toBe(true);
    expect(isValidCoordinates(-2.53, 140.7)).toBe(true); // Jayapura
    expect(isValidCoordinates(90, 180)).toBe(true);
    expect(isValidCoordinates(-90, -180)).toBe(true);
  });

  it("rejects out-of-range, non-finite and non-numeric values", () => {
    for (const [lat, lng] of [
      [91, 0.5],
      [-91, 10],
      [10, 181],
      [10, -181],
      [NaN, 106],
      [-6, Infinity],
      [null, 106],
      [undefined, undefined],
      ["-6.2", "106.8"],
    ] as unknown[][]) {
      expect(isValidCoordinates(lat, lng), `${lat},${lng}`).toBe(false);
    }
  });

  it("rejects (0, 0), the value broken position sources return", () => {
    expect(isValidCoordinates(0, 0)).toBe(false);
  });

  it("catches a latitude/longitude swap for any Indonesian position (longitudes 95-141 cannot be latitudes)", () => {
    for (const p of [JAKARTA, BANDUNG, SURABAYA, MAKASSAR, { lat: -2.53, lng: 140.7 }]) {
      expect(isValidCoordinates(p.lat, p.lng)).toBe(true);
      expect(isValidCoordinates(p.lng, p.lat)).toBe(false);
    }
  });
});

describe("haversineKm", () => {
  it("matches known city distances (straight line)", () => {
    expect(haversineKm(JAKARTA, BANDUNG)).toBeCloseTo(117.6, 0);
    expect(haversineKm(JAKARTA, SURABAYA)).toBeCloseTo(662.3, 0);
    expect(haversineKm(JAKARTA, MAKASSAR)).toBeGreaterThan(1380);
    expect(haversineKm(JAKARTA, MAKASSAR)).toBeLessThan(1420);
  });

  it("is zero for the same point and symmetric", () => {
    expect(haversineKm(BANDUNG, BANDUNG)).toBe(0);
    expect(haversineKm(JAKARTA, SURABAYA)).toBeCloseTo(haversineKm(SURABAYA, JAKARTA), 9);
  });

  it("handles antipodal points and the date line without NaN", () => {
    expect(haversineKm({ lat: 10, lng: 0.5 }, { lat: -10, lng: -179.5 })).toBeCloseTo(20015, -1);
    expect(haversineKm({ lat: -17, lng: 179.9 }, { lat: -17, lng: -179.9 })).toBeLessThan(25);
  });

  it("depends on coordinate order: swapping lat and lng gives a wrong distance", () => {
    const swapped = haversineKm({ lat: JAKARTA.lng, lng: JAKARTA.lat }, { lat: BANDUNG.lng, lng: BANDUNG.lat });
    expect(Math.abs(swapped - haversineKm(JAKARTA, BANDUNG))).toBeGreaterThan(5);
  });
});

describe("distanceKm", () => {
  it("returns a distance only when both points are valid", () => {
    expect(distanceKm(JAKARTA, BANDUNG)).toBeCloseTo(117.6, 0);
    expect(distanceKm(null, BANDUNG)).toBeNull();
    expect(distanceKm(JAKARTA, undefined)).toBeNull();
    expect(distanceKm({ lat: NaN, lng: 1 }, BANDUNG)).toBeNull();
    expect(distanceKm({ lat: 106.8, lng: -6.2 }, BANDUNG)).toBeNull(); // swapped origin
    expect(distanceKm(JAKARTA, { lat: 0, lng: 0 })).toBeNull();
  });
});

describe("sortByDistance", () => {
  const items = [
    { id: "no-coords-first", c: null },
    { id: "makassar", c: MAKASSAR },
    { id: "jakarta", c: JAKARTA },
    { id: "bad", c: { lat: 200, lng: 300 } },
    { id: "surabaya", c: SURABAYA },
    { id: "bandung", c: BANDUNG },
  ];

  it("orders by ascending distance from the origin", () => {
    const sorted = sortByDistance(items, { lat: -6.9, lng: 107.6 }, (i) => i.c);
    expect(sorted.slice(0, 4).map((s) => s.item.id)).toEqual(["bandung", "jakarta", "surabaya", "makassar"]);
    const km = sorted.slice(0, 4).map((s) => s.km!);
    expect([...km].sort((a, b) => a - b)).toEqual(km);
  });

  it("puts items without a valid distance after every measured item, in their original order", () => {
    const sorted = sortByDistance(items, { lat: -6.9, lng: 107.6 }, (i) => i.c);
    expect(sorted.slice(4).map((s) => s.item.id)).toEqual(["no-coords-first", "bad"]);
    expect(sorted.slice(4).every((s) => s.km === null)).toBe(true);
  });

  it("measures nothing and keeps order when the origin is missing or invalid", () => {
    for (const origin of [null, { lat: NaN, lng: 5 }]) {
      const sorted = sortByDistance(items, origin, (i) => i.c);
      expect(sorted.map((s) => s.item.id)).toEqual(items.map((i) => i.id));
      expect(sorted.every((s) => s.km === null)).toBe(true);
    }
  });
});
