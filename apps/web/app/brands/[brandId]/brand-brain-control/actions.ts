"use server";

import type { BrandBrainSection } from "@kairo/contracts";
import {
  addKnowledgeSourceAction as addParent,
  removeKnowledgeSourceAction as removeParent,
  saveBrandBrainFieldAction as saveParent,
  setKnowledgeSourceEnabledAction as setEnabledParent,
} from "../brain/actions";

export async function addKnowledgeSourceAction(brandId: string, formData: FormData): Promise<void> {
  return addParent(brandId, formData);
}

export async function removeKnowledgeSourceAction(brandId: string, sourceId: string): Promise<void> {
  return removeParent(brandId, sourceId);
}

export async function saveBrandBrainFieldAction(
  brandId: string,
  fieldKey: string,
  section: BrandBrainSection,
  formData: FormData,
): Promise<void> {
  return saveParent(brandId, fieldKey, section, formData);
}

export async function setKnowledgeSourceEnabledAction(
  brandId: string,
  sourceId: string,
  enabled: boolean,
): Promise<void> {
  return setEnabledParent(brandId, sourceId, enabled);
}
