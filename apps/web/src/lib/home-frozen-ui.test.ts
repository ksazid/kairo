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

  it("removes the legacy attention card from the approved Home", () => {
    const page = read("app/page.tsx");
    expect(page).not.toContain("Needs attention");
    expect(page).not.toContain("retryButton");
    expect(page).not.toContain("attentionChevron");
  });

  it("locks the approved viral-link analysis flow", () => {
    const page = read("app/page.tsx");
    const viral = read("app/home-viral-link.tsx");
    expect(page).toContain("HomeViralLink");
    expect(viral).toContain("Have a viral idea?");
    expect(viral).toContain("Analyse link");
    expect(viral).toContain("Concept preview · not generated content");
  });

  it("uses the compact Discover more rail from the approved mockup", () => {
    const page = read("app/page.tsx");
    expect(page).toContain("Discover more");
    expect(page).toContain("discoverMiniRail");
    expect(page).toContain("ForYouCreateAction");
    expect(page).not.toContain("RecommendationRail");
    expect(page).not.toContain("ForYouSelectCheckbox");
  });

  it("uses the approved three-panel Home footer", () => {
    const page = read("app/page.tsx");
    for (const title of ["Continue working", "What Kairo learned", "Discover more"]) expect(page).toContain(title);
    expect(page).toContain("homeBottomGrid");
    expect(page).not.toContain("What&apos;s working");
  });

  it("removes legacy Home workflow and duplicate sections", () => {
    const page = read("app/page.tsx");
    for (const forbidden of ["Research", "Hunter", "Angles", "Critic", "Claims", "Truth Gate", "Up Next"]) expect(page).not.toContain(forbidden);
    expect(page).not.toContain("buildUpNext");
  });
});
