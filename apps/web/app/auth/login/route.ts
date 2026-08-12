import { NextRequest, NextResponse } from "next/server";
import { oidcClient, oidcConfiguration } from "../../../src/lib/oidc";

export async function GET(request: NextRequest) {
  const client = oidcClient();
  const config = await oidcConfiguration();
  const verifier = client.randomPKCECodeVerifier();
  const challenge = await client.calculatePKCECodeChallenge(verifier);
  const state = client.randomState();
  const redirectUri = new URL("/auth/callback", request.url).toString();
  const authorizationUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri,
    scope: "openid profile email",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  });

  const response = NextResponse.redirect(authorizationUrl);
  const secure = request.nextUrl.protocol === "https:";
  response.cookies.set("kairo_oidc_verifier", verifier, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  response.cookies.set("kairo_oidc_state", state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
