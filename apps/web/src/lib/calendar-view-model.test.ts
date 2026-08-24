import { describe, expect, it } from "vitest";
import {
  addCalendarMonths,
  addCalendarWeeks,
  applyCalendarFilters,
  buildCalendarMonth,
  buildCalendarWeek,
  calendarWeekRangeIso,
  isCalendarView,
  parseCalendarDay,
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

describe("calendar view model", () => {
  it("parses a valid month and falls back deterministically for invalid input", () => {
    const fallback = new Date("2026-08-17T12:00:00.000Z");
    expect(parseCalendarMonth("2026-02", fallback).toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(parseCalendarMonth("not-a-month", fallback).toISOString()).toBe("2026-08-01T00:00:00.000Z");
  });

  it("parses a valid UTC day and rejects impossible dates", () => {
    const fallback = new Date("2026-08-19T12:00:00.000Z");
    expect(parseCalendarDay("2026-08-24", fallback).toISOString()).toBe("2026-08-24T00:00:00.000Z");
    expect(parseCalendarDay("2026-02-31", fallback).toISOString()).toBe("2026-08-19T00:00:00.000Z");
    expect(parseCalendarDay("bad", fallback).toISOString()).toBe("2026-08-19T00:00:00.000Z");
  });

  it("accepts only the three approved Calendar view modes", () => {
    expect(isCalendarView("week")).toBe(true);
    expect(isCalendarView("month")).toBe(true);
    expect(isCalendarView("agenda")).toBe(true);
    expect(isCalendarView("grid")).toBe(false);
  });

  it("moves between months without day overflow", () => {
    const january = new Date("2026-01-01T00:00:00.000Z");
    expect(addCalendarMonths(january, 1).toISOString()).toBe("2026-02-01T00:00:00.000Z");
    expect(addCalendarMonths(january, -1).toISOString()).toBe("2025-12-01T00:00:00.000Z");
  });

  it("moves between Monday-first weeks across month boundaries", () => {
    const anchor = new Date("2026-08-19T12:00:00.000Z");
    expect(addCalendarWeeks(anchor, 1).toISOString()).toBe("2026-08-24T00:00:00.000Z");
    expect(addCalendarWeeks(anchor, -1).toISOString()).toBe("2026-08-10T00:00:00.000Z");
  });

  it("builds a Monday-first week and assigns entries to truthful UTC dates", () => {
    const week = buildCalendarWeek(new Date("2026-08-19T12:00:00.000Z"), [
      item({ id: "monday", scheduledFor: "2026-08-17T23:59:59.000Z" }),
      item({ id: "sunday", scheduledFor: "2026-08-23T00:00:00.000Z" }),
    ]);

    expect(week.weekKey).toBe("2026-08-17");
    expect(week.label).toBe("17–23 August 2026");
    expect(week.days).toHaveLength(7);
    expect(week.days[0]?.weekday).toBe("Mon");
    expect(week.days.at(-1)?.weekday).toBe("Sun");
    expect(week.days[0]?.entries.map((entry) => entry.id)).toEqual(["monday"]);
    expect(week.days.at(-1)?.entries.map((entry) => entry.id)).toEqual(["sunday"]);
  });

  it("formats cross-month week labels without losing the year", () => {
    const week = buildCalendarWeek(new Date("2026-09-02T00:00:00.000Z"), []);
    expect(week.label).toBe("31 August–6 September 2026");
  });

  it("creates an inclusive exact week query range", () => {
    expect(calendarWeekRangeIso(new Date("2026-08-19T00:00:00.000Z"))).toEqual({
      from: "2026-08-17T00:00:00.000Z",
      to: "2026-08-23T23:59:59.999Z",
    });
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

  it.each([
    ["2026-02-01T00:00:00.000Z", 28],
    ["2028-02-01T00:00:00.000Z", 29],
    ["2026-04-01T00:00:00.000Z", 30],
    ["2026-08-01T00:00:00.000Z", 31],
  ])("keeps the correct in-month day count for %s", (monthStart, expectedDays) => {
    const month = buildCalendarMonth(new Date(monthStart), []);
    expect(month.days.filter((day) => day.inMonth)).toHaveLength(expectedDays);
  });

  it("keeps leap day in the correct month", () => {
    const month = buildCalendarMonth(new Date("2028-02-01T00:00:00.000Z"), []);
    expect(month.days.some((day) => day.dateKey === "2028-02-29" && day.inMonth)).toBe(true);
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
