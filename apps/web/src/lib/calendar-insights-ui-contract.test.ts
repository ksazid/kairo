import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("Calendar + Insights UI compatibility contract", () => {
  it("keeps Calendar week-first, on the shared shell, and links cards to Content Preview", () => {
    const page = read("app/brands/[brandId]/calendar/page.tsx");

    expect(page).toContain("KairoProductShell");
    expect(page).toContain('active="Calendar"');
    expect(page).toContain(': "week"');
    expect(page).toContain("buildCalendarWeek");
    expect(page).toContain("weekStrip");
    expect(page).toContain("contentPreviewHref(item)");
    expect(page).toContain("item.campaignId");
    expect(page).toContain("item.assetId");
    expect(page).not.toContain("PilotMobileNav");
    expect(page).not.toContain("KairoSidebar");
    expect(page).not.toContain("/campaigns/");
    expect(page).not.toContain("Content Studio");
  });

  it("keeps Calendar agenda responsive without forcing the old month-grid implementation", () => {
    const css = read("app/brands/[brandId]/calendar/calendar-approved.module.css");

    expect(css).toContain(".weekStrip");
    expect(css).toContain(".agenda");
    expect(css).toContain(".monthGrid");
    expect(css).toContain("@media (max-width: 599px)");
    expect(css).not.toContain(".kcal-week-grid");
  });

  it("presents Insights with the approved creator-facing hierarchy and removes channel management", () => {
    const page = read("app/brands/[brandId]/performance/page.tsx");
    const metricView = read("src/lib/approved-insights-view-model.ts");

    expect(page).toContain("<h1>Insights</h1>");
    expect(page).toContain("What happened, why it happened, and what to do next.");
    expect(page).toContain("What happened</h2>");
    expect(page).toContain("Why it happened</h2>");
    expect(page).toContain("What to do next</h2>");
    expect(metricView).toContain('formattedValue: "Unavailable"');
    expect(page).not.toContain("ChannelConnection");
    expect(page).not.toContain("Instagram connection");
    expect(page).not.toContain("getChannelAccounts");
    expect(page).not.toContain("Candidate Learnings");
    expect(page).not.toContain("Decision brief");
  });

  it("uses Insights language in recommendation feedback while preserving the compatibility route", () => {
    const feedback = read("app/performance-feedback.tsx");

    expect(feedback).toContain("Insights feedback");
    expect(feedback).toContain("Open Insights");
    expect(feedback).toContain("/performance`");
    expect(feedback).not.toContain("Inspect Performance");
  });
});
