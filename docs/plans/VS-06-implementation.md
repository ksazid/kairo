# VS-06 Implementation Plan

Status: Active under AUTH-001

## Outcome

Deliver FR-12 and FR-13 without publishing: deterministic Truth/Claims failures, independent Critic/Judge evaluation, at most two revision cycles, and explicit human approval bound to one immutable Content Version and destination context.

## Guardrails

- Domain policy, not a model score, decides hard failures.
- Critic and Judge receive content plus approved evidence, never Drafter hidden reasoning.
- Agent roles have no tools, no persistence authority and Brand-private scope.
- Revisions stop after two cycles and fail closed.
- Approval requires the current immutable version, a passed truth gate and a passed review.
- A later edit creates a new version and cannot inherit approval.
- No scheduling, publishing, release or production enablement.

## Implementation steps

1. Domain rules and TDD
   - Add deterministic claim-use input, Truth/Claims findings and hard-fail evaluation.
   - Add review lifecycle, Critic/Judge result contracts and bounded revision counters.
   - Add immutable version-bound Approval records and stale-version rejection.

2. Independent agent contracts
   - Enable Critic and Judge roles with least-privilege, Brand-private, zero-tool invocations.
   - Validate structured output and persist only application-validated findings/provenance.
   - Prove neither role receives hidden Drafter reasoning or can override hard failures.

3. Persistence and API
   - Add scoped PostgreSQL review, finding and approval tables with immutable version lineage.
   - Add Brand-isolated review, revise, judge, approve and archive use cases.
   - Enforce optimistic concurrency, idempotency and human actor identity.

4. Content Studio UI
   - Add visible Draft / Review / Approved / Archived state.
   - Show hard findings separately from qualitative Critic findings.
   - Add bounded revision feedback and an explicit version/destination approval action.
   - Preserve the calm content-first design, responsive states and accessible status semantics.

5. Verification and certification
   - Run domain, API, PostgreSQL, worker, accessibility and responsive tests.
   - Run specification, code-quality, UI and mandatory high-risk security review.
   - Run preflight, full runtime verification and CI.
   - Present the exact tested SHA for human certification; do not merge implementation before certification.

