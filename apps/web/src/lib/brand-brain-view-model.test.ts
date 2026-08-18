import { describe, expect, it } from "vitest";
import type { BrandBrainFieldDto } from "@kairo/contracts";
import {
  buildBrandBrainOverview,
  fieldAnchor,
  fieldEvidenceLabel,
  fieldStateLabel,
  findFieldDefinition,
} from "./brand-brain-view-model";

function field(
  fieldKey: string,
  state: BrandBrainFieldDto["state"],
  value: string,
  sourceIds: string[] = [],
): BrandBrainFieldDto {
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
    sourceIds,
    updatedAt: "2026-08-18T12:42:00.000Z",
  } as BrandBrainFieldDto;
}

describe("brand brain view model", () => {
  it("treats every inferred or stale field as human review work", () => {
    const overview = buildBrandBrainOverview([
      field("positioning.market-position", "confirmed", "Confirmed position"),
      field("audience.primary", "inferred", "Suggested audience", ["source-1"]),
      field("voice.tone", "stale", "Old tone"),
      field("content.pillars", "inferred", "Suggested pillars"),
    ]);

    expect(overview.confirmedCount).toBe(1);
    expect(overview.suggestedCount).toBe(2);
    expect(overview.staleCount).toBe(1);
    expect(overview.reviewItems.map((item) => item.fieldKey)).toEqual([
      "voice.tone",
      "audience.primary",
      "content.pillars",
    ]);
  });

  it("uses the approved profile hierarchy for the Brand Brain overview", () => {
    const overview = buildBrandBrainOverview([
      field("positioning.value-proposition", "inferred", "Useful promise"),
      field("audience.primary", "confirmed", "Duke owners"),
      field("voice.tone", "confirmed", "Direct and practical"),
      field("content.preferred-topics", "inferred", "Ownership and riding"),
    ]);

    expect(overview.summaries.map((summary) => summary.title)).toEqual([
      "Positioning",
      "Audience",
      "Voice",
      "Content strategy",
    ]);
    expect(overview.summaries[0]?.field?.value).toBe("Useful promise");
    expect(overview.summaries[3]?.field?.value).toBe("Ownership and riding");
  });

  it("explains confirmed, source-backed, owner-context and stale provenance truthfully", () => {
    expect(fieldEvidenceLabel(field("identity.description", "confirmed", "A Brand"))).toBe("Owner confirmed");
    expect(fieldEvidenceLabel(field("audience.primary", "inferred", "Riders", ["source-1", "source-2"]))).toBe("Suggested from 2 readable sources");
    expect(fieldEvidenceLabel(field("voice.tone", "inferred", "Direct"))).toBe("Suggested from Brand setup and owner context");
    expect(fieldEvidenceLabel(field("voice.tone", "stale", "Old"))).toBe("Previous context needs review before Kairo relies on it.");
    expect(fieldEvidenceLabel(undefined)).toBe("Kairo has not learned this yet.");
  });

  it("provides stable labels, anchors and field definitions for review navigation", () => {
    expect(fieldStateLabel(field("voice.tone", "inferred", "Direct"))).toBe("Suggested");
    expect(fieldStateLabel(undefined)).toBe("Not set");
    expect(fieldAnchor("content.preferred-topics")).toBe("field-content-preferred-topics");
    expect(findFieldDefinition("audience.primary")?.label).toBe("Primary audience");
  });
});
