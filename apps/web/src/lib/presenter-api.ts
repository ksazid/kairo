import { cookies } from "next/headers";
import type { BrandPresenterResponse, PutBrandPresenterRequest } from "@kairo/contracts/presenter";

class PresenterApiError extends Error {}

function base() {
  return (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
}

async function call<T>(path: string, init?: RequestInit) {
  const token = (await cookies()).get("kairo_access_token")?.value;
  if (!token) throw new PresenterApiError("Authentication is required");
  const response = await fetch(`${base()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      authorization: `Bearer ${token}`,
      ...(init?.body ? { "content-type": "application/json" } : {}),
    },
  });
  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { detail?: string; title?: string } | null;
    throw new PresenterApiError(problem?.detail ?? problem?.title ?? "Unable to save presenter");
  }
  return (await response.json()) as T;
}

export function getBrandPresenter(brandId: string) {
  return call<BrandPresenterResponse>(`/api/v1/brands/${encodeURIComponent(brandId)}/presenter`);
}

export function putBrandPresenter(brandId: string, input: PutBrandPresenterRequest) {
  return call<BrandPresenterResponse>(`/api/v1/brands/${encodeURIComponent(brandId)}/presenter`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}
