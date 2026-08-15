import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");

describe("VS-21 pilot navigation contract", () => {
  it("Today and Discover expose the implemented Campaigns, Calendar and Performance routes", () => {
    const today = source("../app/page.tsx");
    const discover = source("../app/brands/[brandId]/discover/page.tsx");
    for (const page of [today, discover]) {
      expect(page).toContain("/campaigns");
      expect(page).toContain("/calendar");
      expect(page).toContain("/performance");
      expect(page).toContain("/more");
    }
  });

  it("mobile navigation reaches Calendar and the More hub instead of disabling implemented workflow areas", () => {
    const nav = source("../app/pilot-mobile-nav.tsx");
    expect(nav).toContain("/calendar");
    expect(nav).toContain("/more");
    expect(nav).not.toContain("aria-disabled");
  });

  it("the mobile More hub exposes the existing pilot management surfaces", () => {
    const more = source("../app/brands/[brandId]/more/page.tsx");
    expect(more).toContain("/campaigns");
    expect(more).toContain("/performance");
    expect(more).toContain("/brain");
    expect(more).toContain("/operations");
  });

  it("Campaigns, Content Studio, Performance and Operations keep the mobile pilot navigation mounted", () => {
    const pages = [
      source("../app/brands/[brandId]/campaigns/page.tsx"),
      source("../app/brands/[brandId]/campaigns/[campaignId]/page.tsx"),
      source("../app/brands/[brandId]/performance/page.tsx"),
      source("../app/brands/[brandId]/operations/page.tsx"),
    ];
    for (const page of pages) expect(page).toContain("PilotMobileNav");
  });

  it("high-risk pilot read surfaces expose local loading and recoverable error boundaries", () => {
    for (const area of ["calendar", "performance", "operations"]) {
      const loading = source(`../app/brands/[brandId]/${area}/loading.tsx`);
      const error = source(`../app/brands/[brandId]/${area}/error.tsx`);
      expect(loading).toContain("aria-busy");
      expect(error).toContain("reset()");
      expect(error).toContain("Retry");
    }
  });
});
