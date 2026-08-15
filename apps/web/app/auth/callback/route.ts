import { NextRequest, NextResponse } from "next/server";
import { oidcClient, oidcConfiguration } from "../../../src/lib/oidc";
import { decodeOidcTransaction, jwtSecondsRemaining, KAIRO_ACCESS_TOKEN_COOKIE, OIDC_TRANSACTION_COOKIE } from "../../../src/lib/oidc-session";

export const dynamic = "force-dynamic";

function clearTransaction(response: NextResponse) {
  response.cookies.set(OIDC_TRANSACTION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/auth", maxAge: 0 });
}

function signInFailure(request: NextRequest, message: string) {
  const response = NextResponse.redirect(new URL(`/sign-in?error=${encodeURIComponent(message)}`, request.url));
  clearTransaction(response);
  response.cookies.delete(KAIRO_ACCESS_TOKEN_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const transaction = decodeOidcTransaction(request.cookies.get(OIDC_TRANSACTION_COOKIE)?.value);
  if (!transaction) return signInFailure(request, "Authentication session expired. Please sign in again.");

  try {
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

    const response = NextResponse.redirect(new URL(transaction.returnTo, request.url));
    response.cookies.set(KAIRO_ACCESS_TOKEN_COOKIE, tokens.access_token, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge,
    });
    clearTransaction(response);
    return response;
  } catch {
    return signInFailure(request, "Authentication failed. Please try again.");
  }
}
