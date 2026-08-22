"use server";

import { redirect } from "next/navigation";
import { createWorkspaceWithBrand } from "../src/lib/kairo-api";
import { createBrand } from "../src/lib/brand-api";
import { connectionPlanDestination, selectedBrandConnections } from "../src/lib/brand-connection-plan";

export async function createWorkspaceAction(formData: FormData): Promise<void> {
  const workspaceName = String(formData.get("workspaceName") ?? "");
  const brandName = String(formData.get("brandName") ?? "");
  const websiteUrl = String(formData.get("websiteUrl") ?? formData.get("publicReferenceUrl") ?? "").trim();
  const publicSourceUrl = websiteUrl ? new URL(websiteUrl).toString() : undefined;
  const connectionPlan = selectedBrandConnections(formData);

  const created = await createWorkspaceWithBrand({
    workspaceName,
    brandName,
    ...(publicSourceUrl ? { publicSourceUrl } : {}),
  });
  redirect(connectionPlanDestination(created.brand.id, connectionPlan));
}

export async function createBrandAction(workspaceId: string, formData: FormData): Promise<void> {
  const brandName = String(formData.get("brandName") ?? "");
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const connectionPlan = selectedBrandConnections(formData);
  let brandId: string;
  try {
    brandId = (await createBrand(workspaceId, {
      brandName,
      ...(websiteUrl ? { publicSourceUrl: new URL(websiteUrl).toString() } : {}),
    })).id;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Brand";
    redirect(`/brands/new?workspace=${encodeURIComponent(workspaceId)}&error=${encodeURIComponent(message.slice(0, 180))}`);
  }
  redirect(connectionPlanDestination(brandId, connectionPlan));
}
