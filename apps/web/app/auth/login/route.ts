import { NextRequest, NextResponse } from "next/server";
import { oidcAudience, oidcClient, oidcClientSecret, oidcConfiguration } from "../../../src/lib/oidc";
import { encodeOidcTransaction, OIDC_TRANSACTION_COOKIE, OIDC_TRANSACTION_MAX_AGE_SECONDS, safeReturnTo } from "../../../src/lib/oidc-session";

export const dynamic = "force-dynamic";

const DIRECT_SOCIAL_CONNECTIONS = new Set(["google-oauth2", "apple"]);

function loginHint(request: NextRequest): string | undefined {
  const value = request.nextUrl.searchParams.get("login_hint")?.trim();
  if (!value) return undefined;
  return value.slice(0, 320);
}

function directSocialConnection(request: NextRequest): string | undefined {
  const value = request.nextUrl.searchParams.get("connection")?.trim();
  return value && DIRECT_SOCIAL_CONNECTIONS.has(value) ? value : undefined;
}

function authenticationUnavailable(request: NextRequest): NextResponse {
  const target = new URL("/sign-in", request.url);
  target.searchParams.set("error", "Authentication service is temporarily unavailable. Please try again.");
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  if (returnTo !== "/") target.searchParams.set("returnTo", returnTo);
  const response = NextResponse.redirect(target);
  response.cookies.set(OIDC_TRANSACTION_COOKIE, "", {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/auth",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  try {
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
    const connection = directSocialConnection(request);
    if (connection) parameters.connection = connection;
    const hintedEmail = loginHint(request);
    if (hintedEmail) parameters.login_hint = hintedEmail;

    const response = NextResponse.redirect(oidc.buildAuthorizationUrl(configuration, parameters));
    response.cookies.set(
      OIDC_TRANSACTION_COOKIE,
      encodeOidcTransaction({ state, codeVerifier, returnTo, createdAt: Date.now() }, oidcClientSecret()),
      {
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/auth",
        maxAge: OIDC_TRANSACTION_MAX_AGE_SECONDS,
      },
    );
    return response;
  } catch {
    return authenticationUnavailable(request);
  }
}
