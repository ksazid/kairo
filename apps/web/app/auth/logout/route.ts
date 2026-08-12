import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete("kairo_access_token");
  response.cookies.delete("kairo_oidc_verifier");
  response.cookies.delete("kairo_oidc_state");
  return response;
}
