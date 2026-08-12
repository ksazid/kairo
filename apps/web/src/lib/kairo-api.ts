import { cookies } from "next/headers";
import type {
  BrandBrainFieldDto,
  BrandDto,
  CreateKnowledgeSourceRequest,
  CreateWorkspaceWithBrandRequest,
  CreateWorkspaceWithBrandResponse,
  KnowledgeSourceDto,
  PutBrandBrainFieldRequest,
  SessionResponse,
} from "@kairo/contracts";

export class KairoApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

function apiBase(): string { return (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, ""); }
async function accessToken(): Promise<string | null> { return (await cookies()).get("kairo_access_token")?.value ?? null; }

async function authorizedFetch(path: string, init?: RequestInit): Promise<Response | null> {
  const token = await accessToken();
  if (!token) return null;
  return fetch(`${apiBase()}${path}`, {
    ...init,
    cache: "no-store",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}

async function bodyOrError<T>(response: Response | null, fallback: string): Promise<T> {
  if (!response) throw new KairoApiError("Authentication is required", 401);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new KairoApiError(body?.detail ?? fallback, response.status);
  }
  return (await response.json()) as T;
}

export async function getSession(): Promise<SessionResponse | null> {
  const response = await authorizedFetch("/api/v1/session");
  if (!response?.ok) return null;
  return (await response.json()) as SessionResponse;
}

export async function getBrands(workspaceId: string): Promise<BrandDto[]> {
  const response = await authorizedFetch(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/brands`);
  if (!response?.ok) return [];
  return (await response.json()) as BrandDto[];
}

export async function getBrand(brandId: string): Promise<BrandDto | null> {
  const response = await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}`);
  if (!response?.ok) return null;
  return (await response.json()) as BrandDto;
}

export async function createWorkspaceWithBrand(input: CreateWorkspaceWithBrandRequest): Promise<CreateWorkspaceWithBrandResponse> {
  return bodyOrError(await authorizedFetch("/api/v1/workspaces", { method: "POST", body: JSON.stringify(input) }), "Unable to create Workspace and Brand");
}

export async function getBrandBrain(brandId: string): Promise<BrandBrainFieldDto[]> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/brain`), "Unable to load Brand Brain");
}

export async function putBrandBrainField(brandId: string, fieldKey: string, input: PutBrandBrainFieldRequest): Promise<BrandBrainFieldDto> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/brain/${encodeURIComponent(fieldKey)}`, { method: "PUT", body: JSON.stringify(input) }), "Unable to save Brand Brain field");
}

export async function getKnowledgeSources(brandId: string): Promise<KnowledgeSourceDto[]> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/sources`), "Unable to load Knowledge sources");
}

export async function createKnowledgeSource(brandId: string, input: CreateKnowledgeSourceRequest): Promise<KnowledgeSourceDto> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/sources`, { method: "POST", body: JSON.stringify(input) }), "Unable to add Knowledge source");
}

export async function setKnowledgeSourceEnabled(brandId: string, sourceId: string, enabled: boolean): Promise<KnowledgeSourceDto> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/sources/${encodeURIComponent(sourceId)}/${enabled ? "enable" : "disable"}`, { method: "POST" }), `Unable to ${enabled ? "enable" : "disable"} Knowledge source`);
}

export async function removeKnowledgeSource(brandId: string, sourceId: string): Promise<KnowledgeSourceDto> {
  return bodyOrError(await authorizedFetch(`/api/v1/brands/${encodeURIComponent(brandId)}/sources/${encodeURIComponent(sourceId)}`, { method: "DELETE" }), "Unable to remove Knowledge source");
}
