"use server";

import { redirect } from "next/navigation";
import { createWorkspaceWithBrand } from "../src/lib/kairo-api";
import { createBrand } from "../src/lib/brand-api";

const PROFILE_HOSTS = new Set([
  "instagram.com", "www.instagram.com",
  "linkedin.com", "www.linkedin.com",
  "youtube.com", "www.youtube.com",
  "tiktok.com", "www.tiktok.com",
  "x.com", "www.x.com",
  "twitter.com", "www.twitter.com",
  "facebook.com", "www.facebook.com",
]);

export async function createWorkspaceAction(formData: FormData): Promise<void> {
  const workspaceName = String(formData.get("workspaceName") ?? "");
  const brandName = String(formData.get("brandName") ?? "");
  const publicReferenceUrl = String(formData.get("publicReferenceUrl") ?? "").trim();
  let publicSourceUrl: string | undefined;
  let publicProfileUrl: string | undefined;

  if (publicReferenceUrl) {
    const url = new URL(publicReferenceUrl);
    if (PROFILE_HOSTS.has(url.hostname.toLowerCase())) publicProfileUrl = url.toString();
    else publicSourceUrl = url.toString();
  }

  const created = await createWorkspaceWithBrand({
    workspaceName,
    brandName,
    ...(publicSourceUrl ? { publicSourceUrl } : {}),
    ...(publicProfileUrl ? { publicProfileUrl } : {}),
  });
  redirect(`/brands/${encodeURIComponent(created.brand.id)}/brain?setup=1`);
}

export async function createBrandAction(workspaceId: string, formData: FormData): Promise<void> {
  const brandName = String(formData.get("brandName") ?? "");
  try {
    const brand = await createBrand(workspaceId, brandName);
    redirect(`/brands/${encodeURIComponent(brand.id)}/brain?setup=1`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Brand";
    redirect(`/brands/new?workspace=${encodeURIComponent(workspaceId)}&error=${encodeURIComponent(message.slice(0, 180))}`);
  }
}
