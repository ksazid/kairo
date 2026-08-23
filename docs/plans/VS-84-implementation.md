# VS-84 implementation plan

1. Preserve the existing Brand creation and source adapter contracts; map the current `/onboarding`, `/brands/new`, connection-plan and Brand Brain setup paths into one explicit onboarding state model without adding a second source of truth.
2. Add deterministic onboarding progress/state derivation from existing Brand, source, connection-health and Brand Brain data so OAuth redirects and partial provider failures can resume safely.
3. Refactor first-Brand and additional-Brand entry screens into the approved five-step journey: Brand basics → Connect sources → Import/analyse → Review suggestions → Ready.
4. Keep Website optional and combinable; make Instagram the recommended connection while retaining Facebook + Instagram and Facebook-only paths.
5. Reuse existing Meta connection start routes and Website ingestion; do not broaden provider scopes or expose credentials.
6. Add a bounded import/progress surface that reports only persisted/verified states and provides one local recovery action for failed or incomplete sources.
7. Reuse Brand Brain suggestions and confirmation controls for the review step; keep imported fields visibly suggested until confirmed and capture owner objective/boundaries as owner-controlled input.
8. Add the final readiness summary from existing confirmed fields, source health and outstanding review items, with one primary next action.
9. Apply UI UX Pro Max against the approved Kairo design baseline for responsive flow, touch targets, keyboard operation, screen-reader semantics, loading/error/reconnect/success states and progressive disclosure.
10. Add deterministic tests for first Brand, additional Brand, skip-all-sources, Website-only, Instagram-only, combined connection plan, OAuth return/resume, provider failure/recovery, suggestion confirmation and tenant isolation.
11. Run UI review, build/runtime tests, security review where triggered, `npm run governance:validate` and `npm run preflight`.
12. Stop for certification and exact-SHA human approval. Do not merge, release or production-enable autonomously.
