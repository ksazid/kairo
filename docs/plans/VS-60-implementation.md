# VS-60 implementation plan

1. Extend Content Asset Library persistence for provider connections, one-time OAuth intents, encrypted provider credentials, selected Drive roots and disconnect cleanup.
2. Add a Google Drive OAuth/REST adapter that requests only `drive.file`, supports offline refresh, validates provider responses, and performs bounded metadata-only traversal.
3. Add a Brand/account/library-scoped connection service. Authorize locally before every provider call; never expose refresh credentials.
4. Add authenticated API routes for begin connection, OAuth callback completion, Picker bootstrap access, root selection, indexing and disconnect.
5. Wire Google Drive configuration as optional. Partial configuration must fail fast; absent configuration must leave the API healthy with Drive connection unavailable.
6. Update the Content Assets UI to show real connection states and connection/index/disconnect actions only when server capability is available. Keep Content Assets secondary under More/Content Studio.
7. Add deterministic unit/API tests for replay protection, Brand isolation, scope handling, credential lifecycle, bounded traversal, provider failures and disconnect cleanup. Provider network calls are mocked.
8. Run UI Review against `product/DESIGN.md`; distinguish unavailable/needs-attention/empty/indexed states without provider theatrics.
9. Run Product Intake, Security baseline and full CI on the exact implementation head; fix only concrete failures.
10. Transition governance to certification and rerun all gates on one frozen final candidate SHA.
11. Stop for owner merge approval. No Google Cloud Console mutation, secret insertion, provider connection, deployment or production enablement.
