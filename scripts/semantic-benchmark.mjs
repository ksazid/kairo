import pg from "pg";
import { performance } from "node:perf_hooks";

const { Client } = pg;
const DIM = 384;
const BRAND_COUNT = 6;
const PER_BRAND = 1200;
const TOP_K = 10;
const QUERY_COUNT_PER_BRAND = 4;
const QDRANT = process.env.QDRANT_URL ?? "http://127.0.0.1:6333";
const DATABASE_URL = process.env.SEMANTIC_DATABASE_URL ?? "postgres://postgres:postgres@127.0.0.1:55432/kairo_semantic";
const COLLECTION = "kairo_vs03_benchmark";

const random = mulberry32(0x4b414952);
const prototypes = Array.from({ length: 18 }, () => normalize(Array.from({ length: DIM }, () => gaussian(random))));
const brandBias = Array.from({ length: BRAND_COUNT }, () => normalize(Array.from({ length: DIM }, () => gaussian(random))));

const docs = [];
let id = 1;
for (let brand = 0; brand < BRAND_COUNT; brand += 1) {
  for (let index = 0; index < PER_BRAND; index += 1) {
    const topic = index % prototypes.length;
    const vector = normalize(prototypes[topic].map((value, dimension) => value + brandBias[brand][dimension] * 0.05 + gaussian(random) * 0.055));
    docs.push({ id: id++, brand: `brand-${brand}`, topic, vector });
  }
}

