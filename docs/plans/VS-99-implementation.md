# VS-99 Implementation Plan — Common Source Intelligence Foundation

## Authority

- `product/PRD.md` FR-02, FR-03, FR-04, FR-06, FR-08 and FR-20
- `product/TRD.md` source/provenance, ToolGateway, tenant isolation and durable-state boundaries
- `product/DESIGN.md` frozen UI baseline (no UI changes)
- DEC-005, DEC-006, DEC-009, DEC-010 and DEC-011
- Product Owner execution brief and implementation instruction on 2026-08-26
- `docs/slices/VS-99.md`

## Implementation sequence

### 1. Contracts and validation

- Define source identity, adapter health, fetch context and normalized-document contracts in a provider-neutral package.
- Validate canonical public HTTP(S) URLs, confidence, timestamps, hashes, provenance and bounded fields.
- Keep external content explicitly marked as untrusted evidence.

### 2. Deterministic routing

- Implement hostname/path-based detection for the approved source types.
- Route by adapter support and priority with generic secure HTTP as the final fallback.
- Return a truthful unsupported/unavailable state when no adapter can execute.

### 3. Existing reader bridge

- Wrap `PublicBrandReferenceHttpReader` as the generic Website/article fallback.
- Preserve its SSRF, redirect, timeout, size, PDF and content-type controls.
- Normalize its existing output without changing current onboarding behavior.

### 4. Public fetch boundary

- Extend the existing ToolGateway routing to execute `public-content-fetch`.
- Require scoped, bounded input and return normalized evidence plus provenance.
- Never pass credentials or fetched instructions into trusted agent configuration.

### 5. Scoped idempotency cache

- Add a replaceable cache port and bounded in-memory implementation for this slice.
- Key normalized entries by scope, canonical URL, content hash and adapter version.
- Avoid repeated normalization for unchanged content and prevent cross-Brand reuse of private evidence.

### 6. Verification

- Add contract, routing, fallback, ToolGateway, caching and security regression tests first.
- Run focused tests followed by typecheck, complete test suite, build, governance validation and preflight.
- Stop at merge approval after exact-SHA certification evidence is ready.

## Non-goals

- New UI or navigation.
- New platform credentials.
- Unrestricted scraping, browser cookies or private sessions.
- Deep platform extraction.
- Hunter scheduling or production enablement.
