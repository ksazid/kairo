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
    const evidenceNote = result.sourceIds.length
      ? ` ${result.sourceIds.length} public ${result.sourceIds.length === 1 ? "reference was" : "references were"} successfully read.`
      : " Suggestions were generated from the Brand and owner-confirmed context available to Kairo; public links can be added later to improve them.";
    const notice = result.generatorStatus === "generated"
      ? `Brand Brain built with ${result.proposedCount} suggestions. Review the items that need your confirmation.${evidenceNote}`
      : "Your Brand goal was saved. Kairo could not generate suggestions right now; your setup is safe and you can try again shortly.";
    destination = `/brands/${encodeURIComponent(brandId)}/brain?notice=${encodeURIComponent(notice)}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to build Brand Brain";
    destination = `/brands/${encodeURIComponent(brandId)}/brain?error=${encodeURIComponent(message.slice(0, 180))}`;
  }

  redirect(destination);
}
