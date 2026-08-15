# VS-21 Superpowers Implementation Plan

1. **Activation/governance**
   - activate VS-21 from clean VS-20 main;
   - bind scope + implementation approvals;
   - define allowed/protected paths and pilot acceptance matrix.

2. **Red pilot contract**
   - add deterministic journey-report types and failing tests;
   - cover all four proof sectors and carousel/Reel paths;
   - require Brand isolation, exact-version approval, evidence lineage, safe failure/retry and performance-learning checkpoints.

3. **Compose existing runtime**
   - implement the smallest orchestrator/harness that calls existing Kairo seams;
   - fake only external network/credential/provider edges;
   - do not reimplement domain rules in fixture code.

4. **Defect hardening**
   - run CI/runtime verifier;
   - for each failure, classify as fixture defect, composition defect, existing runtime defect or protected-path blocker;
   - fix only approved bounded defects and add regression tests.

5. **UX/API contract sweep**
   - check existing primary pilot routes/states for loading, empty, error, reconnect, retry and human approval authority;
   - fix only blocking drift inside allowed paths.

6. **Security/quality review**
   - cross-Brand reads/reuse;
   - secret/credential non-propagation;
   - generated-media scope/hash/egress;
   - publishing idempotency/no silent success;
   - metric provenance and correlation-not-causation.

7. **Freeze/testing/certification**
   - freeze runtime;
   - transition implementing → testing → certification;
   - run exact-SHA CI/Security/Product Intake plus full runtime verification;
   - stop for human certification + merge approval.
