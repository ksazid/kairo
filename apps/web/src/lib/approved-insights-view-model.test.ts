import { describe, expect, it } from "vitest";
import { buildApprovedInsightsMetrics, canonicalMetric } from "./approved-insights-view-model";
import type { PerformanceMetricView } from "./kairo-api";

const NOW = Date.parse("2026-06-10T12:00:00.000Z");

function metric(name: string, value: number, capturedAt: string, id = `${name}-${capturedAt}`): PerformanceMetricView {
  return {
    id,
    workspaceId: "workspace-1",
    brandId: "brand-1",
    publishedPostId: `post-${id}`,
    name,
    capturedAt,
    status: "available",
    value,
    sourceSnapshotId: `snapshot-${id}`,
    sourceField: name,
    transformationVersion: "v1",
  };
}

describe("approved Insights metric derivation", () => {
  it("keeps exactly the four approved slots", () => {
    const view = buildApprovedInsightsMetrics([], 30, NOW);
    expect(view.slots.map((slot) => slot.label)).toEqual(["Reach", "Saves", "Shares", "Engagement rate"]);
    expect(view.slots.every((slot) => slot.value === null && slot.formattedValue === "Unavailable")).toBe(true);
  });

  it("does not reinterpret generic engagement as engagement rate", () => {
    expect(canonicalMetric("engagement")).toBeNull();
    expect(canonicalMetric("engagement_rate")).toBe("engagement-rate");
    const view = buildApprovedInsightsMetrics([
      metric("engagement", 99, "2026-06-09T12:00:00.000Z"),
    ], 30, NOW);
    expect(view.slots.find((slot) => slot.key === "engagement-rate")?.value).toBeNull();
  });

  it("derives current values, prior-period deltas and real daily series only from available observations", () => {
    const metrics: PerformanceMetricView[] = [
      metric("reach", 1000, "2026-06-01T12:00:00.000Z", "reach-a"),
      metric("reach", 1500, "2026-06-08T12:00:00.000Z", "reach-b"),
      metric("reach", 2000, "2026-05-01T12:00:00.000Z", "reach-prev"),
      metric("saves", 30, "2026-06-02T12:00:00.000Z", "saves-a"),
      metric("shares", 12, "2026-06-03T12:00:00.000Z", "shares-a"),
      metric("engagement-rate", 6, "2026-06-01T12:00:00.000Z", "rate-a"),
      metric("engagement_rate", 8, "2026-06-08T12:00:00.000Z", "rate-b"),
      metric("engagement rate", 5, "2026-05-01T12:00:00.000Z", "rate-prev"),
      {
        ...metric("reach", 9999, "2026-06-09T12:00:00.000Z", "unavailable"),
        status: "unavailable",
        value: undefined,
        reason: "provider-did-not-return",
      },
    ];
    const view = buildApprovedInsightsMetrics(metrics, 30, NOW);
    const reach = view.slots.find((slot) => slot.key === "reach")!;
    const rate = view.slots.find((slot) => slot.key === "engagement-rate")!;

    expect(reach.value).toBe(2500);
    expect(reach.formattedValue).toBe("2.5K");
    expect(reach.changePct).toBe(25);
    expect(reach.series).toEqual([
      { at: "2026-06-01", value: 1000 },
      { at: "2026-06-08", value: 1500 },
    ]);
    expect(rate.value).toBe(7);
    expect(rate.formattedValue).toBe("7%");
    expect(rate.changePct).toBe(40);
    expect(view.engagementSeries).toEqual(rate.series);
  });
});
