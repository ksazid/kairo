import { cookies } from "next/headers";

export type HomeMediaKind = "image" | "video";
export interface HomeMediaAssetView {
  id: string;
  name: string;
  kind: HomeMediaKind;
  source: "uploaded" | "generated" | "brand-asset";
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationMs?: number;
  previewUrl: string;
  createdAt: string;
}
export interface BeginHomeMediaUploadView {
  mediaAssetId: string;
  uploadUrl: string;
  expiresInSeconds: number;
  headers: { "content-type": string };
}

class HomeMediaApiError extends Error {}
function base() { return (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, ""); }
async function call<T>(path: string, init?: RequestInit) {
  const token = (await cookies()).get("kairo_access_token")?.value;
  if (!token) throw new HomeMediaApiError("Authentication is required");
  const response = await fetch(`${base()}${path}`, {
    ...init,
    cache: "no-store",
    headers: { authorization: `Bearer ${token}`, ...(init?.body ? { "content-type": "application/json" } : {}) },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string; title?: string } | null;
    throw new HomeMediaApiError(body?.detail ?? body?.title ?? "Unable to access media");
  }
  return (await response.json()) as T;
}
export function getHomeMedia(brandId: string) { return call<HomeMediaAssetView[]>(`/api/v1/brands/${encodeURIComponent(brandId)}/home-media`); }
export function beginHomeMediaUpload(brandId: string, input: { name: string; mimeType: string; sizeBytes: number }) {
  return call<BeginHomeMediaUploadView>(`/api/v1/brands/${encodeURIComponent(brandId)}/home-media/uploads`, { method: "POST", body: JSON.stringify(input) });
}
export function completeHomeMediaUpload(brandId: string, mediaAssetId: string) {
  return call<HomeMediaAssetView>(`/api/v1/brands/${encodeURIComponent(brandId)}/home-media/uploads/${encodeURIComponent(mediaAssetId)}/complete`, { method: "POST", body: "{}" });
}
