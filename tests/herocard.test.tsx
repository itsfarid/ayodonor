// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HeroCard from "../src/components/HeroCard";
import { buildCardSvg, CARD_DISCLAIMER, escapeXml, safeFileName } from "../src/components/heroCardSvg";

afterEach(cleanup);

const FORBIDDEN = [/sertifikat kelayakan/i, /100\s?%/, /platinum/i, /premium/i, /verifikasi/i, /lolos/i, /siap jadi hero/i, /regulated/i, /sentinel/i, /dinyatakan/i];

describe("HeroCard (Kartu Niat Donor)", () => {
  it("shows the name and an explicit not-a-certificate disclaimer", () => {
    const { container } = render(<HeroCard visitorName="Rizki" />);
    expect(container.textContent).toContain("Rizki");
    expect(container.textContent).toContain(CARD_DISCLAIMER);
    expect(container.textContent).toMatch(/bukan sertifikat/i);
  });

  it("makes no certification, status or eligibility claims", () => {
    const { container } = render(<HeroCard visitorName="Rizki" />);
    for (const claim of FORBIDDEN) expect(container.textContent).not.toMatch(claim);
  });

  it("falls back to a neutral name when none is given", () => {
    const { container } = render(<HeroCard visitorName="   " />);
    expect(container.textContent).toContain("Sobat");
  });

  it("shares a neutral invitation and links to the app's own origin, not a placeholder", () => {
    const { container } = render(<HeroCard visitorName="Rizki" />);
    fireEvent.click(screen.getByText("Bagikan ajakan"));
    const textarea = container.querySelector("textarea")!;
    for (const claim of FORBIDDEN) expect(textarea.value).not.toMatch(claim);
    const link = screen.getByText("Buka LinkedIn").closest("a")!;
    expect(link.getAttribute("href")).toContain(encodeURIComponent(window.location.origin));
    expect(link.getAttribute("href")).not.toContain("ai.studio");
    expect(link.getAttribute("rel")).toContain("noopener");
  });
});

describe("downloadable card SVG", () => {
  it("escapes markup in the visitor name (no SVG/script injection)", () => {
    const svg = buildCardSvg(`</text><script>alert(1)</script><"&'>`, "1 Januari 2026");
    expect(svg).not.toMatch(/<script/i);
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("&amp;");
    expect(svg).toContain("&quot;");
  });

  it("caps very long names", () => {
    const svg = buildCardSvg("a".repeat(500), "x");
    expect(svg).not.toContain("a".repeat(51));
  });

  it("carries the disclaimer and no certification claims", () => {
    const svg = buildCardSvg("Rizki", "1 Januari 2026");
    expect(svg).toContain(escapeXml(CARD_DISCLAIMER));
    for (const claim of FORBIDDEN) expect(svg).not.toMatch(claim);
  });

  it("produces safe file names", () => {
    expect(safeFileName("../../etc/passwd")).toBe("etc_passwd");
    expect(safeFileName("  ")).toBe("Sobat");
    expect(safeFileName("Aurel Putri")).toBe("Aurel_Putri");
  });
});
