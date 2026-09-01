import { describe, expect, it } from "vitest";
import { canPublish, legacyChannelHref, presenterDraft, settingsFallback } from "./settings-data";

describe("Settings production projection", () => {
  it("uses a truthful signed-out fallback", () => {
    expect(settingsFallback()).toEqual({
      authenticated: false,
      account: { displayName: "Guest" },
      workspace: null,
      brand: null,
      channels: [],
      presenter: null,
    });
  });

  it("requires both a connected account and publishing capability", () => {
    const channel = { id: "ig", channel: "instagram" as const, displayName: "Kairo", accountRef: "ig-1", status: "connected" as const, capabilities: ["content-publishing"] };
    expect(canPublish(channel)).toBe(true);
    expect(canPublish({ ...channel, status: "reconnect-required" })).toBe(false);
    expect(canPublish({ ...channel, capabilities: [] })).toBe(false);
  });

  it("builds scoped legacy routes and presenter drafts", () => {
    expect(legacyChannelHref("https://app.example/", "brand / 1")).toBe("https://app.example/brands/brand%20%2F%201/channels");
    expect(presenterDraft({ brandName: " Kairo ", look: "Professional", background: "Studio", voiceEnabled: true, expectedVersion: 3 })).toEqual({
      displayName: "Kairo Creator",
      status: "draft",
      mode: "talking-avatar",
      visualStyle: "Professional",
      background: "Studio",
      voiceStyle: "Voice requested; enrollment not configured",
      expectedVersion: 3,
    });
  });
});
