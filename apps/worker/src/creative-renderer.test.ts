import { describe, expect, it, vi } from "vitest";
import type { CarouselPlan, ReelPlan } from "@kairo/domain/creative-formats";
import {
  CreativeAssetProductionService,
  renderCreativePlan,
  type CreativeObjectStorePort,
} from "./creative-renderer";

const carousel: CarouselPlan = {
  format: "carousel",
  coverHook: "Three things that changed",
  slides: [
    { headline: "First change", body: "A concise explanation for the audience.", supportingClaimIds: ["c1"] },
    { headline: "Second change", body: "Another evidence-linked explanation.", supportingClaimIds: ["c2"] },
    { headline: "What to do next", body: "Turn the evidence into a practical action.", supportingClaimIds: ["c1", "c2"] },
  ],
  caption: "A useful carousel caption.",
  cta: "Save this for later.",
  supportingClaimIds: ["c1", "c2"],
};

const reel: ReelPlan = {
  format: "reel",
  hook: "This changed faster than expected",
  targetDurationSeconds: 12,
  scenes: [
    { startSecond: 0, endSecond: 5, visual: "Close crop of the product", onScreenText: "The old assumption", voiceover: "Start with the established assumption.", supportingClaimIds: ["c1"] },
    { startSecond: 5, endSecond: 12, visual: "Simple comparison graphic", onScreenText: "What changed", voiceover: "Explain the verified change and what it means.", supportingClaimIds: ["c2"] },
  ],
  caption: "A concise Reel caption.",
  cta: "Follow for the next update.",
  supportingClaimIds: ["c1", "c2"],
};

const tinySquare = { width: 180, height: 180 } as const;
const tinyVertical = { width: 180, height: 320 } as const;
const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

describe("creative renderer", () => {
  it("renders a deterministic PNG for every carousel slide", () => {
    const a = renderCreativePlan(carousel, tinySquare);
    const b = renderCreativePlan(carousel, tinySquare);
    expect(a.format).toBe("carousel");
    expect(a.artifacts).toHaveLength(3);
    expect(a.sourceFingerprint).toBe(b.sourceFingerprint);
    expect(a.artifacts.map((item) => item.sha256)).toEqual(b.artifacts.map((item) => item.sha256));
    for (const artifact of a.artifacts) {
      expect(artifact.contentType).toBe("image/png");
      expect(Array.from(artifact.bytes.slice(0, 8))).toEqual(pngSignature);
      expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(artifact.supportingClaimIds.length).toBeGreaterThan(0);
    }
  });

  it("renders a deterministic Reel storyboard and canonical timed manifest", () => {
    const a = renderCreativePlan(reel, tinyVertical);
    const b = renderCreativePlan(reel, tinyVertical);
    expect(a.format).toBe("reel");
    expect(a.artifacts.filter((item) => item.role === "reel-storyboard")).toHaveLength(2);
    const manifest = a.artifacts.find((item) => item.role === "reel-render-manifest");
    expect(manifest?.contentType).toBe("application/vnd.kairo.reel-render+json");
    const decoded = JSON.parse(new TextDecoder().decode(manifest!.bytes));
    expect(decoded.targetDurationSeconds).toBe(12);
    expect(decoded.scenes).toHaveLength(2);
    expect(decoded.scenes[1].startSecond).toBe(5);
    expect(a.artifacts.map((item) => item.sha256)).toEqual(b.artifacts.map((item) => item.sha256));
  });

  it("rejects unsafe rendering dimensions", () => {
    expect(() => renderCreativePlan(carousel, { width: 0, height: 180 })).toThrow(/width/i);
    expect(() => renderCreativePlan(reel, { width: 180, height: 5000 })).toThrow(/height/i);
  });

  it("fails closed rather than silently truncating approved copy", () => {
    const crowded: CarouselPlan = {
      ...carousel,
      slides: [
        { ...carousel.slides[0]!, body: "evidence ".repeat(180).trim() },
        carousel.slides[1]!,
        carousel.slides[2]!,
      ],
    };
    expect(() => renderCreativePlan(crowded, tinySquare)).toThrow(/does not fit/i);
  });

  it("fails closed for glyphs the deterministic bitmap renderer cannot faithfully represent", () => {
    const multilingual: CarouselPlan = { ...carousel, coverHook: "Umrah تحديث" };
    expect(() => renderCreativePlan(multilingual, tinySquare)).toThrow(/unsupported character/i);
  });
});

describe("CreativeAssetProductionService", () => {
  it("stores generated media privately with stable scoped object keys", async () => {
    const puts: Array<{ objectKey: string; workspaceId: string; brandId: string; contentHash: string }> = [];
    const store: CreativeObjectStorePort = {
      async putPrivateObject(input) {
        puts.push({ objectKey: input.objectKey, workspaceId: input.workspaceId, brandId: input.brandId, contentHash: input.contentHash });
        return { objectId: `obj:${input.objectKey}` };
      },
    };
    const service = new CreativeAssetProductionService(store);
    const first = await service.produce({ workspaceId: "ws-1", brandId: "brand-1" }, carousel, tinySquare);
    const firstKeys = puts.map((item) => item.objectKey);
    puts.length = 0;
    const second = await service.produce({ workspaceId: "ws-1", brandId: "brand-1" }, carousel, tinySquare);
    expect(second.sourceFingerprint).toBe(first.sourceFingerprint);
    expect(puts.map((item) => item.objectKey)).toEqual(firstKeys);
    expect(first.assets).toHaveLength(3);
    expect(first.assets.every((item) => item.objectId.startsWith("obj:generated/"))).toBe(true);
  });

  it("keeps content deterministic while scoping stored identity per Brand", async () => {
    const keys: string[] = [];
    const store: CreativeObjectStorePort = { async putPrivateObject(input) { keys.push(input.objectKey); return { objectId: input.objectKey }; } };
    const service = new CreativeAssetProductionService(store);
    const one = await service.produce({ workspaceId: "ws-1", brandId: "brand-1" }, reel, tinyVertical);
    const firstHashes = one.assets.map((item) => item.contentHash);
    keys.length = 0;
    const two = await service.produce({ workspaceId: "ws-1", brandId: "brand-2" }, reel, tinyVertical);
    expect(two.assets.map((item) => item.contentHash)).toEqual(firstHashes);
    expect(two.assets.map((item) => item.objectKey)).not.toEqual(one.assets.map((item) => item.objectKey));
  });

  it("fails closed when a generated artifact exceeds the configured bound", async () => {
    const store: CreativeObjectStorePort = { putPrivateObject: vi.fn(async (input) => ({ objectId: input.objectKey })) };
    const service = new CreativeAssetProductionService(store, { maxArtifactBytes: 16 });
    await expect(service.produce({ workspaceId: "ws-1", brandId: "brand-1" }, carousel, tinySquare)).rejects.toThrow(/artifact size/i);
    expect(store.putPrivateObject).not.toHaveBeenCalled();
  });
});
