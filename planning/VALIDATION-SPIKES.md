# Required Technical Validation Spikes

These validations come directly from the approved TRD and Venture Package. They are not separate product scope.

## Hermes runtime
Before promoting Hermes, prove role invocation, Skill injection, cancellation, bounded budgets, provider routing and validated structured output. DirectModelRuntime remains the fallback.

## Qdrant / TurboQuant
Before provider promotion, benchmark representative Brand memory for recall, latency, storage, tenant-filter correctness and cost. PgVector remains fallback/tests.

## Skill sandbox
Before executable third-party Skills are promoted, prove version pinning, permission declaration, safe loading, prompt-injection resistance and no unapproved network/secret access.

## Instagram and LinkedIn
Before VS-07 automated publishing is implemented, verify the exact pilot publishing and metric capabilities, permissions, review requirements, rate limits and safe degradation path.

## Paperclip
Paperclip remains evaluation-only. A future spike must prove Hermes adapter reliability, Brand isolation, CIE source-of-truth authority, budget enforcement, audit retention, outage safety, removability and enough operational value to justify complexity.
