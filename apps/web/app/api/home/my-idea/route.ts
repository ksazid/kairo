import { NextResponse } from "next/server";
import { getBrand, getLearnings } from "../../../../src/lib/kairo-api";
import { getSimpleCreation, startSimpleCreation } from "../../../../src/lib/simple-creation-api";
import { recommendHomeFormat, type HomeCreationFormat } from "../../../../src/lib/home-creation-format";

type RequestBody = {
  brandId?: unknown;
  text?: unknown;
  source?: unknown;
  format?: unknown;
  presenterId?: unknown;
  mediaAssetIds?: unknown;
  mediaKinds?: unknown;
  ideaId?: unknown;
};
const FORMATS = new Set<HomeCreationFormat>(["image", "carousel", "reel", "video"]);

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const brandId = text(query.get("brandId"), 200);
  const creationId = text(query.get("creationId"), 200);
  if (!brandId || !creationId) return NextResponse.json({ error: "Brand and creation are required." }, { status: 400 });
  try {
    const creation = await getSimpleCreation(brandId, creationId);
    return NextResponse.json({
      id: creation.id,
      status: creation.status,
      message: creation.status === "needs-attention" ? friendlyFailure(creation.failureReason) : creation.progress.message,
      ...(creation.campaignId ? { campaignId: creation.campaignId } : {}),
      ...(creation.assetId ? { assetId: creation.assetId } : {}),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kairo could not read this creation." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  if (!body) return NextResponse.json({ error: "Tell Kairo what you have in mind." }, { status: 400 });
  const brandId = text(body.brandId, 200);
  const idea = optionalText(body.text, 4000);
  const source = optionalText(body.source, 2000);
  const ideaId = optionalText(body.ideaId, 200);
  const mediaAssetIds = ids(body.mediaAssetIds);
  const mediaKinds = kinds(body.mediaKinds);
  const presenterId = optionalText(body.presenterId, 200);
  if (!brandId) return NextResponse.json({ error: "Brand is required." }, { status: 400 });
  if (!idea && !source && !mediaAssetIds.length && !mediaKinds.length && !ideaId) return NextResponse.json({ error: "Add an idea, link or media first." }, { status: 400 });
  if (source && !isPublicHttpUrl(source)) return NextResponse.json({ error: "Use a public http(s) link." }, { status: 400 });

  const brand = await getBrand(brandId).catch(() => null);
  if (!brand) return NextResponse.json({ error: "Brand is unavailable." }, { status: 404 });
  const learnings = await getLearnings(brandId).catch(() => []);
  const recommendation = recommendHomeFormat({ text: idea ?? "", ...(source ? { source } : {}), mediaKinds, learnings });
  if (body.format == null) return NextResponse.json({ recommendation });

  const requestedFormat = typeof body.format === "string" ? body.format.trim().toLowerCase() : "";
  if (!FORMATS.has(requestedFormat as HomeCreationFormat)) return NextResponse.json({ error: "Choose a supported format." }, { status: 400 });
  if (presenterId && !["reel", "video"].includes(requestedFormat)) return NextResponse.json({ error: "Presenter is available only for Reel or Video." }, { status: 400 });

  try {
    const creation = await startSimpleCreation(brandId, {
      goal: recommendation.goal,
      ...(idea ? { input: idea } : {}),
      ...(source ? { source } : {}),
      contentPreference: requestedFormat as HomeCreationFormat,
      ...(presenterId ? { presenterId } : {}),
      ...(mediaAssetIds.length ? { mediaAssetIds } : {}),
      ...(ideaId ? { ideaId } : {}),
    });
    return NextResponse.json({ creationId: creation.id, status: creation.status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Kairo could not start this creation." }, { status: 400 });
  }
}
function text(value: unknown, max: number) { const result = typeof value === "string" ? value.trim() : ""; return result.slice(0, max); }
function optionalText(value: unknown, max: number) { const result = text(value, max); return result || undefined; }
function ids(value: unknown) { if (!Array.isArray(value)) return []; return [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean))].slice(0, 12); }
function kinds(value: unknown): Array<"image"|"video"> { if (!Array.isArray(value)) return []; return [...new Set(value.filter((item): item is "image"|"video" => item === "image" || item === "video"))]; }
function isPublicHttpUrl(value: string) { try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; } }
function friendlyFailure(reason?: string) {
  const value = reason?.toLowerCase() ?? "";
  if (/public brand reference|explicit-url|source.*url|fetch|returned \d{3}/.test(value)) return "Kairo couldn’t read that URL. Remove it and continue with your idea or media, or try another public link.";
  if (/evidence|research/.test(value)) return "Kairo couldn’t find enough reliable information to finish this version. Try adding a little more detail or media.";
  return "Kairo couldn’t finish this creation. Your idea and media are still safe; adjust the input and try again.";
}
