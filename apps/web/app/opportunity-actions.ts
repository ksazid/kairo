"use server";

import { redirect } from "next/navigation";
import type { OpportunityAction } from "@kairo/contracts";
import { actOnOpportunity } from "../src/lib/kairo-api";

export async function opportunityAction(
  brandId: string,
  opportunityId: string,
  action: OpportunityAction,
  returnTo: string,
): Promise<void> {
  const safeReturn = safeLocalPath(returnTo);
  try {
    await actOnOpportunity(brandId, opportunityId, action);
  } catch (error) {
    const message = error instanceof Error ? error.message : `Unable to ${action} Opportunity`;
    redirect(withMessage(safeReturn, "error", message));
  }
  const notice = action === "save" ? "Opportunity saved" : action === "ignore" ? "Opportunity ignored" : "Opportunity marked ready to develop";
  redirect(withMessage(safeReturn, "notice", notice));
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
