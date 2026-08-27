import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { actOnOpportunity, getBrand, getLearnings, getOpportunities } from "../../../../../src/lib/kairo-api";
import { developOpportunity } from "../../../../../src/lib/closed-loop-api";
import { startSimpleCreation } from "../../../../../src/lib/simple-creation-api";
import { recommendHomeFormat, type HomeCreationFormat } from "../../../../../src/lib/home-creation-format";

type BatchItem = { opportunityId?: unknown; format?: unknown };
type RequestBody = { brandId?: unknown; items?: unknown };
const FORMATS = new Set<HomeCreationFormat>(["image", "carousel", "reel", "video"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const brandId = text(body?.brandId, 200);
  const items = Array.isArray(body?.items) ? body.items.slice(0, 6).filter(isBatchItem) : [];
  if (!brandId || !items.length) return NextResponse.json({ error: "Select at least one idea." }, { status: 400 });

  const brand = await getBrand(brandId).catch(() => null);
  if (!brand) return NextResponse.json({ error: "Brand is unavailable." }, { status: 404 });
  const opportunities = await getOpportunities(brandId).catch(() => []);
  const byId = new Map(opportunities.map((item) => [item.id, item]));
  const learnings = await getLearnings(brandId).catch(() => []);
  const started: Array<{ opportunityId: string; creationId: string; status: string }> = [];
  const failed: Array<{ opportunityId: string; error: string }> = [];

  for (const item of items) {
    const opportunity = byId.get(item.opportunityId);
    if (!opportunity) {
      failed.push({ opportunityId: item.opportunityId, error: "Opportunity is no longer available." });
      continue;
    }
    try {
      await actOnOpportunity(brandId, opportunity.id, "develop");
      const development = await developOpportunity(brandId, opportunity.id);
      const input = [opportunity.title, opportunity.developmentDirection].filter(Boolean).join("\n\n");
      const recommendation = recommendHomeFormat({ text: input, learnings });
      const creation = await startSimpleCreation(brandId, {
        goal: recommendation.goal,
        input,
        contentPreference: item.format,
        ideaId: development.ideaId,
      });
      started.push({ opportunityId: opportunity.id, creationId: creation.id, status: creation.status });
    } catch (error) {
      failed.push({ opportunityId: opportunity.id, error: error instanceof Error ? error.message : "Kairo could not start this idea." });
    }
  }

  return NextResponse.json({ batchId: randomUUID(), started, failed, startedCount: started.length, failedCount: failed.length });
}

function isBatchItem(value: unknown): value is { opportunityId: string; format: HomeCreationFormat } {
  if (!value || typeof value !== "object") return false;
  const item = value as BatchItem;
  return typeof item.opportunityId === "string" && typeof item.format === "string" && FORMATS.has(item.format as HomeCreationFormat);
}

function text(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
