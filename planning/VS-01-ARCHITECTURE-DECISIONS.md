# VS-01 Architecture Decision Proposal

Status: Prepared for human approval
Slice: VS-01 — Account, Workspace and Brand
Prepared: 2026-08-12

## DEC-001 — Authentication/session approach

**Recommendation:** Managed standards-based OIDC/OAuth provider behind a Kairo-owned provider-neutral identity/session adapter.

### Why
- Matches the approved TRD requirement for replaceable providers and deterministic authorization.
- Avoids spending VS-01 on building and operating identity infrastructure.
- Keeps Kairo authoritative for Workspace/Brand membership and server-side authorization rather than delegating tenant policy to the identity vendor.
- Allows the exact managed provider to be selected/configured later without changing Kairo domain contracts.

### Constraints
- Authorization Code + PKCE for browser/client flows where applicable.
- No provider token or subject identifier is treated as Workspace/Brand authorization by itself.
- Server derives Workspace/Brand access from Kairo-owned membership records.
- Provider-specific SDK/code stays behind an adapter.
- Secrets and refresh/session material are not exposed to client logs or agent context.

## DEC-002 — TypeScript API framework

**Recommendation:** Fastify.

### Why
- It is the first framework direction named by the approved TRD.
- Lightweight and compatible with a modular TypeScript API, schema-driven validation and OpenAPI.
- Keeps framework concerns at the transport edge while Kairo domain/application modules remain framework-independent.

### Constraints
- Domain modules do not import Fastify.
- Contracts/schemas are versioned and testable independently.
- Provider and persistence SDKs remain adapters.
- Framework choice must not alter approved API, tenant-isolation or error-contract policy.

## Human gate

Approval of this proposal should update `DEC-001` and `DEC-002` to `approved` in `delivery/decisions.json` and allow VS-01 to advance toward scope/runtime implementation approval.

Approval of these architecture choices is **not** release or production-enable approval.
