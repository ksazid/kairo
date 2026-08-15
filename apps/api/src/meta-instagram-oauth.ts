import type { MetaInstagramOAuthPort, MetaInstagramDiscoveredAccount } from "./instagram-connection";

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const REQUIRED_SCOPES = [
  "pages_show_list",
  "instagram_basic",
  "instagram_content_publish",
  "pages_read_engagement",
  "instagram_manage_insights",
] as const;

export class MetaInstagramOAuthClient implements MetaInstagramOAuthPort {
  constructor(
    private readonly appId: string,
    private readonly appSecret: string,
    private readonly graphVersion: string,
    private readonly redirectUri: string,
    private readonly fetchImpl: FetchLike = fetch,
  ) {
    required(this.appId, "META_APP_ID");
    required(this.appSecret, "META_APP_SECRET");
    graph(this.graphVersion);
    httpsUrl(this.redirectUri, "META_OAUTH_REDIRECT_URI");
  }

  authorizationUrl(state: string): string {
    const url = new URL(`https://www.facebook.com/${graph(this.graphVersion)}/dialog/oauth`);
    url.searchParams.set("client_id", this.appId);
    url.searchParams.set("redirect_uri", this.redirectUri);
    url.searchParams.set("state", required(state, "OAuth state"));
    url.searchParams.set("scope", REQUIRED_SCOPES.join(","));
    url.searchParams.set("response_type", "code");
    return url.toString();
  }

  async exchangeAndDiscover(code: string): Promise<{ grantedScopes: string[]; userAccessToken: string; accounts: MetaInstagramDiscoveredAccount[] }> {
    const userAccessToken = await this.exchangeCode(required(code, "authorization code"));
    const grantedScopes = await this.permissions(userAccessToken);
    const pages = await this.pages(userAccessToken);
    const accounts: MetaInstagramDiscoveredAccount[] = [];
    for (const page of pages) {
      const ig = page.instagram_business_account;
      if (!ig?.id || !page.access_token) continue;
      const profile = await this.profile(String(ig.id), String(page.access_token));
      accounts.push({
        pageRef: String(page.id),
        pageName: String(page.name ?? page.id),
        accountRef: String(ig.id),
        displayName: profile.name || profile.username || String(ig.id),
        ...(profile.username ? { username: profile.username } : {}),
        pageAccessToken: String(page.access_token),
      });
    }
    return { grantedScopes, userAccessToken, accounts };
  }

  private async exchangeCode(code: string): Promise<string> {
    const body = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.redirectUri,
      code,
    });
    const response = await this.fetchImpl(`https://graph.facebook.com/${graph(this.graphVersion)}/oauth/access_token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
    if (!response.ok) throw providerError("oauth-exchange", response.status);
    const payload = await json(response) as { access_token?: unknown };
    const token = typeof payload?.access_token === "string" ? payload.access_token.trim() : "";
    if (!token) throw new Error("Meta OAuth exchange returned no access token");
    return token;
  }

  private async permissions(userToken: string): Promise<string[]> {
    const response = await this.fetchImpl(`https://graph.facebook.com/${graph(this.graphVersion)}/me/permissions`, {
      headers: { authorization: `Bearer ${userToken}` },
    });
    if (!response.ok) throw providerError("permissions", response.status);
    const payload = await json(response) as { data?: Array<{ permission?: unknown; status?: unknown }> };
    return [...new Set((payload.data ?? [])
      .filter((item) => item.status === "granted" && typeof item.permission === "string")
      .map((item) => String(item.permission)))]
      .sort();
  }

  private async pages(userToken: string): Promise<Array<{ id: unknown; name?: unknown; access_token?: unknown; instagram_business_account?: { id?: unknown } }>> {
    const url = new URL(`https://graph.facebook.com/${graph(this.graphVersion)}/me/accounts`);
    url.searchParams.set("fields", "id,name,access_token,tasks,instagram_business_account");
    url.searchParams.set("limit", "100");
    const response = await this.fetchImpl(url, { headers: { authorization: `Bearer ${userToken}` } });
    if (!response.ok) throw providerError("page-discovery", response.status);
    const payload = await json(response) as { data?: unknown };
    if (!Array.isArray(payload.data)) return [];
    return payload.data.filter((value): value is { id: unknown; name?: unknown; access_token?: unknown; instagram_business_account?: { id?: unknown } } => !!value && typeof value === "object" && "id" in value);
  }

  private async profile(accountRef: string, pageToken: string): Promise<{ username?: string; name?: string }> {
    const url = new URL(`https://graph.facebook.com/${graph(this.graphVersion)}/${encodeURIComponent(accountRef)}`);
    url.searchParams.set("fields", "id,username,name");
    const response = await this.fetchImpl(url, { headers: { authorization: `Bearer ${pageToken}` } });
    if (!response.ok) throw providerError("instagram-profile", response.status);
    const payload = await json(response) as { username?: unknown; name?: unknown };
    return {
      ...(typeof payload.username === "string" && payload.username.trim() ? { username: payload.username.trim() } : {}),
      ...(typeof payload.name === "string" && payload.name.trim() ? { name: payload.name.trim() } : {}),
    };
  }
}

export function metaInstagramRequestedScopes(): readonly string[] { return REQUIRED_SCOPES; }

function providerError(operation: string, status: number): Error { return new Error(`Meta provider ${operation} failed with HTTP ${status}`); }
async function json(response: Response): Promise<unknown> { try { return await response.json(); } catch { throw new Error("Meta provider returned invalid JSON"); } }
function graph(value: string) { if (!/^v\d+\.\d+$/.test(value)) throw new Error("META_GRAPH_VERSION is invalid"); return value; }
function required(value: string, field: string) { const normalized = value.trim(); if (!normalized) throw new Error(`${field} is required`); return normalized; }
function httpsUrl(value: string, field: string) { let url: URL; try { url = new URL(value); } catch { throw new Error(`${field} must be a valid URL`); } if (url.protocol !== "https:") throw new Error(`${field} must use HTTPS`); return url.toString(); }
