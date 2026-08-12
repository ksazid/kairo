# VS-02 Specification, Architecture, Security and UI Review

Status: Findings addressed — exact-head rerun required
Slice: VS-02 — Brand Brain and Knowledge
PR: #6
Requirements: FR-03, FR-04
Decision: DEC-006

## Specification review

PASS with the bounded implementation described below.

- Brand Brain is Workspace/Brand scoped and exposes explicit `confirmed`, `inferred` and `stale` states.
- User corrections become confirmed authoritative Brand context and clear source dependency.
- Knowledge supports governed URL/website, note, pasted, research, product and quarantined document records.
- Sources expose lifecycle state without returning private raw text in API DTOs.
- DEC-006 removal produces a content-free source tombstone, removes relational source-only derivations/support links, preserves confirmed facts and stales inferred facts that lose all support.
- Loading, empty, error, success, disabled, quarantined and removed states are represented in the web experience.

## Architecture review

PASS.

- PostgreSQL remains authoritative; no vector provider is promoted in VS-02.
- Fastify remains transport-only; validation and use-case rules remain in the domain/application boundary.
- Every new Brand-owned relational record carries Workspace/Brand scope.
- Provider choices remain outside the domain: no S3 vendor, malware vendor, Hermes, Agent Reach or Qdrant dependency is introduced.
- URL sources are records only; VS-02 deliberately introduces no network fetcher.
- Document metadata cannot transition from quarantine to active through this slice.

## Security review

PASS for the enabled VS-02 runtime boundary.

Verified controls:
- active Workspace membership is required for Brand Brain and Knowledge operations;
- guessed foreign Brand/source identifiers return safe not-found behaviour;
- private source bodies are not returned in list/create DTOs;
- URL registration rejects credentials, localhost, `.local`, loopback, link-local and private IPv4 literals and fails closed on IPv6 literals;
- no network retrieval exists, so URL registration cannot create an SSRF request path;
- document JSON cannot carry document bytes and document records remain quarantined;
- DEC-006 redacts source content/URI/content metadata/object locator and deletes source-only relational derivations in one transaction;
- confirmed facts cannot be overwritten/downgraded by a later inference;
- sensitive source bodies are not added to application logging.

Bounded follow-ups, not certification blockers for VS-02:
- actual object storage upload, content sniffing and malware scanning remain disabled until a later approved adapter path exists;
- vector deletion propagation becomes executable only when a vector provider is introduced in VS-03; VS-02 creates no vectors;
- PostgreSQL RLS remains defence-in-depth evaluation, not the primary authorization mechanism.

## UI/accessibility review

The approved calm, content-first Kairo baseline is preserved. Brand Brain uses structured sections instead of a dense configuration/dashboard layout; state is communicated with text plus semantic indicators, not colour alone; important fields have persistent labels; loading/error/empty states are explicit; desktop collapses to a single flow on smaller viewports; reduced-motion support remains inherited from the shell.

Two review findings were corrected before testing:
1. Source removal originally executed from a single destructive button. It now requires a deliberate disclosure + `Confirm removal` action and explains DEC-006 impact before execution.
2. Existing desktop navigation and source-action controls could fall below the 44px interaction baseline. The review override raises those interactive targets to at least 44px.

## Deterministic evidence before review fixes

Core head `a599d4f145f1036b5f22834e3c7549ea2c7064bf`:
- Product Intake run 31637863323 — success
- Security baseline run 31637863452 — success
- CI run 31637863370 — success, including TypeScript, API/domain tests, PostgreSQL 18 integration tests and web build

UI head `6880264ca4d12fa03dc6767d2f09c7ebb2f6af29`:
- Product Intake run 31638484890 — success
- Security baseline run 31638484895 — success
- CI run 31638485079 — success

The review-fix head must pass all exact-head gates again before lifecycle advances to `testing`.
