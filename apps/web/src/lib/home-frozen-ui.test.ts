import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("final frozen Home UI contract", () => {
  it("uses Home as the page identity without duplicating Brand scope in the body", () => {
    const page = read("app/page.tsx");

    expect(page).toContain("<h1>Home</h1>");
    expect(page).toContain("What needs you, what to create next, and what Kairo is handling.");
    expect(page).not.toContain("<KairoScopePicker");
    expect(page).not.toContain("<h1>{brand.name}</h1>");
  });

  it("keeps only the final frozen Home sections and one dominant attention item", () => {
    const page = read("app/page.tsx");

    for (const label of ["Needs Attention", "My Idea", "For You", "What's Working"]) {
      expect(page).toContain(label);
    }
    expect(page).toContain(") [0];");
    expect(page).not.toContain('label="Up Next"');
    expect(page).not.toContain('label="Continue"');
    expect(page).not.toContain("buildUpNext");
    expect(page).not.toContain("buildContinue");
  });

  it("renders the approved My Idea controls and explicit recommendation action", () => {
    const composer = read("app/my-idea-composer.tsx");

    expect(composer).toContain('KairoIcon name="link"');
    expect(composer).toContain('KairoIcon name="image"');
    expect(composer).toContain('KairoIcon name="video"');
    expect(composer).toContain('KairoIcon name="media"');
    expect(composer).toContain("URL");
    expect(composer).toContain("Photo");
    expect(composer).toContain("Video");
    expect(composer).toContain("+ Media");
    expect(composer).toContain("Get recommendations");
    expect(composer).toContain("Kairo recommends");
    expect(composer).not.toContain("useEffect");
    expect(composer).not.toContain("↗");
  });

  it("uses a horizontal recommendation rail with the frozen card information", () => {
    const page = read("app/page.tsx");
    const css = read("app/home-vs85.module.css");

    expect(page).toContain("recommendationRail");
    expect(css).toContain("grid-auto-flow: column");
    expect(page).toContain('KairoIcon name="bookmark"');
    expect(page).toContain("Impact");
    expect(page).toContain("Fit");
    expect(page).toContain("View all");
    expect(page).not.toContain("/discover");
  });

  it("renders exactly the approved real-data performance slots without inventing trends", () => {
    const page = read("app/page.tsx");

    for (const metric of ["Reach", "Saves", "Shares", "Engagement rate"]) {
      expect(page).toContain(metric);
    }
    expect(page).toContain("Last 30 days");
    expect(page).toContain("Unavailable");
    expect(page).toContain("No verified observation yet");
    expect(page).not.toContain("What Kairo learned");
  });

  it("does not reintroduce legacy creator machinery into Home", () => {
    const page = read("app/page.tsx");

    for (const forbidden of ["Research", "Hunter", "Angles", "Critic", "Claims", "Truth Gate"]) {
      expect(page).not.toContain(forbidden);
    }
    expect(page).not.toContain("/campaigns");
    expect(page).not.toContain("/ideas/");
  });
});
