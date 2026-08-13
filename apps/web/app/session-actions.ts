"use server";

import { cookies } from "next/headers";
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

export async function signInKairo(email: string, password: string): Promise<string | null> {
  const result = await auth().signIn.email({ email, password });
  return result.error?.message ?? null;
}

export async function signUpKairo(name: string, email: string, password: string): Promise<string | null> {
  const result = await auth().signUp.email({ name, email, password });
  return result.error?.message ?? null;
}

export async function signOutKairo(): Promise<void> {
  await auth().signOut();
  const store = await cookies();
  store.delete("kairo_access_token");
}
