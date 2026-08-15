export const OIDC_TRANSACTION_COOKIE = "kairo_oidc_tx";
export const KAIRO_ACCESS_TOKEN_COOKIE = "kairo_access_token";
export const OIDC_TRANSACTION_MAX_AGE_SECONDS = 600;

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

export function encodeOidcTransaction(transaction: OidcTransaction): string {
  return Buffer.from(JSON.stringify(transaction), "utf8").toString("base64url");
}

export function decodeOidcTransaction(
  value: string | undefined,
  now = Date.now(),
): OidcTransaction | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<OidcTransaction>;
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
