# VS-03 Final Review — Hunter and Discover

## Scope review

VS-03 implements FR-06/FR-07 only: public Signal discovery, canonicalization/deduplication, Brand relevance and novelty, Opportunity lifecycle, Today/Discover UI, and governed Hunter runtime/provider boundaries.

Explicitly excluded: VS-04 research dossiers/angle generation, campaigns/content generation, publishing, social engagement automation, paid media, deployment, release and production enablement.

## Architecture review

- PostgreSQL remains authoritative for Signals, Opportunities, statuses, provenance and audit.
- DEC-003 promotes PgVector for V1 semantic retrieval behind the provider-neutral retrieval boundary.
- Qdrant + TurboQuant remains a scale-up candidate; it is not required for V1 runtime.
- Hermes is constrained behind `AgentRuntimePort`; Kairo does not expose unrestricted Hermes native terminal/file/browser/secret capabilities.
- Agent Reach is constrained behind Kairo `ToolGateway`/`DiscoverySourceProvider`; the agent requests fixed capabilities, never executable commands.
- Model provider credentials remain server-side transport secrets and are rejected from agent/tool context.

## Product/UI review

- Today surfaces only strong Opportunities and intentionally permits a truthful empty state.
- Discover shows the ranked Opportunity set with provenance/freshness and bounded Develop/Save/Ignore actions.
- Develop is only the VS-03 handoff state and does not implement VS-04 research/angle behavior.
- Existing Kairo visual hierarchy/design tokens are extended rather than replaced.
- Loading, error, empty, responsive and minimum interaction-target states are present.

## Deterministic verification

Candidate verification includes:

- Product Intake
- Security baseline
- `npm run preflight`
- `npm run runtime:verify`
- PostgreSQL integration/isolation tests
- Next/web build via dashboard build path
- fail-closed semantic benchmark with Workspace/Brand filtering

## Decision evidence

Corrected benchmark evidence is recorded in `evaluation/SEMANTIC-RETRIEVAL-VS-03.md`. Both PgVector and Qdrant/TurboQuant achieved recall@10 = 1.0 and zero tenant leaks on the representative surrogate. DEC-003 selects PgVector for the current V1 daily Hunter/coverage-memory workload.

## Review result

Ready for certification candidate generation. Release and production enablement remain unauthorized.
