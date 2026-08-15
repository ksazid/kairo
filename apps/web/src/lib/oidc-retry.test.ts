import { describe, expect, it, vi } from "vitest";
import { createRetryableAsyncCache } from "./oidc";

describe("retry-safe OIDC discovery cache", () => {
  it("caches a successful discovery result", async () => {
    const loader = vi.fn(async () => ({ issuer: "https://issuer.example/" }));
    const cache = createRetryableAsyncCache(loader);

    const first = await cache.get();
    const second = await cache.get();

    expect(first).toBe(second);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("shares one in-flight discovery across concurrent callers", async () => {
    let release!: (value: { issuer: string }) => void;
    const loader = vi.fn(() => new Promise<{ issuer: string }>((resolve) => { release = resolve; }));
    const cache = createRetryableAsyncCache(loader);

    const first = cache.get();
    const second = cache.get();
    expect(loader).toHaveBeenCalledTimes(1);

    release({ issuer: "https://issuer.example/" });
    await expect(first).resolves.toEqual({ issuer: "https://issuer.example/" });
    await expect(second).resolves.toEqual({ issuer: "https://issuer.example/" });
  });

  it("evicts a rejected discovery so a later login can recover", async () => {
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error("temporary discovery failure"))
      .mockResolvedValueOnce({ issuer: "https://issuer.example/" });
    const cache = createRetryableAsyncCache(loader);

    await expect(cache.get()).rejects.toThrow("temporary discovery failure");
    await expect(cache.get()).resolves.toEqual({ issuer: "https://issuer.example/" });
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("does not let an older rejection evict a newer successful request", async () => {
    let rejectFirst!: (error: Error) => void;
    const loader = vi.fn()
      .mockImplementationOnce(() => new Promise((_, reject) => { rejectFirst = reject; }))
      .mockResolvedValueOnce({ issuer: "https://issuer.example/" });
    const cache = createRetryableAsyncCache(loader);

    const first = cache.get();
    rejectFirst(new Error("temporary discovery failure"));
    await expect(first).rejects.toThrow("temporary discovery failure");

    const recovered = await cache.get();
    expect(recovered).toEqual({ issuer: "https://issuer.example/" });
    expect(await cache.get()).toBe(recovered);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
