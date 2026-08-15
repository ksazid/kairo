import { cookies } from "next/headers";
import type { BrandBrainBuildResponse, BuildBrandBrainRequest } from "@kairo/contracts";

function apiBase(): string { return (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, ""); }

export async function buildBrandBrain(brandId: string, input: BuildBrandBrainRequest): Promise<BrandBrainBuildResponse> {
  const token = (await cookies()).get("kairo_access_token")?.value;
  if (!token) throw new Error("Authentication is required");
  const response = await fetch(`${apiBase()}/api/v1/brands/${encodeURIComponent(brandId)}/brain/bootstrap`, {
    method: "POST",
    cache: "no-store",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? "Unable to build Brand Brain");
  }
  return (await response.json()) as BrandBrainBuildResponse;
}
