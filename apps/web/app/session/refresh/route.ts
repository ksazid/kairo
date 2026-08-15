import { NextRequest, NextResponse } from "next/server";
import { jwtSecondsRemaining, KAIRO_ACCESS_TOKEN_COOKIE } from "../../../src/lib/oidc-session";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(KAIRO_ACCESS_TOKEN_COOKIE)?.value;
  if (jwtSecondsRemaining(token) > 0) return new NextResponse(null, { status: 204 });

  const response = new NextResponse(null, { status: 401 });
  response.cookies.delete(KAIRO_ACCESS_TOKEN_COOKIE);
  return response;
}
