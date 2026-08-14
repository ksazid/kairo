import { NextRequest, NextResponse } from "next/server";
import { createNeonAuth } from "@neondatabase/auth/next/server";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function auth() {
  return createNeonAuth({
    baseUrl: requiredEnv("NEON_AUTH_BASE_URL"),
    cookies: { secret: requiredEnv("NEON_AUTH_COOKIE_SECRET") },
  });
}

export async function GET(request: NextRequest) {
  const result = await auth().token();
  const value = result as { data?: { token?: unknown }; token?: unknown; error?: unknown };
  const token = typeof value.data?.token === "string"
    ? value.data.token.trim()
    : typeof value.token === "string"
      ? value.token.trim()
      : "";

  if (token.split(".").length !== 3) {
    return NextResponse.redirect(new URL("/sign-in?error=Authentication%20session%20expired", request.url));
  }

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("kairo_access_token", token, {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 840,
  });
  return response;
}
