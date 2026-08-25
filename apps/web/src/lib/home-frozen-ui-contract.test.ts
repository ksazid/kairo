import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("VS-91 frozen Home UI contract", () => {
  it("keeps the approved page title/tagline and one Brand identity through the shell", () => {
    const page = read("app/page.tsx");
    expect(page).toContain("<h1>Home</h1>");
    expect(page).toContain("What needs you, what to create next, and what Kairo is handling.");
    expect(page).not.toContain("KairoScopePicker");
    expect(page).not.toContain("<h1>{brand.name}</h1>");
  });

  it("shows only one dominant Needs attention item", () => {
    const page = read("app/page.tsx");
    expect(page).toContain("attention[0]");
    expect(page).not.toContain("attention.slice(1)");
    expect(page).not.toContain("attention.map(");
  });

  it("keeps the approved My idea input controls and explicit recommendation action", () => {
    const composer = read("app/my-idea-composer.tsx");
    for (const control of [">URL<", ">Photo<", ">Video<", ">+ Media<", "Get recommendations"]) {
      expect(composer).toContain(control);
    }
    expect(composer).toContain("Kairo recommends");
  });

  it("keeps For you card signals and the approved What’s working metrics", () => {
    const page = read("app/page.tsx");
    expect(page).toContain("View all");
    expect(page).toContain("Impact ");
    expect(page).toContain("Fit ");
    for (const metric of ["Reach", "Saves", "Shares", "Engagement rate"]) {
      expect(page).toContain(metric);
    }
  });

  it("does not reintroduce non-frozen Home sections or internal workflow vocabulary", () => {
    const page = read("app/page.tsx");
    expect(page).not.toContain("Up Next");
    expect(page).not.toContain("Pick up where you left off");
    for (const internal of ["Research", "Hunter", "Angles", "Critic", "Truth Gate"]) {
      expect(page).not.toContain(internal);
    }
  });
});
