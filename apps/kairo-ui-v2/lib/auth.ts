import * as client from "openid-client";

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
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
