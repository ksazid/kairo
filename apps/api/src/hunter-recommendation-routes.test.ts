import { describe, expect, it } from "vitest";
import type { ExternalIdentity } from "@kairo/contracts";
import type { HunterRunInput, HunterRunResult } from "@kairo/worker/hunter";
import type { IdentityVerifier } from "./auth";
import { buildApp } from "./app";
import {
  registerHunterRecommendationRoutes,
  type HunterRecommendationRunner,
} from "./hunter-recommendation-routes";
import { MemoryKairoRepository } from "./store";

class Verifier implements IdentityVerifier {
  async verify(value: string | undefined): Promise<ExternalIdentity | null> {
    return value?.startsWith("Bearer test:")
      ? { provider: "test", subject: value.slice("Bearer test:".length) }
      : null;
  }
}

const emptyResult: HunterRunResult = {
  evidenceCount: 0,
  candidateCount: 0,
  opportunityCount: 0,
};

async function setupBrand(store: MemoryKairoRepository, subject = "alice") {
  const account = await store.resolveAccount({ provider: "test", subject });
  const created = await store.createWorkspaceWithBrand(account.id, {
    workspaceName: `${subject} workspace`,
    brandName: `${subject} brand`,
  });
  return { account, ...created };
}

async function addSector(store: MemoryKairoRepository, accountId: string, brandId: string) {
  await store.putConfirmedBrandBrainField(accountId, brandId, "category", {
    section: "identity",
    value: "AI",
  });
  await store.putConfirmedBrandBrainField(accountId, brandId, "primary-audience", {
    section: "audience",
    value: "Software teams",
  });
}

describe("VS-97 Hunter recommendations API", () => {
  it("requires authentication", async () => {
    const store = new MemoryKairoRepository();
    const verifier = new Verifier();
    const app = buildApp({ store, identityVerifier: verifier });
    registerHunterRecommendationRoutes(app, { store, identityVerifier: verifier, runner: { async runForAuthorizedBrand() { return emptyResult; } } });

    const response = await app.inject({ method: "POST", url: "/api/v1/brands/unknown/recommendations" });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "unauthorized" });
    await app.close();
  });

  it("projects Brand Brain context and returns truthful zero-result Hunter runs", async () => {
    const store = new MemoryKairoRepository();
    const verifier = new Verifier();
    const { account, brand } = await setupBrand(store);
    await addSector(store, account.id, brand.id);
    let captured: HunterRunInput | undefined;
    const runner: HunterRecommendationRunner = {
      async runForAuthorizedBrand(input) {
        captured = input;
        return emptyResult;
      },
    };
    const app = buildApp({ store, identityVerifier: verifier });
    registerHunterRecommendationRoutes(app, { store, identityVerifier: verifier, runner });

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/brands/${brand.id}/recommendations`,
      headers: { authorization: "Bearer test:alice" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(emptyResult);
    expect(captured).toMatchObject({
      accountId: account.id,
      maxEvidence: 8,
      brand: {
        workspaceId: brand.workspaceId,
        brandId: brand.id,
        brandName: brand.name,
        audience: "Software teams",
      },
      intelligenceProfile: {
        sector: "AI",
        audiences: ["Software teams"],
      },
    });
    expect(captured?.query).toBeUndefined();
    await app.close();
  });

  it("uses a bounded explicit public query when no sector pack matches the Brand", async () => {
    const store = new MemoryKairoRepository();
    const verifier = new Verifier();
    const { account, brand } = await setupBrand(store);
    await store.putConfirmedBrandBrainField(account.id, brand.id, "category", {
      section: "identity",
      value: "Restaurant",
    });
    await store.putConfirmedBrandBrainField(account.id, brand.id, "content-pillars", {
      section: "content-strategy",
      value: "seasonal menus",
    });
    let captured: HunterRunInput | undefined;
    const app = buildApp({ store, identityVerifier: verifier });
    registerHunterRecommendationRoutes(app, {
      store,
      identityVerifier: verifier,
      runner: {
        async runForAuthorizedBrand(input) {
          captured = input;
          return emptyResult;
        },
      },
    });

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/brands/${brand.id}/recommendations`,
      headers: { authorization: "Bearer test:alice" },
    });

    expect(response.statusCode).toBe(200);
    expect(captured?.intelligenceProfile).toBeUndefined();
    expect(captured?.query).toContain(brand.name);
    expect(captured?.query).toContain("Restaurant");
    expect((captured?.query?.length ?? 0)).toBeLessThanOrEqual(600);
    await app.close();
  });

  it("fails closed when the Hunter runtime is unavailable", async () => {
    const store = new MemoryKairoRepository();
    const verifier = new Verifier();
    const { account, brand } = await setupBrand(store);
    await addSector(store, account.id, brand.id);
    const app = buildApp({ store, identityVerifier: verifier });
    registerHunterRecommendationRoutes(app, { store, identityVerifier: verifier });

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/brands/${brand.id}/recommendations`,
      headers: { authorization: "Bearer test:alice" },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ code: "hunter_unavailable" });
    await app.close();
  });

  it("does not expose another account's Brand", async () => {
    const store = new MemoryKairoRepository();
    const verifier = new Verifier();
    const { account, brand } = await setupBrand(store, "alice");
    await addSector(store, account.id, brand.id);
    await setupBrand(store, "bob");
    let runs = 0;
    const app = buildApp({ store, identityVerifier: verifier });
    registerHunterRecommendationRoutes(app, {
      store,
      identityVerifier: verifier,
      runner: { async runForAuthorizedBrand() { runs += 1; return emptyResult; } },
    });

    const response = await app.inject({
      method: "POST",
      url: `/api/v1/brands/${brand.id}/recommendations`,
      headers: { authorization: "Bearer test:bob" },
    });

    expect(response.statusCode).toBe(404);
    expect(runs).toBe(0);
    await app.close();
  });

  it("coalesces concurrent Hunter clicks for the same Brand", async () => {
    const store = new MemoryKairoRepository();
    const verifier = new Verifier();
    const { account, brand } = await setupBrand(store);
    await addSector(store, account.id, brand.id);
    let runs = 0;
    let release!: (result: HunterRunResult) => void;
    const pending = new Promise<HunterRunResult>((resolve) => { release = resolve; });
    const runner: HunterRecommendationRunner = {
      async runForAuthorizedBrand() {
        runs += 1;
        return pending;
      },
    };
    const app = buildApp({ store, identityVerifier: verifier });
    registerHunterRecommendationRoutes(app, { store, identityVerifier: verifier, runner });

    const request = () => app.inject({
      method: "POST" as const,
      url: `/api/v1/brands/${brand.id}/recommendations`,
      headers: { authorization: "Bearer test:alice" },
    });
    const first = request();
    const second = request();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(runs).toBe(1);
    release({ evidenceCount: 3, candidateCount: 2, opportunityCount: 1 });

    const responses = await Promise.all([first, second]);
    expect(responses.map((response) => response.statusCode)).toEqual([200, 200]);
    expect(responses.map((response) => response.json().opportunityCount)).toEqual([1, 1]);
    expect(runs).toBe(1);
    await app.close();
  });
});