const queries = [];
for (let brand = 0; brand < BRAND_COUNT; brand += 1) {
  for (let q = 0; q < QUERY_COUNT_PER_BRAND; q += 1) {
    const topic = (brand * 3 + q * 4) % prototypes.length;
    const vector = normalize(prototypes[topic].map((value, dimension) => value + brandBias[brand][dimension] * 0.05 + gaussian(random) * 0.035));
    const candidates = docs.filter((doc) => doc.brand === `brand-${brand}`)
      .map((doc) => ({ id: doc.id, score: cosine(vector, doc.vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_K)
      .map((item) => item.id);
    queries.push({ brand: `brand-${brand}`, vector, truth: candidates });
  }
}

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();
try {
  await setupPgvector(client);
  const pgInsertMs = await measure(() => insertPg(client));
  const pgIndexMs = await measure(() => client.query("create index kairo_bench_hnsw on kairo_vector_bench using hnsw (embedding vector_cosine_ops) with (m=16, ef_construction=100)"));

  await setupQdrant();
  const qdrantInsertMs = await measure(insertQdrant);
  await waitQdrantIndexed();

  const pgMetrics = await benchmarkPg(client);
  const qdrantMetrics = await benchmarkQdrant();
  const pgSize = await client.query("select pg_total_relation_size('kairo_vector_bench')::bigint as bytes");
  const qdrantInfo = await qdrantJson(`/collections/${COLLECTION}`);

  const result = {
    schemaVersion: 1,
    corpus: { dimensions: DIM, brands: BRAND_COUNT, vectorsPerBrand: PER_BRAND, vectors: docs.length, queries: queries.length, topK: TOP_K, seed: "0x4b414952" },
    providers: {
      pgvector: {
        version: await pgvectorVersion(client),
        insertMs: round(pgInsertMs), indexBuildMs: round(pgIndexMs), relationBytes: Number(pgSize.rows[0].bytes),
        ...pgMetrics,
      },
      qdrantTurboQuant: {
        version: qdrantInfo?.result?.config?.service_config?.version ?? "1.18.x-container",
        insertMs: round(qdrantInsertMs),
        turboQuant: { encoding: "bits4-default", documentedCompression: "8x", memory: "pinned" },
        pointsCount: qdrantInfo?.result?.points_count ?? docs.length,
        indexedVectorsCount: qdrantInfo?.result?.indexed_vectors_count ?? null,
        ...qdrantMetrics,
      },
    },
  };

  console.log(JSON.stringify(result, null, 2));
  console.log(`KAIRO_BENCHMARK_RESULT=${JSON.stringify(result)}`);

  if (pgMetrics.tenantLeakCount !== 0 || qdrantMetrics.tenantLeakCount !== 0) throw new Error("Tenant-filter correctness benchmark failed");
  if (pgMetrics.recallAt10 < 0.80 || qdrantMetrics.recallAt10 < 0.80) throw new Error("A semantic provider fell below the minimum recall@10 benchmark floor");
} finally {
  await client.end();
}

async function setupPgvector(client) {
  await client.query("create extension if not exists vector");
  await client.query("drop table if exists kairo_vector_bench");
  await client.query(`create table kairo_vector_bench (id bigint primary key, workspace_id text not null, brand_id text not null, embedding vector(${DIM}) not null)`);
  await client.query("create index kairo_bench_scope on kairo_vector_bench (workspace_id, brand_id)");
}

async function insertPg(client) {
  const BATCH = 200;
  for (let offset = 0; offset < docs.length; offset += BATCH) {
    const batch = docs.slice(offset, offset + BATCH);
    const ids = batch.map((doc) => doc.id);
    const workspaces = batch.map(() => "workspace-benchmark");
    const brands = batch.map((doc) => doc.brand);
    const vectors = batch.map((doc) => vectorLiteral(doc.vector));
    await client.query(
      `insert into kairo_vector_bench (id,workspace_id,brand_id,embedding)
       select x.id,x.workspace_id,x.brand_id,x.embedding_text::vector
       from unnest($1::bigint[],$2::text[],$3::text[],$4::text[]) as x(id,workspace_id,brand_id,embedding_text)`,
      [ids, workspaces, brands, vectors],
    );
  }
  await client.query("analyze kairo_vector_bench");
}

async function setupQdrant() {
  await fetch(`${QDRANT}/collections/${COLLECTION}`, { method: "DELETE" }).catch(() => undefined);
  await qdrantJson(`/collections/${COLLECTION}`, {
    method: "PUT",
    body: JSON.stringify({
      vectors: { size: DIM, distance: "Cosine" },
      hnsw_config: { m: 0, payload_m: 16, ef_construct: 100 },
      quantization_config: { turbo: { memory: "pinned" } },
      optimizers_config: { indexing_threshold: 500 },
    }),
  });
  await qdrantJson(`/collections/${COLLECTION}/index?wait=true`, {
    method: "PUT",
    body: JSON.stringify({ field_name: "brand_id", field_schema: { type: "keyword", is_tenant: true } }),
  });
}

async function insertQdrant() {
  const BATCH = 200;
  for (let offset = 0; offset < docs.length; offset += BATCH) {
    const batch = docs.slice(offset, offset + BATCH);
    await qdrantJson(`/collections/${COLLECTION}/points?wait=true`, {
      method: "PUT",
      body: JSON.stringify({ points: batch.map((doc) => ({ id: doc.id, vector: doc.vector, payload: { workspace_id: "workspace-benchmark", brand_id: doc.brand } })) }),
    });
  }
}

async function waitQdrantIndexed() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const info = await qdrantJson(`/collections/${COLLECTION}`);
    if (info?.result?.status === "green" && (info?.result?.indexed_vectors_count ?? 0) >= docs.length * 0.9) return;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error("Qdrant did not finish indexing within 60 seconds");
}

async function benchmarkPg(client) {
  const latencies = [];
  let recallSum = 0;
  let tenantLeakCount = 0;
  for (const query of queries) {
    const start = performance.now();
    const result = await client.query(
      `with nearest as materialized (
         select id,brand_id,embedding <=> $1::vector as distance
         from kairo_vector_bench
         where workspace_id='workspace-benchmark' and brand_id=$2
         order by embedding <=> $1::vector
         limit ${TOP_K}
       ) select id,brand_id from nearest order by distance + 0`,
      [vectorLiteral(query.vector), query.brand],
    );
    latencies.push(performance.now() - start);
    const ids = result.rows.map((row) => Number(row.id));
    recallSum += recall(ids, query.truth);
    tenantLeakCount += result.rows.filter((row) => row.brand_id !== query.brand).length;
  }
  return { recallAt10: round(recallSum / queries.length, 4), p50LatencyMs: round(percentile(latencies, 0.5)), p95LatencyMs: round(percentile(latencies, 0.95)), tenantLeakCount };
}

async function benchmarkQdrant() {
  const latencies = [];
  let recallSum = 0;
  let tenantLeakCount = 0;
  for (const query of queries) {
    const start = performance.now();
    const response = await qdrantJson(`/collections/${COLLECTION}/points/query`, {
      method: "POST",
      body: JSON.stringify({
        query: query.vector,
        filter: { must: [{ key: "workspace_id", match: { value: "workspace-benchmark" } }, { key: "brand_id", match: { value: query.brand } }] },
        params: { hnsw_ef: 80, quantization: { ignore: false, rescore: true, oversampling: 2.0 } },
        with_payload: true,
        limit: TOP_K,
      }),
    });
    latencies.push(performance.now() - start);
    const points = response?.result?.points ?? [];
    const ids = points.map((point) => Number(point.id));
    recallSum += recall(ids, query.truth);
    tenantLeakCount += points.filter((point) => point?.payload?.brand_id !== query.brand || point?.payload?.workspace_id !== "workspace-benchmark").length;
  }
  return { recallAt10: round(recallSum / queries.length, 4), p50LatencyMs: round(percentile(latencies, 0.5)), p95LatencyMs: round(percentile(latencies, 0.95)), tenantLeakCount };
}

async function pgvectorVersion(client) {
  const result = await client.query("select extversion from pg_extension where extname='vector'");
  return result.rows[0]?.extversion ?? "unknown";
}

async function qdrantJson(path, init = {}) {
  const response = await fetch(`${QDRANT}${path}`, { ...init, headers: { "content-type": "application/json", ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error(`Qdrant ${init.method ?? "GET"} ${path} failed: ${response.status} ${await response.text()}`);
  return response.json();
}

async function measure(fn) { const start = performance.now(); await fn(); return performance.now() - start; }
function recall(actual, expected) { const expectedSet = new Set(expected); return actual.filter((id) => expectedSet.has(id)).length / expected.length; }
function percentile(values, p) { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] ?? 0; }
function vectorLiteral(vector) { return `[${vector.map((value) => value.toFixed(7)).join(",")}]`; }
function cosine(a, b) { let dot = 0; for (let i = 0; i < a.length; i += 1) dot += a[i] * b[i]; return dot; }
function normalize(vector) { const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1; return vector.map((value) => value / magnitude); }
function gaussian(rng) { const u = Math.max(Number.EPSILON, rng()); const v = Math.max(Number.EPSILON, rng()); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function mulberry32(seed) { return () => { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function round(value, digits = 2) { const factor = 10 ** digits; return Math.round(value * factor) / factor; }
