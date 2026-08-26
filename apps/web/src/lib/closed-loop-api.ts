import { cookies } from "next/headers";

export type RecommendationFeedbackAction = "seen" | "dismissed";
export interface OpportunityDevelopmentView {
  ideaId: string;
  opportunityId: string;
  status: "developing";
  reused: boolean;
}
export interface RecommendationFeedbackView {
  opportunityId: string;
  action: RecommendationFeedbackAction;
  status: "new" | "saved" | "ignored" | "developing";
}
export interface RecommendationRunView {
  evidenceCount: number;
  candidateCount: number;
  opportunityCount: number;
  degradedSources?: string[];
}

class ClosedLoopApiError extends Error {}

function base() {
  return (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const token = (await cookies()).get("kairo_access_token")?.value;
  if (!token) throw new ClosedLoopApiError("Authentication is required");
  const response = await fetch(`${base()}${path}`, {
    ...init,
    cache: "no-store",
    headers: { authorization: `Bearer ${token}`, ...(init?.body ? { "content-type": "application/json" } : {}) },
  });
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new ClosedLoopApiError(problem?.detail ?? "Kairo closed-loop action failed");
  }
  return (await response.json()) as T;
}

export function requestRecommendations(brandId: string) {
  return call<RecommendationRunView>(`/api/v1/brands/${encodeURIComponent(brandId)}/recommendations`, { method: "POST" });
}

export function recordRecommendationFeedback(brandId: string, opportunityId: string, action: RecommendationFeedbackAction) {
  return call<RecommendationFeedbackView>(
    `/api/v1/brands/${encodeURIComponent(brandId)}/opportunities/${encodeURIComponent(opportunityId)}/feedback/${action}`,
    { method: "POST" },
  );
}

export function developOpportunity(brandId: string, opportunityId: string) {
  return call<OpportunityDevelopmentView>(
    `/api/v1/brands/${encodeURIComponent(brandId)}/opportunities/${encodeURIComponent(opportunityId)}/development`,
    { method: "POST" },
  );
}
