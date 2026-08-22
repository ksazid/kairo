import { NextRequest, NextResponse } from "next/server";
import {
  completeInstagramConnection,
  InstagramApiError,
} from "../../../../src/lib/instagram-api";
import { OAUTH_RETURN_COOKIE, safeBrandReturnTo, safeStoredBrandReturn } from "../../../../src/lib/brand-source-navigation";

export const dynamic = "force-dynamic";

function callbackReturnTo(request: NextRequest): string {
  return `${request.nextUrl.pathname}${request.nextUrl.search}`;
}

function resumeAfterSignIn(request: NextRequest): NextResponse {
  const target = new URL("/auth/login", request.url);
  target.searchParams.set("returnTo", callbackReturnTo(request));
  return NextResponse.redirect(target);
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const providerError = request.nextUrl.searchParams.get("error");

  if (providerError || !code || !state) {
    const stored = safeStoredBrandReturn(request.cookies.get(OAUTH_RETURN_COOKIE)?.value);
    const target = new URL(stored ?? "/", request.url);
    target.searchParams.set("error", providerError ? "Instagram connection was cancelled or denied" : "Instagram callback was incomplete");
    const response = NextResponse.redirect(target);
    response.cookies.delete(OAUTH_RETURN_COOKIE);
    return response;
  }

  try {
    const result = await completeInstagramConnection(code, state);
    const base = `/brands/${encodeURIComponent(result.brandId)}/performance`;
    const returnTo = safeBrandReturnTo(request.cookies.get(OAUTH_RETURN_COOKIE)?.value, result.brandId);

    if (result.status === "selection-required") {
      const response = NextResponse.redirect(
        new URL(
          `${base}?instagramIntent=${encodeURIComponent(result.intentId)}&returnTo=${encodeURIComponent(returnTo)}&notice=${encodeURIComponent(
            "Choose the Instagram account Kairo should connect",
          )}`,
          request.url,
        ),
      );
      response.cookies.delete(OAUTH_RETURN_COOKIE);
      return response;
    }

    if (result.status === "no-eligible-account") {
      const target = new URL(returnTo, request.url);
      target.searchParams.set("error", "No eligible Instagram Professional account was found");
      const response = NextResponse.redirect(target);
      response.cookies.delete(OAUTH_RETURN_COOKIE);
      return response;
    }

    const target = new URL(returnTo, request.url);
    target.searchParams.set("notice", "Instagram connected");
    const response = NextResponse.redirect(target);
    response.cookies.delete(OAUTH_RETURN_COOKIE);
    return response;
  } catch (error) {
    if (error instanceof InstagramApiError && error.status === 401) {
      return resumeAfterSignIn(request);
    }

    const stored = safeStoredBrandReturn(request.cookies.get(OAUTH_RETURN_COOKIE)?.value);
    const target = new URL(stored ?? "/", request.url);
    target.searchParams.set("error", error instanceof Error ? error.message : "Unable to complete Instagram connection");
    const response = NextResponse.redirect(target);
    response.cookies.delete(OAUTH_RETURN_COOKIE);
    return response;
  }
}
