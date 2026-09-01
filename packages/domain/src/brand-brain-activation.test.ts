import { describe, expect, it } from "vitest";
import type { BrandBrainFieldDto } from "@kairo/contracts";
import { createBrandBrainActivationSnapshot } from "./brand-brain-activation";

function field(fieldKey: string, value: string, state: BrandBrainFieldDto["state"] = "inferred", sourceIds: string[] = ["source-1"]): BrandBrainFieldDto {
  return {
    id: `${fieldKey}-${state}`,
    workspaceId: "w",
    brandId: "b",
    section: fieldKey.startsWith("content.") ? "content-strategy" : fieldKey.split(".")[0] as BrandBrainFieldDto["section"],
    fieldKey,
    value,
    state,
    sourceIds,
    version: 1,
    updatedAt: "2026-09-01T00:00:00.000Z",
  };
}

const complete = () => [
  field("identity.description", "A practical travel Brand"),
  field("identity.products-services", "Malta travel guides"),
  field("audience.primary", "Independent Malta travellers"),
  field("positioning.value-proposition", "Useful local guidance"),
  field("content.core-topics", "Malta itineraries and travel tips"),
  field("boundaries.excluded-topics", "Unsafe travel advice"),
];

describe("Brand Brain activation", () => {
  it("marks source-backed inferred Brand DNA as high confidence and Hunter-ready", () => {
    const result = createBrandBrainActivationSnapshot(complete());
    expect(result).toMatchObject({ status: "ready-for-hunter", hunterReady: true, completeness: { score: 100, knownGroups: 6, totalGroups: 6 } });
    expect(result.fields.every((item) => item.origin === "source-backed" && item.confidence.level === "high")).toBe(true);
  });

  it("gives user-confirmed values precedence and maximum confidence", () => {
    const fields = complete();
    fields.push({ ...field("audience.primary", "Malta road-trip travellers", "confirmed", []), updatedAt: "2026-09-01T01:00:00.000Z", confirmedByAccountId: "owner" });
    const result = createBrandBrainActivationSnapshot(fields);
    expect(result.fields.find((item) => item.fieldKey === "audience.primary")).toMatchObject({ origin: "user-confirmed", confidence: { score: 1, level: "high" } });
  });

  it("blocks Hunter when critical context is missing and recommends enrichment", () => {
    const result = createBrandBrainActivationSnapshot([field("identity.description", "A travel Brand")]);
    expect(result.hunterReady).toBe(false);
    expect(result.status).toBe("needs-enrichment");
    expect(result.readiness.gaps).toEqual(expect.arrayContaining(["offerings", "audience", "positioning", "topics", "boundaries"]));
    expect(result.recommendedSources).toEqual(expect.arrayContaining([expect.objectContaining({ type: "website" })]));
  });

  it("requires review for unsupported AI-only critical inference even when all groups are filled", () => {
    const fields = complete();
    fields[2] = field("audience.primary", "Likely travellers", "inferred", []);
    const result = createBrandBrainActivationSnapshot(fields);
    expect(result.readiness.status).toBe("ready");
    expect(result).toMatchObject({ status: "needs-review", hunterReady: false });
    expect(result.weakFields).toContain("audience.primary");
    expect(result.recommendedSources).toEqual(expect.arrayContaining([expect.objectContaining({ type: "confirm-field", fieldKey: "audience.primary" })]));
  });
});
