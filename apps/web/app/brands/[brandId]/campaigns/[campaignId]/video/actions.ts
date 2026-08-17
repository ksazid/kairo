"use server";

import { redirect } from "next/navigation";
import {
  createVideoProject,
  moveVideoProjectScene,
  parseVideoProject,
  retimeVideoProjectScene,
  serializeVideoProject,
  updateVideoProjectScene,
  validateVideoProject,
  type VideoProject,
} from "@kairo/domain/video-project";
import { appendContentEdit, getCampaignDetail } from "../../../../../../src/lib/kairo-api";

const route = (brandId: string, campaignId: string, assetId: string) =>
  `/brands/${encodeURIComponent(brandId)}/campaigns/${encodeURIComponent(campaignId)}/video/${encodeURIComponent(assetId)}`;

function message(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

async function currentVideoAsset(brandId: string, campaignId: string, assetId: string, expectedVersion: number) {
  const detail = await getCampaignDetail(brandId, campaignId);
  const entry = detail.assets.find(({ asset }) => asset.id === assetId);
  if (!entry) throw new Error("Content Asset not found");
  if (entry.asset.format.toLowerCase() !== "reel") throw new Error("Video Studio currently supports Reel Content Assets");
  const current = entry.versions.at(-1);
  if (!current) throw new Error("Content Version not found");
  if (entry.asset.currentVersion !== expectedVersion || current.version !== expectedVersion) throw new Error("Content Version is stale");
  return { detail, entry, current };
}

async function saveProject(brandId: string, campaignId: string, assetId: string, expectedVersion: number, project: VideoProject, notice: string) {
  await appendContentEdit(brandId, campaignId, assetId, {
    expectedVersion,
    content: serializeVideoProject(project),
  });
  redirect(`${route(brandId, campaignId, assetId)}?notice=${encodeURIComponent(notice)}`);
}

export async function initializeVideoProjectAction(brandId: string, campaignId: string, assetId: string, expectedVersion: number, form: FormData) {
  try {
    const { detail, current } = await currentVideoAsset(brandId, campaignId, assetId, expectedVersion);
    const scene1Duration = Number(form.get("scene1Duration") ?? 0);
    const scene2Duration = Number(form.get("scene2Duration") ?? 0);
    const supportingClaimIds = [...current.supportingClaimIds];
    if (!supportingClaimIds.length) throw new Error("Video Project requires supporting Claims from the Content Version");

    const project = createVideoProject({
      id: `video-project-${assetId}-${current.id}`,
      workspaceId: detail.campaign.workspaceId,
      brandId,
      campaignId,
      assetId,
      sourceVersionId: current.id,
      sourceVersion: current.version,
      plan: {
        format: "reel",
        hook: String(form.get("hook") ?? ""),
        targetDurationSeconds: scene1Duration + scene2Duration,
        scenes: [
          {
            startSecond: 0,
            endSecond: scene1Duration,
            visual: String(form.get("scene1Visual") ?? ""),
            onScreenText: String(form.get("scene1OnScreenText") ?? ""),
            voiceover: String(form.get("scene1Voiceover") ?? ""),
            supportingClaimIds,
          },
          {
            startSecond: scene1Duration,
            endSecond: scene1Duration + scene2Duration,
            visual: String(form.get("scene2Visual") ?? ""),
            onScreenText: String(form.get("scene2OnScreenText") ?? ""),
            voiceover: String(form.get("scene2Voiceover") ?? ""),
            supportingClaimIds,
          },
        ],
        caption: String(form.get("caption") ?? ""),
        cta: String(form.get("cta") ?? ""),
        supportingClaimIds,
      },
    });

    await saveProject(brandId, campaignId, assetId, expectedVersion, project, "Video Project initialized as a new Content Version");
  } catch (error) {
    redirect(`${route(brandId, campaignId, assetId)}?error=${encodeURIComponent(message(error, "Unable to initialize Video Project"))}`);
  }
}

export async function saveVideoProjectCopyAction(brandId: string, campaignId: string, assetId: string, expectedVersion: number, form: FormData) {
  try {
    const { current } = await currentVideoAsset(brandId, campaignId, assetId, expectedVersion);
    const project = parseVideoProject(current.content);
    const updated = validateVideoProject({
      ...project,
      hook: String(form.get("hook") ?? ""),
      caption: String(form.get("caption") ?? ""),
      cta: String(form.get("cta") ?? ""),
    });
    await saveProject(brandId, campaignId, assetId, expectedVersion, updated, "Video Project copy saved as a new Content Version");
  } catch (error) {
    redirect(`${route(brandId, campaignId, assetId)}?error=${encodeURIComponent(message(error, "Unable to save Video Project copy"))}`);
  }
}

export async function saveVideoProjectSceneAction(brandId: string, campaignId: string, assetId: string, expectedVersion: number, sceneId: string, form: FormData) {
  try {
    const { current } = await currentVideoAsset(brandId, campaignId, assetId, expectedVersion);
    const project = parseVideoProject(current.content);
    const updated = updateVideoProjectScene(project, sceneId, {
      visual: String(form.get("visual") ?? ""),
      onScreenText: String(form.get("onScreenText") ?? ""),
      voiceover: String(form.get("voiceover") ?? ""),
    });
    await saveProject(brandId, campaignId, assetId, expectedVersion, updated, "Scene saved as a new Content Version");
  } catch (error) {
    redirect(`${route(brandId, campaignId, assetId)}?error=${encodeURIComponent(message(error, "Unable to save scene"))}`);
  }
}

export async function retimeVideoProjectSceneAction(brandId: string, campaignId: string, assetId: string, expectedVersion: number, sceneId: string, form: FormData) {
  try {
    const { current } = await currentVideoAsset(brandId, campaignId, assetId, expectedVersion);
    const project = parseVideoProject(current.content);
    const updated = retimeVideoProjectScene(project, sceneId, Number(form.get("durationSeconds") ?? 0));
    await saveProject(brandId, campaignId, assetId, expectedVersion, updated, "Scene timing saved as a new Content Version");
  } catch (error) {
    redirect(`${route(brandId, campaignId, assetId)}?error=${encodeURIComponent(message(error, "Unable to retime scene"))}`);
  }
}

export async function moveVideoProjectSceneAction(brandId: string, campaignId: string, assetId: string, expectedVersion: number, sceneId: string, toIndex: number) {
  try {
    const { current } = await currentVideoAsset(brandId, campaignId, assetId, expectedVersion);
    const project = parseVideoProject(current.content);
    const updated = moveVideoProjectScene(project, sceneId, toIndex);
    await saveProject(brandId, campaignId, assetId, expectedVersion, updated, "Scene order saved as a new Content Version");
  } catch (error) {
    redirect(`${route(brandId, campaignId, assetId)}?error=${encodeURIComponent(message(error, "Unable to reorder scene"))}`);
  }
}
