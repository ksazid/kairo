# VS-100 Implementation Plan — Core Source Intelligence Adapters

## Authority

- Product execution brief phases A, B1–B4 and recommended execution order
- `product/PRD.md` FR-02, FR-03, FR-04, FR-06, FR-08 and FR-20
- DEC-005, DEC-006, DEC-009, DEC-010 and DEC-011
- VS-99 shared Source Intelligence foundation
- Product Owner instruction “Go next” on 2026-08-26

## Sequence

1. Extract reusable bounded HTML/feed parsing and link-selection helpers.
2. Implement WebsiteAdapter over the existing SSRF-safe reader with prioritized same-domain sampling.
3. Implement GitHubAdapter over credential-free public REST endpoints with truthful rate-limit degradation.
4. Implement HackerNewsAdapter over the official API with bounded discussion traversal.
5. Implement RSSSubstackAdapter using the existing RSS/Atom semantics and bounded entries.
6. Register adapters ahead of the secure generic fallback.
7. Verify adapter routing, normalization, provenance, limits, degradation and fallback behavior.

## Non-goals

- Video/media analysis or YouTube deep extraction.
- Authenticated Instagram, Facebook or LinkedIn enrichment.
- Topic Graph, Hunter ranking, durable runs or scheduling.
- UI changes.
