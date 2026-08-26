import { describe, expect, it } from "vitest";
import { InMemoryNormalizedSourceCache } from "@kairo/agent-contracts";
import { PublicBrandReferenceHttpReader, type PublicBrandReferenceTransportResponse } from "./public-brand-reference";
import { SecureHttpSourceAdapter, SourceIntelligenceBrandReferenceReader, createSourceIntelligenceRouter } from "./source-intelligence";

describe("VS-99 secure HTTP source adapter", () => {
  it("bridges the existing reader into normalized untrusted evidence", async () => {
    let calls = 0;
    const reader = new PublicBrandReferenceHttpReader({
      resolveHost: async () => [{ address: "93.184.216.34", family: 4 }],
      transport: async (): Promise<PublicBrandReferenceTransportResponse> => {
        calls++;
        return { status: 200, headers: { "content-type": "text/html" }, body: "<html><head><title>Example</title><meta name=\"description\" content=\"Summary\"></head><body><main>Useful body</main></body></html>" };
      },
      now: () => new Date("2026-08-26T07:00:00.000Z"),
    });
    const router = createSourceIntelligenceRouter({ reader, cache: new InMemoryNormalizedSourceCache() });
    const first = await router.fetch({ url: "https://example.com", scope: { visibility: "global-public" }, timeoutMs: 1000 });
    const second = await router.fetch({ url: "https://example.com", scope: { visibility: "global-public" }, timeoutMs: 1000 });
    expect(first.document).toMatchObject({ platform: "website", title: "Example", trust: "untrusted-evidence", provider: "website" });
    expect(first.document.contentHash).toMatch(/^sha256:/);
    expect(second.cacheHit).toBe(true);
    expect(calls).toBe(1);

    const refreshed = await router.fetch({ url: "https://example.com", scope: { visibility: "global-public" }, timeoutMs: 1000, forceRefresh: true });
    expect(refreshed.cacheHit).toBe(true);
    expect(calls).toBe(2);

    const compatibility = await new SourceIntelligenceBrandReferenceReader(router).read("https://example.com");
    expect(compatibility).toMatchObject({ url: "https://example.com/", title: "Example", excerpt: expect.stringContaining("Useful body") });
  });

  it("truthfully reports adapter health without credentials", async () => {
    const adapter = new SecureHttpSourceAdapter(new PublicBrandReferenceHttpReader());
    await expect(adapter.health()).resolves.toEqual({ status: "available" });
  });
});
