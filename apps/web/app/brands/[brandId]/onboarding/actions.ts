"use server";

import { redirect } from "next/navigation";
import type { BrandBrainSection } from "@kairo/contracts";
import { getBrand, putBrandBrainField } from "../../../../src/lib/kairo-api";
import { getBrandBrainActivation } from "../../../../src/lib/brand-brain-activation-api";
import { buildBrandBrain } from "../../../../src/lib/guided-brand-brain-api";

export async function confirmOnboardingBrandAction(brandId: string): Promise<void> {
  const brand = await getBrand(brandId);
  if (!brand) redirect("/");

  // The activation read also ensures the versioned Discovery Plan exists for
  // this exact Brand Intelligence snapshot before onboarding can complete.
  const activation = await getBrandBrainActivation(brandId).catch(() => undefined);
  if (!activation?.hunterReady) {
    const notice = activation?.status === "needs-review"
      ? "Brand DNA needs confirmation before discovery can start"
      : "Brand DNA needs one more useful signal before discovery can start";
    redirect(`/brands/${encodeURIComponent(brand.id)}/onboarding/confirm?notice=${encodeURIComponent(notice)}`);
  }

  // Flow 1B stops at Ready for Hunter. Handoff enters the approved Kairo v2
  // surface through its own OIDC login so host-scoped auth cookies are not
  // assumed to transfer between separate Vercel applications.
  redirect(kairoV2Handoff(brand.id));
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

function kairoV2Handoff(brandId: string): string {
  const configured = process.env.KAIRO_UI_V2_URL?.trim() || "https://kairo-ui-v2.vercel.app";
  const base = new URL(configured);
  if (base.protocol !== "https:" && base.protocol !== "http:") throw new Error("KAIRO_UI_V2_URL must be HTTP(S)");
  const returnTo = `/brand?brand=${encodeURIComponent(brandId)}&onboarding=complete`;
  const login = new URL("/auth/login", base);
  login.searchParams.set("returnTo", returnTo);
  return login.toString();
}

function sectionFor(fieldKey: string): BrandBrainSection | undefined {
  if (fieldKey.startsWith("identity.")) return "identity";
  if (fieldKey.startsWith("positioning.")) return "positioning";
  if (fieldKey.startsWith("audience.")) return "audience";
  if (fieldKey.startsWith("content.")) return "content-strategy";
  if (fieldKey.startsWith("boundaries.")) return "boundaries";
  return undefined;
}
