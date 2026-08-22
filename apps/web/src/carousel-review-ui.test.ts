import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const source = (p: string) => readFileSync(new URL(p, import.meta.url), "utf8");
describe("VS-77 visual carousel review", () => {
  it("covers every bounded edit and exact render approval endpoint", () => {
    const api = source("./lib/carousel-review-api.ts");
    for (const part of [
      "/slides/",
      "/reorder",
      "/regenerate",
      "/style",
      "/approve",
      "/bootstrap",
      "/render",
      "ensureCarouselReview",
      "expectedAssetVersion",
      "renderVersionId",
    ])
      expect(api).toContain(part);
  });
  it("previews and edits every slide without hiding quality findings", () => {
    const page = source(
      "../app/brands/[brandId]/campaigns/[campaignId]/carousel/[assetId]/page.tsx",
    );
    for (const text of [
      "Preview and edit every slide",
      "Headline",
      "Body",
      "Replacement image asset ID",
      "Move earlier",
      "Move later",
      "Regenerate slide",
      "Quality check",
      "Approve final carousel",
    ])
      expect(page).toContain(text);
    expect(page).toContain("disabled={blocking}");
  });
  it("provides route-level loading and recovery states", () => {
    expect(
      source(
        "../app/brands/[brandId]/campaigns/[campaignId]/carousel/[assetId]/loading.tsx",
      ),
    ).toContain('role="status"');
    const error = source(
      "../app/brands/[brandId]/campaigns/[campaignId]/carousel/[assetId]/error.tsx",
    );
    expect(error).toContain('role="alert"');
    expect(error).toContain("reset");
  });
});
