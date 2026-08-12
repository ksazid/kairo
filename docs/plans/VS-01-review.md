# VS-01 Specification and Code Review

Status: Ready for certification preparation
Slice: VS-01 — Account, Workspace and Brand
PR: #3

## Specification compliance

- FR-01 Account/Workspace boundary: implemented through the provider-neutral identity verifier, Kairo Account resolution, Workspace membership authorization and authenticated web shell.
- FR-02 Brand creation: implemented as the same transaction that creates the initial Workspace and owner membership.
- Foreign Workspace/Brand identifiers are denied through account-scoped repository queries and API tests.
- Identity-provider subjects are mapped to Kairo Accounts but do not grant Workspace/Brand authorization.
- Fastify remains in `apps/api`; the domain package has no Fastify dependency.
- PostgreSQL is authoritative for Accounts, external identities, Workspaces, memberships, Brands and audit events.
- The web shell uses the approved Kairo/CIE minimalist visual vocabulary, explicit Brand scope and responsive mobile navigation without implementing later intelligence features.

## Verification evidence

Exact-head CI exercises:
- strict TypeScript type checking;
- domain tests;
- Fastify API authorization/tenant-isolation tests;
- PostgreSQL 18 migration execution and repository integration tests;
- concurrent first-login identity resolution;
- Next.js production build;
- PES preflight/dashboard validation.

Product Intake and Security baseline are required independently on the same PR head.

## Review finding resolved

During review, the original account-resolution implementation had a possible race when two first-login requests for the same external identity arrived concurrently. A transaction-scoped PostgreSQL advisory lock keyed by the encoded provider/subject pair was added, with a dedicated concurrent-login integration test.

The first advisory-lock key used a NUL separator, which PostgreSQL text parameters reject. CI caught this. The key is now JSON-encoded, preserving deterministic identity separation without invalid text bytes. The same concurrency test remains in place.

## Deliberate V1 boundaries

- The exact managed OIDC provider is deployment configuration, not a domain dependency.
- The included `OidcJwtVerifier` is one adapter for providers that issue signed JWT access tokens for the configured API audience; another verifier may be substituted behind `IdentityVerifier` without domain changes.
- PostgreSQL Row-Level Security remains defence-in-depth evaluation rather than a VS-01 requirement; application queries are tenant-scoped and tested.
- No refresh-token lifecycle, enterprise role administration, Brand Brain, Hunter, generation, publishing, metrics, billing or production deployment is included.
- Release and production-enable approvals remain pending.

## Review verdict

No open specification or code-quality blocker remains for moving VS-01 from testing into certification preparation, subject to exact-head CI, Product Intake and Security remaining green after this review record is committed.
