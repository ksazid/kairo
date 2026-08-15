import { describe, expect, it } from "vitest";
import { PublicBrandReferenceError, PublicBrandReferenceHttpReader } from "./public-brand-reference";

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
      resolveHost: async () => [{ address: "93.184.216.34", family: 4 as const }],
      transport: async (request) => {
        calls.push({ url: request.url.toString(), address: request.address, family: request.family });
        return {
          status: 200,
          headers: { "content-type": "text/html; charset=utf-8" },
          body: `<!doctype html><html lang="en"><head><title>The Duke 390</title><meta name="description" content="Rider-first Duke 390 ownership and riding content"></head><body><main><h1>Duke 390</h1><p>Rides, ownership, modifications and rider questions.</p><script>ignore me</script></main></body></html>`,
        };
      },
    });

    await expect(reader.read("https://example.com/about")).resolves.toEqual({
      url: "https://example.com/about",
      title: "The Duke 390",
      summary: "Rider-first Duke 390 ownership and riding content",
      excerpt: "The Duke 390 Duke 390 Rides, ownership, modifications and rider questions.",
      retrievedAt: "2026-08-15T18:23:00.000Z",
    });
    expect(calls).toEqual([{ url: "https://example.com/about", address: "93.184.216.34", family: 4 }]);
  });

  it("revalidates redirects and refuses a redirect to a local target", async () => {
    const reader = new PublicBrandReferenceHttpReader({
      resolveHost: async () => [{ address: "93.184.216.34", family: 4 as const }],
      transport: async () => ({ status: 302, headers: { location: "http://127.0.0.1/private" }, body: "" }),
    });

    await expect(reader.read("https://example.com/start")).rejects.toMatchObject({ kind: "unsafe-target" });
  });
});
