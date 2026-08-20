import { cookies } from "next/headers";
import { KairoApiError, type PublishCommandView } from "./kairo-api";

function apiBase(): string {
  return (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
}

export async function publishApprovedContentNow(
  brandId: string,
  campaignId: string,
  assetId: string,
  input: { channelAccountId: string; contentType: "text" | "image" | "video" | "carousel" },
): Promise<PublishCommandView> {
  const token = (await cookies()).get("kairo_access_token")?.value;
  if (!token) throw new KairoApiError("Authentication is required", 401);

  const response = await fetch(
    `${apiBase()}/api/v1/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(campaignId)}/assets/${encodeURIComponent(assetId)}/schedule`,
    {
      method: "POST",
      cache: "no-store",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new KairoApiError(body?.detail ?? "Unable to publish approved content", response.status);
  }
  return (await response.json()) as PublishCommandView;
}
