import { describe, expect, it } from "vitest";
import {
  AgentContractError,
  prepareAgentInvocation,
  prepareModelPolicy,
  prepareToolRequest,
} from "./index";

describe("VS-03 agent and tool boundaries", () => {
  it("allows a bounded global-public Hunter invocation", () => {
    const request = prepareAgentInvocation({
      role: "hunter",
      scope: { visibility: "global-public" },
      approvedContextVersion: "global-public@1",
      capabilities: ["public-content-search", "public-content-search"],
      outputSchema: { name: "hunter-candidates", version: "1" },
      budget: { maxOutputTokens: 1500, maxToolCalls: 4, maxCostUsd: 0.05, timeoutMs: 30_000 },
    });

    expect(request.capabilities).toEqual(["public-content-search"]);
    expect(request.scope).toEqual({ visibility: "global-public" });
  });

  it.each(["shell.exec", "secrets.read", "database.write", "social.publish"])(
    "rejects prohibited capability %s before a runtime can see it",
    (capability) => {
      expect(() => prepareAgentInvocation({
        role: "hunter",
        scope: { visibility: "global-public" },
        approvedContextVersion: "global-public@1",
        capabilities: [capability],
        outputSchema: { name: "hunter-candidates", version: "1" },
        budget: { maxOutputTokens: 1000, maxToolCalls: 1, maxCostUsd: 0.02, timeoutMs: 10_000 },
      })).toThrow(AgentContractError);
    },
  );

  it("requires complete tenant scope for Brand-private invocation", () => {
    expect(() => prepareAgentInvocation({
      role: "hunter",
      scope: { visibility: "brand-private", workspaceId: "", brandId: "brand-1" },
      approvedContextVersion: "brand-1@2",
      capabilities: ["public-content-search"],
      outputSchema: { name: "brand-relevance", version: "1" },
      budget: { maxOutputTokens: 1000, maxToolCalls: 2, maxCostUsd: 0.03, timeoutMs: 15_000 },
    })).toThrow(AgentContractError);
  });

  it("keeps provider secrets outside ModelGateway policy", () => {
    const policy = prepareModelPolicy({
      qualityTier: "balanced",
      privacyClass: "brand-private",
      maxCostUsd: 0.04,
      maxOutputTokens: 1200,
      allowedProviders: ["openai", "openrouter", "openai"],
    });

    expect(policy.allowedProviders).toEqual(["openai", "openrouter"]);
    expect("apiKey" in policy).toBe(false);
    expect("token" in policy).toBe(false);
  });

  it("binds tool calls to the same explicit scope and blocks unknown capabilities", () => {
    const request = prepareToolRequest({
      capability: "public-content-search",
      scope: { visibility: "brand-private", workspaceId: "workspace-1", brandId: "brand-1" },
      input: { query: "AI agents" },
      timeoutMs: 8_000,
    });
    expect(request.scope).toEqual({ visibility: "brand-private", workspaceId: "workspace-1", brandId: "brand-1" });

    expect(() => prepareToolRequest({
      capability: "arbitrary-network",
      scope: { visibility: "global-public" },
      input: { url: "https://example.com" },
      timeoutMs: 8_000,
    })).toThrow(AgentContractError);
  });
});
