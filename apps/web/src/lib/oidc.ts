import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export const auth = createNeonAuth({
  baseUrl: requiredEnv("NEON_AUTH_BASE_URL"),
  cookies: { secret: requiredEnv("NEON_AUTH_COOKIE_SECRET") },
});

export async function getKairoAccessToken(): Promise<string | null> {
  const result = await auth.token();
  if (result.error || !result.data) return null;
  const token = (result.data as { token?: unknown }).token;
  return typeof token === "string" && token.split(".").length === 3 ? token : null;
}
