# VS-01 Certification Evidence

Status: Running — awaiting exact-head human certification approval
Slice: VS-01 — Account, Workspace and Brand
PR: #3

## Certification scope

Certification covers only FR-01 and FR-02 within the approved VS-01 boundary. It does not authorize release, deployment or production-enable behavior.

## Reviewed implementation baseline

The testing/review head `ae885f6f631a4472875b0c17eaea05eb38c804fd` passed all required automated gates before this certification-state transition:

- Product Intake — success;
- Security baseline — success;
- CI / PES preflight — success;
- strict TypeScript type checking — success;
- domain and API tests — success;
- PostgreSQL 18 migration/repository integration tests — success;
- concurrent first-login identity test — success;
- Next.js production build — success;
- dashboard validation — success.

The implementation history also demonstrates that CI detected and blocked the invalid NUL-encoded advisory-lock key before it was replaced with a valid JSON-encoded identity lock key. The regression test remains active.

## Requirements evidence

### FR-01 — Account, Workspace and Brand access boundary

Evidence:
- provider-neutral `IdentityVerifier` and OIDC/JWT adapter;
- Kairo Account resolution keyed by provider + subject;
- active Workspace membership required for Brand access;
- unauthenticated and foreign-tenant API tests;
- PostgreSQL tenant-scoped integration tests;
- concurrent identity-resolution test;
- authenticated web shell and secure PKCE sign-in flow.

### FR-02 — Initial Brand creation

Evidence:
- one transaction creates Workspace, owner membership, Brand and audit event;
- domain validation for required names and public URLs;
- API integration path for initial creation;
- PostgreSQL integration test confirms ownership, Brand visibility and audit event.

## Architecture evidence

- DEC-001: managed standards-based OIDC/OAuth remains behind a Kairo-owned adapter; identity-provider subject is not tenant authorization.
- DEC-002: Fastify remains at the API transport boundary; domain code has no Fastify dependency.
- PostgreSQL remains authoritative for VS-01 business state.
- Design implementation follows the approved minimalist Kairo baseline and does not simulate later Hunter/Brand Brain features.

## Known bounded items

- Exact production identity provider and credentials are environment/deployment configuration and are not authorized by VS-01.
- `OidcJwtVerifier` supports the approved replaceable adapter boundary; providers with a different token validation contract can supply another `IdentityVerifier`.
- PostgreSQL Row-Level Security remains defence-in-depth evaluation, not a VS-01 acceptance requirement.
- Release, production deployment and production-enable remain explicitly unapproved.

## Pass condition

The certification candidate is the exact PR head produced by this certification-state commit after Product Intake, Security and CI/runtime verification pass again. Human certification approval must bind that exact 40-character SHA before lifecycle may transition to `certified`.
