# VS-17 Implementation Plan — Instagram Connection + Insights

## Authority

FR-05, FR-15, FR-16, FR-17, FR-18, FR-20, DEC-004 and the approved TRD. Scope and runtime implementation were explicitly approved by Sazid Khan on 2026-08-15.

## Provider baseline

Use Meta's Facebook Login for Business / Instagram API with Facebook Login for this slice because Kairo's certified Instagram publishing adapter already uses `graph.facebook.com`, Instagram Professional account IDs and Page-scoped credentials. Do not add a second Instagram Login token model in the same slice.

Current provider expectations reviewed 2026-08-15:
- Instagram Professional accounts only;
- Page-linked Professional account for the Facebook Login model;
- discover managed Pages with a user token and obtain Page access tokens;
- publishing and Insights remain provider capabilities guarded by granted permissions;
- Insights failures must not become fabricated metrics.

## Security boundary

```text
Browser
  -> Kairo web route
  -> authenticated Kairo API
  -> Meta OAuth
  -> Kairo API callback completion
  -> encrypted credential vault
  -> opaque credentialRef
  -> deterministic publisher / metric collector
```

Rules:
- Meta App Secret is API infrastructure configuration only.
- OAuth access tokens never enter agents, prompts, Brand Brain, API response bodies or logs.
- PostgreSQL stores encrypted credential material only; encryption key is external environment secret.
- OAuth transaction state is hashed at rest, one-time, account/Brand bound and short-lived.
- connection candidates expose only safe Page/Instagram identifiers and display metadata.
- unselected candidate credentials are removed/revoked locally after selection or expiry.
- disconnect makes the credential unavailable to dispatch immediately.

## Implementation steps

1. Reconcile VS-16 governance to the factual state: certified, merged, release-approved and production-enable-approved at exact SHA `f2b3c7e43112512bbc7761d89220617a9e2b12db`, with actual Vercel deployment still blocked by provider rate limit.
2. Activate VS-17 with approved scope + implementation and high-risk security classification.
3. Add domain connection lifecycle types and validation without provider SDK dependencies.
4. Add migration for Brand-scoped channel connections, OAuth intents/candidates and encrypted credential records.
5. Add PostgreSQL repository + credential-vault implementation using authenticated encryption.
6. Add Meta OAuth adapter:
   - build authorization URL;
   - exchange callback code server-side;
   - discover managed Pages + linked Instagram Professional account IDs;
   - persist safe selection candidates with encrypted Page credentials.
7. Add authenticated API routes to start, complete, select, list and disconnect Instagram connections.
8. Make selected connection records compatible with existing `channel-accounts` publishing reads without exposing `credentialRef` to the web.
9. Add `InstagramMetricCollector` using the existing `MetricCollector` port, provider-specific metric parsing and permission/rate-limit failure semantics.
10. Add a bounded collection application path that creates `RawMetricSnapshot` + `NormalizedMetric` using existing AnalyticsService/domain rules.
11. Add Brand Performance connection UI:
    - disconnected CTA;
    - connected account identity and status;
    - reconnect-required state;
    - disconnect action;
    - no token/permission-secret display.
12. Add deterministic unit/API/PostgreSQL tests for tenant isolation, OAuth state, selection, encrypted storage, disconnect, metric parsing and secret non-propagation.
13. Run migration registry, typecheck, tests, build, governance/preflight, security and Product Intake.
14. Freeze exact candidate SHA and stop for human certification. Merge, release and production enablement remain separate gates.

## Runtime configuration

API / server-side only:
- `META_APP_ID` — public application identifier
- `META_APP_SECRET` — secret; never send through chat or commit
- `META_GRAPH_VERSION` — validated Graph API version
- `META_OAUTH_REDIRECT_URI` — Kairo web callback URL
- `CHANNEL_CREDENTIAL_ENCRYPTION_KEY` — 32-byte encryption key supplied as an infrastructure secret

Web:
- no Meta App Secret
- uses existing authenticated Kairo API bridge

## Production readiness

Implementation and deterministic certification do not imply Meta App Review or production permission availability. Production enablement requires the exact certified/released SHA plus verified Meta app configuration, allowed callback URL, required permission access, credential encryption key, and a functional smoke with a test Professional account.
