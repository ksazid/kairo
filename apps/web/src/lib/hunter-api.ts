import { cookies } from "next/headers";

export interface HunterRecommendationResult {
  evidenceCount: number;
  candidateCount: number;
  opportunityCount: number;
  degradedSources?: string[];
}

export class HunterApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function runHunterRecommendations(brandId: string): Promise<HunterRecommendationResult> {
  const token = (await cookies()).get("kairo_access_token")?.value;
  if (!token) throw new HunterApiError("Authentication is required", 401);

  const base = (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
  const response = await fetch(`${base}/api/v1/brands/${encodeURIComponent(brandId)}/recommendations`, {
    method: "POST",
    cache: "no-store",
    headers: { authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new HunterApiError(body?.detail ?? "Kairo could not refresh recommendations.", response.status);
  }
  return (await response.json()) as HunterRecommendationResult;
}
