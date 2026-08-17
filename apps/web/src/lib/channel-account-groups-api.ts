import { cookies } from "next/headers";

export interface ChannelAccountGroupView {
  id: string;
  workspaceId: string;
  brandId: string;
  name: string;
  memberAccountIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DistributionResultView {
  campaignId: string;
  scheduledFor: string;
  destinations: Array<{ assetId: string; channelAccountId: string; status: string; channel?: string; accountRef?: string; commandId?: string; reason?: string }>;
}

function apiBase() { return (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, ""); }
async function token() { return (await cookies()).get("kairo_access_token")?.value ?? null; }
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await token();
  if (!accessToken) throw new Error("Authentication is required");
  const response = await fetch(`${apiBase()}${path}`, { ...init, cache: "no-store", headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json", ...(init?.headers ?? {}) } });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(body?.detail ?? "Kairo request failed");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getChannelAccountGroups(brandId: string) {
  return request<ChannelAccountGroupView[]>(`/api/v1/brands/${encodeURIComponent(brandId)}/channel-account-groups`);
}
export function createChannelAccountGroupRequest(brandId: string, input: { name: string; memberAccountIds: string[] }) {
  return request<ChannelAccountGroupView>(`/api/v1/brands/${encodeURIComponent(brandId)}/channel-account-groups`, { method: "POST", body: JSON.stringify(input) });
}
export function updateChannelAccountGroupRequest(brandId: string, groupId: string, input: { name: string; memberAccountIds: string[] }) {
  return request<ChannelAccountGroupView>(`/api/v1/brands/${encodeURIComponent(brandId)}/channel-account-groups/${encodeURIComponent(groupId)}`, { method: "PUT", body: JSON.stringify(input) });
}
export function deleteChannelAccountGroupRequest(brandId: string, groupId: string) {
  return request<void>(`/api/v1/brands/${encodeURIComponent(brandId)}/channel-account-groups/${encodeURIComponent(groupId)}`, { method: "DELETE" });
}
export function distributeCampaignRequest(brandId: string, campaignId: string, input: { scheduledFor: string; destinations: Array<{ assetId: string; expectedVersion: number; channelAccountId: string; contentType: "text" | "image" | "video" | "carousel" | "reel" }> }) {
  return request<DistributionResultView>(`/api/v1/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(campaignId)}/distributions`, { method: "POST", body: JSON.stringify(input) });
}
