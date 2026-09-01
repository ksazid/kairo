import { deflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { PublicBrandReferenceError, PublicBrandReferenceHttpReader } from "./public-brand-reference";

const publicHost = async () => [{ address: "93.184.216.34", family: 4 as const }];

describe("PublicBrandReferenceHttpReader", () => {
  it("rejects local/private literal targets before network access", async () => {
    let resolved = false;
    const reader = new PublicBrandReferenceHttpReader({
      resolveHost: async () => { resolved = true; return [{ address: "93.184.216.34", family: 4 as const }]; },
      transport: async () => { throw new Error("should not run"); },
    });

    for (const url of ["http://127.0.0.1/admin", "http://169.254.169.254/latest", "http://[::1]/"]) {
      await expect(reader.read(url)).rejects.toBeInstanceOf(PublicBrandReferenceError);
    }
    expect(resolved).toBe(false);
  });

  it("rejects a public hostname that resolves to a private address", async () => {
    const reader = new PublicBrandReferenceHttpReader({
      resolveHost: async () => [{ address: "10.0.0.7", family: 4 as const }],
      transport: async () => { throw new Error("should not run"); },
    });

    await expect(reader.read("https://example.com/about")).rejects.toMatchObject({ kind: "unsafe-target" });
  });

  it("pins the resolved public address and extracts bounded page context", async () => {
    const calls: Array<{ url: string; address: string; family: 4 | 6 }> = [];
    const reader = new PublicBrandReferenceHttpReader({
      now: () => new Date("2026-08-15T18:23:00.000Z"),
      resolveHost: publicHost,
      transport: async (request) => {
        calls.push({ url: request.url.toString(), address: request.address, family: request.family });
        return {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
          body: `<!doctype html><html lang="en"><head><title>The Duke 390</title><meta name="description" content="Rider-first Duke 390 ownership and riding content"></head><body><header>Account Search</header><nav>Home About Privacy</nav><main><h1>Duke 390</h1><p>Rides, ownership, modifications and rider questions.</p><a href="/products">Products</a><a href="https://other.example/about">Other</a><script>ignore me</script></main><aside>Related promotions</aside><footer>Terms Contact</footer></body></html>`,
        };
      },
    });

    await expect(reader.read("https://example.com/about")).resolves.toEqual({
      url: "https://example.com/about",
      title: "The Duke 390",
      summary: "Rider-first Duke 390 ownership and riding content",
      excerpt: "The Duke 390 Rider-first Duke 390 ownership and riding content Duke 390 Rides, ownership, modifications and rider questions. Products Other",
      retrievedAt: "2026-08-15T18:23:00.000Z",
      links: ["https://example.com/products"],
    });
    expect(calls).toEqual([{ url: "https://example.com/about", address: "93.184.216.34", family: 4 }]);
  });

  it("uses OpenGraph/social metadata when a public profile page exposes little visible body text", async () => {
    const reader = new PublicBrandReferenceHttpReader({
      resolveHost: publicHost,
      transport: async () => ({
        status: 200,
        headers: { "content-type": "text/html" },
        body: `<!doctype html><html><head><meta property="og:title" content="The Duke 390 (@_dukeman390)"><meta property="og:description" content="Duke motorcycle rides, ownership notes and modifications."><meta name="twitter:description" content="Fallback description"></head><body><div id="root"></div></body></html>`,
      }),
    });

    await expect(reader.read("https://www.instagram.com/_dukeman390/")).resolves.toMatchObject({
      title: "The Duke 390 (@_dukeman390)",
      summary: "Duke motorcycle rides, ownership notes and modifications.",
      excerpt: expect.stringContaining("Duke motorcycle rides, ownership notes and modifications."),
    });
  });

  it("reads broad text responses without requiring HTML", async () => {
    const reader = new PublicBrandReferenceHttpReader({
      resolveHost: publicHost,
      transport: async () => ({
        status: 200,
        headers: { "content-type": "text/markdown; charset=utf-8" },
        body: "# Brand notes\nDuke 390 ownership, riding and maintenance content for enthusiasts.",
      }),
    });

    await expect(reader.read("https://example.com/brand.md")).resolves.toMatchObject({
      excerpt: "# Brand notes Duke 390 ownership, riding and maintenance content for enthusiasts.",
    });
  });

  it("safely truncates oversized textual pages instead of discarding usable evidence", async () => {
    const reader = new PublicBrandReferenceHttpReader({
      maxBytes: 8_000,
      resolveHost: publicHost,
      transport: async () => ({
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
        body: `<html><head><title>Wolt Malta</title><meta name="description" content="Food, groceries and local delivery in Malta"></head><body><main>Order food and groceries from local restaurants and stores in Malta.</main><script>${"x".repeat(9_000)}`,
      }),
    });

    await expect(reader.read("https://example.com/malta")).resolves.toMatchObject({
      title: "Wolt Malta",
      summary: "Food, groceries and local delivery in Malta",
      excerpt: expect.stringContaining("Order food and groceries from local restaurants and stores in Malta."),
    });
  });

  it("does not truncate oversized or partially downloaded PDF content as text", async () => {
    const reader = new PublicBrandReferenceHttpReader({
      resolveHost: publicHost,
      transport: async () => ({
        status: 200,
        headers: { "content-type": "text/html" },
        body: Buffer.from("%PDF-1.4\nBT (partial document) Tj ET", "latin1"),
        truncated: true,
      }),
    });

    await expect(reader.read("https://example.com/document")).rejects.toMatchObject({ kind: "too-large" });
  });

  it("extracts text from a bounded text-based PDF URL and reports document metadata", async () => {
    const pdf = Buffer.from("%PDF-1.4\n1 0 obj<< /Title (Duke Brand Guide) >>endobj\n2 0 obj<< /Length 90 >>stream\nBT /F1 12 Tf 72 720 Td (Duke 390 rider-first ownership and modification guidance.) Tj ET\nendstream\nendobj\n%%EOF", "latin1");
    const reader = new PublicBrandReferenceHttpReader({
      resolveHost: publicHost,
      transport: async () => ({ status: 200, headers: { "content-type": "application/pdf" }, body: pdf }),
    });

    const result = await reader.read("https://example.com/brand-guide.pdf");
    expect(result).toMatchObject({
      title: "Duke Brand Guide",
      contentType: "application/pdf",
      sizeBytes: pdf.length,
      excerpt: expect.stringContaining("Duke 390 rider-first ownership and modification guidance."),
    });
  });

  it("extracts text from Flate-compressed PDF content streams", async () => {
    const compressed = deflateSync(Buffer.from("BT /F1 12 Tf (Performance motorcycle content for practical Duke owners.) Tj ET", "latin1"));
    const pdf = Buffer.concat([
      Buffer.from("%PDF-1.4\n1 0 obj<< /Filter /FlateDecode /Length ", "latin1"),
      Buffer.from(String(compressed.length), "ascii"),
      Buffer.from(" >>stream\n", "latin1"),
      compressed,
      Buffer.from("\nendstream\nendobj\n%%EOF", "latin1"),
    ]);
    const reader = new PublicBrandReferenceHttpReader({
      resolveHost: publicHost,
      transport: async () => ({ status: 200, headers: { "content-type": "application/octet-stream" }, body: pdf }),
    });

    await expect(reader.read("https://example.com/download?id=guide")).resolves.toMatchObject({
      contentType: "application/pdf",
      excerpt: expect.stringContaining("Performance motorcycle content for practical Duke owners."),
    });
  });

  it("does not claim success for a PDF with no safely extractable text", async () => {
    const reader = new PublicBrandReferenceHttpReader({
      resolveHost: publicHost,
      transport: async () => ({
        status: 200,
        headers: { "content-type": "application/pdf" },
        body: Buffer.from("%PDF-1.4\n1 0 obj<< /Type /XObject /Subtype /Image >>endobj\n%%EOF", "latin1"),
      }),
    });

    await expect(reader.read("https://example.com/scanned.pdf")).rejects.toMatchObject({ kind: "invalid-response" });
  });

  it("revalidates redirects and refuses a redirect to a local target", async () => {
    const reader = new PublicBrandReferenceHttpReader({
      resolveHost: publicHost,
      transport: async () => ({ status: 302, headers: { location: "http://127.0.0.1/private" }, body: "" }),
    });

    await expect(reader.read("https://example.com/start")).rejects.toMatchObject({ kind: "unsafe-target" });
  });
});
