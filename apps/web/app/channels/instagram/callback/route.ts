import { NextRequest, NextResponse } from "next/server";
import {
  completeInstagramConnection,
  InstagramApiError,
} from "../../../../src/lib/instagram-api";

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
    return NextResponse.redirect(
      new URL(
        `/?error=${encodeURIComponent(
          providerError
            ? "Instagram connection was cancelled or denied"
            : "Instagram callback was incomplete",
        )}`,
        request.url,
      ),
    );
  }

  try {
    const result = await completeInstagramConnection(code, state);
    const base = `/brands/${encodeURIComponent(result.brandId)}/performance`;

    if (result.status === "selection-required") {
      return NextResponse.redirect(
        new URL(
          `${base}?instagramIntent=${encodeURIComponent(result.intentId)}&notice=${encodeURIComponent(
            "Choose the Instagram account Kairo should connect",
          )}`,
          request.url,
        ),
      );
    }

    if (result.status === "no-eligible-account") {
      return NextResponse.redirect(
        new URL(
          `${base}?error=${encodeURIComponent(
            "No eligible Instagram Professional account was found",
          )}`,
          request.url,
        ),
      );
    }

    return NextResponse.redirect(
      new URL(`${base}?notice=${encodeURIComponent("Instagram connected")}`, request.url),
    );
  } catch (error) {
    if (error instanceof InstagramApiError && error.status === 401) {
      return resumeAfterSignIn(request);
    }

    return NextResponse.redirect(
      new URL(
        `/?error=${encodeURIComponent(
          error instanceof Error ? error.message : "Unable to complete Instagram connection",
        )}`,
        request.url,
      ),
    );
  }
}
