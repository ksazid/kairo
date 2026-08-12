"use server";

import { redirect } from "next/navigation";
import { createWorkspaceWithBrand } from "../src/lib/kairo-api";

export async function createWorkspaceAction(formData: FormData): Promise<void> {
  const workspaceName = String(formData.get("workspaceName") ?? "");
  const brandName = String(formData.get("brandName") ?? "");
  const publicSourceUrl = String(formData.get("publicSourceUrl") ?? "").trim();
  const publicProfileUrl = String(formData.get("publicProfileUrl") ?? "").trim();

  const created = await createWorkspaceWithBrand({
    workspaceName,
    brandName,
    ...(publicSourceUrl ? { publicSourceUrl } : {}),
    ...(publicProfileUrl ? { publicProfileUrl } : {}),
  });
  redirect(`/?workspace=${encodeURIComponent(created.workspace.id)}&brand=${encodeURIComponent(created.brand.id)}`);
}
