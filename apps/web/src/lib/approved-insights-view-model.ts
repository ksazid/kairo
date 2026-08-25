import type { PerformanceMetricView } from "./kairo-api";

export type ApprovedMetricKey = "reach" | "saves" | "shares" | "engagement-rate";
export type ApprovedMetricPoint = { at: string; value: number };
export type ApprovedMetricSlot = {
  key: ApprovedMetricKey;
  label: "Reach" | "Saves" | "Shares" | "Engagement rate";
  value: number | null;
  formattedValue: string;
  changePct: number | null;
  series: ApprovedMetricPoint[];
};

export type ApprovedInsightsMetrics = {
  periodDays: number;
  periodLabel: string;
  slots: ApprovedMetricSlot[];
  engagementSeries: ApprovedMetricPoint[];
};

const DAY_MS = 86_400_000;
const SLOT_META: Array<{ key: ApprovedMetricKey; label: ApprovedMetricSlot["label"] }> = [
  { key: "reach", label: "Reach" },
  { key: "saves", label: "Saves" },
  { key: "shares", label: "Shares" },
  { key: "engagement-rate", label: "Engagement rate" },
];

export function buildApprovedInsightsMetrics(
  metrics: PerformanceMetricView[],
  periodDays = 30,
  nowInput: number | Date = Date.now(),
): ApprovedInsightsMetrics {
  const now = nowInput instanceof Date ? nowInput.getTime() : nowInput;
  const currentStart = now - periodDays * DAY_MS;
  const previousStart = currentStart - periodDays * DAY_MS;
  const usable = metrics.filter(
    (metric): metric is PerformanceMetricView & { value: number } =>
      metric.status === "available"
      && typeof metric.value === "number"
      && Number.isFinite(metric.value)
      && canonicalMetric(metric.name) !== null,
  );

  const slots = SLOT_META.map(({ key, label }) => {
    const allForSlot = usable.filter((metric) => canonicalMetric(metric.name) === key);
    const current = allForSlot.filter((metric) => {
      const captured = Date.parse(metric.capturedAt);
      return Number.isFinite(captured) && captured >= currentStart && captured <= now;
    });
    const previous = allForSlot.filter((metric) => {
      const captured = Date.parse(metric.capturedAt);
      return Number.isFinite(captured) && captured >= previousStart && captured < currentStart;
    });
    const value = aggregate(key, current.map((metric) => metric.value));
    const previousValue = aggregate(key, previous.map((metric) => metric.value));
    return {
      key,
      label,
      value,
      formattedValue: formatMetricValue(key, value),
      changePct: comparison(value, previousValue),
      series: dailySeries(key, current),
    } satisfies ApprovedMetricSlot;
  });

  return {
    periodDays,
    periodLabel: `Last ${periodDays} days`,
    slots,
    engagementSeries: slots.find((slot) => slot.key === "engagement-rate")?.series ?? [],
  };
}

export function canonicalMetric(name: string): ApprovedMetricKey | null {
  const normal = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (normal === "reach") return "reach";
  if (normal === "saves" || normal === "save") return "saves";
  if (normal === "shares" || normal === "share") return "shares";
  if (normal === "engagementrate") return "engagement-rate";
  return null;
}

export function formatMetricValue(key: ApprovedMetricKey, value: number | null): string {
  if (value == null) return "Unavailable";
  if (key === "engagement-rate") {
    const digits = Math.abs(value) >= 10 ? 0 : 1;
    return `${new Intl.NumberFormat("en", { maximumFractionDigits: digits }).format(value)}%`;
  }
  return new Intl.NumberFormat("en", {
    notation: Math.abs(value) >= 1000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) >= 1000 ? 1 : 0,
  }).format(value);
}

function aggregate(key: ApprovedMetricKey, values: number[]): number | null {
  if (!values.length) return null;
  if (key === "engagement-rate") return values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.reduce((sum, value) => sum + value, 0);
}

function comparison(current: number | null, previous: number | null): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function dailySeries(
  key: ApprovedMetricKey,
  metrics: Array<PerformanceMetricView & { value: number }>,
): ApprovedMetricPoint[] {
  const byDay = new Map<string, number[]>();
  for (const metric of metrics) {
    const parsed = Date.parse(metric.capturedAt);
    if (!Number.isFinite(parsed)) continue;
    const day = new Date(parsed).toISOString().slice(0, 10);
    byDay.set(day, [...(byDay.get(day) ?? []), metric.value]);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([at, values]) => ({ at, value: aggregate(key, values) ?? 0 }));
}
