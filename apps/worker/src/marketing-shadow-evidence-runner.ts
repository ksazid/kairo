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
  pairs: MarketingShadowPairEvidence[];
}

export async function runMarketingShadowPairedEvidence(
  runtime: AgentRuntimePort,
  fetchImpl: typeof fetch = fetch,
): Promise<MarketingShadowEvidenceRun> {
  const manifest = challengerData.manifest as unknown as MarketingSkillManifest;
  const source = manifest.source;
  if (source.kind !== "github") throw new Error("Corey shadow challenger must use pinned GitHub source");

  const response = await fetchImpl(COREY_SOURCE_URL, {
    method: "GET",
    headers: { accept: "text/plain" },
  });
  if (!response.ok) throw new Error(`Pinned Corey skill snapshot fetch failed with ${response.status}`);

  const snapshot: MarketingSkillSnapshot = {
    repository: source.repository,
    commitSha: source.commitSha,
    path: source.path,
    blobSha: source.contentHash,
    content: await response.text(),
  };

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

  const pairs: MarketingShadowPairEvidence[] = [];
  for (const fixture of fixtures) {
    const benchmarkCase = toMotorcycleCarouselQualificationCase(fixture);
    const native = await executeKairoNativeCarouselBaseline(runtime, benchmarkCase);
    const corey = await shadow.execute({
      challenger: { id: manifest.id, version: manifest.version },
      snapshot,
      benchmarkCase,
    });
    if (native.inputFingerprint !== corey.inputFingerprint) {
      throw new Error(`Paired input fingerprint mismatch for ${fixture.id}`);
    }
    requireMeasuredMetadata(native.metadata, `${fixture.id}:native`);
    requireMeasuredMetadata(corey.metadata, `${fixture.id}:corey`);
    pairs.push({
      caseId: fixture.id,
      inputFingerprint: native.inputFingerprint,
      native: { output: native.output, metadata: safeMetadata(native.metadata) },
      corey: { output: corey.output, metadata: safeMetadata(corey.metadata) },
    });
  }

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
    pairs,
  };
}

function requireMeasuredMetadata(metadata: AgentInvocationMetadata, lane: string): void {
  if (!Number.isFinite(metadata.latencyMs) || metadata.latencyMs < 0) {
    throw new Error(`Measured latency metadata is required for ${lane}`);
  }
  if (metadata.costUsd === undefined || !Number.isFinite(metadata.costUsd) || metadata.costUsd < 0) {
    throw new Error(`Measured cost metadata is required for ${lane}`);
  }
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
