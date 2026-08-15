# VS-18 implementation plan

1. **Red domain tests** — generated-media artifact validation, idempotency key, Claim lineage and source fingerprint.
2. **Red renderer tests** — deterministic carousel PNG signature/hash/content and Reel storyboard/manifest determinism.
3. **Domain implementation** — generated-media contracts, bounded artifact metadata and asset-production service.
4. **Worker implementation** — dependency-free deterministic PNG encoder/bitmap text renderer; carousel renderer; Reel storyboard renderer and canonical manifest.
5. **Persistence seam** — object-store port and in-memory/test implementation only unless an existing production object-store adapter is already present; do not invent provider credentials.
6. **Integration** — expose worker renderer boundary and prove outputs map to existing publishing media descriptors without publishing them automatically.
7. **Verification** — immutable install, migrations, dependency audit, governance/preflight, typecheck, tests, build, scope/security review.
8. Freeze exact candidate; certification/merge remain exact-SHA human gates.

## Test matrix
- valid 3-slide carousel → 3 PNGs
- repeated render → identical hashes
- Claim outside plan → rejected by existing plan validator
- oversized/invalid theme/dimensions → rejected
- Reel scene timing → ordered storyboard frames + canonical manifest
- same Reel → identical manifest/frame hashes
- different Brand metadata does not alter content bytes but produces distinct scoped asset records/idempotency keys
- renderer failure → explicit failed result; no publish command generated
