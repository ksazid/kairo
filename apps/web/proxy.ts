import { NextRequest, NextResponse } from "next/server";

const LEGACY_LOGIN = "/auth/login";
const LEGACY_LOGOUT = "/auth/logout";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === LEGACY_LOGIN) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  if (path === LEGACY_LOGOUT) {
    return NextResponse.redirect(new URL("/sign-out", request.url));
  }
  if (path.startsWith("/sign-in") || path === "/sign-out") {
    return NextResponse.next();
  }

  const authBase = process.env.NEON_AUTH_BASE_URL?.trim().replace(/\/$/, "");
  const cookieHeader = request.headers.get("cookie")?.trim();
  if (!authBase || !cookieHeader) return NextResponse.next();

  const tokenResponse = await fetch(`${authBase}/token`, {
    method: "GET",
    cache: "no-store",
    headers: { accept: "application/json", cookie: cookieHeader },
  }).catch(() => null);
  if (!tokenResponse?.ok) return NextResponse.next();

  const body = (await tokenResponse.json().catch(() => null)) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (token.split(".").length !== 3) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  const nextCookie = [
    ...cookieHeader.split(/;\s*/).filter((value) => !value.startsWith("kairo_access_token=")),
    `kairo_access_token=${token}`,
  ].join("; ");
  requestHeaders.set("cookie", nextCookie);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.cookies.set("kairo_access_token", token, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 840,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
