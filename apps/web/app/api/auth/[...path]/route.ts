import { createNeonAuth } from "@neondatabase/auth/next/server";

export const dynamic = "force-dynamic";

type AuthRouteContext = {
  params: Promise<{ path: string[] }>;
};

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function handlers() {
  return createNeonAuth({
    baseUrl: requiredEnv("NEON_AUTH_BASE_URL"),
    cookies: { secret: requiredEnv("NEON_AUTH_COOKIE_SECRET") },
  }).handler();
}

export async function GET(request: Request, context: AuthRouteContext) {
  return handlers().GET(request, context);
}

export async function POST(request: Request, context: AuthRouteContext) {
  return handlers().POST(request, context);
}
