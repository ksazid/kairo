# VS-31 Implementation Plan — Platform-specific Content Adapters

## Context

VS-30 established Campaign-level fan-out with one destination-bound approval and PublishCommand per external destination. VS-31 makes each channel execution content-aware before publication while preserving the same approval/publishing guarantees.

## Plan

### Step 1 — Deterministic channel profiles

Add `apps/worker/src/content-channel-adapters.ts` with:

- `ChannelContentProfile`
- LinkedIn profile
- Instagram profile
- manual fallback profile
- profile resolver
- deterministic content validation

Profiles are structured data: channel, requested format, content mode, hard character limit, requirements and recommendations. They must not mutate/truncate user or generated content.

### Step 2 — TDD profile behavior

Add tests that prove:

- LinkedIn resolves as text-first with the existing publishing hard limit.
- Instagram resolves as visual/video-caption oriented with the existing publishing hard limit.
- format-specific guidance is present for carousel/reel where appropriate.
- manual remains generic.
- over-limit text fails deterministically.
- content is never silently truncated.

### Step 3 — Drafter integration

Update the Drafter so it:

1. resolves a channel profile from the Content Asset;
2. includes the structured profile in the bounded agent task context;
3. validates returned content against that profile before creating the new Content Version;
4. preserves Claim lineage and existing provenance behavior.

Add regressions for channel context and over-limit model output.

### Step 4 — Publishing adapter convergence

Reuse the shared channel content validator/limit in LinkedIn/Instagram provider adapter `supports()` checks while retaining provider-specific account/media validation and API behavior.

### Step 5 — Verification

Run/require:

- worker typecheck/tests
- repository preflight
- runtime verification
- Product Intake
- Security baseline
- full CI

No production deployment or real provider call is part of VS-31 certification.

## Design decisions

- Do not introduce a second LLM or model route. Channel adaptation is context + deterministic policy around the existing Drafter runtime.
- Do not automatically rewrite or truncate content after generation. If a model violates a hard channel constraint, fail closed so a bounded regeneration/revision can occur explicitly.
- Keep provider API code separate from content adaptation. The content profile knows channel presentation constraints; the publishing adapter knows credentials, endpoints, media upload and provider outcomes.
- Do not introduce future channels before their provider/product behavior is approved.
