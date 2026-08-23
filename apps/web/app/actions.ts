"use server";

import { redirect } from "next/navigation";
import { createWorkspaceWithBrand } from "../src/lib/kairo-api";
import { createBrand } from "../src/lib/brand-api";
import { buildBrandBrain } from "../src/lib/guided-brand-brain-api";
import { brandNameFromReference, normalizeBrandReferenceUrl } from "../src/lib/brand-onboarding";

export async function createWorkspaceAction(formData: FormData): Promise<void> {
  const reference = parseReference(formData, "/onboarding");
  const brandName = brandNameFromReference(reference);

  let created: Awaited<ReturnType<typeof createWorkspaceWithBrand>>;
  try {
    created = await createWorkspaceWithBrand({
      workspaceName: brandName,
      brandName,
      publicSourceUrl: reference,
    });
  } catch (error) {
    redirectWithError("/onboarding", error, "Unable to create your Brand");
  }

  const notice = await learnBrand(created.brand.id, reference);
  redirect(confirmationHref(created.brand.id, notice));
}

export async function createBrandAction(workspaceId: string, formData: FormData): Promise<void> {
  const base = `/brands/new?workspace=${encodeURIComponent(workspaceId)}`;
  const reference = parseReference(formData, base);
  const brandName = brandNameFromReference(reference);

  let brandId: string;
  try {
    brandId = (await createBrand(workspaceId, { brandName, publicSourceUrl: reference })).id;
  } catch (error) {
    redirectWithError(base, error, "Unable to create Brand");
  }

  const notice = await learnBrand(brandId, reference);
  redirect(confirmationHref(brandId, notice));
}

function parseReference(formData: FormData, errorHref: string): string {
  try {
    return normalizeBrandReferenceUrl(String(formData.get("brandUrl") ?? ""));
  } catch (error) {
    redirectWithError(errorHref, error, "Enter a valid public Brand URL");
  }
}

async function learnBrand(brandId: string, reference: string): Promise<string | undefined> {
  try {
    const result = await buildBrandBrain(brandId, { publicReferenceUrl: reference });
    return result.generatorStatus === "generated" ? undefined : "learning-limited";
  } catch {
    // Brand creation is durable. A source/provider problem must not force the user to restart onboarding.
    return "learning-limited";
  }
}

function confirmationHref(brandId: string, notice?: string): string {
  const base = `/brands/${encodeURIComponent(brandId)}/onboarding/confirm`;
  return notice ? `${base}?notice=${encodeURIComponent(notice)}` : base;
}

function redirectWithError(href: string, error: unknown, fallback: string): never {
  const message = error instanceof Error ? error.message : fallback;
  const separator = href.includes("?") ? "&" : "?";
  redirect(`${href}${separator}error=${encodeURIComponent(message.slice(0, 180))}`);
}
