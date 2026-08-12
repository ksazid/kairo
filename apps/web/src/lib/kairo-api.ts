import { cookies } from "next/headers";
import type {
  BrandDto,
  CreateWorkspaceWithBrandRequest,
  CreateWorkspaceWithBrandResponse,
  SessionResponse,
} from "@kairo/contracts";

function apiBase(): string {
  return (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
}

async function accessToken(): Promise<string | null> {
  return (await cookies()).get("kairo_access_token")?.value ?? null;
}

async function authorizedFetch(path: string, init?: RequestInit): Promise<Response | null> {
  const token = await accessToken();
  if (!token) return null;
  return fetch(`${apiBase()}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
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

export async function createWorkspaceWithBrand(
  input: CreateWorkspaceWithBrandRequest,
): Promise<CreateWorkspaceWithBrandResponse> {
  const response = await authorizedFetch("/api/v1/workspaces", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!response) throw new Error("Authentication is required");
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? "Unable to create Workspace and Brand");
  }
  return (await response.json()) as CreateWorkspaceWithBrandResponse;
}
