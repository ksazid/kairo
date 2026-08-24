"use server";
import { redirect } from "next/navigation";
import { startSimpleCreation } from "../../../../src/lib/simple-creation-api";
export async function startSimpleCreationAction(
  brandId: string,
  form: FormData,
) {
  let creationId:string;
  try {
    const presenterId = String(form.get("presenterId") ?? "").trim();
    const created = await startSimpleCreation(brandId, {
      goal: String(form.get("goal") ?? ""),
      ...(String(form.get("input") ?? "").trim()
        ? { input: String(form.get("input")) }
        : {}),
      ...(String(form.get("source") ?? "").trim()
        ? { source: String(form.get("source")) }
        : {}),
      contentPreference: String(form.get("contentPreference") ?? "auto") as
        "auto" | "carousel" | "reel" | "image" | "campaign",
      ...(presenterId ? { presenterId } : {}),
    });
    creationId=created.id;
  } catch (e) {
    redirect(
      `/brands/${encodeURIComponent(brandId)}/create?error=${encodeURIComponent(e instanceof Error ? e.message : "Unable to start creation")}`,
    );
  }
  redirect(`/brands/${encodeURIComponent(brandId)}/create/${encodeURIComponent(creationId)}`);
}
