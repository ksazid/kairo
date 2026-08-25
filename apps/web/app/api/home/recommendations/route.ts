import { NextResponse } from "next/server";
import { HunterApiError, runHunterRecommendations } from "../../../../src/lib/hunter-api";

type RequestBody = { brandId?: unknown };

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const brandId = typeof body?.brandId === "string" ? body.brandId.trim().slice(0, 200) : "";
  if (!brandId) return NextResponse.json({ error: "Brand is required." }, { status: 400 });

  try {
    return NextResponse.json(await runHunterRecommendations(brandId));
  } catch (error) {
    if (error instanceof HunterApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Kairo could not refresh recommendations." }, { status: 500 });
  }
}
