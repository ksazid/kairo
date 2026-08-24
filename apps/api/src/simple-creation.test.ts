import { describe, expect, it } from "vitest";
import type { BrandPresenterDto } from "@kairo/contracts/presenter";
import type { AvatarProvider } from "./avatar-provider";
import {
  SimpleCreationService,
  type SimpleCreationRequest,
  type SimpleCreationStore,
} from "./simple-creation";

const availableProvider: AvatarProvider = {
  async getCapabilities() {
    return { providerConfigured: true, avatarRendering: true, testClip: true };
  },
};

describe("simple creation", () => {
  it("validates a compact creation brief without requiring a presenter", async () => {
    const store = new MemoryStore();
    const service = new SimpleCreationService(store, {} as never, {} as never, { develop: async () => {} });
    await expect(
      service.start("a", "w", "b", {
        goal: "  Grow awareness ",
        source: "https://example.com",
        contentPreference: "carousel",
      }),
    ).resolves.toMatchObject({
      goal: "Grow awareness",
      source: "https://example.com",
      contentPreference: "carousel",
      status: "queued",
    });
    await expect(
      service.start("a", "w", "b", { goal: "", contentPreference: "auto" }),
    ).rejects.toThrow("goal is required");
  });

  it("persists an eligible presenter and exposes only its public identity", async () => {
    const store = new MemoryStore();
    store.presenter = presenter({ status: "ready" });
    const service = new SimpleCreationService(
      store,
      {} as never,
      {} as never,
      { develop: async () => {} },
      () => new Date(),
      availableProvider,
    );
    const created = await service.start("a", "w", "b", { goal: "Launch", presenterId: "p1" });
    expect(created.presenterId).toBe("p1");
    await expect(service.get("a", "b", created.id)).resolves.toMatchObject({
      presenter: { id: "p1", displayName: "Guide", mode: "hybrid-explainer" },
    });
  });

  it("fails before persistence when provider capability is unavailable", async () => {
    const store = new MemoryStore();
    store.presenter = presenter({ status: "ready" });
    const service = new SimpleCreationService(store, {} as never, {} as never, { develop: async () => {} });
    await expect(
      service.start("a", "w", "b", { goal: "Launch", presenterId: "p1" }),
    ).rejects.toThrow("Presenter rendering is not available for this Brand");
    expect(store.rows).toHaveLength(0);
  });

  it("fails before persistence for a non-ready or cross-Brand presenter", async () => {
    const store = new MemoryStore();
    store.presenter = presenter({ status: "draft" });
    const service = new SimpleCreationService(
      store,
      {} as never,
      {} as never,
      { develop: async () => {} },
      () => new Date(),
      availableProvider,
    );
    await expect(
      service.start("a", "w", "b", { goal: "Launch", presenterId: "p1" }),
    ).rejects.toThrow("Presenter is not available for this Brand");
    expect(store.rows).toHaveLength(0);

    store.presenter = presenter({ status: "ready", brandId: "other" });
    await expect(
      service.start("a", "w", "b", { goal: "Launch", presenterId: "p1" }),
    ).rejects.toThrow("Presenter is not available for this Brand");
    expect(store.rows).toHaveLength(0);
  });

  it("exposes friendly progress without leaking internal pipeline ids", async () => {
    const store = new MemoryStore();
    const service = new SimpleCreationService(store, {} as never, {} as never, { develop: async () => {} });
    const created = await service.start("a", "w", "b", { goal: "Launch" });
    const view = await service.get("a", "b", created.id);
    expect(view).toMatchObject({
      status: "queued",
      progress: { stage: "queued", message: "Getting your creation ready" },
    });
    expect(view).not.toHaveProperty("ideaId");
  });
});

class MemoryStore implements SimpleCreationStore {
  rows: SimpleCreationRequest[] = [];
  presenter: BrandPresenterDto | null = null;

  async create(value: SimpleCreationRequest) {
    this.rows.push(value);
    return value;
  }
  async get(accountId: string, brandId: string, id: string) {
    return this.rows.find((item) => item.accountId === accountId && item.brandId === brandId && item.id === id) ?? null;
  }
  async claim() {
    return null;
  }
  async advance() {}
  async getPresenter(workspaceId: string, brandId: string) {
    return this.presenter?.workspaceId === workspaceId && this.presenter.brandId === brandId ? this.presenter : null;
  }
  async putPresenter(value: BrandPresenterDto) {
    this.presenter = value;
    return value;
  }
}

function presenter(value: Partial<BrandPresenterDto> = {}): BrandPresenterDto {
  return {
    id: "p1",
    workspaceId: "w",
    brandId: "b",
    displayName: "Guide",
    status: "ready",
    mode: "hybrid-explainer",
    version: 1,
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
    ...value,
  };
}
