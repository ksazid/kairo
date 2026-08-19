# VS-65 implementation plan

1. Add a typed blind pair-evaluation contract in `apps/worker/src/marketing-shadow-quality-evaluator.ts`.
2. Build evaluator requests through `prepareAgentInvocation` using role `critic`, global-public scope, zero capabilities/tools and a fixed Kairo rubric.
3. Validate evaluator output fail-closed: both candidates require boolean Truth, five bounded scores and concise reasons; preserve runtime provenance.
4. Add a strict Groq GPT-OSS JSON Schema for `marketing-pair-quality-evaluation@1` without changing existing carousel schema behavior.
5. Add TDD coverage for identity blindness, request budget/capabilities, output validation, malformed-score rejection and structured-output routing.
6. Export the evaluator from `@kairo/worker` for later governed evidence execution.
7. Run repository CI/security/preflight on an immutable PR head. No production deployment or evaluator execution is part of this plan.
