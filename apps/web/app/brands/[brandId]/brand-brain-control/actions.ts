"use server";

import { redirect } from "next/navigation";
import type { BrandBrainSection, CreateKnowledgeSourceRequest, KnowledgeSourceType } from "@kairo/contracts";
import {
  createKnowledgeSource,
  putBrandBrainField,
  removeKnowledgeSource,
  setKnowledgeSourceEnabled,
  deleteBrand,
} from "../../../../src/lib/kairo-api";
import { fieldAnchor } from "../../../../src/lib/brand-brain-view-model";
import { buildBrandBrain } from "../../../../src/lib/guided-brand-brain-api";

function target(brandId: string, key: "notice" | "error", value: string, anchor?: string): never {
  const params = new URLSearchParams({ [key]: value.slice(0, 180) });
  const hash = anchor ? `#${anchor}` : "";
  redirect(`/brands/${encodeURIComponent(brandId)}/brain?${params.toString()}${hash}`);
}

export async function deleteBrandAction(brandId: string, formData: FormData): Promise<void> {
  if (String(formData.get("confirmation") ?? "").trim() !== "DELETE BRAND") {
    return target(brandId, "error", "Type DELETE BRAND exactly to permanently remove this Brand.");
  }
  try { await deleteBrand(brandId); } catch (error) { return target(brandId, "error", error instanceof Error ? error.message : "Unable to delete Brand"); }
  redirect("/?notice=Brand%20and%20all%20related%20data%20deleted");
}

export async function addKnowledgeSourceAction(brandId: string, formData: FormData): Promise<void> {
  try {
    const type = String(formData.get("type") ?? "") as KnowledgeSourceType;
    const title = String(formData.get("title") ?? "").trim();
    const url = String(formData.get("url") ?? "").trim();
    const content = String(formData.get("content") ?? "").trim();
    const input: CreateKnowledgeSourceRequest = {
      type,
      ...(title ? { title } : {}),
      ...((type === "url" || type === "website") && url ? { url } : {}),
      ...(!["url", "website", "document"].includes(type) && content ? { content } : {}),
    };
    await createKnowledgeSource(brandId, input);
    if ((type === "url" || type === "website") && url) await buildBrandBrain(brandId, { publicReferenceUrl: url });
  } catch (error) {
    return target(brandId, "error", error instanceof Error ? error.message : "Unable to add source", "sources");
  }
  return target(brandId, "notice", "Source added", "sources");
}

export async function removeKnowledgeSourceAction(brandId: string, sourceId: string): Promise<void> {
  try {
    await removeKnowledgeSource(brandId, sourceId);
  } catch (error) {
    return target(brandId, "error", error instanceof Error ? error.message : "Unable to remove source", "sources");
  }
  return target(brandId, "notice", "Source removed and Brand context re-evaluated", "sources");
}

export async function saveBrandBrainFieldAction(
  brandId: string,
  fieldKey: string,
  section: BrandBrainSection,
  formData: FormData,
): Promise<void> {
  const anchor = fieldAnchor(fieldKey);
  try {
    const value = String(formData.get("value") ?? "");
    const expectedRaw = String(formData.get("expectedVersion") ?? "").trim();
    await putBrandBrainField(brandId, fieldKey, {
      section,
      value,
      ...(expectedRaw ? { expectedVersion: Number(expectedRaw) } : {}),
    });
  } catch (error) {
    return target(brandId, "error", error instanceof Error ? error.message : "Unable to save Brand field", anchor);
  }
  return target(brandId, "notice", "Brand field saved", anchor);
}

export async function setKnowledgeSourceEnabledAction(
  brandId: string,
  sourceId: string,
  enabled: boolean,
): Promise<void> {
  try {
    await setKnowledgeSourceEnabled(brandId, sourceId, enabled);
  } catch (error) {
    return target(brandId, "error", error instanceof Error ? error.message : "Unable to update source", "sources");
  }
  return target(brandId, "notice", enabled ? "Source enabled" : "Source disabled", "sources");
}
