# VS-09 Implementation Plan

Status: In progress

Scope: FR-17, FR-18 and FR-19 only

Method: PES/Loop → Superpowers → TDD → deterministic verification → specification/code/UI/security review → exact-SHA certification preparation.

## 1. Domain invariants

- Define Performance Narrative, Candidate Learning, evidence, contradiction, supersession and Experiment contracts.
- Require scoped metric/post evidence, bounded confidence, explicit uncertainty and causal-restraint language.
- Preserve human authority through accept, reject and correct transitions with optimistic concurrency.

## 2. Persistence and APIs

- Persist Learning history, evidence windows, applicability and contradiction/supersession lineage in PostgreSQL.
- Persist Experiment hypotheses, variants, primary metrics, results and evidence-linked Learning output.
- Add authenticated Brand-scoped APIs; agents never receive direct authoritative mutation access.

## 3. Intelligence boundary

- Add schema-constrained Analyst/Learner runtime ports.
- Deterministically reject causal overstatement, unsupported evidence and cross-Brand references before persistence.
- Retrieve accepted relevant Brand Performance Memory for later recommendations with provenance.

## 4. UI

- Extend Performance with narrative What happened / Why it might have happened / What to try next.
- Add Candidate Learning review, correction, rejection, contradiction and supersession states.
- Add explicit Experiment creation/result surfaces without chart-wall density.

## 5. Verification

- Run domain, API, worker and PostgreSQL tests, all typechecks, production build, governance and preflight.
- Run specification/code/UI and risk-based security review.
- Prepare a clean exact-SHA candidate and stop for human certification.
