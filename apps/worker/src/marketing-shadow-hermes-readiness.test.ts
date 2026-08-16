import { describe, expect, it } from "vitest";
import {
  MARKETING_EVIDENCE_HERMES_READY_MAX_ATTEMPTS,
  MARKETING_EVIDENCE_HERMES_READY_POLL_DELAY_MS,
  waitForMarketingEvidenceHermesReady,
} from "./marketing-shadow-evidence-runner";

describe("VS-23 Hermes readiness preflight", () => {
  it("retries transient cold-start responses before any qualification lane can start", async () => {
    const statuses = [502, 503, 200];
    const requests: string[] = [];
    const pauses: number[] = [];
    const fakeFetch: typeof fetch = async (input, init) => {
      requests.push(String(input));
      expect(init?.method).toBe("GET");
      expect(new Headers(init?.headers).get("authorization")).toBeNull();
      return new Response("", { status: statuses.shift() ?? 200 });
    };

    await waitForMarketingEvidenceHermesReady(
      "https://hermes.example.test/",
      fakeFetch,
      async (ms) => { pauses.push(ms); },
    );

    expect(requests).toEqual(Array(3).fill("https://hermes.example.test/health/ready"));
    expect(pauses).toEqual(Array(2).fill(MARKETING_EVIDENCE_HERMES_READY_POLL_DELAY_MS));
  });

  it("fails closed after the bounded readiness window without invoking a model endpoint", async () => {
    const requests: string[] = [];
    const pauses: number[] = [];
    const fakeFetch: typeof fetch = async (input) => {
      requests.push(String(input));
      return new Response("", { status: 502 });
    };

    await expect(waitForMarketingEvidenceHermesReady(
      "https://hermes.example.test",
      fakeFetch,
      async (ms) => { pauses.push(ms); },
    )).rejects.toThrow(/readiness preflight failed with 502/i);

    expect(requests).toHaveLength(MARKETING_EVIDENCE_HERMES_READY_MAX_ATTEMPTS);
    expect(requests.every((request) => request.endsWith("/health/ready"))).toBe(true);
    expect(pauses).toHaveLength(MARKETING_EVIDENCE_HERMES_READY_MAX_ATTEMPTS - 1);
  });

  it("is a no-op when Hermes is explicitly unconfigured", async () => {
    let called = false;
    const fakeFetch: typeof fetch = async () => {
      called = true;
      return new Response("", { status: 200 });
    };

    await waitForMarketingEvidenceHermesReady(null, fakeFetch);
    expect(called).toBe(false);
  });
});
