import { NextRequest, NextResponse } from "next/server";
import { verifyAuthCompletion } from "../../../src/lib/auth-completion";
import { accessTokenCookieNames, readAccessTokenCookie, safeReturnTo } from "../../../src/lib/oidc-session";

export const dynamic = "force-dynamic";

function clearAccessToken(response: NextResponse, request: NextRequest) {
  const secure = request.nextUrl.protocol === "https:";
  for (const name of accessTokenCookieNames()) {
    response.cookies.set(name, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  }
}

function failure(request: NextRequest, message: string) {
  const target = new URL("/sign-in", request.url);
  target.searchParams.set("error", message);
  const response = NextResponse.redirect(target);
  clearAccessToken(response, request);
  return response;
}

export async function GET(request: NextRequest) {
  const token = readAccessTokenCookie((name) => request.cookies.get(name)?.value);
  const result = await verifyAuthCompletion(token, process.env.KAIRO_API_URL);
  if (!result.ok) return failure(request, result.message);

  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  return NextResponse.redirect(new URL(returnTo, request.url));
}
