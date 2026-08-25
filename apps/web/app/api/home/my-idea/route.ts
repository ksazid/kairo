import { NextResponse } from "next/server";
import { getBrand, getLearnings } from "../../../../src/lib/kairo-api";
import { startSimpleCreation } from "../../../../src/lib/simple-creation-api";
import { recommendMyIdea, type HomeCreationFormat } from "../../../../src/lib/home-intelligence";

type RequestBody = {
  brandId?: unknown;
  text?: unknown;
  source?: unknown;
  format?: unknown;
  presenterId?: unknown;
  mediaAssetIds?: unknown;
};

const FORMATS = new Set<HomeCreationFormat>(["carousel", "reel", "image"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  if (!body) return NextResponse.json({ error: "Tell Kairo what you have in mind." }, { status: 400 });

  const brandId = text(body.brandId, 200);
  const idea = optionalText(body.text, 4000);
  const source = optionalText(body.source, 2000);
  const presenterId = optionalText(body.presenterId, 200);
  const mediaAssetIds = mediaIds(body.mediaAssetIds);
  if (!brandId) return NextResponse.json({ error: "Brand is required." }, { status: 400 });
  if (!idea && !source && !mediaAssetIds.length) return NextResponse.json({ error: "Add an idea, link, photo, or video first." }, { status: 400 });
  if (source && !isPublicHttpUrl(source)) return NextResponse.json({ error: "Use a public http(s) link." }, { status: 400 });

  const brand = await getBrand(brandId).catch(() => null);
  if (!brand) return NextResponse.json({ error: "Brand is unavailable." }, { status: 404 });

  const learnings = await getLearnings(brandId).catch(() => []);
  const recommendation = recommendMyIdea({
    text: idea ?? (mediaAssetIds.length ? "Create content from the attached Brand media" : ""),
    ...(source ? { source } : {}),
    learnings,
  });

  if (body.format == null) {
    return NextResponse.json({ recommendation });
  }

  const requestedFormat = typeof body.format === "string" ? body.format.trim().toLowerCase() : "";
  if (!FORMATS.has(requestedFormat as HomeCreationFormat)) {
    return NextResponse.json({ error: "Choose a supported format." }, { status: 400 });
  }

  try {
    const creation = await startSimpleCreation(brandId, {
      goal: recommendation.goal,
      ...(idea ? { input: idea } : {}),
      ...(source ? { source } : {}),
      contentPreference: requestedFormat as HomeCreationFormat,
      ...(presenterId ? { presenterId } : {}),
      ...(mediaAssetIds.length ? { mediaAssetIds } : {}),
    });
    return NextResponse.json({
      creationId: creation.id,
      href: `/brands/${encodeURIComponent(brandId)}/create/${encodeURIComponent(creation.id)}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kairo could not start this creation." },
      { status: 400 },
    );
  }
}

function text(value: unknown, max: number) {
  const result = typeof value === "string" ? value.trim() : "";
  return result.slice(0, max);
}
function optionalText(value: unknown, max: number) {
  const result = text(value, max);
  return result || undefined;
}
function mediaIds(value: unknown) {
  if (value == null) return [];
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => text(item, 200)).filter((item) => /^[A-Za-z0-9._-]+$/.test(item)))].slice(0, 12);
}
function isPublicHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
