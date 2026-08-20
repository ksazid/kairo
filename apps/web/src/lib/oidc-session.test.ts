import { describe, expect, it } from "vitest";
import {
  accessTokenPartCookieName,
  decodeOidcTransaction,
  encodeOidcTransaction,
  jwtSecondsRemaining,
  KAIRO_ACCESS_TOKEN_COOKIE,
  KAIRO_ACCESS_TOKEN_COOKIE_CHUNK_SIZE,
  KAIRO_ACCESS_TOKEN_MAX_PARTS,
  KAIRO_ACCESS_TOKEN_PARTS_COOKIE,
  readAccessTokenCookie,
  safeReturnTo,
  splitAccessTokenCookie,
} from "./oidc-session";

const TEST_SECRET = "test-only-oidc-client-secret-32-characters-minimum";

describe("OIDC session helpers", () => {
  it("accepts only relative same-origin return paths", () => {
    expect(safeReturnTo("/brands/123?tab=brain#voice")).toBe("/brands/123?tab=brain#voice");
    expect(safeReturnTo("https://evil.example/steal")).toBe("/");
    expect(safeReturnTo("//evil.example/steal")).toBe("/");
    expect(safeReturnTo("javascript:alert(1)")).toBe("/");
  });

  it("round-trips a fresh signed OIDC transaction and rejects expired input", () => {
    const now = Date.parse("2026-08-15T02:30:00Z");
    const encoded = encodeOidcTransaction({
      state: "state-123",
      codeVerifier: "verifier-123",
      returnTo: "/today",
      createdAt: now,
    }, TEST_SECRET);

    expect(decodeOidcTransaction(encoded, TEST_SECRET, now + 60_000)).toMatchObject({
      state: "state-123",
      codeVerifier: "verifier-123",
      returnTo: "/today",
    });
    expect(decodeOidcTransaction(encoded, TEST_SECRET, now + 601_000)).toBeNull();
    expect(decodeOidcTransaction("not-json", TEST_SECRET, now)).toBeNull();
  });

  it("rejects a transaction whose payload or signature was tampered with", () => {
    const now = Date.parse("2026-08-15T02:30:00Z");
    const encoded = encodeOidcTransaction({
      state: "state-123",
      codeVerifier: "verifier-123",
      returnTo: "/today",
      createdAt: now,
    }, TEST_SECRET);
    const [payload, signature] = encoded.split(".");
    if (!payload || !signature) throw new Error("Expected signed transaction");

    const tamperedPayload = Buffer.from(JSON.stringify({
      state: "attacker-state",
      codeVerifier: "attacker-verifier",
      returnTo: "/",
      createdAt: now,
    }), "utf8").toString("base64url");
    const tamperedSignature = `${signature.startsWith("A") ? "B" : "A"}${signature.slice(1)}`;

    expect(decodeOidcTransaction(`${tamperedPayload}.${signature}`, TEST_SECRET, now)).toBeNull();
    expect(decodeOidcTransaction(`${payload}.${tamperedSignature}`, TEST_SECRET, now)).toBeNull();
    expect(decodeOidcTransaction(encoded, "wrong-secret", now)).toBeNull();
  });

  it("reports JWT lifetime without trusting malformed tokens", () => {
    const now = Date.parse("2026-08-15T02:30:00Z");
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ exp: now / 1000 + 900 })).toString("base64url");
    expect(jwtSecondsRemaining(`${header}.${payload}.signature`, now)).toBe(900);
    expect(jwtSecondsRemaining("opaque-token", now)).toBe(0);
  });

  it("chunks a large access token below browser cookie limits and reassembles it exactly", () => {
    const token = "token-".repeat(1200);
    const parts = splitAccessTokenCookie(token);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.every((part) => part.length <= KAIRO_ACCESS_TOKEN_COOKIE_CHUNK_SIZE)).toBe(true);

    const cookies = new Map<string, string>([[KAIRO_ACCESS_TOKEN_PARTS_COOKIE, String(parts.length)]]);
    parts.forEach((part, index) => cookies.set(accessTokenPartCookieName(index), part));
    expect(readAccessTokenCookie((name) => cookies.get(name))).toBe(token);
  });

  it("keeps the existing single-cookie token compatible and fails closed on incomplete chunks", () => {
    const legacy = new Map<string, string>([[KAIRO_ACCESS_TOKEN_COOKIE, "legacy-token"]]);
    expect(readAccessTokenCookie((name) => legacy.get(name))).toBe("legacy-token");

    const incomplete = new Map<string, string>([
      [KAIRO_ACCESS_TOKEN_PARTS_COOKIE, "2"],
      [accessTokenPartCookieName(0), "first-half"],
    ]);
    expect(readAccessTokenCookie((name) => incomplete.get(name))).toBeNull();
  });

  it("rejects access tokens larger than the bounded browser-session cookie budget", () => {
    const tooLarge = "x".repeat(KAIRO_ACCESS_TOKEN_COOKIE_CHUNK_SIZE * KAIRO_ACCESS_TOKEN_MAX_PARTS + 1);
    expect(() => splitAccessTokenCookie(tooLarge)).toThrow("bounded browser-session cookie budget");
  });
});
