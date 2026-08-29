"use server";

import { redirect } from "next/navigation";
import type { BrandBrainSection } from "@kairo/contracts";
import { getBrand, getBrandDnaReadiness } from "../../../../src/lib/kairo-api";
import { requestRecommendations } from "../../../../src/lib/closed-loop-api";
import { buildBrandBrain } from "../../../../src/lib/guided-brand-brain-api";
import { putBrandBrainField } from "../../../../src/lib/kairo-api";

export async function confirmOnboardingBrandAction(brandId: string): Promise<void> {
  const brand = await getBrand(brandId);
  if (!brand) redirect("/");

  const readiness = await getBrandDnaReadiness(brandId).catch(() => undefined);
  if (readiness?.status !== "ready") {
    redirect(`/brands/${encodeURIComponent(brand.id)}/onboarding/confirm?notice=${encodeURIComponent("Brand DNA needs one more detail before discovery can start")}`);
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

export async function enrichOnboardingBrandAction(brandId: string, formData: FormData): Promise<void> {
  const kind = String(formData.get("kind") ?? "");
  try {
    if (kind === "source") {
      const url = String(formData.get("publicReferenceUrl") ?? "").trim();
      if (!url) throw new Error("Add a public Brand link");
      await buildBrandBrain(brandId, { publicReferenceUrl: url });
    } else if (kind === "field") {
      const fieldKey = String(formData.get("fieldKey") ?? "");
      const value = String(formData.get("value") ?? "").trim();
      const section = sectionFor(fieldKey);
      if (!section || !value) throw new Error("Enter a value to continue");
      await putBrandBrainField(brandId, fieldKey, { section, value });
    } else if (kind === "none") {
      await putBrandBrainField(brandId, "boundaries.excluded-topics", { section: "boundaries", value: "None" });
    } else {
      throw new Error("Choose one enrichment action");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update Brand DNA";
    redirect(`/brands/${encodeURIComponent(brandId)}/onboarding/confirm?error=${encodeURIComponent(message.slice(0, 180))}`);
  }
  redirect(`/brands/${encodeURIComponent(brandId)}/onboarding/confirm?notice=${encodeURIComponent("Brand DNA updated. Review it once more before discovery.")}`);
}

function sectionFor(fieldKey: string): BrandBrainSection | undefined {
  if (fieldKey.startsWith("identity.")) return "identity";
  if (fieldKey.startsWith("positioning.")) return "positioning";
  if (fieldKey.startsWith("audience.")) return "audience";
  if (fieldKey.startsWith("content.")) return "content-strategy";
  if (fieldKey.startsWith("boundaries.")) return "boundaries";
  return undefined;
}
