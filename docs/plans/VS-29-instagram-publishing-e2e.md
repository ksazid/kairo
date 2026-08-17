# VS-29 Instagram publishing end-to-end test gate

## Purpose

Prepare a deterministic pre-production verification gate for Instagram publishing without contacting Meta or publishing real content.

## Covered path

`PublishingJobRunner -> DeterministicPublishingWorker -> InstagramProfessionalAdapter -> Meta request contract -> PublishingExecutionStore.settle`

## Scenarios

1. A scheduled three-image Instagram carousel is claimed, each child container is created, the carousel parent is created, the parent is published, and the job is settled as published with the external post ID and provider correlation ID.
2. Missing/unresolvable encrypted credentials fail closed before any Meta request.
3. Unsafe/private media URLs are refused before any Meta request and settle as manual-required.

## Explicit non-goals

- No real Meta access token.
- No real Instagram account.
- No network call to Meta.
- No production database mutation.
- No publication.
- No Cloudflare/Render background-worker dependency.

## Later live smoke gate

When a production executor exists and the owner explicitly authorizes a live smoke test, verify separately:

- exact release SHA deployed;
- Instagram Professional account connected through OAuth;
- one owner-approved test asset/version;
- immutable publish command created only after explicit approval;
- executor claims only the Instagram command;
- provider publication ID persisted;
- duplicate execution remains idempotent;
- disconnect/reconnect-required states block publication;
- audit/telemetry contain no credential plaintext.

A live smoke test is not authorized by this document.
