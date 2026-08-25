import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("VS-91 frozen Brand profile contract", () => {
  it("keeps the approved Brand title, tagline and profile summary", () => {
    const page = read("app/brands/[brandId]/brain/page.tsx");
    expect(page).toContain("<h1>Brand</h1>");
    expect(page).toContain("Shape how Kairo understands and represents your brand.");
    expect(page).toContain("brand-profile-avatar");
    expect(page).toContain("Confirmed</span>");
    expect(page).toContain("AI inferred</span>");
  });

  it("keeps the exact profile-style section hierarchy", () => {
    const page = read("app/brands/[brandId]/brain/page.tsx");
    expect(page).toContain('href="#identity">Identity</a>');
    expect(page).toContain('href="#audience">Audience</a>');
    expect(page).toContain('href="#voice-style">Voice &amp; Style</a>');
    expect(page).toContain('href="#content-pillars">Content Pillars</a>');
    expect(page).toContain('href="#sources">Sources</a>');
    expect(page).toContain('href="#channels">Channels</a>');
    expect(page).toContain('href="#avatar">Avatar</a>');
  });

  it("keeps Sources and Channels inline with simple health and one-action rows", () => {
    const page = read("app/brands/[brandId]/brain/page.tsx");
    expect(page).toContain("Keep the website and connected social sources Kairo learns from accurate and healthy.");
    expect(page).toContain(">Refresh</button>");
    expect(page).toContain("<h2 id=\"channels-title\">Channels</h2>");
    expect(page).toContain("ChannelSummaryRow");
    expect(page).toContain("Avatar (Presenter)");
  });

  it("uses Confirmed / AI inferred language in inline fields", () => {
    const model = read("src/lib/brand-brain-view-model.ts");
    expect(model).toContain('return "Confirmed"');
    expect(model).toContain('return "AI inferred"');
    expect(model).toContain("AI inferred from");
  });

  it("does not expose rejected Brand dashboard or internal learning/source machinery", () => {
    const page = read("app/brands/[brandId]/brain/page.tsx");
    expect(page).not.toContain("Brand Health");
    expect(page).not.toContain("accepted Learning");
    expect(page).not.toContain("Performance memory");
    expect(page).not.toContain("malware");
    expect(page).not.toContain("Needs scan");
    expect(page).not.toContain("accountRef");
    expect(page).not.toContain("OAuth");
  });
});
