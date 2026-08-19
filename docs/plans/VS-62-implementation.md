# VS-62 implementation plan — Instagram Retry-After correctness

## Context

Issue #89 identifies one FR-15 resilience gap: retryable Meta responses can omit `Retry-After`, leaving the existing planner without a provider pacing hint. The adapter must remain single-attempt; only the outer publishing workflow may schedule retries.

## Plan

1. Add an Instagram-specific failure mapper in `apps/worker/src/publishing-adapters.ts`.
   - Parse a valid `Retry-After` seconds/date header first.
   - Inspect only the bounded Meta JSON error envelope needed for `code` and `is_transient`.
   - Classify HTTP 429 and Meta codes 4/17/613 as rate-limited.
   - Classify HTTP 5xx and `is_transient:true` as transient.
   - Use deterministic bounded fallbacks when the header is absent: 60 seconds for rate limiting; 30 seconds for transient/5xx.
   - Leave unrelated provider behavior and the LinkedIn failure mapper unchanged.
2. Route all Instagram create/status/publish failures through the Instagram-specific mapper.
3. Extend worker regression coverage in `publishing-rich.test.ts` for:
   - 429 without header;
   - 5xx without header;
   - Meta rate-limit code on a 4xx envelope;
   - `is_transient:true` envelope;
   - explicit `Retry-After` precedence;
   - auth/non-transient failure with no fallback;
   - exactly one provider request for a failed create call.
4. Run Product Intake, Security baseline, and CI on the implementation head. Fix only concrete failures.
5. Freeze the implementation, transition governance to certification, rerun all gates on the exact candidate, and stop for owner merge approval.

## Non-goals

No provider/OAuth configuration, no live Meta request, no direct retry loop, no publishing workflow redesign, no UI, no deployment.
