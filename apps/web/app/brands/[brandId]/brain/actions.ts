"use server";

import { redirect } from "next/navigation";
import type { BrandBrainSection, CreateKnowledgeSourceRequest, KnowledgeSourceType } from "@kairo/contracts";
import {
  createKnowledgeSource,
  putBrandBrainField,
  removeKnowledgeSource,
  setKnowledgeSourceEnabled,
} from "../../../../src/lib/kairo-api";

function target(brandId: string, key: "notice" | "error", value: string): never {
  const params = new URLSearchParams({ [key]: value.slice(0, 180) });
  redirect(`/brands/${encodeURIComponent(brandId)}/brain?${params.toString()}`);
}

export async function saveBrandBrainFieldAction(
  brandId: string,
  fieldKey: string,
  section: BrandBrainSection,
  formData: FormData,
): Promise<void> {
  try {
    const value = String(formData.get("value") ?? "");
    const expectedRaw = String(formData.get("expectedVersion") ?? "").trim();
    await putBrandBrainField(brandId, fieldKey, {
      section,
      value,
      ...(expectedRaw ? { expectedVersion: Number(expectedRaw) } : {}),
    });
  } catch (error) {
    return target(brandId, "error", error instanceof Error ? error.message : "Unable to save Brand Brain field");
  }
  return target(brandId, "notice", "Brand Brain updated");
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
  } catch (error) {
    return target(brandId, "error", error instanceof Error ? error.message : "Unable to add Knowledge source");
  }
  return target(brandId, "notice", "Knowledge source added");
}

export async function setKnowledgeSourceEnabledAction(brandId: string, sourceId: string, enabled: boolean): Promise<void> {
  try {
    await setKnowledgeSourceEnabled(brandId, sourceId, enabled);
  } catch (error) {
    return target(brandId, "error", error instanceof Error ? error.message : "Unable to update Knowledge source");
  }
  return target(brandId, "notice", enabled ? "Knowledge source enabled" : "Knowledge source disabled");
}

export async function removeKnowledgeSourceAction(brandId: string, sourceId: string): Promise<void> {
  try {
    await removeKnowledgeSource(brandId, sourceId);
  } catch (error) {
    return target(brandId, "error", error instanceof Error ? error.message : "Unable to remove Knowledge source");
  }
  return target(brandId, "notice", "Knowledge source removed and derived context re-evaluated");
}
