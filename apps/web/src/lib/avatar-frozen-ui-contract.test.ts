import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("VS-91 frozen Avatar Presenter contract", () => {
  it("keeps the approved title, tagline and Brand return path", () => {
    const page = read("app/brands/[brandId]/avatar/page.tsx");
    expect(page).toContain("<h1>Avatar (Presenter)</h1>");
    expect(page).toContain("An optional presenter Kairo can use in videos.");
    expect(page).toContain("← Back to Brand");
  });

  it("keeps the large preview, truthful readiness and provider setup callout", () => {
    const page = read("app/brands/[brandId]/avatar/page.tsx");
    expect(page).toContain("avatar-preview-stage");
    expect(page).toContain("Not ready yet");
    expect(page).toContain("Set up avatar provider");
    expect(page).toContain('href="/settings"');
  });

  it("keeps the approved benefits and four-step flow", () => {
    const page = read("app/brands/[brandId]/avatar/page.tsx");
    expect(page).toContain('title="Realistic presenter"');
    expect(page).toContain('title="Brand aligned"');
    expect(page).toContain('title="Consistent delivery"');
    for (const step of ["Configure", "Create", "Review", "Use"]) expect(page).toContain(`[\"${step}\",`);
  });

  it("keeps Kairo recommendations, Customize and the approved actions", () => {
    const page = read("app/brands/[brandId]/avatar/page.tsx");
    for (const setting of ["Style", "Voice", "Language", "Framing", "Background", "Mode"]) expect(page).toContain(`<span>${setting}</span>`);
    expect(page).toContain(">Customize</summary>");
    expect(page).toContain(">Test clip</button>");
    expect(page).toContain("Create &amp; Save</button>");
  });

  it("does not expose provider credentials or infrastructure", () => {
    const page = read("app/brands/[brandId]/avatar/page.tsx");
    expect(page).not.toContain("credentials");
    expect(page).not.toContain("provider secret");
    expect(page).not.toContain("endpoint");
    expect(page).not.toContain("API key");
  });
});
