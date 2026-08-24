import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("VS-88 Calendar + Insights UI contract", () => {
  it("keeps Calendar week-first, on the shared shell and out of Campaign management", () => {
    const page = read("app/brands/[brandId]/calendar/page.tsx");

    expect(page).toContain('KairoProductShell');
    expect(page).toContain('active="Calendar"');
    expect(page).toContain(': "week"');
    expect(page).toContain('buildCalendarWeek');
    expect(page).toContain('kcal-week-strip');
    expect(page).toContain('/content`');
    expect(page).not.toContain('PilotMobileNav');
    expect(page).not.toContain('KairoSidebar');
    expect(page).not.toContain('/campaigns/');
    expect(page).not.toContain('Content Studio');
  });

  it("keeps mobile Calendar agenda-first rather than depending on the month grid", () => {
    const css = read("app/brands/[brandId]/calendar/calendar-v2.css");

    expect(css).toContain('.kcal-week-grid{display:none}');
    expect(css).toContain('.kcal-week-strip{display:grid');
    expect(css).toContain('.kcal-month-grid{display:none}');
  });

  it("presents Insights as What happened, Why, What next and removes channel management", () => {
    const page = read("app/brands/[brandId]/performance/page.tsx");

    expect(page).toContain('eyebrow">Insights');
    expect(page).toContain('What happened?');
    expect(page).toContain('Why might it have happened?');
    expect(page).toContain('What should we try next?');
    expect(page).toContain('Unavailable');
    expect(page).not.toContain('ChannelConnection');
    expect(page).not.toContain('Instagram connection');
    expect(page).not.toContain('getChannelAccounts');
  });

  it("uses Insights language in recommendation feedback while preserving the compatibility route", () => {
    const feedback = read("app/performance-feedback.tsx");

    expect(feedback).toContain('Insights feedback');
    expect(feedback).toContain('Open Insights');
    expect(feedback).toContain('/performance`');
    expect(feedback).not.toContain('Inspect Performance');
  });
});
