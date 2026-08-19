# VS-63 implementation plan

1. Reset PR #88 branch to the current certified `main` merge and retain the same PR.
2. Re-add the Instagram publishing integration test as a test-only change.
3. Tighten the transient HTTP 500 assertion from the old 30–60 second range to the VS-62 deterministic 30-second retry hint.
4. Keep all Meta requests stubbed and retain encrypted credential persistence checks plus exactly-once settlement checks.
5. Activate VS-63 governance with production/provider/migration paths protected.
6. Run Product Intake, Security and full CI on the implementation head.
7. Correct only evidence-backed failures, then freeze one final certification SHA and rerun all required gates.
8. Stop for explicit owner merge approval. No deployment or provider activation.
