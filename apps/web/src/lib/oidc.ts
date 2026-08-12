import * as client from "openid-client";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export async function oidcConfiguration() {
  return client.discovery(new URL(requiredEnv("OIDC_ISSUER")), requiredEnv("OIDC_CLIENT_ID"));
}

export function oidcClient() {
  return client;
}
