import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { ChannelAccount } from "@kairo/domain/publishing";
import {
  InstagramConnectionService,
  type InstagramConnectionCandidate,
  type InstagramConnectionRepository,
  type InstagramCredentialVault,
  type MetaInstagramOAuthPort,
} from "./instagram-connection";

class Repo implements InstagramConnectionRepository {
  intents: Array<any> = [];
  candidates: InstagramConnectionCandidate[] = [];
  disabled: string[] = [];
  async createIntent(value: any) { this.intents.push(value); }
  async consumeIntent(accountId: string, stateHash: string) {
    const intent = this.intents.find((x) => x.accountId === accountId && x.stateHash === stateHash && !x.consumedAt);
    if (!intent) return null;
    intent.consumedAt = "now";
    return intent;
  }
  async saveCandidates(values: InstagramConnectionCandidate[]) { this.candidates.push(...values); }
  async listCandidates(accountId: string, brandId: string, intentId: string) {
    return this.candidates.filter((x) => x.accountId === accountId && x.brandId === brandId && x.intentId === intentId);
  }
  async markSelected(accountId: string, brandId: string, candidateId: string) {
    const item = this.candidates.find((x) => x.accountId === accountId && x.brandId === brandId && x.id === candidateId);
    if (!item) return null;
    item.selectedAt = "now";
    return item;
  }
  async disableConnection(_accountId: string, _brandId: string, channelAccountId: string) { this.disabled.push(channelAccountId); }
}

class Vault implements InstagramCredentialVault {
  values = new Map<string, string>();
  revoked: string[] = [];
  async store(_workspaceId: string, _brandId: string, ref: string, token: string) { this.values.set(ref, token); }
  async resolve(ref: string) { const value = this.values.get(ref); if (!value) throw new Error("unavailable"); return value; }
  async revoke(ref: string) { this.values.delete(ref); this.revoked.push(ref); }
}

class Meta implements MetaInstagramOAuthPort {
  authorizationUrl(state: string) { return `https://www.facebook.com/v99.0/dialog/oauth?state=${encodeURIComponent(state)}`; }
  async exchangeAndDiscover(code: string) {
    expect(code).toBe("meta-code");
    return {
      grantedScopes: ["instagram_basic", "instagram_content_publish", "instagram_manage_insights", "pages_read_engagement", "pages_show_list"],
      accounts: [
        { pageRef: "page-1", pageName: "Page One", accountRef: "111", displayName: "One", username: "one", pageAccessToken: "secret-page-token-1" },
        { pageRef: "page-2", pageName: "Page Two", accountRef: "222", displayName: "Two", username: "two", pageAccessToken: "secret-page-token-2" },
      ],
    };
  }
}

function service(repo = new Repo(), vault = new Vault()) {
  const saved: ChannelAccount[] = [];
  const instance = new InstagramConnectionService({
    brands: { async getBrandForAccount(accountId, brandId) { return accountId === "alice" && brandId === "brand-1" ? { id: brandId, workspaceId: "ws-1" } : null; } },
    publishing: { async saveChannelAccount(_accountId, channel) { saved.push(channel); return channel; } },
    repo,
    vault,
    meta: new Meta(),
    now: () => new Date("2026-08-15T05:00:00Z"),
    stateBytes: () => Buffer.from("0123456789abcdef0123456789abcdef"),
    id: (() => { let n = 0; return () => `id-${++n}`; })(),
  });
  return { instance, repo, vault, saved };
}

describe("VS-17 Instagram connection", () => {
  it("stores only a hash of OAuth state and binds it to account + Brand", async () => {
    const { instance, repo } = service();
    const started = await instance.begin("alice", "brand-1");
    const rawState = new URL(started.authorizationUrl).searchParams.get("state")!;
    expect(rawState).toBeTruthy();
    expect(repo.intents[0].stateHash).not.toBe(rawState);
    expect(repo.intents[0]).toMatchObject({ accountId: "alice", brandId: "brand-1", workspaceId: "ws-1" });
    expect(repo.intents[0].stateHash).toBe(createHash("sha256").update(rawState).digest("hex"));
  });

  it("consumes OAuth state once and requires explicit selection when Meta returns multiple accounts", async () => {
    const { instance, repo, saved } = service();
    const started = await instance.begin("alice", "brand-1");
    const state = new URL(started.authorizationUrl).searchParams.get("state")!;
    const completed = await instance.complete("alice", "meta-code", state);
    expect(completed.status).toBe("selection-required");
    if (completed.status !== "selection-required") throw new Error("expected selection");
    expect(completed.candidates).toHaveLength(2);
    expect(saved).toHaveLength(0);
    await expect(instance.complete("alice", "meta-code", state)).rejects.toThrow(/expired|invalid|used/i);
    expect(JSON.stringify(repo.candidates)).not.toContain("secret-page-token");
  });

  it("selects one candidate, creates the existing ChannelAccount seam and revokes unselected credentials", async () => {
    const { instance, vault, saved } = service();
    const started = await instance.begin("alice", "brand-1");
    const state = new URL(started.authorizationUrl).searchParams.get("state")!;
    const completed = await instance.complete("alice", "meta-code", state);
    if (completed.status !== "selection-required") throw new Error("expected selection");
    const selected = await instance.select("alice", "brand-1", completed.intentId, completed.candidates[0]!.id);
    expect(selected).toMatchObject({ channel: "instagram", accountRef: "111", status: "connected" });
    expect(selected.capabilities).toEqual(expect.arrayContaining(["publish-image", "publish-carousel", "publish-reel"]));
    expect(saved).toHaveLength(1);
    expect(vault.revoked).toHaveLength(1);
    expect(selected.credentialRef).not.toContain("secret-page-token");
  });
});
