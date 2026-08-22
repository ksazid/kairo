# VS-77 implementation plan

1. Define persisted carousel, slide and immutable rendered-version records.
2. Add additive database migration and Brand-scoped repositories.
3. Add replaceable object-storage delivery contracts with short-lived public URLs.
4. Expose optimistic-concurrency review and editing APIs.
5. Build the responsive visual slide review/editor.
6. Preserve per-slide regeneration requests and prior versions.
7. Enforce deterministic quality readiness before approval.
8. Bind approval and publish command to the exact rendered asset version.
9. Persist Meta container creation, processing verification and final media result.
10. Verify tenant isolation, stale edits, immutable approval, delivery expiry, retries and failure paths; open a draft PR.

## Security controls
- Storage keys are private identifiers; only short-lived delivery URLs cross the Meta boundary.
- Image replacement accepts only existing Brand-scoped asset references, not arbitrary remote URLs.
- Checksums are verified before approval and again before delivery.
- Approval and publishing fail closed on missing, changed or unready media.
- Provider identifiers and errors are bounded; credentials and signed URLs are redacted from logs.
- Every mutation verifies tenant, Brand, Campaign, Content and expected version scope.
