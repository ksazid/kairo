"use server";

import { redirect } from "next/navigation";
import { createIdea, selectIdeaAngle } from "../../../../src/lib/kairo-api";

export async function createIdeaAction(brandId: string, formData: FormData): Promise<void> {
  try {
    const idea = await createIdea(brandId, { title: String(formData.get("title") ?? ""), premise: String(formData.get("premise") ?? "") });
    redirect(`/brands/${encodeURIComponent(brandId)}/ideas/${encodeURIComponent(idea.id)}?notice=${encodeURIComponent("Idea created. Research is the next step.")}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create Idea";
    redirect(`/brands/${encodeURIComponent(brandId)}/ideas?error=${encodeURIComponent(message.slice(0, 180))}`);
  }
}

export async function selectAngleAction(brandId: string, ideaId: string, angleId: string, expectedVersion: number): Promise<void> {
  try {
    await selectIdeaAngle(brandId, ideaId, angleId, expectedVersion);
    redirect(`/brands/${encodeURIComponent(brandId)}/ideas/${encodeURIComponent(ideaId)}?notice=${encodeURIComponent("Angle selected")}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to select Angle";
    redirect(`/brands/${encodeURIComponent(brandId)}/ideas/${encodeURIComponent(ideaId)}?error=${encodeURIComponent(message.slice(0, 180))}`);
  }
}
