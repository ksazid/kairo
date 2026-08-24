import { describe, expect, it } from "vitest";
import type { BrandPresenterDto } from "@kairo/contracts/presenter";
import { BrandPresenterService, type BrandPresenterStore } from "./brand-presenter";

class MemoryPresenterStore implements BrandPresenterStore {
  value: BrandPresenterDto | null = null;
  async getPresenter(workspaceId: string, brandId: string) {
    return this.value?.workspaceId === workspaceId && this.value.brandId === brandId ? this.value : null;
  }
  async putPresenter(value: BrandPresenterDto, expectedVersion?: number) {
    if (this.value && expectedVersion !== this.value.version) throw new Error("stale");
    if (!this.value && expectedVersion !== undefined) throw new Error("stale");
    this.value = value;
    return value;
  }
}

describe("BrandPresenterService", () => {
  it("does not persist a fake presenter on read", async () => {
    const service = new BrandPresenterService(new MemoryPresenterStore());
    await expect(service.get("w1", "b1")).resolves.toEqual({
      presenter: null,
      capabilities: { avatarRendering: false, testClip: false },
    });
  });

  it("creates a ready presenter and normalizes descriptive preferences", async () => {
    const service = new BrandPresenterService(new MemoryPresenterStore(), () => new Date("2026-08-24T17:00:00Z"));
    const response = await service.save("w1", "b1", {
      displayName: "  Kairo Guide  ",
      status: "ready",
      mode: "hybrid-explainer",
      visualStyle: "  clean technical presenter  ",
      voiceStyle: " calm and concise ",
    });
    expect(response.presenter).toMatchObject({
      workspaceId: "w1",
      brandId: "b1",
      displayName: "Kairo Guide",
      status: "ready",
      mode: "hybrid-explainer",
      visualStyle: "clean technical presenter",
      voiceStyle: "calm and concise",
      version: 1,
    });
    expect(response.capabilities).toEqual({ avatarRendering: false, testClip: false });
  });

  it("requires exact version for updates", async () => {
    const store = new MemoryPresenterStore();
    const service = new BrandPresenterService(store);
    const created = await service.save("w1", "b1", { displayName: "Guide", status: "ready", mode: "basic" });
    await expect(service.save("w1", "b1", { displayName: "Guide 2", status: "ready", mode: "basic" })).rejects.toThrow("Presenter changed");
    const updated = await service.save("w1", "b1", { displayName: "Guide 2", status: "ready", mode: "talking-avatar", expectedVersion: created.presenter!.version });
    expect(updated.presenter).toMatchObject({ displayName: "Guide 2", mode: "talking-avatar", version: 2 });
  });

  it("fails closed when creation references a non-ready or cross-Brand presenter", async () => {
    const store = new MemoryPresenterStore();
    const service = new BrandPresenterService(store);
    const created = await service.save("w1", "b1", { displayName: "Guide", status: "draft", mode: "basic" });
    await expect(service.requireReady("w1", "b1", created.presenter!.id)).rejects.toThrow("Presenter is not available for this Brand");
    await service.save("w1", "b1", { displayName: "Guide", status: "ready", mode: "basic", expectedVersion: created.presenter!.version });
    await expect(service.requireReady("w1", "b2", store.value!.id)).rejects.toThrow("Presenter is not available for this Brand");
  });
});
