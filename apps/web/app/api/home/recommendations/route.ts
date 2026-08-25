import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type RequestBody = { brandId?: unknown };
type ProblemBody = { detail?: string };

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RequestBody | null;
  const brandId = typeof body?.brandId === "string" ? body.brandId.trim().slice(0, 200) : "";
  if (!brandId) return NextResponse.json({ error: "Brand is required." }, { status: 400 });

  const token = (await cookies()).get("kairo_access_token")?.value;
  if (!token) return NextResponse.json({ error: "Authentication is required." }, { status: 401 });

  const base = (process.env.KAIRO_API_URL ?? "http://127.0.0.1:4000").replace(/\/$/, "");
  try {
    const response = await fetch(`${base}/api/v1/brands/${encodeURIComponent(brandId)}/hunter/run`, {
      method: "POST",
      cache: "no-store",
      headers: { authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const problem = (await response.json().catch(() => null)) as ProblemBody | null;
      return NextResponse.json(
        { error: problem?.detail ?? "Kairo could not refresh recommendations." },
        { status: response.status },
      );
    }
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: "Kairo could not refresh recommendations." }, { status: 502 });
  }
}
