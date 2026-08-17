export type CalendarChannel = "linkedin" | "instagram" | "manual";
export type CalendarStatus = "scheduled" | "dispatching" | "published" | "failed" | "unknown" | "manual-required" | "cancelled";

export interface CalendarFilterable {
  id: string;
  brandId: string;
  campaignId: string;
  channel: CalendarChannel;
  status: CalendarStatus;
  scheduledFor: string;
}

export interface CalendarFilters {
  brandId?: string;
  campaignId?: string;
  channel?: CalendarChannel | "all";
  status?: CalendarStatus | "all";
}

export interface CalendarDay<T extends CalendarFilterable> {
  dateKey: string;
  date: Date;
  dayNumber: number;
  inMonth: boolean;
  entries: T[];
}

export interface CalendarMonth<T extends CalendarFilterable> {
  monthStart: Date;
  monthKey: string;
  label: string;
  rangeStart: Date;
  rangeEnd: Date;
  days: Array<CalendarDay<T>>;
}

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DAY_MS = 86_400_000;

export function parseCalendarMonth(value: string | undefined, fallback = new Date()): Date {
  const match = value?.match(MONTH_PATTERN);
  if (match) return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  return new Date(Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), 1));
}

export function addCalendarMonths(monthStart: Date, amount: number): Date {
  return new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + amount, 1));
}

export function calendarMonthKey(value: Date): string {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function buildCalendarMonth<T extends CalendarFilterable>(monthStartInput: Date, entries: T[]): CalendarMonth<T> {
  const monthStart = new Date(Date.UTC(monthStartInput.getUTCFullYear(), monthStartInput.getUTCMonth(), 1));
  const mondayIndex = (monthStart.getUTCDay() + 6) % 7;
  const rangeStart = new Date(monthStart.getTime() - mondayIndex * DAY_MS);
  const rangeEnd = new Date(rangeStart.getTime() + 41 * DAY_MS);
  const byDate = new Map<string, T[]>();

  for (const entry of entries) {
    const dateKey = entry.scheduledFor.slice(0, 10);
    byDate.set(dateKey, [...(byDate.get(dateKey) ?? []), entry]);
  }

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(rangeStart.getTime() + index * DAY_MS);
    const dateKey = date.toISOString().slice(0, 10);
    return {
      dateKey,
      date,
      dayNumber: date.getUTCDate(),
      inMonth: date.getUTCMonth() === monthStart.getUTCMonth() && date.getUTCFullYear() === monthStart.getUTCFullYear(),
      entries: [...(byDate.get(dateKey) ?? [])].sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor)),
    } satisfies CalendarDay<T>;
  });

  return {
    monthStart,
    monthKey: calendarMonthKey(monthStart),
    label: monthStart.toLocaleDateString("en", { month: "long", year: "numeric", timeZone: "UTC" }),
    rangeStart,
    rangeEnd,
    days,
  };
}

export function applyCalendarFilters<T extends CalendarFilterable>(entries: T[], filters: CalendarFilters): T[] {
  return entries.filter((entry) => {
    if (filters.brandId && filters.brandId !== "all" && entry.brandId !== filters.brandId) return false;
    if (filters.campaignId && filters.campaignId !== "all" && entry.campaignId !== filters.campaignId) return false;
    if (filters.channel && filters.channel !== "all" && entry.channel !== filters.channel) return false;
    if (filters.status && filters.status !== "all" && entry.status !== filters.status) return false;
    return true;
  });
}

export function calendarRangeIso(monthStart: Date): { from: string; to: string } {
  const month = buildCalendarMonth(monthStart, []);
  return {
    from: `${month.rangeStart.toISOString().slice(0, 10)}T00:00:00.000Z`,
    to: `${month.rangeEnd.toISOString().slice(0, 10)}T23:59:59.999Z`,
  };
}
