import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("VS-91 frozen Insights / Results contract", () => {
  it("keeps the approved title, tagline and date/filter controls", () => {
    const page = read("app/brands/[brandId]/performance/page.tsx");
    expect(page).toContain("<h1>Insights</h1>");
    expect(page).toContain("See what&apos;s working, why, and what to do next.");
    expect(page).toContain('name="period"');
    expect(page).toContain('name="metric"');
    expect(page).toContain("Last 30 days");
  });

  it("keeps the approved three-part decision hierarchy", () => {
    const page = read("app/brands/[brandId]/performance/page.tsx");
    expect(page).toContain("What happened");
    expect(page).toContain("Why it may have happened");
    expect(page).toContain("What to try next");
    expect(page).toContain("Ranked next actions");
  });

  it("uses real metrics for summary sparklines and one selected trend chart", () => {
    const page = read("app/brands/[brandId]/performance/page.tsx");
    expect(page).toContain("<Sparkline values={series.map((item) => item.value)}");
    expect(page).toContain("<TrendChart values={trendSeries.map((item) => item.value)}");
    expect(page).toContain('metric.status === "available" && typeof metric.value === "number"');
  });

  it("does not expose learning-state, experiment-engine or raw-post machinery", () => {
    const page = read("app/brands/[brandId]/performance/page.tsx");
    expect(page).not.toContain("Candidate Learnings");
    expect(page).not.toContain("Accept Learning");
    expect(page).not.toContain("Inspect evidence and scope");
    expect(page).not.toContain("Inspect variants");
    expect(page).not.toContain("<code>{postId}</code>");
    expect(page).not.toContain("% confidence");
  });

  it("shows truthful unavailable states instead of fabricating channel or top-content data", () => {
    const page = read("app/brands/[brandId]/performance/page.tsx");
    expect(page).toContain("Channel-level results are not available yet.");
    expect(page).toContain("Top-content ranking is not available yet.");
    expect(page).toContain("only when performance observations include real channel attribution");
    expect(page).toContain("only when measured results can be matched to user-facing content details");
  });
});
