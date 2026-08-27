import { describe, expect, it } from "vitest";
import { productNotificationView, type ProductNotificationRecord } from "./product-notification-view";

const base: ProductNotificationRecord = {
  id: "notification-1",
  kind: "content-ready",
  occurredAt: "2026-08-24T12:00:00.000Z",
  brandId: "brand/a",
  context: {},
};

describe("VS-86 product notification routing", () => {
  it("opens affected Content for a publishing failure", () => {
    const view = productNotificationView({
      ...base,
      kind: "publishing-failed",
      context: { campaignId: "campaign/1", failureReason: "Provider rejected media" },
    });
    expect(view.href).toBe("/brands/brand%2Fa/content");
    expect(view.title).toBe("Publishing failed");
  });

  it("routes Instagram reconnect directly into the existing recovery flow", () => {
    const view = productNotificationView({
      ...base,
      kind: "connection-reconnect-required",
      context: { channel: "instagram", accountRef: "@kairo" },
    });
    expect(view.href).toBe("/brands/brand%2Fa/channels/instagram/connect?returnTo=%2Fbrands%2Fbrand%252Fa%2Fbrain");
  });

  it("keeps non-Instagram connection recovery in Brand instead of Insights", () => {
    const view = productNotificationView({
      ...base,
      kind: "connection-reconnect-required",
      context: { channel: "facebook" },
    });
    expect(view.href).toBe("/brands/brand%2Fa/brain");
  });

  it("routes performance signals to Insights while keeping the stable performance route", () => {
    const view = productNotificationView({ ...base, kind: "performance-spike" });
    expect(view.href).toBe("/brands/brand%2Fa/performance");
    expect(view.title).toBe("New performance insight");
  });

  it("opens Content for content awaiting approval", () => {
    const view = productNotificationView({ ...base, context: { campaignId: "campaign-2" } });
    expect(view.href).toBe("/brands/brand%2Fa/content");
  });
});
