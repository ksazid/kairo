import type { AgentInvocationMetadata, AgentRuntimePort } from "@kairo/agent-contracts";
import { createMarketingSkillRegistry, type MarketingSkillManifest } from "@kairo/domain/skill-registry";
import benchmarkData from "../../../evaluation/marketing-lab/benchmark-cases.json";
import challengerData from "../../../evaluation/marketing-lab/corey-social-shadow.json";
import {
  executeKairoNativeCarouselBaseline,
  toMotorcycleCarouselQualificationCase,
  type MotorcycleCarouselFixture,
} from "./marketing-shadow-qualification";
import {
  MarketingShadowExecutionService,
  verifyPinnedSkillSnapshot,
  type MarketingSkillSnapshot,
} from "./marketing-shadow";

const CASE_IDS = new Set([
  "motorcycle-carousel-01",
  "motorcycle-carousel-02",
  "motorcycle-carousel-03",
  "motorcycle-carousel-04",
]);

const COREY_SOURCE_URL =
  "https://raw.githubusercontent.com/coreyhaines31/marketingskills/7868cb9251fad80a73d26e488a5ad5f6c4a9f335/skills/social/SKILL.md";

export const MARKETING_EVIDENCE_INTER_LANE_DELAY_MS = 65_000;
export const MARKETING_EVIDENCE_HERMES_READY_MAX_ATTEMPTS = 6;
export const MARKETING_EVIDENCE_HERMES_READY_REQUEST_TIMEOUT_MS = 20_000;
export const MARKETING_EVIDENCE_HERMES_READY_POLL_DELAY_MS = 2_000;
export type MarketingEvidencePause = (ms: number) => Promise<void>;

export interface MarketingShadowLaneEvidence {
  output: unknown;
  metadata: Pick<
    AgentInvocationMetadata,
    | "runtime"
    | "runtimeVersion"
    | "provider"
    | "model"
    | "modelVersion"
    | "inputTokens"
    | "outputTokens"
    | "costUsd"
    | "pricingVersion"
    | "latencyMs"
  >;
}

export interface MarketingShadowRuntimeRoute {
  runtime: "hermes";
  runtimeVersion: string;
  provider: string;
  model: string;
  modelVersion?: string;
  pricingVersion: string;
}

export interface MarketingShadowPairEvidence {
  caseId: string;
  inputFingerprint: string;
  native: MarketingShadowLaneEvidence;
  corey: MarketingShadowLaneEvidence;
}

export interface MarketingShadowEvidenceRun {
  schemaVersion: 1;
  evidenceKind: "vs23-shadow-qualification-paired-execution";
  datasetId: "marketing-lab-cross-sector-synthetic-fixtures";
  challengerSource: {
    repository: string;
    commitSha: string;
    path: string;
    blobSha: string;
  };
  runtimeRoute: MarketingShadowRuntimeRoute;
  pairs: MarketingShadowPairEvidence[];
}

