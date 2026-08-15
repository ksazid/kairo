import * as client from "openid-client";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

let configurationPromise: ReturnType<typeof client.discovery> | undefined;

export function oidcIssuer(): string {
  const issuer = requiredEnv("OIDC_ISSUER");
  return issuer.endsWith("/") ? issuer : `${issuer}/`;
}

export function oidcClientId(): string {
  return requiredEnv("OIDC_CLIENT_ID");
}

export function oidcClientSecret(): string {
  return requiredEnv("OIDC_CLIENT_SECRET");
}

export function oidcAudience(): string {
  return requiredEnv("OIDC_AUDIENCE");
}

export async function oidcConfiguration() {
  configurationPromise ??= client.discovery(
    new URL(oidcIssuer()),
    oidcClientId(),
    oidcClientSecret(),
  );
  return configurationPromise;
}

export function oidcClient() {
  return client;
}
