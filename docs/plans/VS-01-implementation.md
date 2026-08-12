# VS-01 Implementation Plan

Method: PES/Loop orchestration with Superpowers execution. Tests are written with or before the corresponding production behavior where practical.

## Task 1 — TypeScript workspace foundation
- Extend the root Node workspace without changing PES governance scripts.
- Add `apps/api`, `apps/web`, `packages/contracts`, `packages/domain`, `packages/design-tokens`.
- Add strict shared TypeScript configuration.
- Add lint/typecheck/test/build commands used by CI.

Verification:
- workspace dependency graph installs deterministically;
- TypeScript strict checks pass;
- package boundary imports resolve.

## Task 2 — Domain invariants first
Write tests for:
- Account identity uniqueness by provider + subject.
- Workspace requires an owner membership.
- Initial Workspace + Brand creation is one application operation.
- Brand access requires an active Workspace membership.
- A foreign Brand ID is rejected even when syntactically valid.

Then implement framework-independent domain/application code satisfying those tests.

## Task 3 — Persistence contracts and migration
- Define PostgreSQL schema for accounts, external identities, workspaces, memberships, brands and audit events.
- Scope Brand-owned records with Workspace IDs.
- Use explicit migration SQL and repository ports/adapters.
- Keep the database replaceable in tests with an in-memory repository adapter while contract tests protect semantics.

Verification:
- migration registry/check;
- repository contract tests;
- uniqueness/foreign-key/tenant-boundary assertions.

## Task 4 — OIDC boundary and Fastify API
Write authorization tests first for:
- unauthenticated request => 401;
- authenticated non-member => 404/403-safe denial according to endpoint policy;
- member can list only authorised Brands;
- initial Workspace/Brand creation establishes owner membership atomically;
- provider subject alone cannot select a Workspace.

Implement:
- provider-neutral `IdentityVerifier`/`AuthenticatedIdentity` port;
- generic standards-based OIDC/JWT adapter configured by issuer/audience, with test verifier injected in tests;
- Fastify transport only in `apps/api`;
- `/health`, `/api/v1/session`, `/api/v1/workspaces`, `/api/v1/brands` foundation;
- stable problem-details-compatible errors and correlation IDs.

## Task 5 — Kairo web shell
Implement the approved minimalist baseline:
- Inter/system-sans typography fallback;
- neutral palette + `#4F46E5` primary accent;
- persistent desktop navigation and responsive mobile adaptation;
- Today shell with explicit Brand scope;
- account/Workspace/Brand onboarding states;
- loading, empty, validation, error and keyboard/focus states;
- reduced-motion support.

No Hunter/Discover intelligence is implemented in VS-01; navigation destinations outside scope are visibly unavailable/placeholder-only rather than fake functionality.

## Task 6 — CI, security and specification review
- Add dependency install + typecheck + tests + build to CI while preserving PES preflight.
- Run security baseline and tenant-isolation tests.
- Review against `docs/slices/VS-01.md` and `product/DESIGN.md`.
- Update traceability with exact implementation/test paths.
- Transition to testing only after implementation evidence is complete.

## Completion boundary
This plan may implement and test VS-01 outside production. It may not certify, merge, release, deploy, or production-enable without the corresponding PES gates and human authority.
