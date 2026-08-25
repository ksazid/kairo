# VS-97 Implementation Plan

## Scope

Implement the approved Home `Get recommendations` → Hunter → `For You` flow by wiring existing runtime capabilities, not by creating a second discovery stack.

## Steps

1. Wire the existing Hunter runtime for Home recommendations:
   - project active Brand Brain into the existing Brand Intelligence Profile;
   - use sector-aware source planning when a matching Sector Intelligence Pack exists;
   - use a bounded explicit public query for Brands without a matching pack so the Home action does not block on classification coverage;
   - route public discovery through the existing Kairo-owned Hacker News, Bluesky and optional YouTube adapters, preserving concrete provider provenance;
   - allow unsupported/unconfigured named sources to degrade truthfully rather than fabricate evidence;
   - persist only qualified, non-duplicate Opportunities through the existing DiscoveryService.
2. Add a Brand-scoped authenticated `POST /api/v1/brands/:brandId/recommendations` route.
   - return 503 when no model runtime is configured;
   - coalesce concurrent duplicate requests per account+Brand in-process;
   - return evidence/candidate/opportunity counts and degraded source names.
3. Wire the route into the API server using the existing model runtime and PostgreSQL discovery repository.
4. Add a Next.js server proxy at `/api/home/recommendations` so browser code never receives the bearer token.
5. Add a compact For You action component:
   - `Get recommendations` when empty;
   - `Refresh recommendations` when populated;
   - `Finding opportunities…` while running;
   - refresh Home when complete;
   - truthful zero-result/degraded-source status.
6. Rename My Idea's format action from `Get recommendations` to `Recommend format` to remove semantic ambiguity.
7. Add API route tests and run deterministic verification.

## Security and correctness constraints

- Authenticate and resolve Brand access before Hunter execution.
- Keep Brand-private context scoped to the active Brand.
- Public discovery receives only bounded queries through the existing Tool Gateway.
- Preserve provider/source provenance and existing opportunity qualification/deduplication.
- Do not add publishing authority, new credential scopes or autonomous execution.
- Do not fabricate recommendations when Hunter returns zero.

## Rollback

The runtime change is additive. Rollback is the exact revert of the VS-97 commit(s), restoring Home to read-only For You population and removing the on-demand Hunter route; no schema rollback is required.
