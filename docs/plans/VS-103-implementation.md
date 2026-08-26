# VS-103 implementation plan

1. Define typed Brand Intelligence V2 and Topic Graph contracts in the domain package.
2. Define configurable sector packs (generic, AI/tech, Umrah, motorcycles, IAS/UPSC) as seed hints, not truth.
3. Build deterministic Topic Graph construction from persisted Brand Brain fields, preserving confirmed-field precedence, exclusions, confidence and source provenance.
4. Add graph fingerprint/version semantics: materially identical graphs reuse their version; material changes advance it.
5. Add additive PostgreSQL persistence for versioned Brand Intelligence graphs and graph-version lineage on durable Hunter runs where available.
6. Add tests for determinism, alias/topic deduplication, exclusions, sector-pack precedence, no fabricated provenance and versioning.
7. Run focused tests, full preflight/runtime/build/PostgreSQL verification, Product Intake and Security baseline.
8. Open the implementation PR and stop at the exact-SHA certification gate. No release or production enablement is authorized by this plan.
