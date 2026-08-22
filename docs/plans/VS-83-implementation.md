# VS-83 implementation plan

1. Implement and test a replaceable private S3-compatible adapter with SigV4 upload and bounded signed GET delivery.
2. Add strict environment parsing shared by API and publisher runtime.
3. Add a production carousel render service that compiles the editable project, renders PNGs and computes measured quality.
4. Persist immutable manifest, slides and thumbnail lineage only after every upload and validation succeeds.
5. Add the authenticated render route and signed preview integration.
6. Route approved carousel publishing through the same object signer.
7. Add isolation, hash, expiry, configuration, render and publishing regressions.
8. Extend the smoke harness for an exact approved carousel and provider result.
9. Run full runtime and governance verification and open a draft PR.
10. Stop for exact-SHA merge approval before release or provider-backed verification.
