import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("VS-91 frozen Settings provider contracts", () => {
  it("keeps the approved Settings navigation and excludes deferred Integrations", () => {
    const shell = read("app/settings/settings-shell.tsx");
    for (const label of ["General", "Team", "Billing", "Notifications", "Security", "AI Providers", "Media Providers", "Audit Log"]) {
      expect(shell).toContain(`label: \"${label}\"`);
    }
    expect(shell).not.toContain("Integrations");
  });

  it("keeps the approved AI provider hierarchy and Ollama default", () => {
    const page = read("app/settings/ai-providers/page.tsx");
    const catalog = read("app/settings/provider-catalog.ts");
    expect(page).toContain('title="AI Providers"');
    expect(page).toContain("Primary Capability");
    expect(page).toContain("Available Via Provider");
    expect(catalog).toContain('name: "Ollama"');
    expect(catalog).toContain('role: "Writing & reasoning"');
    expect(catalog).toContain('"Text generation"');
    expect(catalog).toContain('"Research assistance"');
    expect(catalog).toContain('"Recommendations"');
  });

  it("keeps all five approved media providers and exact approved defaults", () => {
    const catalog = read("app/settings/provider-catalog.ts");
    for (const value of ["FLUX.1 Schnell", "Wan 2.2", "Kokoro", "ACE-Step", "MuseTalk"]) expect(catalog).toContain(value);
    for (const value of ["flux-schnell", "Fast", "Auto", "wan-2.2", "1080p", "30 fps", "kokoro", "Heart", "1.0x", "ace-step", "On", "musetalk", "Standard", "Match source"]) expect(catalog).toContain(`\"${value}\"`);
  });

  it("keeps management pages available without fabricating runtime readiness", () => {
    const overview = read("app/settings/media-providers/page.tsx");
    const management = read("app/settings/provider-management-page.tsx");
    expect(overview).toContain("Not configured");
    expect(management).toContain("Not configured");
    expect(management).toContain("Save Changes");
    expect(management).toContain("disabled");
    expect(management).not.toContain("Ready to generate");
  });

  it("keeps provider secrets and infrastructure details out of the normal Settings UI", () => {
    const ai = read("app/settings/ai-providers/page.tsx");
    const media = read("app/settings/media-providers/page.tsx");
    const management = read("app/settings/provider-management-page.tsx");
    for (const source of [ai, media, management]) {
      expect(source).not.toContain("API key");
      expect(source).not.toContain("secret");
      expect(source).not.toContain("token");
      expect(source).not.toContain("endpoint URL");
    }
  });
});
