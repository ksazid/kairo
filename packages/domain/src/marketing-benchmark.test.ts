import { describe, expect, it } from "vitest";
import {
  compareMarketingBenchmark,
  DEFAULT_MARKETING_BENCHMARK_POLICY,
  type MarketingBenchmarkObservation,
} from "./marketing-benchmark";

const baseline = "kairo-native-strategy";
const challenger = "corey-social-reference";

function observation(overrides: Partial<MarketingBenchmarkObservation> & Pick<MarketingBenchmarkObservation, "caseId" | "candidateSkillId">): MarketingBenchmarkObservation {
  return {
    workspaceId: "ws-1",
    brandId: "brand-1",
    capability: "carousel-strategy",
    format: "carousel",
    stage: "offline",
    truthPassed: true,
    scores: { brandFit: 80, hookQuality: 80, originality: 80, formatQuality: 80, criticScore: 80 },
    latencyMs: 1_000,
    costUsd: 0.04,
    ...overrides,
  };
}

function pairedCases(count: number, challengerOverrides: Partial<MarketingBenchmarkObservation> = {}): MarketingBenchmarkObservation[] {
  return Array.from({ length: count }, (_, index) => {
    const caseId = `case-${index + 1}`;
    return [
      observation({ caseId, candidateSkillId: baseline }),
      observation({
        caseId,
        candidateSkillId: challenger,
        scores: { brandFit: 90, hookQuality: 90, originality: 90, formatQuality: 90, criticScore: 90 },
        latencyMs: 1_100,
        costUsd: 0.045,
        ...challengerOverrides,
      }),
    ];
  }).flat();
}

describe("VS-14 Marketing Lab benchmark policy", () => {
  it("hard-rejects a challenger with any Truth failure", () => {
    const observations = pairedCases(4);
    const first = observations.find((item) => item.candidateSkillId === challenger)!;
    first.truthPassed = false;
    const result = compareMarketingBenchmark({ baselineSkillId: baseline, challengerSkillId: challenger, observations });
    expect(result.verdict).toBe("reject-challenger");
    expect(result.reasons).toContain("challenger-truth-failure");
  });

  it("returns insufficient evidence when paired case coverage is below policy", () => {
    const result = compareMarketingBenchmark({ baselineSkillId: baseline, challengerSkillId: challenger, observations: pairedCases(2) });
    expect(result.verdict).toBe("insufficient-evidence");
  });

  it("keeps Kairo Native on a tie or immaterial improvement", () => {
    const observations = pairedCases(4, { scores: { brandFit: 82, hookQuality: 82, originality: 82, formatQuality: 82, criticScore: 82 } });
    const result = compareMarketingBenchmark({ baselineSkillId: baseline, challengerSkillId: challenger, observations });
    expect(result.verdict).toBe("keep-baseline");
    expect(result.qualityDelta).toBeLessThan(DEFAULT_MARKETING_BENCHMARK_POLICY.minQualityDelta);
  });

  it("advances a materially stronger offline challenger only to shadow", () => {
    const result = compareMarketingBenchmark({ baselineSkillId: baseline, challengerSkillId: challenger, observations: pairedCases(4) });
    expect(result.verdict).toBe("advance-to-shadow");
    expect(result.qualityDelta).toBeGreaterThanOrEqual(DEFAULT_MARKETING_BENCHMARK_POLICY.minQualityDelta);
  });

  it("blocks advancement when the challenger exceeds cost or latency ceilings", () => {
    const expensive = compareMarketingBenchmark({ baselineSkillId: baseline, challengerSkillId: challenger, observations: pairedCases(4, { costUsd: 0.2 }) });
    expect(expensive.verdict).toBe("keep-baseline");
    expect(expensive.reasons).toContain("cost-regression");

    const slow = compareMarketingBenchmark({ baselineSkillId: baseline, challengerSkillId: challenger, observations: pairedCases(4, { latencyMs: 4_000 }) });
    expect(slow.verdict).toBe("keep-baseline");
    expect(slow.reasons).toContain("latency-regression");
  });

  it("requires human preference and edit-distance evidence before a shadow challenger can advance to live", () => {
    const missingHuman = pairedCases(4).map((item) => ({ ...item, stage: "shadow" as const }));
    expect(compareMarketingBenchmark({ baselineSkillId: baseline, challengerSkillId: challenger, observations: missingHuman }).verdict).toBe("insufficient-evidence");

    const withHuman = missingHuman.map((item) => item.candidateSkillId === baseline
      ? { ...item, humanPreferenceScore: 45, editDistancePercent: 20 }
      : { ...item, humanPreferenceScore: 70, editDistancePercent: 8 });
    expect(compareMarketingBenchmark({ baselineSkillId: baseline, challengerSkillId: challenger, observations: withHuman }).verdict).toBe("advance-to-live");
  });

  it("requires comparable live samples and performance improvement before Brand qualification", () => {
    const live = pairedCases(4).map((item) => item.candidateSkillId === baseline
      ? { ...item, stage: "live" as const, humanPreferenceScore: 45, editDistancePercent: 20, realWorldPerformance: { normalizedScore: 70, sampleSize: 12 } }
      : { ...item, stage: "live" as const, humanPreferenceScore: 70, editDistancePercent: 8, realWorldPerformance: { normalizedScore: 82, sampleSize: 12 } });
    const qualified = compareMarketingBenchmark({ baselineSkillId: baseline, challengerSkillId: challenger, observations: live });
    expect(qualified.verdict).toBe("qualified-for-brand");
    expect(qualified.brandId).toBe("brand-1");
    expect(qualified.capability).toBe("carousel-strategy");
    expect(qualified.format).toBe("carousel");

    const tooSmall = live.map((item) => ({ ...item, realWorldPerformance: { normalizedScore: item.candidateSkillId === baseline ? 70 : 82, sampleSize: 2 } }));
    expect(compareMarketingBenchmark({ baselineSkillId: baseline, challengerSkillId: challenger, observations: tooSmall }).verdict).toBe("insufficient-evidence");
  });

  it("refuses to aggregate different Brands into one winner", () => {
    const observations = pairedCases(4);
    observations[0] = { ...observations[0]!, brandId: "brand-2" };
    expect(compareMarketingBenchmark({ baselineSkillId: baseline, challengerSkillId: challenger, observations }).verdict).toBe("insufficient-evidence");
  });
});
