import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("approved Home screenshot contract", () => {
  it("uses shell context for Home and removes the rejected page hero", () => {
    const page = read("app/page.tsx");
    expect(page).toContain('<h1 className={styles.srOnly}>Home</h1>');
    expect(page).not.toContain("What needs you, what to create next, and what Kairo is handling.");
    expect(page).not.toContain("The one thing that needs you now.");
    expect(page).not.toContain("Have something in mind?");
    expect(page).not.toContain("<KairoScopePicker");
  });

  it("matches the approved compact attention card", () => {
    const page = read("app/page.tsx");
    const css = read("app/home-vs85.module.css");
    expect(page).toContain("Needs attention");
    expect(page).toContain('KairoIcon name="warning"');
    expect(page).toContain("retryButton");
    expect(page).toContain("attentionChevron");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) 58px 16px");
    expect(css).toContain("height:30px");
  });

  it("matches the approved My idea hierarchy and four source cells", () => {
    const page = read("app/page.tsx");
    const composer = read("app/my-idea-composer.tsx");
    const css = read("app/home-vs85.module.css");
    expect(page).toContain("My idea");
    expect(page).toContain("Share your thought and let Kairo recommend the best format.");
    expect(composer).toContain('placeholder="What do you want to create?"');
    expect(composer).toContain('KairoIcon name="link"');
    expect(composer).toContain('KairoIcon name="image"');
    expect(composer).toContain('KairoIcon name="video"');
    expect(composer).toContain('KairoIcon name="plus"');
    expect(composer).toContain("Recommend format");
    expect(composer).toContain("Kairo recommends the format before it creates anything.");
    expect(css).toContain("grid-template-columns: repeat(4, minmax(0, 1fr))");
    expect(css).toContain("height:38px");
  });

  it("keeps the dense approved For you rail on mobile", () => {
    const page = read("app/page.tsx");
    const action = read("app/for-you-recommendations-action.tsx");
    const css = read("app/home-vs85.module.css");
    expect(page).toContain("For you");
    expect(page).toContain("Smart recommendations based on your brand and goals.");
    expect(page).toContain("ForYouRecommendationsAction");
    expect(action).toContain("Get recommendations");
    expect(action).toContain("Refresh recommendations");
    expect(action).toContain('KairoIcon name="sparkles"');
    expect(page).toContain('KairoIcon name="bookmark"');
    expect(page).toContain("railProgress");
    expect(css).toContain("grid-auto-flow: column");
    expect(css).toContain("grid-auto-columns: 114px");
    expect(css).toContain("height:88px");
  });

  it("keeps all four What’s working cards in one mobile row", () => {
    const page = read("app/page.tsx");
    const css = read("app/home-vs85.module.css");
    expect(page).toContain("What&apos;s working");
    expect(page).toContain("A quick pulse of your content performance.");
    expect(page).toContain("Last 7 days");
    for (const metric of ["Reach", "Saves", "Shares", "Engagement rate"]) expect(page).toContain(metric);
    expect(css).toContain("grid-template-columns: repeat(4, minmax(0, 1fr))");
    expect(css).not.toContain("@media (max-width: 430px)");
  });

  it("removes legacy Home workflow and duplicate sections", () => {
    const page = read("app/page.tsx");
    for (const forbidden of ["Research", "Hunter", "Angles", "Critic", "Claims", "Truth Gate", "Up Next", "Continue"]) expect(page).not.toContain(forbidden);
    expect(page).not.toContain("buildUpNext");
    expect(page).not.toContain("buildContinue");
  });
});
