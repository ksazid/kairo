import type { MetricTransformation } from "@kairo/domain/analytics";
import type { PublishingSecretResolver } from "./publishing-adapters";
import type { MetricCollectionJob, MetricCollectionResult, MetricCollector } from "./performance";

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

const METRICS = ["impressions", "reach", "likes", "comments", "shares", "saved", "views"] as const;

export const instagramMetricTransformation: MetricTransformation = {
  version: "instagram-media-v1",
  supported: {
    impressions: "impressions",
    reach: "reach",
    likes: "likes",
    comments: "comments",
    shares: "shares",
    saves: "saved",
    videoViews: "views",
  },
};

export class InstagramMetricCollector implements MetricCollector {
  readonly provider = "instagram" as const;
  constructor(private readonly secrets: PublishingSecretResolver, private readonly graphVersion: string, private readonly fetchImpl: FetchLike = fetch) {}
  supports(job: MetricCollectionJob) { return job.provider === "instagram" && /^\d+$/.test(job.accountRef) && !!job.externalPostId && !!job.credentialRef; }

  async collect(job: MetricCollectionJob): Promise<MetricCollectionResult> {
    if (!this.supports(job)) return { status: "unavailable", reason: "unsupported" };
    let token: string;
    try { token = (await this.secrets.resolve(job.credentialRef)).trim(); } catch { return { status: "unavailable", reason: "permission-required" }; }
    if (!token) return { status: "unavailable", reason: "permission-required" };
    const version = requiredGraph(this.graphVersion);
    const raw: Record<string, unknown> = {};
    let requestId: string | undefined;
    let successfulRequests = 0;
    for (const metric of METRICS) {
      let response: Response;
      try {
        const url = new URL(`https://graph.facebook.com/${version}/${encodeURIComponent(job.externalPostId)}/insights`);
        url.searchParams.set("metric", metric);
        response = await this.fetchImpl(url, { headers: { authorization: `Bearer ${token}` } });
      } catch {
        return { status: "retry", failureCode: "provider-network", retryAfterSeconds: 60 };
      }
      requestId ??= response.headers.get("x-fb-request-id") ?? undefined;
      if (response.status === 401 || response.status === 403) return { status: "unavailable", reason: "permission-required" };
      if (response.status === 404) return { status: "unavailable", reason: "post-not-eligible" };
      if (response.status === 429 || response.status >= 500) return { status: "retry", failureCode: `provider-${response.status}`, retryAfterSeconds: retryAfter(response) };
      const body = await safeJson(response);
      if (!response.ok) {
        if (response.status === 400 && isUnsupportedMetric(body)) continue;
        return { status: "failed", failureCode: `provider-${response.status}` };
      }
      const value = metricValue(body, metric);
      if (value !== undefined) raw[metric] = value;
      successfulRequests++;
    }
    if (!successfulRequests) return { status: "unavailable", reason: "post-not-eligible" };
    return { status: "collected", raw, ...(requestId ? { providerRequestId: requestId } : {}) };
  }
}

function metricValue(body: unknown, metric: string): number | undefined {
  if (!body || typeof body !== "object") return undefined;
  const data = (body as { data?: unknown }).data;
  if (!Array.isArray(data)) return undefined;
  const item = data.find((entry) => entry && typeof entry === "object" && (entry as { name?: unknown }).name === metric) as { values?: unknown; total_value?: unknown } | undefined;
  if (!item) return undefined;
  const total = scalar(item.total_value);
  if (total !== undefined) return total;
  if (!Array.isArray(item.values) || !item.values.length) return undefined;
  const last = item.values[item.values.length - 1];
  if (!last || typeof last !== "object") return undefined;
  return scalar((last as { value?: unknown }).value);
}
function scalar(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (value && typeof value === "object") {
    const candidate = (value as { value?: unknown }).value;
    if (typeof candidate === "number" && Number.isFinite(candidate) && candidate >= 0) return candidate;
  }
  return undefined;
}
function isUnsupportedMetric(body: unknown) {
  if (!body || typeof body !== "object") return false;
  const error = (body as { error?: unknown }).error;
  if (!error || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  const message = String((error as { message?: unknown }).message ?? "").toLowerCase();
  return code === 100 && (message.includes("metric") || message.includes("insight"));
}
async function safeJson(response: Response): Promise<unknown> { try { return await response.json(); } catch { return null; } }
function retryAfter(response: Response) { const raw = Number(response.headers.get("retry-after")); return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : 60; }
function requiredGraph(value: string) { if (!/^v\d+\.\d+$/.test(value)) throw new Error("Instagram Graph version is invalid"); return value; }
