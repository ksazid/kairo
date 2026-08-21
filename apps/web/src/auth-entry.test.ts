import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");

describe("VS-28 Kairo auth entry contract", () => {
  it("sends signed-out root traffic directly to Auth0 and routes users without a Workspace to onboarding", () => {
    const root = source("../app/page.tsx");
    expect(root).toContain('redirect("/auth/login?returnTo=/")');
    expect(root).toContain('redirect("/onboarding")');
    expect(root).not.toContain("function SignIn");
    expect(root).not.toContain("function Onboarding");
  });

  it("keeps Workspace creation on an authenticated dedicated onboarding route", () => {
    const onboarding = source("../app/onboarding/page.tsx");
    expect(onboarding).toContain('redirect("/auth/login?returnTo=/onboarding")');
    expect(onboarding).toContain("session.workspaces.length > 0");
    expect(onboarding).toContain("createWorkspaceAction");
  });

  it("keeps the Kairo sign-in route recovery-only instead of collecting an identifier or password", () => {
    const recovery = source("../app/sign-in/page.tsx");
    expect(recovery).toContain("Auth0 Universal Login");
    expect(recovery).not.toContain("login_hint");
    expect(recovery).not.toContain('type="password"');
    expect(recovery).not.toContain('type="email"');
  });

  it("keeps default Universal Login connection-neutral while bounding direct social selection to Google and Apple", () => {
    const login = source("../app/auth/login/route.ts");
    expect(login).toContain('new Set(["google-oauth2", "apple"])');
    expect(login).toContain("if (connection) parameters.connection = connection");
    expect(login).not.toContain('parameters.connection = "google-oauth2"');
  });

  it("preserves the full Instagram OAuth callback across an expired Kairo session", () => {
    const callback = source("../app/channels/instagram/callback/route.ts");
    expect(callback).toContain('error instanceof InstagramApiError && error.status === 401');
    expect(callback).toContain('return `${request.nextUrl.pathname}${request.nextUrl.search}`;');
    expect(callback).toContain('target.searchParams.set("returnTo", callbackReturnTo(request));');
  });

  it("ships a stable Kairo application logo asset for Auth0 branding", () => {
    const logo = source("../public/kairo-auth-logo.svg");
    expect(logo).toContain("<title id=\"title\">Kairo</title>");
    expect(logo).toContain("viewBox=\"0 0 256 256\"");
  });
});
