import { NextResponse } from "next/server";
import { beginHomeMediaUpload, completeHomeMediaUpload, getHomeMedia } from "../../../../src/lib/home-media-api";

type Body = { action?: unknown; brandId?: unknown; mediaAssetId?: unknown; name?: unknown; mimeType?: unknown; sizeBytes?: unknown };

export async function GET(request: Request) {
  const brandId = new URL(request.url).searchParams.get("brandId")?.trim() ?? "";
  if (!brandId) return NextResponse.json({ error: "Brand is required." }, { status: 400 });
  try { return NextResponse.json(await getHomeMedia(brandId)); }
  catch (error) { return NextResponse.json({ error: message(error, "Kairo could not load Media.") }, { status: 502 }); }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null;
  const brandId = typeof body?.brandId === "string" ? body.brandId.trim() : "";
  if (!brandId) return NextResponse.json({ error: "Brand is required." }, { status: 400 });
  try {
    if (body?.action === "complete") {
      const mediaAssetId = typeof body.mediaAssetId === "string" ? body.mediaAssetId.trim() : "";
      if (!mediaAssetId) return NextResponse.json({ error: "Media asset is required." }, { status: 400 });
      return NextResponse.json(await completeHomeMediaUpload(brandId, mediaAssetId));
    }
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const mimeType = typeof body?.mimeType === "string" ? body.mimeType.trim() : "";
    const sizeBytes = Number(body?.sizeBytes);
    return NextResponse.json(await beginHomeMediaUpload(brandId, { name, mimeType, sizeBytes }), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: message(error, "Kairo could not save this media.") }, { status: 502 });
  }
}
function message(error: unknown, fallback: string) { return error instanceof Error && error.message ? error.message : fallback; }
