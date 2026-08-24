import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("VS-87 Content UI contract", () => {
  it("keeps Content as a user-facing library instead of Campaign management", () => {
    const navigation = read("src/lib/product-navigation.ts");
    const page = read("app/brands/[brandId]/content/page.tsx");

    expect(navigation).toContain('`${base}/content`');
    expect(page).toContain('CONTENT_FILTERS');
    expect(page).toContain('Review what Kairo has prepared.');
    expect(page).not.toContain('New Campaign');
    expect(page).not.toContain('Content Assets</Link>');
  });

  it("uses the canonical exact-version Content Detail and approved approval language", () => {
    const detail = read("app/brands/[brandId]/content/[campaignId]/[assetId]/page.tsx");

    expect(detail).toContain('Exact current version');
    expect(detail).toContain('getCarouselReview');
    expect(detail).toContain('Content channel previews');
    expect(detail).toContain('Approve &amp; Lock');
    expect(detail).toContain('eligibleAccounts.map');
    expect(detail).not.toContain('Destination account reference');
    expect(detail).not.toContain('Research → Critic');
  });

  it("keeps Publish now primary and Schedule for later secondary", () => {
    const schedule = read("app/brands/[brandId]/campaigns/[campaignId]/schedule-form.tsx");

    expect(schedule).toContain('Publish now');
    expect(schedule).toContain('Schedule for later');
    expect(schedule.indexOf('Publish now')).toBeLessThan(schedule.indexOf('Schedule for later'));
  });

  it("keeps exact carousel and Reel sub-surfaces inside Content language", () => {
    const carousel = read("app/brands/[brandId]/campaigns/[campaignId]/carousel/[assetId]/page.tsx");
    const video = read("app/brands/[brandId]/campaigns/[campaignId]/video/[assetId]/page.tsx");

    expect(carousel).toContain('← Content preview');
    expect(carousel).toContain('Lock final render');
    expect(video).toContain('← Content preview');
    expect(video).toContain('Reel editor');
    expect(video).not.toContain('Content Studio');
    expect(video).not.toContain('VS-54');
    expect(video).not.toContain('VS-18/VS-20');
  });
});
