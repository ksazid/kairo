import { describe, expect, it } from "vitest";
import { oidcBootstrapFailure, oidcEnvironmentStatus } from "./auth";

const configured = {
  OIDC_ISSUER: "https://issuer.example/",
  OIDC_CLIENT_ID: "client-id",
  OIDC_CLIENT_SECRET: "client-secret",
  OIDC_AUDIENCE: "https://api.example",
} as NodeJS.ProcessEnv;

describe("Kairo UI v2 OIDC bootstrap diagnostics", () => {
  it("reports only missing configuration keys, never values", () => {
    const env = { ...configured, OIDC_CLIENT_SECRET: "" };
    expect(oidcEnvironmentStatus(env)).toEqual({ configured: false, missing: ["OIDC_CLIENT_SECRET"] });
    expect(JSON.stringify(oidcBootstrapFailure(new Error("anything"), env))).not.toContain("client-secret");
  });

  it("classifies discovery failures without exposing the underlying error", () => {
    expect(oidcBootstrapFailure(new TypeError("fetch failed: secret-looking-detail"), configured)).toEqual({
      code: "discovery_failed",
      missing: [],
    });
  });

  it("keeps unknown bootstrap failures generic", () => {
    expect(oidcBootstrapFailure(new Error("unexpected secret-looking-detail"), configured)).toEqual({
      code: "bootstrap_failed",
      missing: [],
    });
  });
});
