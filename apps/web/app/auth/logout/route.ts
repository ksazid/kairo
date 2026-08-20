import { NextRequest, NextResponse } from "next/server";
import { oidcClientId, oidcConfiguration } from "../../../src/lib/oidc";
import { accessTokenCookieNames, OIDC_TRANSACTION_COOKIE } from "../../../src/lib/oidc-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const postLogout = new URL("/", request.url);
  let destination = postLogout;

  try {
    const configuration = await oidcConfiguration();
    const endpoint = configuration.serverMetadata().end_session_endpoint;
    if (endpoint) {
      destination = new URL(endpoint);
      destination.searchParams.set("client_id", oidcClientId());
      destination.searchParams.set("post_logout_redirect_uri", postLogout.href);
    }
  } catch {
    destination = postLogout;
  }

  const response = NextResponse.redirect(destination);
  const secure = request.nextUrl.protocol === "https:";
  for (const name of accessTokenCookieNames()) {
    response.cookies.set(name, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  }
  response.cookies.set(OIDC_TRANSACTION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/auth", maxAge: 0 });
  return response;
}
