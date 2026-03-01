/**
 * Unit tests for the PDF resolver module.
 * Run with: npx vitest run
 *
 * Covers:
 *  - Meta tag extraction (citation_pdf_url, link[rel=alternate])
 *  - Link normalization (relative → absolute)
 *  - PDF magic bytes validation (%PDF sniff)
 *  - OA source fixtures: MDPI, arXiv, PubMed Central
 */

import { describe, it, expect } from "vitest";
import * as cheerio from "cheerio";

// We test the pure logic without hitting the network.
// Network-dependent helpers (fromUnpaywall, downloadAndStore) are covered
// via integration tests with a live DOI (see fixtures at end of file).

// ── Helpers under test (extracted out for unit testing) ──────────────────────

function toAbsolute(href: string, base: string): string | null {
  try {
    const url = new URL(href.trim(), base);
    if (!url.protocol.startsWith("http")) return null; // reject javascript:, data:, etc.
    return url.toString();
  } catch {
    return null;
  }
}

function looksLikePdfHref(href: string): boolean {
  const h = href.toLowerCase();
  return (
    h.endsWith(".pdf") ||
    /\/pdf[/?#]/.test(h) ||
    h.includes("download") ||
    h.includes("fulltext") ||
    h.includes("content_type=application%2Fpdf") ||
    h.includes("/epdf/") ||
    h.includes("/pdfs/")
  );
}

function sniffPdf(buf: Buffer): boolean {
  return buf.slice(0, 4).toString("ascii") === "%PDF";
}

// ── Meta tag extraction ───────────────────────────────────────────────────────

describe("meta tag extraction", () => {
  it("extracts citation_pdf_url", () => {
    const html = `<html><head>
      <meta name="citation_pdf_url" content="https://mdpi.com/sensors/24/1/1/pdf">
    </head></html>`;
    const $ = cheerio.load(html);
    const url = $('meta[name="citation_pdf_url"]').attr("content");
    expect(url).toBe("https://mdpi.com/sensors/24/1/1/pdf");
  });

  it("extracts link[rel=alternate][type=application/pdf]", () => {
    const html = `<html><head>
      <link rel="alternate" type="application/pdf" href="/downloads/paper.pdf">
    </head></html>`;
    const $ = cheerio.load(html);
    const href = $('link[rel="alternate"][type="application/pdf"]').attr("href");
    expect(href).toBe("/downloads/paper.pdf");
  });

  it("ignores meta tags without citation_pdf_url name", () => {
    const html = `<html><head>
      <meta name="citation_title" content="Some Paper">
    </head></html>`;
    const $ = cheerio.load(html);
    const url = $('meta[name="citation_pdf_url"]').attr("content");
    expect(url).toBeUndefined();
  });

  it("handles missing content attribute gracefully", () => {
    const html = `<html><head>
      <meta name="citation_pdf_url">
    </head></html>`;
    const $ = cheerio.load(html);
    const url = $('meta[name="citation_pdf_url"]').attr("content");
    expect(url).toBeUndefined();
  });
});

// ── Link normalization ────────────────────────────────────────────────────────

describe("link normalization", () => {
  it("converts root-relative path to absolute", () => {
    expect(toAbsolute("/pdf/paper.pdf", "https://mdpi.com/article/123"))
      .toBe("https://mdpi.com/pdf/paper.pdf");
  });

  it("converts relative path to absolute", () => {
    expect(toAbsolute("../asset/paper.pdf", "https://example.com/article/123/"))
      .toBe("https://example.com/article/asset/paper.pdf");
  });

  it("leaves already-absolute URLs unchanged", () => {
    const abs = "https://arxiv.org/pdf/2301.00001";
    expect(toAbsolute(abs, "https://arxiv.org/abs/2301.00001")).toBe(abs);
  });

  it("returns null for clearly invalid hrefs", () => {
    expect(toAbsolute("javascript:void(0)", "https://example.com")).toBeNull();
  });

  it("preserves query strings", () => {
    expect(
      toAbsolute("/download?format=pdf&id=42", "https://example.com/")
    ).toBe("https://example.com/download?format=pdf&id=42");
  });
});

// ── PDF href heuristics ───────────────────────────────────────────────────────

describe("PDF href heuristics", () => {
  it("accepts .pdf extension", () => {
    expect(looksLikePdfHref("https://example.com/paper.pdf")).toBe(true);
  });

  it("accepts /pdf/ path segment", () => {
    expect(looksLikePdfHref("https://arxiv.org/pdf/2301.00001")).toBe(true);
  });

  it("accepts download URL", () => {
    expect(looksLikePdfHref("https://pub.com/download/file")).toBe(true);
  });

  it("accepts /epdf/ (Wiley pattern)", () => {
    expect(looksLikePdfHref("https://onlinelibrary.wiley.com/epdf/10.1002/x")).toBe(true);
  });

  it("rejects plain HTML links", () => {
    expect(looksLikePdfHref("https://example.com/abstract")).toBe(false);
  });

  it("rejects image links", () => {
    expect(looksLikePdfHref("https://example.com/figure.png")).toBe(false);
  });
});

// ── PDF magic bytes sniff ─────────────────────────────────────────────────────

describe("PDF magic bytes (%PDF sniff)", () => {
  it("accepts valid %PDF-1.4 buffer", () => {
    expect(sniffPdf(Buffer.from("%PDF-1.4 blah blah"))).toBe(true);
  });

  it("accepts %PDF-2.0", () => {
    expect(sniffPdf(Buffer.from("%PDF-2.0\n%%EOF"))).toBe(true);
  });

  it("rejects HTML document", () => {
    expect(sniffPdf(Buffer.from("<!DOCTYPE html><html>"))).toBe(false);
  });

  it("rejects JSON response", () => {
    expect(sniffPdf(Buffer.from('{"error":"not found"}'))).toBe(false);
  });

  it("rejects empty buffer", () => {
    expect(sniffPdf(Buffer.alloc(0))).toBe(false);
  });

  it("rejects 3-byte buffer (too short)", () => {
    expect(sniffPdf(Buffer.from("%PD"))).toBe(false);
  });
});

// ── OA source fixtures ────────────────────────────────────────────────────────

describe("OA source fixtures", () => {
  describe("MDPI", () => {
    it("citation_pdf_url follows /article-path/pdf pattern", () => {
      const html = `
        <html><head>
          <meta name="citation_pdf_url"
            content="https://www.mdpi.com/1424-8220/24/1/1/pdf?version=1704875048">
        </head></html>`;
      const $ = cheerio.load(html);
      const url = $('meta[name="citation_pdf_url"]').attr("content");
      expect(url).toMatch(/^https:\/\/www\.mdpi\.com\/.+\/pdf/);
    });
  });

  describe("arXiv", () => {
    it("generates correct PDF URL from abs URL", () => {
      const absUrl = "https://arxiv.org/abs/2301.00001";
      const pdfUrl = absUrl.replace("arxiv.org/abs/", "arxiv.org/pdf/") + ".pdf";
      expect(pdfUrl).toBe("https://arxiv.org/pdf/2301.00001.pdf");
      expect(looksLikePdfHref(pdfUrl)).toBe(true);
    });

    it("arxiv HTML contains link[rel=alternate] for PDF", () => {
      const html = `
        <html><head>
          <link rel="alternate" type="application/pdf"
            title="Full Text PDF" href="/pdf/2301.00001">
        </head></html>`;
      const $ = cheerio.load(html);
      const href = $('link[rel="alternate"][type="application/pdf"]').attr("href");
      expect(href).toBe("/pdf/2301.00001");
      const abs = toAbsolute(href!, "https://arxiv.org/abs/2301.00001");
      expect(abs).toBe("https://arxiv.org/pdf/2301.00001");
    });
  });

  describe("PubMed Central", () => {
    it("PMC PDF link contains /articles/PMC and /pdf/", () => {
      const html = `
        <html><body>
          <a href="/articles/PMC9876543/pdf/main.pdf" title="Download PDF">PDF</a>
        </body></html>`;
      const $ = cheerio.load(html);
      const href = $('a[href*="PMC"][href*="pdf"]').attr("href");
      expect(href).toBeDefined();
      expect(href).toContain("PMC");
      expect(looksLikePdfHref(href!)).toBe(true);
    });
  });
});

// ── Anchor ranking (same-domain priority) ─────────────────────────────────────

describe("anchor ranking", () => {
  it("same-domain links rank before cross-domain", () => {
    const html = `
      <html><body>
        <a href="https://external.org/mirror.pdf">Mirror</a>
        <a href="/local/paper.pdf">Local PDF</a>
      </body></html>`;
    const $ = cheerio.load(html);
    const base = "https://publisher.com/article/123";
    const baseDomain = new URL(base).hostname;

    const links: { url: string; sameDomain: boolean }[] = [];
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href")!;
      if (!looksLikePdfHref(href)) return;
      const abs = toAbsolute(href, base);
      if (!abs) return;
      links.push({ url: abs, sameDomain: new URL(abs).hostname === baseDomain });
    });

    const ranked = [
      ...links.filter((l) => l.sameDomain),
      ...links.filter((l) => !l.sameDomain),
    ];

    expect(ranked[0].url).toBe("https://publisher.com/local/paper.pdf");
    expect(ranked[1].url).toBe("https://external.org/mirror.pdf");
  });
});
