import { NextRequest, NextResponse } from "next/server";
import { oidcAudience, oidcClient, oidcConfiguration } from "../../../src/lib/oidc";
import { encodeOidcTransaction, OIDC_TRANSACTION_COOKIE, OIDC_TRANSACTION_MAX_AGE_SECONDS, safeReturnTo } from "../../../src/lib/oidc-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const oidc = oidcClient();
  const configuration = await oidcConfiguration();
  const codeVerifier = oidc.randomPKCECodeVerifier();
  const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier);
  const state = oidc.randomState();
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const parameters: Record<string, string> = {
    redirect_uri: new URL("/auth/callback", request.url).href,
    scope: "openid profile email",
    audience: oidcAudience(),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  };
  if (request.nextUrl.searchParams.get("screen_hint") === "signup") parameters.screen_hint = "signup";
  if (request.nextUrl.searchParams.get("connection") === "google-oauth2") parameters.connection = "google-oauth2";

  const response = NextResponse.redirect(oidc.buildAuthorizationUrl(configuration, parameters));
  response.cookies.set(OIDC_TRANSACTION_COOKIE, encodeOidcTransaction({ state, codeVerifier, returnTo, createdAt: Date.now() }), {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/auth",
    maxAge: OIDC_TRANSACTION_MAX_AGE_SECONDS,
  });
  return response;
}
