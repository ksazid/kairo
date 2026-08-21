import type { DiscoveryEvidence, DiscoveryRequest, DiscoverySourceProvider } from "@kairo/agent-contracts";
import { ResearchEvidenceAdapterError } from "./research-evidence-adapters";

type SleepLike = (ms: number) => Promise<void>;

export interface RetryingDiscoverySourceProviderOptions {
  maxAttempts?: number;
  maxRetryDelayMs?: number;
  sleep?: SleepLike;
}

export class RetryingDiscoverySourceProvider implements DiscoverySourceProvider {
  private readonly maxAttempts: number;
  private readonly maxRetryDelayMs: number;
  private readonly sleep: SleepLike;

  constructor(
    private readonly inner: DiscoverySourceProvider,
    options: RetryingDiscoverySourceProviderOptions = {},
  ) {
    this.maxAttempts = boundedInteger(options.maxAttempts ?? 3, "maxAttempts", 1, 5);
    this.maxRetryDelayMs = boundedInteger(options.maxRetryDelayMs ?? 2_000, "maxRetryDelayMs", 0, 30_000);
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  async discover(request: DiscoveryRequest): Promise<DiscoveryEvidence[]> {
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        return await this.inner.discover(request);
      } catch (error) {
        if (!isRetryable(error) || attempt >= this.maxAttempts) throw error;
        await this.sleep(Math.min(this.maxRetryDelayMs, 250 * (2 ** (attempt - 1))));
      }
    }
    return [];
  }
}

function isRetryable(error: unknown): boolean {
  return error instanceof ResearchEvidenceAdapterError && (error.kind === "rate-limited" || error.kind === "upstream");
}

function boundedInteger(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${field} must be an integer from ${min} to ${max}`);
  }
  return value;
}
