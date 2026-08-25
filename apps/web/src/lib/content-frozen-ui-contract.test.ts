import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("VS-91 frozen Content list contract", () => {
  it("keeps the approved title/tagline and search", () => {
    const page = read("app/brands/[brandId]/content/page.tsx");
    expect(page).toContain("<h1>Content</h1>");
    expect(page).toContain("All your content in one place. Track, review and publish.");
    expect(page).toContain('type="search"');
    expect(page).toContain('placeholder="Search content"');
  });

  it("keeps approved user-language status tabs", () => {
    const model = read("src/lib/content-view-model.ts");
    expect(model).toContain('["all", "needs-you", "ready", "scheduled", "published"]');
    expect(model).toContain('return "Needs you"');
  });

  it("does not expose version or technical lineage in the list", () => {
    const page = read("app/brands/[brandId]/content/page.tsx");
    expect(page).not.toContain("Version {item.version}");
    expect(page).not.toContain("renderId");
    expect(page).not.toContain("campaignId}");
    expect(page).not.toContain("Truth Gate");
  });

  it("keeps thumbnail-led rows and one contextual action", () => {
    const page = read("app/brands/[brandId]/content/page.tsx");
    expect(page).toContain("styles.thumbnail");
    expect(page).toContain("item.actionLabel");
    expect(page).toContain("item.statusLabel");
    expect(page).toContain("updatedLabel(item.updatedAt)");
  });
});