export async function runMarketingShadowPairedEvidence(
  runtime: AgentRuntimePort,
  fetchImpl: typeof fetch = fetch,
  pause: MarketingEvidencePause = defaultMarketingEvidencePause,
): Promise<MarketingShadowEvidenceRun> {
  const manifest = challengerData.manifest as unknown as MarketingSkillManifest;
  const source = manifest.source;
  if (source.kind !== "github") throw new Error("Corey shadow challenger must use pinned GitHub source");

  const response = await fetchImpl(COREY_SOURCE_URL, {
    method: "GET",
    headers: { accept: "text/plain" },
  });
  if (!response.ok) throw new Error(`Pinned Corey skill snapshot fetch failed with ${response.status}`);

  const candidateSnapshot: MarketingSkillSnapshot = {
    repository: source.repository,
    commitSha: source.commitSha,
    path: source.path,
    blobSha: source.contentHash,
    content: await response.text(),
  };
  const snapshot = verifyPinnedSkillSnapshot(manifest, candidateSnapshot);

  await waitForMarketingEvidenceHermesReady(process.env.KAIRO_HERMES_ENDPOINT, fetch, pause);

  const registry = createMarketingSkillRegistry([manifest]);
  const shadow = new MarketingShadowExecutionService(runtime, registry, {
    allowedDatasetIds: ["marketing-lab-cross-sector-synthetic-fixtures"],
    maxCostUsd: 0.03,
    timeoutMs: 30_000,
    maxOutputTokens: 2_200,
  });

  const fixtures = benchmarkData.cases
    .filter((candidate) => CASE_IDS.has(candidate.id))
    .map((candidate) => candidate as MotorcycleCarouselFixture)
    .sort((a, b) => a.id.localeCompare(b.id));
  if (fixtures.length !== 4) throw new Error("Exactly four approved motorcycle carousel fixtures are required");

  const pacedInvoke = createMarketingEvidenceLanePacer(pause);
  const pairs: MarketingShadowPairEvidence[] = [];
  let expectedRoute: MarketingShadowRuntimeRoute | undefined;
  for (const fixture of fixtures) {
    const benchmarkCase = toMotorcycleCarouselQualificationCase(fixture);
    const native = await pacedInvoke(() => executeKairoNativeCarouselBaseline(runtime, benchmarkCase));
    const corey = await pacedInvoke(() => shadow.execute({
      challenger: { id: manifest.id, version: manifest.version },
      snapshot,
      benchmarkCase,
    }));
    if (native.inputFingerprint !== corey.inputFingerprint) {
      throw new Error(`Paired input fingerprint mismatch for ${fixture.id}`);
    }
    requireMeasuredMetadata(native.metadata, `${fixture.id}:native`);
    requireMeasuredMetadata(corey.metadata, `${fixture.id}:corey`);

    const nativeRoute = marketingEvidenceRuntimeRoute(native.metadata, `${fixture.id}:native`);
    const coreyRoute = marketingEvidenceRuntimeRoute(corey.metadata, `${fixture.id}:corey`);
    if (runtimeRouteKey(nativeRoute) !== runtimeRouteKey(coreyRoute)) {
      throw new Error(`Paired Hermes provider/model route mismatch for ${fixture.id}`);
    }
    if (!expectedRoute) expectedRoute = nativeRoute;
    else if (runtimeRouteKey(expectedRoute) !== runtimeRouteKey(nativeRoute)) {
      throw new Error(`Hermes provider/model route changed during the qualification run at ${fixture.id}`);
    }

    pairs.push({
      caseId: fixture.id,
      inputFingerprint: native.inputFingerprint,
      native: { output: native.output, metadata: safeMetadata(native.metadata) },
      corey: { output: corey.output, metadata: safeMetadata(corey.metadata) },
    });
  }

  if (!expectedRoute) throw new Error("Qualification evidence requires an explicit Hermes runtime route");
  return {
    schemaVersion: 1,
    evidenceKind: "vs23-shadow-qualification-paired-execution",
    datasetId: "marketing-lab-cross-sector-synthetic-fixtures",
    challengerSource: {
      repository: source.repository,
      commitSha: source.commitSha,
      path: source.path,
      blobSha: source.contentHash,
    },
    runtimeRoute: expectedRoute,
    pairs,
  };
}

