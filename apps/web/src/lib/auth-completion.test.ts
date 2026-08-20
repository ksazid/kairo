import { describe, expect, it, vi } from "vitest";
import {
  AUTH_COOKIE_REJECTED_MESSAGE,
  AUTH_SERVICE_UNAVAILABLE_MESSAGE,
  AUTH_SESSION_REJECTED_MESSAGE,
  verifyAuthCompletion,
} from "./auth-completion";

describe("post-callback authentication completion", () => {
  it("stops before API access when the browser did not retain the access-token cookie", async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(verifyAuthCompletion(null, "https://api.example", fetcher)).resolves.toEqual({
      ok: false,
      message: AUTH_COOKIE_REJECTED_MESSAGE,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("accepts the browser session only after the API confirms the access token", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 200 }));
    await expect(verifyAuthCompletion("token-value", "https://api.example/", fetcher)).resolves.toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledWith("https://api.example/api/v1/session", expect.objectContaining({
      method: "GET",
      cache: "no-store",
      headers: expect.objectContaining({ authorization: "Bearer token-value" }),
    }));
  });

  it("fails closed instead of redirecting back into login when the API rejects the token", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("{}", { status: 401 }));
    await expect(verifyAuthCompletion("rejected-token", "https://api.example", fetcher)).resolves.toEqual({
      ok: false,
      message: AUTH_SESSION_REJECTED_MESSAGE,
    });
  });

  it("returns a recoverable failure when API configuration or transport is unavailable", async () => {
    const fetcher = vi.fn<typeof fetch>();
    await expect(verifyAuthCompletion("token-value", undefined, fetcher)).resolves.toEqual({
      ok: false,
      message: AUTH_SERVICE_UNAVAILABLE_MESSAGE,
    });
    expect(fetcher).not.toHaveBeenCalled();

    fetcher.mockRejectedValueOnce(new Error("network unavailable"));
    await expect(verifyAuthCompletion("token-value", "https://api.example", fetcher)).resolves.toEqual({
      ok: false,
      message: AUTH_SERVICE_UNAVAILABLE_MESSAGE,
    });
  });
});
