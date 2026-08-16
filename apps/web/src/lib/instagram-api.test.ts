import { describe, expect, it } from "vitest";
import { instagramApiHeaders } from "./instagram-api";

describe("Instagram API request headers", () => {
  it("does not declare JSON for a bodyless POST", () => {
    const headers = new Headers(instagramApiHeaders("access-token", { method: "POST" }));

    expect(headers.get("authorization")).toBe("Bearer access-token");
    expect(headers.has("content-type")).toBe(false);
  });

  it("declares JSON when the request has a JSON body", () => {
    const headers = new Headers(instagramApiHeaders("access-token", {
      method: "POST",
      body: JSON.stringify({ code: "code", state: "state" }),
    }));

    expect(headers.get("authorization")).toBe("Bearer access-token");
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("preserves an explicit caller content type", () => {
    const headers = new Headers(instagramApiHeaders("access-token", {
      method: "POST",
      body: "payload",
      headers: { "content-type": "text/plain" },
    }));

    expect(headers.get("content-type")).toBe("text/plain");
  });
});
