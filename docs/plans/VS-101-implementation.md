# VS-101 Implementation Plan

## Scope

Implement Batch 3 of Source Intelligence: dedicated YouTube, Instagram, Facebook and LinkedIn adapters behind the existing `SourceRouter` and reuse the current Brand onboarding reader.

## Steps

1. Add social/video adapter classes in `apps/api/src/social-source-adapters.ts`.
   - `YouTubeAdapter`: official Data API metadata when an optional server-side key is configured; bounded public-reference fallback otherwise.
   - Instagram/Facebook/professional-network adapters: bounded public-reference extraction only; no cookies/private sessions.
   - Detect login/interstitial/blocked evidence and reject it as unusable rather than treating it as Brand truth.
2. Register the adapters in `apps/api/src/source-intelligence.ts` ahead of Website and secure HTTP fallback.
3. Canonicalize social/video tracking parameters without removing semantic identifiers.
4. Add focused tests for adapter routing, normalized evidence, fallback/degradation, tracking canonicalization and onboarding-reader reuse.
5. Run focused tests, repository tests, typecheck, builds, governance validation and preflight.
6. Stop at implementation-ready PR. Certification/merge/release require separate exact-SHA approval.

## Constraints

- No UI changes.
- No publishing-authority changes.
- No OAuth scope changes.
- No scheduler changes.
- No unrestricted scraping or authenticated browser/session state.
- Provider secrets remain server-side and optional.
- Remote content remains `untrusted-evidence` with provenance and bounded confidence.
