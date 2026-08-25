# VS-97 Implementation Plan

## Scope

Implement the approved Home `Get recommendations` → Hunter → `For You` flow by wiring existing runtime capabilities, not by creating a second discovery stack.

## Steps

1. Add an API-facing Hunter runtime adapter that:
   - projects active Brand Brain into the existing Brand Intelligence Profile;
   - uses sector-aware source planning when a matching pack exists;
   - falls back to a bounded explicit public query for Brands without a matching sector pack;
   - routes through existing RSS/Hacker News/Bluesky/optional YouTube discovery adapters;
   - invokes the existing HunterOrchestrator and DiscoveryService.
2. Add a Brand-scoped authenticated `POST /api/v1/brands/:brandId/hunter/run` route.
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
- Public discovery receives only bounded queries through existing adapters/tool gateway.
- Preserve provider/source provenance and existing opportunity qualification/deduplication.
- Do not add publishing authority or provider credentials.
- Do not fabricate recommendations when Hunter returns zero.

## Rollback

The runtime change is additive. Rollback is the exact revert of the VS-97 commit(s), restoring Home to read-only For You population and removing the on-demand Hunter route; no schema rollback is required.
