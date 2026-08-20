import { NextRequest, NextResponse } from "next/server";
import { oidcClient, oidcClientSecret, oidcConfiguration } from "../../../src/lib/oidc";
import {
  accessTokenCookieNames,
  accessTokenPartCookieName,
  decodeOidcTransaction,
  jwtSecondsRemaining,
  KAIRO_ACCESS_TOKEN_COOKIE,
  KAIRO_ACCESS_TOKEN_MAX_PARTS,
  KAIRO_ACCESS_TOKEN_PARTS_COOKIE,
  OIDC_TRANSACTION_COOKIE,
  splitAccessTokenCookie,
} from "../../../src/lib/oidc-session";

export const dynamic = "force-dynamic";

function clearTransaction(response: NextResponse) {
  response.cookies.set(OIDC_TRANSACTION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/auth", maxAge: 0 });
}

function accessCookieOptions(request: NextRequest, maxAge: number) {
  return {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

function clearAccessToken(response: NextResponse, request: NextRequest) {
  for (const name of accessTokenCookieNames()) {
    response.cookies.set(name, "", accessCookieOptions(request, 0));
  }
}

function setAccessToken(response: NextResponse, request: NextRequest, token: string, maxAge: number) {
  const parts = splitAccessTokenCookie(token);
  const active = accessCookieOptions(request, maxAge);
  const expired = accessCookieOptions(request, 0);

  if (parts.length === 1) {
    response.cookies.set(KAIRO_ACCESS_TOKEN_COOKIE, parts[0]!, active);
    response.cookies.set(KAIRO_ACCESS_TOKEN_PARTS_COOKIE, "", expired);
    for (let index = 0; index < KAIRO_ACCESS_TOKEN_MAX_PARTS; index += 1) {
      response.cookies.set(accessTokenPartCookieName(index), "", expired);
    }
    return;
  }

  response.cookies.set(KAIRO_ACCESS_TOKEN_COOKIE, "", expired);
  response.cookies.set(KAIRO_ACCESS_TOKEN_PARTS_COOKIE, String(parts.length), active);
  for (let index = 0; index < parts.length; index += 1) {
    response.cookies.set(accessTokenPartCookieName(index), parts[index]!, active);
  }
  for (let index = parts.length; index < KAIRO_ACCESS_TOKEN_MAX_PARTS; index += 1) {
    response.cookies.set(accessTokenPartCookieName(index), "", expired);
  }
}

function signInFailure(request: NextRequest, message: string) {
  const response = NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(message)}`, request.url));
  clearTransaction(response);
  clearAccessToken(response, request);
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const transaction = decodeOidcTransaction(
      request.cookies.get(OIDC_TRANSACTION_COOKIE)?.value,
      oidcClientSecret(),
    );
    if (!transaction) return signInFailure(request, "Authentication session expired. Please sign in again.");

    const oidc = oidcClient();
    const configuration = await oidcConfiguration();
    const tokens = await oidc.authorizationCodeGrant(configuration, new URL(request.url), {
      pkceCodeVerifier: transaction.codeVerifier,
      expectedState: transaction.state,
    });
    if (!tokens.access_token) return signInFailure(request, "Identity provider did not return an access token.");

    const jwtLifetime = jwtSecondsRemaining(tokens.access_token);
    const reportedLifetime = typeof tokens.expires_in === "number" ? Math.floor(tokens.expires_in) : 0;
    const maxAge = jwtLifetime > 0 && reportedLifetime > 0
      ? Math.max(1, Math.min(jwtLifetime, reportedLifetime))
      : Math.max(1, jwtLifetime || reportedLifetime || 900);

    const completion = new URL("/auth/complete", request.url);
    completion.searchParams.set("returnTo", transaction.returnTo);
    const response = NextResponse.redirect(completion);
    setAccessToken(response, request, tokens.access_token, maxAge);
    clearTransaction(response);
    return response;
  } catch {
    return signInFailure(request, "Authentication failed. Please try again.");
  }
}
