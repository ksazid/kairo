import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd(), "apps/web");
const listPage = readFileSync(resolve(root, "app/brands/[brandId]/content/page.tsx"), "utf8");
const listCss = readFileSync(resolve(root, "app/brands/[brandId]/content/content.module.css"), "utf8");
const detailPage = readFileSync(resolve(root, "app/brands/[brandId]/content/[campaignId]/[assetId]/page.tsx"), "utf8");
const detailCss = readFileSync(resolve(root, "app/brands/[brandId]/content/[campaignId]/[assetId]/content-detail.module.css"), "utf8");
const shellCss = readFileSync(resolve(root, "app/brands/[brandId]/content/content-reference-shell.module.css"), "utf8");
const model = readFileSync(resolve(root, "src/lib/content-view-model.ts"), "utf8");

describe("VS-93 approved Content bitmap contract", () => {
  it("locks the approved Content list hierarchy and controls", () => {
    expect(listPage).toContain("<h1>Content</h1>");
    expect(listPage).toContain("All your content in one place. Track, review and publish.");
    expect(listPage).toContain('placeholder="Search content..."');
    expect(listPage).toContain('name="filter"');
    expect(listPage).toContain('name="list"');
    expect(listPage).toContain('name="grid"');
    expect(listPage).toContain("Channel / Format");
    expect(listPage).toContain("Last Updated");
    expect(listPage).toContain("Showing {firstShown} to {lastShown} of {filtered.length} results");
    expect(model).toContain('["all", "needs-you", "ready", "scheduled", "published", "drafts"]');
  });

  it("locks the approved 1024px Content list geometry", () => {
    expect(listCss).toContain("height: 62px");
    expect(listCss).toContain("min-height: 153px");
    expect(listCss).toContain("grid-template-columns: 188px minmax(0, 1fr)");
    expect(listCss).toContain("width: 188px");
    expect(listCss).toContain("height: 120px");
    expect(listCss).toContain("min-height: 67px");
    expect(shellCss).toContain("height: 100px");
    expect(shellCss).toContain("height: 88px");
    expect(shellCss).toContain("k-shell--content-reference");
  });

  it("locks the approved Preview composition and removes technical machinery", () => {
    expect(detailPage).toContain("Back to content");
    expect(detailPage).toContain("More actions");
    expect(detailPage).toContain("Preview");
    expect(detailPage).toContain("Review how your content will look across platforms.");
    expect(detailPage).toContain("AI assistance");
    expect(detailPage).toContain("Content details");
    expect(detailPage).toContain("Performance potential");
    expect(detailPage).toContain("Approve &amp; Lock");
    expect(detailPage).toContain("uniqueDestinations");
    expect(detailPage).not.toContain("Truth Gate");
    expect(detailPage).not.toContain("Critic");
    expect(detailPage).not.toContain("renderVersionId");
    expect(detailPage).not.toContain("accountRef}</");
    expect(detailPage).not.toContain("supportingClaimIds");
  });

  it("locks the approved 1024px Preview geometry", () => {
    expect(detailCss).toContain("grid-template-columns: minmax(0, 1fr) 276px");
    expect(detailCss).toContain("width: 486px");
    expect(detailCss).toContain("height: 440px");
    expect(detailCss).toContain("min-height: 139px");
    expect(detailCss).toContain("min-height: 88px");
    expect(detailCss).toContain("bottom: 88px");
    expect(detailCss).toContain("min-width: 228px");
  });
});
