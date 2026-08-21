# VS-73 implementation plan

1. Add bounded transient retry behavior at provider adapters; prove 429 recovery, `Retry-After`, max-attempt and non-retryable behavior with deterministic tests.
2. Add a first-class `CreateBrandRequest` and Workspace-scoped Brand creation through contracts, domain repository/service, memory/Postgres adapters, API, server-side web client and UI.
3. Add tenant-isolation API tests for additional Brand creation and cross-account Brand access.
4. Prove partial Idea development recovery and expose a UI retry action whenever Research exists but candidate Angles are incomplete.
5. Add web deployment Git-SHA endpoint and expand pilot smoke to verify API/web provenance plus authenticated multi-Brand reads/creation while explicitly avoiding external publishing.
6. Run repository CI/security/product checks, correct failures, bind the final exact SHA, merge/release/deploy under the owner's explicit full approval, then verify production provenance and smoke-safe endpoints.
