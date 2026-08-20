import { createHmac, timingSafeEqual } from "node:crypto";

export const OIDC_TRANSACTION_COOKIE = "kairo_oidc_tx";
export const KAIRO_ACCESS_TOKEN_COOKIE = "kairo_access_token";
export const KAIRO_ACCESS_TOKEN_PARTS_COOKIE = "kairo_access_token_parts";
export const OIDC_TRANSACTION_MAX_AGE_SECONDS = 600;
export const KAIRO_ACCESS_TOKEN_COOKIE_CHUNK_SIZE = 3000;
export const KAIRO_ACCESS_TOKEN_MAX_PARTS = 8;

const TRANSACTION_SIGNATURE_CONTEXT = "kairo-oidc-tx-v1";

type OidcTransaction = {
  state: string;
  codeVerifier: string;
  returnTo: string;
  createdAt: number;
};

export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const base = new URL("https://kairo.invalid");
    const parsed = new URL(value, base);
    if (parsed.origin !== base.origin) return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

export function accessTokenPartCookieName(index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= KAIRO_ACCESS_TOKEN_MAX_PARTS) {
    throw new RangeError("Access-token cookie part index is out of range");
  }
  return `${KAIRO_ACCESS_TOKEN_COOKIE}.${index}`;
}

export function accessTokenCookieNames(): string[] {
  return [
    KAIRO_ACCESS_TOKEN_COOKIE,
    KAIRO_ACCESS_TOKEN_PARTS_COOKIE,
    ...Array.from({ length: KAIRO_ACCESS_TOKEN_MAX_PARTS }, (_, index) => accessTokenPartCookieName(index)),
  ];
}

export function splitAccessTokenCookie(token: string): string[] {
  if (!token) throw new Error("Access token is required");
  const parts: string[] = [];
  for (let offset = 0; offset < token.length; offset += KAIRO_ACCESS_TOKEN_COOKIE_CHUNK_SIZE) {
    parts.push(token.slice(offset, offset + KAIRO_ACCESS_TOKEN_COOKIE_CHUNK_SIZE));
  }
  if (parts.length > KAIRO_ACCESS_TOKEN_MAX_PARTS) {
    throw new Error("Access token exceeds the bounded browser-session cookie budget");
  }
  return parts;
}

export function readAccessTokenCookie(getCookie: (name: string) => string | undefined): string | null {
  const legacy = getCookie(KAIRO_ACCESS_TOKEN_COOKIE);
  const rawPartCount = getCookie(KAIRO_ACCESS_TOKEN_PARTS_COOKIE);
  if (!rawPartCount) return legacy ?? null;

  const partCount = Number(rawPartCount);
  if (!Number.isInteger(partCount) || partCount < 2 || partCount > KAIRO_ACCESS_TOKEN_MAX_PARTS) {
    return legacy ?? null;
  }

  const parts: string[] = [];
  for (let index = 0; index < partCount; index += 1) {
    const part = getCookie(accessTokenPartCookieName(index));
    if (!part) return null;
    parts.push(part);
  }
  return parts.join("") || null;
}

function transactionSignature(payload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${TRANSACTION_SIGNATURE_CONTEXT}.${payload}`, "utf8")
    .digest("base64url");
}

export function encodeOidcTransaction(transaction: OidcTransaction, secret: string): string {
  const payload = Buffer.from(JSON.stringify(transaction), "utf8").toString("base64url");
  return `${payload}.${transactionSignature(payload, secret)}`;
}

export function decodeOidcTransaction(
  value: string | undefined,
  secret: string,
  now = Date.now(),
): OidcTransaction | null {
  if (!value || !secret) return null;
  const parts = value.split(".");
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;

  try {
    const expected = Buffer.from(transactionSignature(payload, secret), "base64url");
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<OidcTransaction>;
    if (
      typeof parsed.state !== "string" || !parsed.state ||
      typeof parsed.codeVerifier !== "string" || !parsed.codeVerifier ||
      typeof parsed.returnTo !== "string" ||
      typeof parsed.createdAt !== "number" || !Number.isFinite(parsed.createdAt)
    ) return null;

    const ageMs = now - parsed.createdAt;
    if (ageMs < -30_000 || ageMs > OIDC_TRANSACTION_MAX_AGE_SECONDS * 1000) return null;

    return {
      state: parsed.state,
      codeVerifier: parsed.codeVerifier,
      returnTo: safeReturnTo(parsed.returnTo),
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export function jwtSecondsRemaining(token: string | undefined, now = Date.now()): number {
  if (!token) return 0;
  const parts = token.split(".");
  if (parts.length !== 3) return 0;
  try {
    const payload = JSON.parse(Buffer.from(parts[1]!, "base64url").toString("utf8")) as { exp?: unknown };
    if (typeof payload.exp !== "number" || !Number.isFinite(payload.exp)) return 0;
    return Math.max(0, Math.floor(payload.exp - now / 1000));
  } catch {
    return 0;
  }
}
