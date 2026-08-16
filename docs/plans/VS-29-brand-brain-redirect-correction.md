# VS-29 — Brand Brain Redirect Correction Plan

## Context
`buildBrandBrainAction` currently places Next.js `redirect()` inside the `try` that handles Brand Brain build failures. Because `redirect()` throws Next.js's internal redirect signal, the action catches its own successful redirect and converts it into an `error=NEXT_REDIRECT` redirect.

## Implementation plan
1. Add a web regression test that mocks Next.js `redirect()` with a redirect signal and proves a successful Brand Brain build invokes redirect exactly once with the normal notice destination.
2. Preserve a second contract for genuine `buildBrandBrain` failures so they still redirect exactly once to the bounded error destination.
3. Refactor the server action so application work resolves a redirect URL inside `try/catch`, while the actual Next.js `redirect()` call executes outside that handled region.
4. Run repository CI/preflight/runtime verification and inspect the exact PR head before certification is requested.

## Invariants
- request construction for objective, public reference and owner boundary is unchanged;
- generated/degraded notice copy is unchanged;
- genuine application error messages remain capped at 180 characters;
- no API/domain/database/auth/infrastructure changes;
- no merge, release, deployment or production enablement without a separate exact-SHA approval.

## Test-first evidence
The regression test must exist in commit history before the production correction so the previous implementation would fail the success-path single-redirect assertion.
