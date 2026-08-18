# VS-55 implementation plan

1. Add regression tests for owner-context-only Brand Brain proposals and strict external-source provenance when source IDs are present.
2. Add public-reader tests for generic HTML metadata, social-profile metadata, plain text, text-based PDF extraction, unreadable PDF failure, response bounds and existing SSRF/redirect protections.
3. Update the public reader behind the existing `PublicBrandReferenceReader` port; do not introduce provider SDKs or a new service.
4. Update Brand Brain bootstrap and worker validation so a configured generator may propose from owner context with zero external references, while external citations remain restricted to inspected sources.
5. Make the existing quick-setup URL optional and adjust copy/status messaging without adding a new step.
6. Run domain/API/worker/web tests, typecheck/build, governance validation, preflight, Security and full CI on one frozen candidate SHA.
7. Stop at the certification/merge gate. Release/deployment require separate approval.
