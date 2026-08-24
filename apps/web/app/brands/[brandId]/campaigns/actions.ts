"use server";

import { redirect } from "next/navigation";
import {
  appendContentEdit,
  approveContentVersionRequest,
  createCampaign,
  createContentAsset,
  generateContentVersion,
  getChannelAccounts,
  requestContentReview,
  scheduleApprovedContent,
} from "../../../../src/lib/kairo-api";
import { publishApprovedContentNow } from "../../../../src/lib/publishing-api";
import { saveContentVersionProductionAssets } from "../../../../src/lib/content-asset-library-api";
import { distributeCampaignRequest, getChannelAccountGroups } from "../../../../src/lib/channel-account-groups-api";

const campaignUrl = (brandId: string, campaignId?: string) =>
  `/brands/${encodeURIComponent(brandId)}/campaigns${campaignId ? `/${encodeURIComponent(campaignId)}` : ""}`;
const contentUrl = (brandId: string, campaignId: string, assetId: string) =>
  `/brands/${encodeURIComponent(brandId)}/content/${encodeURIComponent(campaignId)}/${encodeURIComponent(assetId)}`;

export async function createCampaignAction(brandId: string, form: FormData) {
  try {
    const campaign = await createCampaign(brandId, {
      ideaId: String(form.get("ideaId") ?? ""),
      name: String(form.get("name") ?? ""),
      objective: String(form.get("objective") ?? ""),
    });
    redirect(`${campaignUrl(brandId, campaign.id)}?notice=${encodeURIComponent("Campaign created")}`);
  } catch (error) {
    redirect(`${campaignUrl(brandId)}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to create Campaign")}`);
  }
}

export async function createAssetAction(brandId: string, campaignId: string, form: FormData) {
  try {
    await createContentAsset(brandId, campaignId, {
      channel: String(form.get("channel") ?? "manual"),
      format: String(form.get("format") ?? "text"),
      audience: String(form.get("audience") ?? ""),
      topic: String(form.get("topic") ?? ""),
      hookType: String(form.get("hookType") ?? ""),
      cta: String(form.get("cta") ?? ""),
      content: String(form.get("content") ?? ""),
    });
  } catch (error) {
    redirect(`${campaignUrl(brandId, campaignId)}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to create content")}`);
  }
  redirect(`${campaignUrl(brandId, campaignId)}?notice=${encodeURIComponent("Content Asset created")}`);
}

export async function saveVersionAction(brandId: string, campaignId: string, assetId: string, expectedVersion: number, form: FormData) {
  try {
    await appendContentEdit(brandId, campaignId, assetId, {
      expectedVersion,
      content: String(form.get("content") ?? ""),
    });
    redirect(`${contentUrl(brandId, campaignId, assetId)}?notice=${encodeURIComponent("New Content Version saved")}`);
  } catch (error) {
    redirect(`${contentUrl(brandId, campaignId, assetId)}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to save version")}`);
  }
}

export async function saveProductionAssetsAction(brandId: string, campaignId: string, assetId: string, expectedVersion: number, form: FormData) {
  try {
    const libraryAssetIds = form.getAll("libraryAssetId").map((value) => String(value));
    await saveContentVersionProductionAssets(brandId, campaignId, assetId, { expectedVersion, libraryAssetIds });
    redirect(`${contentUrl(brandId, campaignId, assetId)}?notice=${encodeURIComponent("Production assets saved as a new Content Version")}`);
  } catch (error) {
    redirect(`${contentUrl(brandId, campaignId, assetId)}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to save production assets")}`);
  }
}

export async function generateVersionAction(brandId: string, campaignId: string, assetId: string, expectedVersion: number, action: string) {
  try {
    await generateContentVersion(brandId, campaignId, assetId, {
      expectedVersion,
      action,
      brandContextVersion: `${brandId}@current`,
    });
    redirect(`${contentUrl(brandId, campaignId, assetId)}?notice=${encodeURIComponent("AI-assisted version created")}`);
  } catch (error) {
    redirect(`${contentUrl(brandId, campaignId, assetId)}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to generate version")}`);
  }
}

