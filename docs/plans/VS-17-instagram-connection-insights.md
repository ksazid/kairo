# VS-17 Implementation Plan — Instagram Connection + Insights

## Authority

FR-05, FR-15, FR-16, FR-17, FR-18, FR-20, DEC-004 and the approved TRD. Scope and runtime implementation were explicitly approved by Sazid Khan on 2026-08-15.

## Provider baseline

Use Meta's Facebook Login for Business / Instagram API with Facebook Login for this slice because Kairo's certified Instagram publishing adapter already uses `graph.facebook.com`, Instagram Professional account IDs and Page-scoped credentials. Do not add a second Instagram Login token model in the same slice.

Current provider expectations reviewed 2026-08-15:
- Instagram Professional accounts only;
- Page-linked Professional account for the Facebook Login model;
- discover managed Pages with a Facebook User token and obtain Page access tokens;
- publishing uses the Page credential while Instagram media Insights use the Facebook User credential in this provider model;
- the short-lived Facebook User token is extended server-side before Kairo accepts the connection for the 1h/24h/7d collection window;
- Kairo records the verified expiry timestamp but never exposes either provider token;
- some Business Manager role configurations can require additional provider permissions; VS-17 does not silently broaden into Ads API permissions and leaves such eligibility to production Meta configuration/smoke evidence;
- provider failures or unavailable metrics must never become fabricated performance evidence.

## Security boundary

```text
Browser
  -> Kairo web route
  -> authenticated Kairo API
  -> Meta OAuth
  -> server-side token extension + Page discovery
  -> encrypted credential vault
     -> opaque publishing credentialRef (Page token)
     -> opaque Insights credentialRef (Facebook User token)
  -> deterministic publisher / metric collector
```

Rules:
- Meta App Secret is API infrastructure configuration only.
- OAuth access tokens never enter agents, prompts, Brand Brain, API response bodies or logs.
- PostgreSQL stores encrypted credential material only; encryption key is an external environment secret.
- AES-256-GCM additional authenticated data binds ciphertext to Workspace + Brand + credentialRef.
- OAuth transaction state is hashed at rest, one-time, account/Brand bound and short-lived.
- connection candidates expose only safe Page/Instagram identifiers and display metadata.
- multiple eligible destinations require explicit user selection.
- unselected or expired candidate credentials are revoked locally.
- a partially failed selection is compensated fail-closed: the new connection is disabled and its newly issued credentials are revoked.
- reconnect replaces old credential references and revokes superseded credentials.
- disconnect revokes both publishing and Insights credentials before disabling the channel account.
- expired Insights credentials move the connection to `reconnect-required`.

## Implemented runtime

1. VS-16 factual closeout is recorded separately: its approved production deployment remains blocked by Vercel rate limiting and is not falsely marked deployed.
2. VS-17 is activated as high-risk with scope + implementation approval and DEC-004 as existing policy authority.
3. Brand/account-bound OAuth intent state is SHA-256 hashed, single-use and 10-minute limited.
4. Migration `0015_instagram_connection_insights.sql` adds encrypted credential records, OAuth intents/candidates, Meta account metadata and durable metric jobs.
5. `PgEncryptedChannelCredentialVault` uses AES-256-GCM with a 32-byte external encryption key.
6. `MetaInstagramOAuthClient`:
   - builds the authorisation URL;
   - exchanges the callback code server-side;
   - extends the Facebook User token server-side and requires enough verified lifetime for the Insights window;
   - verifies granted permissions;
   - discovers managed Pages and linked Instagram Professional account IDs;
   - returns Page credentials and the extended User credential only inside the server boundary.
7. Authenticated API routes start, complete, select, list and disconnect Instagram connections.
8. Selected connections reuse the existing ChannelAccount publishing `accountRef + credentialRef` seam.
9. `InstagramMetricCollector` uses only the opaque Insights credential, bounded metric requests and explicit 401/403/404/429/5xx semantics.
10. Durable jobs are seeded at about 1h, 24h and 7d only when each scheduled point is inside the verified User-token lifetime; jobs are leased and bounded to three attempts.
11. Raw provider snapshots and normalized metrics retain exact Published Post / Brand / account / external media lineage.
12. Permission or token expiry transitions the connection to `reconnect-required` rather than fabricating or silently dropping evidence.
13. Brand Performance UI provides connect, explicit account selection, reconnect and disconnect controls without exposing provider credentials.
14. Meta runtime remains optional when no Meta environment is configured; partial configuration fails startup explicitly.

## Runtime configuration

API / server-side only:
- `META_APP_ID` — public application identifier
- `META_APP_SECRET` — secret; never send through chat or commit
- `META_GRAPH_VERSION` — validated Graph API version
- `META_OAUTH_REDIRECT_URI` — Kairo web callback URL
- `CHANNEL_CREDENTIAL_ENCRYPTION_KEY` — base64 encoding of exactly 32 random bytes, supplied as an infrastructure secret

Web:
- no Meta App Secret
- no Meta provider token
- uses the existing authenticated Kairo API bridge

## Verification sequence

Before certification:
- clean PostgreSQL 18 migration verification including `0015`;
- production dependency audit;
- governance/preflight;
- full runtime typecheck/tests/build;
- dashboard build;
- Product Intake;
- high-risk Security baseline;
- specification/code review and unresolved-thread check;
- exact-SHA certification gate.

## Production readiness

Deterministic certification does not imply Meta App Review, Advanced Access or production permission availability. Production enablement requires the exact certified/released SHA plus verified Meta app configuration, callback URL, required permission access, credential encryption key, and a functional smoke with an eligible Instagram Professional account. Provider configurations that require additional Business Manager/Ads permissions remain a production eligibility decision and are not silently added to this slice.
