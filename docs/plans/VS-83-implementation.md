# VS-83 implementation plan

1. Implement and test a replaceable private S3-compatible adapter with SigV4 upload and bounded signed GET delivery.
2. Add strict environment parsing shared by API and publisher runtime.
3. Add a production carousel render service that compiles the editable project, renders PNGs and computes measured quality.
4. Persist immutable manifest, slides and thumbnail lineage only after every upload and validation succeeds.
5. Add the authenticated render route and signed preview integration.
6. Route approved carousel publishing through the same object signer.
7. Add isolation, hash, expiry, configuration, render and publishing regressions.
8. Extend the smoke harness for an exact approved carousel and provider result.
9. Expose the existing immediate-publish action in Content Studio for a matching connected Instagram carousel-capable destination, while preserving LinkedIn text behavior and failing closed for unsupported combinations.
10. Cover the immediate-publish capability decision with deterministic web tests.
11. Run full runtime and governance verification and open a PR.
12. Stop for exact-SHA certification, merge, release and production-enable approval before production deployment or provider-backed verification.
