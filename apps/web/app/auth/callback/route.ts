import { NextRequest, NextResponse } from "next/server";
import { oidcClient, oidcConfiguration } from "../../../src/lib/oidc";

export async function GET(request: NextRequest) {
  const verifier = request.cookies.get("kairo_oidc_verifier")?.value;
  const state = request.cookies.get("kairo_oidc_state")?.value;
  if (!verifier || !state) {
    return NextResponse.json({ error: "Missing sign-in state" }, { status: 400 });
  }

  const client = oidcClient();
  const config = await oidcConfiguration();
  const tokens = await client.authorizationCodeGrant(config, new URL(request.url), {
    pkceCodeVerifier: verifier,
    expectedState: state,
  });

  if (!tokens.access_token) {
    return NextResponse.json({ error: "Identity provider did not return an access token" }, { status: 502 });
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  const secure = request.nextUrl.protocol === "https:";
  response.cookies.set("kairo_access_token", tokens.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(60, tokens.expires_in ?? 3600),
  });
  response.cookies.delete("kairo_oidc_verifier");
  response.cookies.delete("kairo_oidc_state");
  return response;
}
