import { describe, expect, it } from "vitest";
import type { ExternalIdentity } from "@kairo/contracts";
import { buildApp } from "./app";
import type { IdentityVerifier } from "./auth";
import { MemoryResearchRepository } from "./research-store";
import { MemoryKairoRepository } from "./store";

class TestIdentityVerifier implements IdentityVerifier {
  async verify(header: string | undefined): Promise<ExternalIdentity | null> {
    if (!header?.startsWith("Bearer test:")) return null;
    const subject = header.slice("Bearer test:".length);
    return subject ? { provider: "https://issuer.test", subject } : null;
  }
}

async function setup() {
  const store = new MemoryKairoRepository();
  const researchStore = new MemoryResearchRepository(store);
  const app = buildApp({ store, researchStore, identityVerifier: new TestIdentityVerifier() });
  const auth = { authorization: "Bearer test:alice" };
  const created = await app.inject({ method: "POST", url: "/api/v1/workspaces", headers: auth, payload: { workspaceName: "Studio", brandName: "Kairo" } });
  return { app, auth, brandId: created.json().brand.id as string, researchStore };
}

describe("VS-04 Research and Angle API", () => {
  it("creates and lists a user-originated Idea with truthful lineage", async () => {
    const context = await setup();
    const created = await context.app.inject({
      method: "POST", url: `/api/v1/brands/${context.brandId}/ideas`, headers: context.auth,
      payload: { title: "A customer question", premise: "Explain why it matters" },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({ brandId: context.brandId, source: { type: "user" }, status: "new" });

    const listed = await context.app.inject({ method: "GET", url: `/api/v1/brands/${context.brandId}/ideas`, headers: context.auth });
    expect(listed.statusCode).toBe(200);
    expect(listed.json()).toEqual([expect.objectContaining({ id: created.json().id, title: "A customer question" })]);
    await context.app.close();
  });

  it("hides a foreign Brand's Ideas behind safe not-found behavior", async () => {
    const context = await setup();
    const response = await context.app.inject({ method: "GET", url: `/api/v1/brands/${context.brandId}/ideas`, headers: { authorization: "Bearer test:bob" } });
    expect(response.statusCode).toBe(404);
    expect(response.json().code).toBe("resource_not_found");
    await context.app.close();
  });

  it("returns Research/Angles and enforces optimistic Angle selection", async () => {
    const context = await setup();
    const created = await context.app.inject({ method: "POST", url: `/api/v1/brands/${context.brandId}/ideas`, headers: context.auth, payload: { title: "Evidence", premise: "Use supported facts" } });
    const ideaId = created.json().id as string;
    await context.researchStore.seedReadyBundle(ideaId);

    const detail = await context.app.inject({ method: "GET", url: `/api/v1/brands/${context.brandId}/ideas/${ideaId}`, headers: context.auth });
    expect(detail.statusCode).toBe(200);
    expect(detail.json().research.claims[0]).toMatchObject({ verificationState: "supported" });
    expect(detail.json().angles).toHaveLength(2);

    const edited = await context.app.inject({ method: "PATCH", url: `/api/v1/brands/${context.brandId}/ideas/${ideaId}/angles/angle-1`, headers: context.auth, payload: { framing: "Explain the verified finding first", expectedVersion: 1 } });
    expect(edited.statusCode).toBe(200);
    expect(edited.json()).toMatchObject({ id: "angle-1", framing: "Explain the verified finding first", version: 2 });
    const staleEdit = await context.app.inject({ method: "PATCH", url: `/api/v1/brands/${context.brandId}/ideas/${ideaId}/angles/angle-1`, headers: context.auth, payload: { framing: "Stale overwrite", expectedVersion: 1 } });
    expect(staleEdit.statusCode).toBe(409);

    const selected = await context.app.inject({ method: "POST", url: `/api/v1/brands/${context.brandId}/ideas/${ideaId}/angles/angle-2/select`, headers: context.auth, payload: { expectedVersion: 1 } });
    expect(selected.statusCode).toBe(200);
    expect(selected.json().filter((angle: { status: string }) => angle.status === "selected")).toEqual([expect.objectContaining({ id: "angle-2" })]);
    const stale = await context.app.inject({ method: "POST", url: `/api/v1/brands/${context.brandId}/ideas/${ideaId}/angles/angle-1/select`, headers: context.auth, payload: { expectedVersion: 1 } });
    expect(stale.statusCode).toBe(409);
    await context.app.close();
  });
});
