import { describe, expect, it } from "vitest";
import {
  addCalendarMonths,
  applyCalendarFilters,
  buildCalendarMonth,
  parseCalendarMonth,
  type CalendarFilterable,
} from "./calendar-view-model";

function item(overrides: Partial<CalendarFilterable> = {}): CalendarFilterable {
  return {
    id: "cmd-1",
    brandId: "brand-a",
    campaignId: "campaign-a",
    channel: "instagram",
    status: "scheduled",
    scheduledFor: "2026-08-17T09:00:00.000Z",
    ...overrides,
  };
}

describe("VS-32 calendar view model", () => {
  it("parses a valid month and falls back deterministically for invalid input", () => {
    const fallback = new Date("2026-08-17T12:00:00.000Z");
    expect(parseCalendarMonth("2026-02", fallback).toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(parseCalendarMonth("not-a-month", fallback).toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });

  it("moves between months without day overflow", () => {
    const january = new Date("2026-01-01T00:00:00.000Z");
    expect(addCalendarMonths(january, 1).toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(addCalendarMonths(january, -1).toISOString()).toBe("2025-12-01T00:00:00.000Z");
  });

  it("builds a Monday-first six-week grid and assigns entries to truthful UTC dates", () => {
    const month = buildCalendarMonth(new Date("2026-08-01T00:00:00.000Z"), [
      item({ id: "first", scheduledFor: "2026-08-01T23:59:59.000Z" }),
      item({ id: "last", scheduledFor: "2026-08-31T00:00:00.000Z" }),
    ]);

    expect(month.days).toHaveLength(42);
    expect(month.days[0]?.dateKey).toBe("2026-07-27");
    expect(month.days.at(-1)?.dateKey).toBe("2026-09-06");
    expect(month.days.find((day) => day.dateKey === "2026-08-01")?.entries.map((entry) => entry.id)).toEqual(["first"]);
    expect(month.days.find((day) => day.dateKey === "2026-08-31")?.entries.map((entry) => entry.id)).toEqual(["last"]);
  });

  it("handles leap-year February boundaries", () => {
    const month = buildCalendarMonth(new Date("2028-02-01T00:00:00.000Z"), []);
    expect(month.days.some((day) => day.dateKey === "2028-02-29" && day.inMonth)).toBe(true);
    expect(month.days.filter((day) => day.inMonth)).toHaveLength(29);
  });

  it("combines brand, campaign, channel and status filters without changing entries", () => {
    const source = [
      item({ id: "match" }),
      item({ id: "wrong-brand", brandId: "brand-b" }),
      item({ id: "wrong-campaign", campaignId: "campaign-b" }),
      item({ id: "wrong-channel", channel: "linkedin" }),
      item({ id: "wrong-status", status: "published" }),
    ];

    const filtered = applyCalendarFilters(source, {
      brandId: "brand-a",
      campaignId: "campaign-a",
      channel: "instagram",
      status: "scheduled",
    });

    expect(filtered.map((entry) => entry.id)).toEqual(["match"]);
    expect(source).toHaveLength(5);
  });

  it("treats omitted or all filters as unfiltered", () => {
    const source = [item({ id: "one" }), item({ id: "two", brandId: "brand-b", channel: "linkedin", status: "published" })];
    expect(applyCalendarFilters(source, {})).toEqual(source);
    expect(applyCalendarFilters(source, { brandId: "all", campaignId: "all", channel: "all", status: "all" })).toEqual(source);
  });
});
