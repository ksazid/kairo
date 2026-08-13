# VS-03 Semantic Retrieval Benchmark

Status: evidence recorded; DEC-003 remains pending human architecture approval.

## Corrected fail-closed run

- Candidate branch head before this evidence-only commit: `3ebb1347715dacb3f886adbc1153b70f78af4678`.
- GitHub Actions CI run: `31661908305`.
- The benchmark shell uses `set -o pipefail`; a benchmark process failure cannot be masked by `tee`.
- Deterministic surrogate: 384 dimensions, 6 Brands, 1,200 vectors per Brand, 7,200 total vectors, 24 queries, topK 10, seed `0x4b414952`.
- Every query applies explicit Workspace + Brand filtering; tenant leak count must be zero.

## Results

| Metric | PgVector 0.8.6 | Qdrant 1.18 + TurboQuant |
| --- | ---: | ---: |
| recall@10 | 1.0000 | 1.0000 |
| tenant leaks | 0 | 0 |
| p50 query latency | 1.17 ms | 44.00 ms |
| p95 query latency | 1.34 ms | 44.28 ms |
| insert time | 1,032.93 ms | 1,057.90 ms |

PgVector configuration: HNSW `m=16`, `ef_construction=100`, `ef_search=200`, `hnsw.iterative_scan=strict_order`, `hnsw.max_scan_tuples=20000`.

Qdrant configuration: HNSW `ef=80`, TurboQuant bits4 default, oversampling 2, rescoring enabled, Brand payload tenant index enabled.

PgVector relation size for the benchmark was 26,828,800 bytes. Qdrant reported all 7,200 points indexed. The benchmark does not claim cross-provider storage equivalence because the Qdrant container metric available in the run is not directly comparable to PostgreSQL relation bytes.

## Interpretation

Both providers satisfy the benchmark's recall and tenant-isolation floor after PgVector is correctly tuned for filtered HNSW retrieval. On this V1-sized representative surrogate, PgVector is materially faster while avoiding an additional vector-service operational dependency because PostgreSQL is already Kairo's authoritative store.

Qdrant + TurboQuant remains strategically attractive for substantially larger vector-memory workloads, specialized vector operations and compression. The benchmark therefore supports keeping the semantic retrieval port provider-neutral and re-running a larger-scale benchmark before any later migration/promotion.

## Recommendation for DEC-003

Recommend **PgVector for Kairo V1 semantic retrieval**, behind the existing provider-neutral retrieval boundary, while retaining Qdrant + TurboQuant as the scale-up candidate to re-benchmark as Brand memory grows.

This recommendation is not an approval. DEC-003 must remain pending until the Product Owner explicitly approves the material architecture choice.
