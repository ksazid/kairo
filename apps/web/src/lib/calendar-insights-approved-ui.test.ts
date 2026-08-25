import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const calendarPage = readFileSync(resolve(root, "app/brands/[brandId]/calendar/page.tsx"), "utf8");
const calendarCss = readFileSync(resolve(root, "app/brands/[brandId]/calendar/calendar-approved.module.css"), "utf8");
const insightsPage = readFileSync(resolve(root, "app/brands/[brandId]/performance/page.tsx"), "utf8");
const insightsCss = readFileSync(resolve(root, "app/brands/[brandId]/performance/insights-approved.module.css"), "utf8");
const portraitShell = readFileSync(resolve(root, "app/approved-portrait-shell.css"), "utf8");

describe("VS-94 approved Calendar and Insights bitmap contract", () => {
  it("locks Calendar to the supplied portrait hierarchy", () => {
    expect(calendarPage).toContain("<h1>Calendar</h1>");
    expect(calendarPage).toContain(">Today</Link>");
    expect(calendarPage).toContain(">Week</Link>");
    expect(calendarPage).toContain(">Month</Link>");
    expect(calendarPage).toContain(">Agenda</Link>");
    expect(calendarPage).toContain("Filter calendar");
    expect(calendarPage).toContain("dayHeading");
    expect(calendarPage).toContain("CalendarCard");
    expect(calendarPage).not.toContain("Plan the week. Keep publishing visible.");
    expect(calendarPage).not.toContain("Publishing schedule</h2>");
  });

  it("routes every Calendar card directly to Content Preview", () => {
    expect(calendarPage).toContain("contentPreviewHref(item)");
    expect(calendarPage).toContain("/content/${encodeURIComponent(item.campaignId)}/${encodeURIComponent(item.assetId)}");
    expect(calendarPage).not.toContain('href={`/brands/${encodeURIComponent(item.brandId)}/content`}');
  });

  it("locks the approved 728px Calendar geometry", () => {
    expect(calendarCss).toContain("width: min(100%, 760px)");
    expect(calendarCss).toContain("grid-template-columns: minmax(0, 500px) 58px");
    expect(calendarCss).toContain("grid-template-columns: 34px repeat(7, minmax(0, 1fr)) 34px");
    expect(calendarCss).toContain("min-height: 130px");
    expect(calendarCss).toContain("grid-template-columns: 80px 124px minmax(0, 1fr) 132px 24px");
    expect(calendarCss).toContain("width: 124px");
    expect(calendarCss).toContain("height: 100px");
  });

  it("locks Insights to the supplied creator-facing hierarchy", () => {
    expect(insightsPage).toContain("<h1>Insights</h1>");
    expect(insightsPage).toContain("What happened, why it happened, and what to do next.");
    expect(insightsPage).toContain("What happened</h2>");
    expect(insightsPage).toContain("Engagement trend");
    expect(insightsPage).toContain("Why it happened</h2>");
    expect(insightsPage).toContain("What to do next</h2>");
    expect(insightsPage).toContain("Create similar");
    expect(insightsPage).not.toContain("Candidate Learnings");
    expect(insightsPage).not.toContain("Decision brief");
    expect(insightsPage).not.toContain("Measured channel observations");
    expect(insightsPage).not.toContain("Experiments</h2>");
  });

  it("locks the exact four performance slots and truthful trend behavior", () => {
    expect(insightsPage).toContain("metricView.slots.map");
    expect(insightsPage).toContain("Engagement trend will appear when at least two real engagement-rate observations are available");
    expect(insightsPage).toContain("No comparable prior period");
    expect(insightsPage).not.toContain("12.4K");
    expect(insightsPage).not.toContain("6.7%");
  });

  it("locks the approved 728px Insights and shared shell geometry", () => {
    expect(insightsCss).toContain("grid-template-columns: repeat(4, minmax(0, 1fr))");
    expect(insightsCss).toContain("min-height: 184px");
    expect(insightsCss).toContain("height: 235px");
    expect(insightsCss).toContain("min-height: 111px");
    expect(insightsCss).toContain("min-height: 166px");
    expect(portraitShell).toContain("min-height: 102px");
    expect(portraitShell).toContain("width: 52px !important");
    expect(portraitShell).toContain("height: 86px");
    expect(portraitShell).toContain("k-shell--portrait-reference");
  });
});
