import { cookies } from "next/headers";
import type { BrandDto } from "@kairo/contracts";
import { KairoApiError } from "./kairo-api";

function apiBase(): string {
  return (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
}

export async function createBrand(workspaceId: string, brandName: string): Promise<BrandDto> {
  const token = (await cookies()).get("kairo_access_token")?.value;
  if (!token) throw new KairoApiError("Authentication is required", 401);
  const response = await fetch(`${apiBase()}/api/v1/workspaces/${encodeURIComponent(workspaceId)}/brands`, {
    method: "POST",
    cache: "no-store",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ brandName }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new KairoApiError(body?.detail ?? "Unable to create Brand", response.status);
  }
  return (await response.json()) as BrandDto;
}
