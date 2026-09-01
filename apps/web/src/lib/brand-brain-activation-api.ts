import { cookies } from "next/headers";
import type { BrandDnaReadinessResponse } from "@kairo/contracts";

export type BrandBrainActivationStatus = "ready-for-hunter" | "needs-review" | "needs-enrichment";

export interface BrandBrainActivationView {
  status: BrandBrainActivationStatus;
  hunterReady: boolean;
  readiness: BrandDnaReadinessResponse;
  completeness: { score: number; knownGroups: number; totalGroups: number };
  weakFields: string[];
  recommendedSources: Array<{
    gap: string;
    type: "website" | "public-link" | "confirm-field";
    fieldKey?: string;
    label: string;
    reason: string;
  }>;
  evidenceSourceCount: number;
  updatedAt: string | null;
}

export async function getBrandBrainActivation(brandId: string): Promise<BrandBrainActivationView> {
  const token = (await cookies()).get("kairo_access_token")?.value;
  if (!token) throw new Error("Authentication is required");
  const base = (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
  const response = await fetch(`${base}/api/v1/brands/${encodeURIComponent(brandId)}/brain/activation`, {
    cache: "no-store",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(body?.detail ?? "Unable to evaluate Brand Brain activation");
  }
  return response.json() as Promise<BrandBrainActivationView>;
}
