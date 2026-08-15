import { describe, expect, it } from "vitest";
import type { PublishingJob } from "./publishing";
import { InstagramProfessionalAdapter } from "./publishing-adapters";

const secrets = { async resolve() { return "secret-token"; } };

function job(overrides: Partial<PublishingJob> = {}): PublishingJob {
  return {
    commandId: "cmd",
    versionId: "v1",
    attemptId: "attempt-1",
    attemptNumber: 1,
    leaseOwner: "worker",
    idempotencyKey: "cmd:v1:123",
    channel: "instagram",
    accountRef: "123",
    credentialRef: "vault://ig",
    contentType: "reel",
    content: "Evidence-led caption",
    mediaUrls: [],
    mediaItems: [{ kind: "video", url: "https://cdn.example.com/reel.mp4" }],
    options: { instagram: { shareToFeed: true } },
    ...overrides,
  };
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });
}

describe("VS-15 Instagram Reel publishing", () => {
  it("creates a Reel, waits for FINISHED, then publishes it", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    let statusChecks = 0;
    const adapter = new InstagramProfessionalAdapter(secrets, "v24.0", async (input, init) => {
      const url = String(input); calls.push({ url, init });
      if (url.endsWith("/123/media")) return json({ id: "container-r" });
      if (url.includes("/container-r?")) return json({ status_code: ++statusChecks === 1 ? "IN_PROGRESS" : "FINISHED" });
      if (url.endsWith("/123/media_publish")) return json({ id: "media-r" });
      throw new Error(`unexpected ${url}`);
    }, { maxChecks: 3, intervalMs: 0, sleep: async () => undefined });

    expect(adapter.supports(job())).toBe(true);
    const result = await adapter.publish(job());
    expect(result).toEqual({ status: "published", externalPostId: "media-r", providerCorrelationId: "container-r" });

    const createBody = JSON.parse(String(calls[0]?.init?.body));
    expect(createBody).toEqual({ media_type: "REELS", video_url: "https://cdn.example.com/reel.mp4", caption: "Evidence-led caption", share_to_feed: true });
    expect(calls.filter((call) => call.url.includes("/container-r?")).length).toBe(2);
  });

  it("fails safely on provider processing ERROR and retains the container correlation", async () => {
    const adapter = new InstagramProfessionalAdapter(secrets, "v24.0", async (input) => {
      const url = String(input);
      if (url.endsWith("/123/media")) return json({ id: "container-error" });
      if (url.includes("/container-error?")) return json({ status_code: "ERROR", status: "Processing failed" });
      throw new Error("publish must not be called");
    }, { maxChecks: 2, intervalMs: 0, sleep: async () => undefined });

    expect(await adapter.publish(job())).toEqual({
      status: "failed",
      failureCode: "provider-media-processing-error",
      retryable: false,
      providerCorrelationId: "container-error",
    });
  });

  it("bounds readiness polling without claiming the Reel was published", async () => {
    let checks = 0;
    const adapter = new InstagramProfessionalAdapter(secrets, "v24.0", async (input) => {
      const url = String(input);
      if (url.endsWith("/123/media")) return json({ id: "container-slow" });
      if (url.includes("/container-slow?")) { checks += 1; return json({ status_code: "IN_PROGRESS" }); }
      throw new Error("publish must not be called");
    }, { maxChecks: 2, intervalMs: 0, sleep: async () => undefined });

    const result = await adapter.publish(job());
    expect(checks).toBe(2);
    expect(result).toEqual({ status: "failed", failureCode: "provider-media-processing-pending", retryable: true, providerCorrelationId: "container-slow" });
  });
});

describe("VS-15 Instagram image carousel publishing", () => {
  it("creates child image containers, a CAROUSEL parent, then publishes the parent", async () => {
    const bodies: unknown[] = [];
    let createCount = 0;
    const adapter = new InstagramProfessionalAdapter(secrets, "v24.0", async (input, init) => {
      const url = String(input);
      if (url.endsWith("/123/media")) {
        bodies.push(JSON.parse(String(init?.body)));
        createCount += 1;
        if (createCount === 1) return json({ id: "child-1" });
        if (createCount === 2) return json({ id: "child-2" });
        return json({ id: "parent-1" });
      }
      if (url.endsWith("/123/media_publish")) return json({ id: "carousel-media" });
      throw new Error(`unexpected ${url}`);
    });

    const carousel = job({
      contentType: "carousel",
      mediaItems: [
        { kind: "image", url: "https://cdn.example.com/1.jpg" },
        { kind: "image", url: "https://cdn.example.com/2.jpg" },
      ],
      options: {},
    });
    expect(adapter.supports(carousel)).toBe(true);
    expect(await adapter.publish(carousel)).toEqual({ status: "published", externalPostId: "carousel-media", providerCorrelationId: "parent-1" });
    expect(bodies).toEqual([
      { image_url: "https://cdn.example.com/1.jpg", is_carousel_item: true },
      { image_url: "https://cdn.example.com/2.jpg", is_carousel_item: true },
      { media_type: "CAROUSEL", children: "child-1,child-2", caption: "Evidence-led caption" },
    ]);
  });

  it("does not create a parent when a child container fails", async () => {
    let calls = 0;
    const adapter = new InstagramProfessionalAdapter(secrets, "v24.0", async () => {
      calls += 1;
      if (calls === 1) return json({ id: "child-1" });
      return new Response("bad", { status: 500 });
    });

    const result = await adapter.publish(job({
      contentType: "carousel",
      mediaItems: [
        { kind: "image", url: "https://cdn.example.com/1.jpg" },
        { kind: "image", url: "https://cdn.example.com/2.jpg" },
      ],
      options: {},
    }));
    expect(calls).toBe(2);
    expect(result).toMatchObject({ status: "failed", failureCode: "provider-http-500", retryable: true });
  });

  it("rejects private media before an outbound request", () => {
    const adapter = new InstagramProfessionalAdapter(secrets, "v24.0");
    expect(adapter.supports(job({ mediaItems: [{ kind: "video", url: "https://127.0.0.1/private.mp4" }] }))).toBe(false);
  });
});