export async function reviewContentAction(brandId: string, campaignId: string, assetId: string, expectedVersion: number) {
  try {
    await requestContentReview(brandId, campaignId, assetId, {
      expectedVersion,
      brandContextVersion: `${brandId}@current`,
      revisionCycle: 0,
    });
    redirect(`${contentUrl(brandId, campaignId, assetId)}?notice=${encodeURIComponent("Current version reviewed")}`);
  } catch (error) {
    redirect(`${contentUrl(brandId, campaignId, assetId)}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to review version")}`);
  }
}

export async function approveContentAction(
  brandId: string,
  campaignId: string,
  assetId: string,
  expectedVersion: number,
  channel: "linkedin" | "instagram" | "facebook" | "manual",
  form: FormData,
) {
  try {
    await approveContentVersionRequest(brandId, campaignId, assetId, {
      expectedVersion,
      destination: { channel, accountRef: String(form.get("accountRef") ?? "") },
    });
    redirect(`${contentUrl(brandId, campaignId, assetId)}?notice=${encodeURIComponent(`Version ${expectedVersion} approved and locked`)}`);
  } catch (error) {
    redirect(`${contentUrl(brandId, campaignId, assetId)}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to approve version")}`);
  }
}

export async function scheduleContentAction(brandId: string, campaignId: string, assetId: string, form: FormData) {
  try {
    const channelAccountId = String(form.get("channelAccountId") ?? "");
    const contentType = String(form.get("contentType") ?? "") as "text" | "image" | "video" | "carousel";
    if (form.get("publishMode") === "now") {
      await publishApprovedContentNow(brandId, campaignId, assetId, { channelAccountId, contentType });
      redirect(`/brands/${encodeURIComponent(brandId)}/calendar?notice=${encodeURIComponent("Approved version queued to publish now")}`);
    }
    await scheduleApprovedContent(brandId, campaignId, assetId, {
      channelAccountId,
      contentType,
      scheduledFor: String(form.get("scheduledForIso") ?? ""),
    });
    redirect(`/brands/${encodeURIComponent(brandId)}/calendar?notice=${encodeURIComponent("Approved version scheduled")}`);
  } catch (error) {
    redirect(`${contentUrl(brandId, campaignId, assetId)}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to schedule content")}`);
  }
}

export async function distributeGroupAction(brandId: string, campaignId: string, assetId: string, expectedVersion: number, form: FormData) {
  try {
    const [groupList, accounts] = await Promise.all([getChannelAccountGroups(brandId), getChannelAccounts(brandId)]);
    const group = groupList.find((item) => item.id === String(form.get("groupId") ?? ""));
    if (!group) throw new Error("Account group not found");
    const memberIds = new Set(group.memberAccountIds);
    const destinations = accounts
      .filter((account) => memberIds.has(account.id))
      .map((account) => ({
        assetId,
        expectedVersion,
        channelAccountId: account.id,
        contentType: String(form.get("contentType") ?? "text") as "text" | "image" | "video" | "carousel" | "reel",
      }));
    if (destinations.length !== group.memberAccountIds.length) throw new Error("Account group contains an unavailable destination");
    const result = await distributeCampaignRequest(brandId, campaignId, {
      scheduledFor: String(form.get("scheduledForIso") ?? ""),
      destinations,
    });
    const accepted = result.destinations.filter((item) => item.status === "scheduled" || item.status === "manual-required").length;
    const blocked = result.destinations.length - accepted;
    if (blocked) {
      redirect(`${contentUrl(brandId, campaignId, assetId)}?notice=${encodeURIComponent(`${accepted} destinations accepted`)}&error=${encodeURIComponent(`${blocked} destinations need attention; review connection state, capability or approval policy`)}`);
    }
    redirect(`/brands/${encodeURIComponent(brandId)}/calendar?notice=${encodeURIComponent(`${accepted} group destinations accepted`)}`);
  } catch (error) {
    redirect(`${contentUrl(brandId, campaignId, assetId)}?error=${encodeURIComponent(error instanceof Error ? error.message : "Unable to distribute to account group")}`);
  }
}