export async function waitForMarketingEvidenceHermesReady(
  endpoint: string | null | undefined = process.env.KAIRO_HERMES_ENDPOINT,
  fetchImpl: typeof fetch = fetch,
  pause: MarketingEvidencePause = defaultMarketingEvidencePause,
): Promise<void> {
  const normalizedEndpoint = endpoint?.trim();
  if (!normalizedEndpoint) return;
  if (!/^https?:\/\//.test(normalizedEndpoint)) {
    throw new Error("Hermes readiness endpoint must be HTTP(S)");
  }

  let lastStatus: number | undefined;
  for (let attempt = 1; attempt <= MARKETING_EVIDENCE_HERMES_READY_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      MARKETING_EVIDENCE_HERMES_READY_REQUEST_TIMEOUT_MS,
    );
    try {
      const response = await fetchImpl(`${normalizedEndpoint.replace(/\/$/, "")}/health/ready`, {
        method: "GET",
        headers: { accept: "application/json" },
        signal: controller.signal,
      });
      lastStatus = response.status;
      if (response.ok) return;
    } catch {
      lastStatus = undefined;
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < MARKETING_EVIDENCE_HERMES_READY_MAX_ATTEMPTS) {
      await pause(MARKETING_EVIDENCE_HERMES_READY_POLL_DELAY_MS);
    }
  }

  throw new Error(
    lastStatus === undefined
      ? "Hermes readiness preflight failed before qualification lanes"
      : `Hermes readiness preflight failed with ${lastStatus} before qualification lanes`,
  );
}

export function createMarketingEvidenceLanePacer(
  pause: MarketingEvidencePause = defaultMarketingEvidencePause,
): <T>(invoke: () => Promise<T>) => Promise<T> {
  let invocationCount = 0;
  return async <T>(invoke: () => Promise<T>): Promise<T> => {
    if (invocationCount > 0) await pause(MARKETING_EVIDENCE_INTER_LANE_DELAY_MS);
    invocationCount += 1;
    return invoke();
  };
}

function defaultMarketingEvidencePause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requireMeasuredMetadata(metadata: AgentInvocationMetadata, lane: string): void {
  if (!Number.isFinite(metadata.latencyMs) || metadata.latencyMs < 0) {
    throw new Error(`Measured latency metadata is required for ${lane}`);
  }
  if (metadata.costUsd === undefined || !Number.isFinite(metadata.costUsd) || metadata.costUsd < 0) {
    throw new Error(`Measured cost metadata is required for ${lane}`);
  }
}

export function marketingEvidenceRuntimeRoute(
  metadata: AgentInvocationMetadata,
  lane: string,
): MarketingShadowRuntimeRoute {
  if (metadata.runtime !== "hermes") throw new Error(`Hermes runtime evidence is required for ${lane}`);
  const runtimeVersion = requiredMetadataText(metadata.runtimeVersion, "runtimeVersion", lane);
  const provider = requiredMetadataText(metadata.provider, "provider", lane);
  const model = requiredMetadataText(metadata.model, "model", lane);
  const pricingVersion = requiredMetadataText(metadata.pricingVersion, "pricingVersion", lane);
  return {
    runtime: "hermes",
    runtimeVersion,
    provider,
    model,
    ...(metadata.modelVersion ? { modelVersion: metadata.modelVersion } : {}),
    pricingVersion,
  };
}

function runtimeRouteKey(route: MarketingShadowRuntimeRoute): string {
  return JSON.stringify(route);
}

function requiredMetadataText(value: unknown, field: string, lane: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} metadata is required for ${lane}`);
  return value.trim();
}

function safeMetadata(metadata: AgentInvocationMetadata): MarketingShadowLaneEvidence["metadata"] {
  return {
    runtime: metadata.runtime,
    ...(metadata.runtimeVersion ? { runtimeVersion: metadata.runtimeVersion } : {}),
    ...(metadata.provider ? { provider: metadata.provider } : {}),
    ...(metadata.model ? { model: metadata.model } : {}),
    ...(metadata.modelVersion ? { modelVersion: metadata.modelVersion } : {}),
    ...(metadata.inputTokens !== undefined ? { inputTokens: metadata.inputTokens } : {}),
    ...(metadata.outputTokens !== undefined ? { outputTokens: metadata.outputTokens } : {}),
    ...(metadata.costUsd !== undefined ? { costUsd: metadata.costUsd } : {}),
    ...(metadata.pricingVersion ? { pricingVersion: metadata.pricingVersion } : {}),
    latencyMs: metadata.latencyMs,
  };
}
