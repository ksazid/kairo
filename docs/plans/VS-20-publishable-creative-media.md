# VS-20 implementation plan — Publishable Creative Media Pipeline

## Method
PES/Loop authority; Superpowers execution methodology; TDD first; one active slice; runtime outside production only.

## Step 1 — Red tests
Add worker tests for:
- scoped private object read/hash/type verification;
- carousel ordered egress URLs and TTL bounds;
- Reel input manifest/frame integrity;
- encoder invocation only after integrity passes;
- fixed direct-process FFmpeg grammar with no shell/user-controlled arguments;
- MP4 signature/size verification;
- deterministic encoded object key and reuse/idempotency;
- cross-Brand read/egress failure;
- unsafe/non-HTTPS or overlong expiry failure;
- compatibility with existing `PublishMediaItem` shapes.

## Step 2 — Media/egress contracts
Define:
- `PublishableCreativeStorePort` for scoped read, deterministic lookup, private write and publishing-only URL issuance;
- `ReelEncoderPort` with version and bounded encoded result;
- typed publishable result retaining source/object/hash/encoder/expiry provenance.

## Step 3 — Reel encoding orchestration
Implement integrity validation of VS-18 storyboard + manifest artifacts, derive scene durations, call `ReelEncoderPort`, validate output and store under a deterministic Brand-scoped key. Reuse a matching existing encoded object before invoking the encoder.

## Step 4 — Bounded FFmpeg adapter
Implement a direct-spawn adapter:
- configured executable only;
- `shell:false` / no shell path;
- Kairo-generated temporary directory, safe filenames and concat manifest;
- fixed video-only H.264/yuv420p/faststart arguments;
- bounded timeout/output size/stderr capture;
- cleanup on success/failure;
- no external URL/network input protocols.

## Step 5 — Publishing preparation
For carousels: verify private PNGs and issue ordered short-lived HTTPS URLs.
For Reels: reuse/encode private MP4 and issue one short-lived HTTPS URL.
Return existing domain `PublishMediaItem` shapes; do not bypass approval or call the social provider.

## Step 6 — Review and gates
Run scope/security review, then CI/Security/Product Intake. Fix only VS-20 defects. Freeze runtime, transition implementing → testing → certification through governance-only commits, rerun exact-head gates, then stop for human certification + merge approval.
