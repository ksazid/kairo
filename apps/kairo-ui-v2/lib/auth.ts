import * as client from "openid-client";

export const OIDC_ENV_NAMES = ["OIDC_ISSUER", "OIDC_CLIENT_ID", "OIDC_CLIENT_SECRET", "OIDC_AUDIENCE"] as const;
export type OidcEnvName = (typeof OIDC_ENV_NAMES)[number];

function required(name: OidcEnvName) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function oidcEnvironmentStatus(env: NodeJS.ProcessEnv = process.env) {
  const missing = OIDC_ENV_NAMES.filter((name) => !env[name]?.trim());
  return { configured: missing.length === 0, missing };
}

export function oidcBootstrapFailure(error: unknown, env: NodeJS.ProcessEnv = process.env) {
  const status = oidcEnvironmentStatus(env);
  if (!status.configured) return { code: "missing_environment" as const, missing: status.missing };

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("fetch") || message.includes("discovery") || message.includes("issuer")) {
    return { code: "discovery_failed" as const, missing: [] as OidcEnvName[] };
  }
  return { code: "bootstrap_failed" as const, missing: [] as OidcEnvName[] };
}

export const oidcIssuer = () => required("OIDC_ISSUER").replace(/\/?$/, "/");
export const oidcClientId = () => required("OIDC_CLIENT_ID");
export const oidcClientSecret = () => required("OIDC_CLIENT_SECRET");
export const oidcAudience = () => required("OIDC_AUDIENCE");

let current: Promise<client.Configuration> | undefined;
export function oidcConfiguration() {
  if (!current) {
    current = client.discovery(new URL(oidcIssuer()), oidcClientId(), oidcClientSecret());
    void current.catch(() => { current = undefined; });
  }
  return current;
}

export const oidcClient = () => client;
