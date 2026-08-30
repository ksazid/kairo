import { cookies } from "next/headers";

export type HomeOpportunity = {
  id: string;
  title: string;
  rationale?: string;
  whyNow?: string;
  developmentDirection?: string;
  scores?: { relevance?: number; audienceFit?: number; overall?: number };
  details?: { recommendedFormat?: string; proposedAngle?: string };
};

export type HomeData = {
  authenticated: boolean;
  brandId?: string;
  brandName: string;
  opportunities: HomeOpportunity[];
};

const apiBase = () => (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");

async function api(path: string) {
  const token = (await cookies()).get("kairo_access_token")?.value;
  if (!token) return null;
  return fetch(`${apiBase()}${path}`, { cache: "no-store", headers: { authorization: `Bearer ${token}` } });
}

export async function getHomeData(): Promise<HomeData> {
  const sessionResponse = await api("/api/v1/session");
  if (!sessionResponse?.ok) return { authenticated: false, brandName: "Sazzid", opportunities: [] };
  const session = await sessionResponse.json() as { workspaces?: Array<{ id: string }> };
  const workspaceId = session.workspaces?.[0]?.id;
  if (!workspaceId) return { authenticated: true, brandName: "Sazzid", opportunities: [] };
  const brandsResponse = await api(`/api/v1/workspaces/${encodeURIComponent(workspaceId)}/brands`);
  const brands = brandsResponse?.ok ? await brandsResponse.json() as Array<{ id: string; name: string }> : [];
  const brand = brands[0];
  if (!brand) return { authenticated: true, brandName: "Sazzid", opportunities: [] };
  const opportunitiesResponse = await api(`/api/v1/brands/${encodeURIComponent(brand.id)}/opportunities`);
  const opportunities = opportunitiesResponse?.ok ? await opportunitiesResponse.json() as HomeOpportunity[] : [];
  return { authenticated: true, brandId: brand.id, brandName: brand.name, opportunities };
}
