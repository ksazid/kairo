import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("VS-91 frozen Content preview contract", () => {
  it("keeps the preview-first user flow and destination-derived tabs", () => {
    const page = read("app/brands/[brandId]/content/[campaignId]/[assetId]/page.tsx");
    expect(page).toContain("Back to Content");
    expect(page).toContain("Selected destination previews");
    expect(page).toContain("detail.assets.map");
    expect(page).toContain("Preview the destination experience");
  });

  it("shows platform chrome, caption and approved secondary tools", () => {
    const page = read("app/brands/[brandId]/content/[campaignId]/[assetId]/page.tsx");
    for (const value of ["Like", "Comment", "Share", "Replace media", "AI assist", "Edit"]) {
      expect(page).toContain(value);
    }
    expect(page).toContain("truncateCaption(caption)");
  });

  it("keeps Approve & Lock dominant and exposes publish/schedule only after approval", () => {
    const page = read("app/brands/[brandId]/content/[campaignId]/[assetId]/page.tsx");
    const schedule = read("app/brands/[brandId]/campaigns/[campaignId]/schedule-form.tsx");
    expect(page).toContain("Approve & Lock");
    expect(page).toContain("approval ?");
    expect(schedule).toContain("Publish now");
    expect(schedule).toContain("Schedule for later");
    expect(schedule).toContain('className="primary-button"');
    expect(schedule).not.toContain("account.accountRef");
    expect(schedule).not.toContain("publishing worker");
  });

  it("keeps implementation vocabulary out of visible normal-flow copy", () => {
    const page = read("app/brands/[brandId]/content/[campaignId]/[assetId]/page.tsx");
    for (const forbidden of [
      "Truth Gate",
      "Critic",
      "Inspect Research",
      "renderVersionId",
      "asset version",
      "supporting Claims",
      "provider ID",
      "account reference",
    ]) {
      expect(page).not.toContain(forbidden);
    }
  });

  it("keeps Details & history progressively disclosed", () => {
    const page = read("app/brands/[brandId]/content/[campaignId]/[assetId]/page.tsx");
    expect(page).toContain("Details & history");
    expect(page).toContain("Content history");
    expect(page).toContain("Campaign context");
  });
});
