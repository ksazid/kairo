"use server";

import { redirect } from "next/navigation";
import type { GuidedBrandObjective } from "@kairo/contracts";
import { buildBrandBrain } from "../../../../src/lib/guided-brand-brain-api";

export async function buildBrandBrainAction(brandId: string, formData: FormData): Promise<void> {
  let destination: string;

  try {
    const primaryObjective = String(formData.get("primaryObjective") ?? "") as GuidedBrandObjective;
    const publicReferenceUrl = String(formData.get("publicReferenceUrl") ?? "").trim();
    const ownerBoundary = String(formData.get("ownerBoundary") ?? "").trim();
    const result = await buildBrandBrain(brandId, {
      primaryObjective,
      ...(publicReferenceUrl ? { publicReferenceUrl } : {}),
      ...(ownerBoundary ? { ownerBoundary } : {}),
    });
    const notice = result.generatorStatus === "generated"
      ? `Brand Brain built with ${result.proposedCount} suggestions. Review the items that need your confirmation.`
      : "Your Brand goal was saved. Kairo could not generate source-backed suggestions yet; add or verify a public Brand reference and try again.";
    destination = `/brands/${encodeURIComponent(brandId)}/brain?notice=${encodeURIComponent(notice)}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to build Brand Brain";
    destination = `/brands/${encodeURIComponent(brandId)}/brain?error=${encodeURIComponent(message.slice(0, 180))}`;
  }

  redirect(destination);
}
