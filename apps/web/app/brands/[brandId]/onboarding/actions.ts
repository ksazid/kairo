"use server";

import { redirect } from "next/navigation";
import type { BrandBrainSection } from "@kairo/contracts";
import { getBrand, getBrandBrain, putBrandBrainField } from "../../../../src/lib/kairo-api";
import { requestRecommendations } from "../../../../src/lib/closed-loop-api";

const CONFIRMABLE_SECTIONS = new Set<BrandBrainSection>([
  "identity",
  "positioning",
  "audience",
  "voice",
  "content-strategy",
]);

export async function confirmOnboardingBrandAction(brandId: string): Promise<void> {
  const [brand, brain] = await Promise.all([getBrand(brandId), getBrandBrain(brandId)]);
  if (!brand) redirect("/");

  for (const field of brain) {
    if (field.state !== "inferred" || !CONFIRMABLE_SECTIONS.has(field.section)) continue;
    await putBrandBrainField(brandId, field.fieldKey, {
      section: field.section,
      value: field.value,
      expectedVersion: field.version,
    });
  }

  let notice = "Brand ready";
  try {
    const run = await requestRecommendations(brand.id);
    notice = run.opportunityCount > 0 ? "Brand ready. For you is ready." : "Brand ready. Hunter completed its first run.";
  } catch {
    notice = "Brand ready. Hunter will retry when recommendations refresh.";
  }

  redirect(`/?workspace=${encodeURIComponent(brand.workspaceId)}&brand=${encodeURIComponent(brand.id)}&notice=${encodeURIComponent(notice)}`);
}
