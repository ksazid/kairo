"use server";

import { redirect } from "next/navigation";
import type { OpportunityAction } from "@kairo/contracts";
import { actOnOpportunity, startIdeaResearch } from "../src/lib/kairo-api";
import {
  developOpportunity,
  recordRecommendationFeedback,
  type OpportunityDevelopmentView,
} from "../src/lib/closed-loop-api";

export async function opportunityAction(
  brandId: string,
  opportunityId: string,
  action: OpportunityAction,
  returnTo: string,
): Promise<void> {
  const safeReturn = safeLocalPath(returnTo);
  let destination = safeReturn;
  let notice = action === "save" ? "Opportunity saved" : action === "ignore" ? "Opportunity ignored" : "Opportunity marked ready to develop";
  let researchError = "";
  try {
    if (action === "develop") {
      const development = await prepareOpportunityDevelopmentAction(brandId, opportunityId);
      destination = `/brands/${encodeURIComponent(brandId)}/ideas/${encodeURIComponent(development.ideaId)}`;
      notice = development.reused ? "Continuing this opportunity" : "Opportunity moved into Research";
      try {
        await startIdeaResearch(brandId, development.ideaId);
        notice = "Research and candidate Angles are ready";
      } catch (error) {
        researchError = error instanceof Error ? error.message : "Research will continue from the saved Idea.";
      }
    } else {
      await actOnOpportunity(brandId, opportunityId, action);
      if (action === "ignore") await recordRecommendationFeedback(brandId, opportunityId, "dismissed");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : `Unable to ${action} Opportunity`;
    redirect(withMessage(safeReturn, "error", message));
  }
  if (researchError) redirect(withMessage(destination, "error", researchError));
  redirect(withMessage(destination, "notice", notice));
}

export async function prepareOpportunityDevelopmentAction(
  brandId: string,
  opportunityId: string,
): Promise<OpportunityDevelopmentView> {
  await actOnOpportunity(brandId, opportunityId, "develop");
  return developOpportunity(brandId, opportunityId);
}

export async function saveOpportunityAction(brandId: string, opportunityId: string) {
  return actOnOpportunity(brandId, opportunityId, "save");
}

export async function recordSeenAction(brandId: string, opportunityId: string): Promise<void> {
  try {
    await recordRecommendationFeedback(brandId, opportunityId, "seen");
  } catch {
    // Seen feedback is enrichment only; a transient feedback failure must not break the reading UI.
  }
}

function safeLocalPath(value: string): string {
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\n") || path.includes("\r")) return "/";
  return path;
}

function withMessage(path: string, key: "notice" | "error", value: string): string {
  const url = new URL(path, "https://kairo.local");
  url.searchParams.set(key, value.slice(0, 180));
  return `${url.pathname}${url.search}`;
}
