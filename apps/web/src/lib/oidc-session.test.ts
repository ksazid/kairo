import { describe, expect, it } from "vitest";
import {
  decodeOidcTransaction,
  encodeOidcTransaction,
  jwtSecondsRemaining,
  safeReturnTo,
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
    const tamperedPayload = Buffer.from(JSON.stringify({
      state: "attacker-state",
      codeVerifier: "attacker-verifier",
      returnTo: "/",
      createdAt: now,
    }), "utf8").toString("base64url");

    expect(decodeOidcTransaction(`${tamperedPayload}.${signature}`, TEST_SECRET, now)).toBeNull();
    expect(decodeOidcTransaction(`${payload}.${signature?.slice(0, -1)}A`, TEST_SECRET, now)).toBeNull();
    expect(decodeOidcTransaction(encoded, "wrong-secret", now)).toBeNull();
  });

  it("reports JWT lifetime without trusting malformed tokens", () => {
    const now = Date.parse("2026-08-15T02:30:00Z");
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ exp: now / 1000 + 900 })).toString("base64url");
    expect(jwtSecondsRemaining(`${header}.${payload}.signature`, now)).toBe(900);
    expect(jwtSecondsRemaining("opaque-token", now)).toBe(0);
  });
});
