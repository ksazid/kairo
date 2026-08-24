"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { BrandPresenterMode, BrandPresenterStatus } from "@kairo/contracts/presenter";
import { putBrandPresenter } from "../../../../src/lib/presenter-api";

export async function saveBrandPresenterAction(brandId: string, form: FormData) {
  const optional = (name: string) => {
    const value = String(form.get(name) ?? "").trim();
    return value ? value : undefined;
  };
  const expectedRaw = String(form.get("expectedVersion") ?? "").trim();
  try {
    await putBrandPresenter(brandId, {
      displayName: String(form.get("displayName") ?? ""),
      status: String(form.get("status") ?? "ready") as BrandPresenterStatus,
      mode: String(form.get("mode") ?? "hybrid-explainer") as BrandPresenterMode,
      ...(optional("visualStyle") ? { visualStyle: optional("visualStyle") } : {}),
      ...(optional("voiceStyle") ? { voiceStyle: optional("voiceStyle") } : {}),
      ...(optional("locale") ? { locale: optional("locale") } : {}),
      ...(optional("accent") ? { accent: optional("accent") } : {}),
      ...(optional("pace") ? { pace: optional("pace") } : {}),
      ...(optional("framing") ? { framing: optional("framing") } : {}),
      ...(optional("background") ? { background: optional("background") } : {}),
      ...(optional("introStyle") ? { introStyle: optional("introStyle") } : {}),
      ...(optional("outroStyle") ? { outroStyle: optional("outroStyle") } : {}),
      ...(optional("captionPreference") ? { captionPreference: optional("captionPreference") } : {}),
      ...(expectedRaw ? { expectedVersion: Number(expectedRaw) } : {}),
    });
  } catch (error) {
    redirect(`/brands/${encodeURIComponent(brandId)}/avatar?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to save presenter")}`);
  }
  revalidatePath(`/brands/${brandId}/avatar`);
  revalidatePath(`/brands/${brandId}/create`);
  redirect(`/brands/${encodeURIComponent(brandId)}/avatar?notice=${encodeURIComponent("Presenter saved")}`);
}
