import { NextRequest, NextResponse } from "next/server";
import { beginHomeMediaUpload, completeHomeMediaUpload, getHomeMedia } from "../../../../src/lib/home-media-api";

export async function GET(request: NextRequest) {
  try {
    const brandId = request.nextUrl.searchParams.get("brandId")?.trim();
    if (!brandId) return NextResponse.json({ detail: "brandId is required" }, { status: 400 });
    return NextResponse.json(await getHomeMedia(brandId));
  } catch (error) {
    return NextResponse.json({ detail: message(error) }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      brandId?: string;
      action?: "begin" | "complete";
      name?: string;
      mimeType?: string;
      sizeBytes?: number;
      uploadId?: string;
    };
    const brandId = body.brandId?.trim();
    if (!brandId) return NextResponse.json({ detail: "brandId is required" }, { status: 400 });
    if (body.action === "begin") {
      return NextResponse.json(
        await beginHomeMediaUpload(brandId, { name: body.name ?? "", mimeType: body.mimeType ?? "", sizeBytes: Number(body.sizeBytes) }),
        { status: 201 },
      );
    }
    if (body.action === "complete" && body.uploadId) {
      return NextResponse.json(await completeHomeMediaUpload(brandId, body.uploadId));
    }
    return NextResponse.json({ detail: "Unsupported media action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ detail: message(error) }, { status: 502 });
  }
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Unable to access media";
}
