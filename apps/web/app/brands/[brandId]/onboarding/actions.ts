"use server";

import { redirect } from "next/navigation";
import type { BrandBrainSection } from "@kairo/contracts";
import { getBrand, putBrandBrainField } from "../../../../src/lib/kairo-api";
import { getBrandBrainActivation } from "../../../../src/lib/brand-brain-activation-api";
import { buildBrandBrain } from "../../../../src/lib/guided-brand-brain-api";

export async function confirmOnboardingBrandAction(brandId: string): Promise<void> {
  const brand = await getBrand(brandId);
  if (!brand) redirect("/");

  const activation = await getBrandBrainActivation(brandId).catch(() => undefined);
  if (!activation?.hunterReady) {
    const notice = activation?.status === "needs-review"
      ? "Brand DNA needs confirmation before discovery can start"
      : "Brand DNA needs one more useful signal before discovery can start";
    redirect(`/brands/${encodeURIComponent(brand.id)}/onboarding/confirm?notice=${encodeURIComponent(notice)}`);
  }

  // Flow 1B stops at the explicit Ready-for-Hunter handoff. The first Hunter run
  // is a separate lifecycle step so onboarding never fabricates run history or
  // activates discovery before its runtime/scheduler gate is approved.
  const notice = "Brand ready for Discovery";
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
