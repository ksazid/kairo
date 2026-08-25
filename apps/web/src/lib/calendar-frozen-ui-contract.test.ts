import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("VS-91 frozen Calendar contract", () => {
  it("keeps the approved title, tagline, navigation and views", () => {
    const page = read("app/brands/[brandId]/calendar/page.tsx");
    expect(page).toContain("<h1>Calendar</h1>");
    expect(page).toContain("See what’s scheduled, publishing, and already live.");
    expect(page).toContain(">Today</Link>");
    expect(page).toContain('["week", "month", "agenda"]');
    expect(page).toContain('name="arrow-left"');
    expect(page).toContain('name="arrow-right"');
  });

  it("keeps restrained Brand, channel and user-language status filters", () => {
    const page = read("app/brands/[brandId]/calendar/page.tsx");
    expect(page).toContain('name="brand"');
    expect(page).toContain('name="channel"');
    expect(page).toContain('name="status"');
    expect(page).toContain('["all", "scheduled", "publishing", "published", "needs-attention"]');
    expect(page).toContain('return "Needs attention"');
  });

  it("opens the exact Content item and keeps the failed-item Fix action", () => {
    const page = read("app/brands/[brandId]/calendar/page.tsx");
    expect(page).toContain("/content/${encodeURIComponent(item.campaignId)}/${encodeURIComponent(item.assetId)}");
    expect(page).toContain('=== "needs-attention" ? "Fix" : "View content"');
  });

  it("keeps technical publishing internals out of visible Calendar copy", () => {
    const page = read("app/brands/[brandId]/calendar/page.tsx");
    expect(page).not.toContain("Outcome requires reconciliation");
    expect(page).not.toContain("Not dispatched");
    expect(page).not.toContain("of 3 attempts");
    expect(page).not.toContain("Dispatching</");
  });

  it("keeps desktop Week and mobile compact-date-strip plus Agenda patterns", () => {
    const css = read("app/brands/[brandId]/calendar/calendar-v2.css");
    expect(css).toContain(".kcal-week-grid{display:grid");
    expect(css).toContain(".kcal-week-strip{display:none}");
    expect(css).toContain(".kcal-mobile-agenda{display:none}");
    expect(css).toContain(".kcal-week-grid{display:none}.kcal-week-strip{display:grid");
    expect(css).toContain(".kcal-mobile-agenda{display:block}");
    expect(css).toContain(".kcal-item-thumbnail");
  });
});
