import { describe, expect, it } from "vitest";
import type { BrandBrainFieldDto } from "@kairo/contracts";
import { buildBrandProfileSections, brandSummary } from "./brand-profile-view-model";

function field(fieldKey: string, value: string, state: BrandBrainFieldDto["state"] = "confirmed"): BrandBrainFieldDto {
  const section = fieldKey.startsWith("positioning.")
    ? "positioning"
    : fieldKey.startsWith("audience.")
      ? "audience"
      : fieldKey.startsWith("voice.")
        ? "voice"
        : fieldKey.startsWith("content.")
          ? "content-strategy"
          : fieldKey.startsWith("goals.")
            ? "goals"
            : fieldKey.startsWith("boundaries.")
              ? "boundaries"
              : "identity";
  return {
    id: `field-${fieldKey}`,
    workspaceId: "workspace-1",
    brandId: "brand-1",
    section,
    fieldKey,
    value,
    state,
    version: 1,
    sourceIds: [],
    updatedAt: "2026-08-24T12:00:00.000Z",
  } as BrandBrainFieldDto;
}

describe("Brand profile view model", () => {
  it("groups every existing Brand Brain field into the four approved user-facing sections", () => {
    const sections = buildBrandProfileSections([]);

    expect(sections.map((section) => section.title)).toEqual([
      "Identity",
      "Audience",
      "Voice & Style",
      "Content Pillars",
    ]);

    const keys = sections.flatMap((section) => section.fields.map((entry) => entry.definition.key));
    expect(keys).toContain("identity.description");
    expect(keys).toContain("positioning.value-proposition");
    expect(keys).toContain("audience.primary");
    expect(keys).toContain("voice.tone");
    expect(keys).toContain("boundaries.owner-directive");
    expect(keys).toContain("content.pillars");
    expect(keys).toContain("goals.objectives");
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("preserves the original Brand Brain section on every inline edit", () => {
    const sections = buildBrandProfileSections([]);
    const positioning = sections.flatMap((section) => section.fields).find((entry) => entry.definition.key === "positioning.market-position");
    const boundary = sections.flatMap((section) => section.fields).find((entry) => entry.definition.key === "boundaries.claims-to-avoid");

    expect(positioning?.section).toBe("positioning");
    expect(boundary?.section).toBe("boundaries");
  });

  it("derives a concise Brand summary without converting missing values into invented facts", () => {
    const summary = brandSummary([
      field("identity.category", "Developer tools"),
      field("positioning.value-proposition", "Architecture guidance"),
      field("audience.primary", "Software engineers", "inferred"),
      field("voice.tone", "Clear and technical", "stale"),
    ]);

    expect(summary.category).toBe("Developer tools");
    expect(summary.positioning).toBe("Architecture guidance");
    expect(summary.audience).toBe("Software engineers");
    expect(summary.confirmed).toBe(2);
    expect(summary.suggested).toBe(1);
    expect(summary.stale).toBe(1);
  });
});
