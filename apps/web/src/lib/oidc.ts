import * as client from "openid-client";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export interface RetryableAsyncCache<T> {
  get(): Promise<T>;
}

export function createRetryableAsyncCache<T>(loader: () => Promise<T>): RetryableAsyncCache<T> {
  let current: Promise<T> | undefined;

  return {
    get() {
      if (current) return current;

      let pending: Promise<T>;
      try {
        pending = loader();
      } catch (error) {
        return Promise.reject(error);
      }

      current = pending;
      void pending.catch(() => {
        if (current === pending) current = undefined;
      });
      return pending;
    },
  };
}

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

const configurationCache = createRetryableAsyncCache(() => client.discovery(
  new URL(oidcIssuer()),
  oidcClientId(),
  oidcClientSecret(),
));

export async function oidcConfiguration() {
  return configurationCache.get();
}

export function oidcClient() {
  return client;
}
