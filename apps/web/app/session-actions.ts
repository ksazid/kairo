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

async function writeKairoBearer(): Promise<boolean> {
  const result = await auth().token();
  const token = result.data && typeof (result.data as { token?: unknown }).token === "string"
    ? (result.data as { token: string }).token
    : null;
  const store = await cookies();
  if (!token || token.split(".").length !== 3) {
    store.delete("kairo_access_token");
    return false;
  }
  store.set("kairo_access_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return true;
}

export async function refreshKairoSession(): Promise<boolean> {
  return writeKairoBearer();
}

export async function signInKairo(email: string, password: string): Promise<string | null> {
  const result = await auth().signIn.email({ email, password });
  if (result.error) return result.error.message;
  return (await writeKairoBearer()) ? null : "Unable to establish Kairo session";
}

export async function signUpKairo(name: string, email: string, password: string): Promise<string | null> {
  const result = await auth().signUp.email({ name, email, password });
  if (result.error) return result.error.message;
  return (await writeKairoBearer()) ? null : "Unable to establish Kairo session";
}

export async function signOutKairo(): Promise<void> {
  await auth().signOut();
  const store = await cookies();
  store.delete("kairo_access_token");
}
