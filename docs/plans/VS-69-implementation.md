# VS-69 implementation plan — Run D evidence export and quality evaluation

## Goal

Use the already-completed immutable Run D evidence (`vs23-qualification-20260820-d`) as the sole machine-evidence source for measured cost/latency aggregation and for the already-certified VS-65 Truth + five-dimension evaluator.

## Changes

1. Rotate the SELECT-only Marketing Lab evidence exporter from immutable Run B to immutable Run D and bind it to Run D's exact evidence-producing release SHA `5492f8ffc9273317ddd4e6b3e8f4a30f4a8df5e2`.
2. Rotate the existing VS-65 quality-evaluation source from Run B to Run D without changing evaluator instructions, rubric, output schema, provider/model route, pacing, candidate mapping, or benchmark fixtures.
3. Reserve a fresh one-shot evaluator run ID `vs65-quality-evaluation-20260820-b` so prior evaluator evidence is never overwritten or reused.
4. Update the quality-authorization fence and startup allowlists to the exact Run D source and the fresh evaluator run ID.
5. Update regression tests so they prove the evaluator reads exactly four Run D pairs, verifies the exact source release, preserves blind candidate labels, and remains dormant without one-shot authorization.

## Execution protocol

After exact-head Product Intake, Security and full CI pass:

1. merge and deploy the exact certified release with all Marketing Lab startup/execution actions disabled;
2. run the SELECT-only Run D exporter once and capture the four persisted pairs;
3. clear the export startup action;
4. compute measured Native/Corey aggregate cost and latency from the exported persisted metadata only;
5. stage exactly one fresh quality-evaluation authorization and run four blind evaluator calls with the existing 65-second inter-pair pacing;
6. clear every quality-evaluation/startup trigger after terminal completion or failure;
7. record results on issues #58 and #116.

## Non-goals

- no benchmark rerun;
- no Run B/C/D mutation;
- no evaluator-rubric or Truth-policy changes;
- no model/provider/key/pricing changes;
- no human preference or edit-distance fabrication;
- no final comparator verdict;
- no publishing, VS-23 activation, VS-24 activation, or Hermes reactivation.
