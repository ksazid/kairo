import { describe, expect, it } from "vitest";
import {
  decodeOidcTransaction,
  encodeOidcTransaction,
  jwtSecondsRemaining,
  safeReturnTo,
} from "./oidc-session";

describe("OIDC session helpers", () => {
  it("accepts only relative same-origin return paths", () => {
    expect(safeReturnTo("/brands/123?tab=brain#voice")).toBe("/brands/123?tab=brain#voice");
    expect(safeReturnTo("https://evil.example/steal")).toBe("/");
    expect(safeReturnTo("//evil.example/steal")).toBe("/");
    expect(safeReturnTo("javascript:alert(1)")).toBe("/");
  });

  it("round-trips a fresh OIDC transaction and rejects expired input", () => {
    const now = Date.parse("2026-08-15T02:30:00Z");
    const encoded = encodeOidcTransaction({
      state: "state-123",
      codeVerifier: "verifier-123",
      returnTo: "/today",
      createdAt: now,
    });

    expect(decodeOidcTransaction(encoded, now + 60_000)).toMatchObject({
      state: "state-123",
      codeVerifier: "verifier-123",
      returnTo: "/today",
    });
    expect(decodeOidcTransaction(encoded, now + 601_000)).toBeNull();
    expect(decodeOidcTransaction("not-json", now)).toBeNull();
  });

  it("reports JWT lifetime without trusting malformed tokens", () => {
    const now = Date.parse("2026-08-15T02:30:00Z");
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ exp: now / 1000 + 900 })).toString("base64url");
    expect(jwtSecondsRemaining(`${header}.${payload}.signature`, now)).toBe(900);
    expect(jwtSecondsRemaining("opaque-token", now)).toBe(0);
  });
});
