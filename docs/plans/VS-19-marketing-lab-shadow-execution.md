# VS-19 implementation plan — Marketing Lab Shadow Execution

## Method
PES/Loop authority; Superpowers implementation methodology; TDD first; one active slice.

## Step 1 — Red tests
Add worker-level tests defining the shadow boundary:
- exact pinned-source snapshot verification;
- only sandboxed/shadow challenger allowed;
- zero tool capability and zero tool-call budget;
- synthetic/public-safe fixture requirement;
- immutable Kairo policy instruction surrounding untrusted skill reference;
- typed/Claim-linked carousel or Reel plan output;
- observation provenance and identical input fingerprint;
- fail closed on source/hash/scope/output violations.

## Step 2 — Shadow executor
Implement `MarketingShadowExecutionService` behind existing `AgentRuntimePort`.
- No provider SDK and no shell.
- No network/secrets/publishing capability.
- Use strategist role with zero capabilities.
- External reference is context only; Kairo instruction and schema remain authoritative.
- Verify Git blob SHA against the pinned manifest before invoking the runtime.

## Step 3 — Observation builder
Produce a deterministic `MarketingBenchmarkObservation` from one shadow execution plus Kairo-owned evaluation input.
- Preserve workspace/brand/capability/format/case/fingerprint/candidate version.
- Record runtime latency/cost.
- Truth result remains a hard boolean gate.
- Scores are supplied by Kairo evaluation, not self-awarded by challenger.

## Step 4 — Paired shadow comparison
Exercise existing Marketing Lab comparison using equal inputs for Kairo Native and challenger.
- Result may advance only to live eligibility.
- No live execution or Brand selection.

## Step 5 — Review and gates
- specification/compliance review;
- code-quality/security review focused on prompt injection and provenance;
- `npm run preflight`;
- `npm run runtime:verify`;
- GitHub Product Intake, Security baseline, CI;
- freeze exact certification SHA and stop for human certification/merge approval.
