import { NextRequest, NextResponse } from "next/server";
import { jwtSecondsRemaining, KAIRO_ACCESS_TOKEN_COOKIE } from "../../../src/lib/oidc-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(KAIRO_ACCESS_TOKEN_COOKIE)?.value;
  if (jwtSecondsRemaining(token) > 0) return NextResponse.redirect(new URL("/", request.url));

  const response = NextResponse.redirect(new URL("/auth/login", request.url));
  response.cookies.delete(KAIRO_ACCESS_TOKEN_COOKIE);
  return response;
}
