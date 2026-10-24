import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { UTD_RECORDS, UTD_RETRIEVED_ON, UTD_SOURCE_URL } from "../src/data/utd";
import { getSource } from "../src/data/sources";

const ROOT = path.join(__dirname, "..");

describe("UDD/UTD dataset", () => {
  it("carries source metadata on every record", () => {
    expect(UTD_RECORDS.length).toBe(228);
    for (const r of UTD_RECORDS) {
      expect(r.sourceUrl, String(r.no)).toBe(UTD_SOURCE_URL);
      expect(r.sourceUrl).toMatch(/^https:\/\/ayodonor\.pmi\.or\.id\//);
      expect(r.verifiedOn, String(r.no)).toBe(UTD_RETRIEVED_ON);
    }
  });

  it("has the fields the source supports, and no others", () => {
    const allowed = new Set(["no", "name", "province", "address", "phone", "sourceUrl", "verifiedOn"]);
    for (const r of UTD_RECORDS) {
      expect(Object.keys(r).filter((k) => !allowed.has(k)), String(r.no)).toEqual([]);
      for (const f of [r.name, r.province, r.address]) expect(f.trim().length, String(r.no)).toBeGreaterThan(2);
      expect(typeof r.phone).toBe("string");
    }
    expect(new Set(UTD_RECORDS.map((r) => r.no)).size).toBe(UTD_RECORDS.length);
    expect(new Set(UTD_RECORDS.map((r) => r.name)).size).toBe(UTD_RECORDS.length);
  });

  it("invents no coordinates: the official page has none, so none are stored without their own source", () => {
    for (const r of UTD_RECORDS) {
      if (r.coordinates) {
        expect(r.coordinates.source, String(r.no)).toMatch(/^https:\/\//);
      }
    }
    expect(UTD_RECORDS.filter((r) => r.coordinates)).toEqual([]);
  });

  it("copies the official entries, not the removed demo values", () => {
    const makassar = UTD_RECORDS.find((r) => r.name === "UDD PMI Kota Makassar")!;
    expect(makassar.address).toBe("Jl. Lanto Daeng Pasewang No. 55 Makassar");
    expect(makassar.phone).toBe("(0411) 852477");
    const medan = UTD_RECORDS.find((r) => r.name === "UDD PMI Kota Medan")!;
    expect(medan.address).toContain("Perintis Kemerdekaan");
    const text = JSON.stringify(UTD_RECORDS);
    for (const removed of ["Kandea", "3612502", "Palang Merah No.17", "4567232", "Sugiopranoto No.31", "(031) 5313555"]) {
      expect(text, removed).not.toContain(removed);
    }
  });

  it("contains no stock information", () => {
    const text = JSON.stringify(UTD_RECORDS);
    expect(text).not.toMatch(/stok|stock|Kritis|"Aman"|"Cukup"/i);
  });

  it("the source is registered in the sources list with the same URL", () => {
    expect(getSource("pmi-kontak").url).toBe(UTD_SOURCE_URL);
  });

  it("the removed demo locator data and stock labels are gone from the source tree", () => {
    const files = fs
      .readdirSync(path.join(ROOT, "src"), { recursive: true, withFileTypes: true })
      .filter((e) => e.isFile() && /\.(tsx?|css)$/.test(e.name))
      .map((e) => path.join(e.parentPath, e.name));
    for (const f of files) {
      const src = fs.readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/INITIAL_PMI_DATA|BLOOD_TYPES|getStockBadgeColor|StockStatus|Contoh status stok|Ilustrasi Demo/);
    }
  });
});
