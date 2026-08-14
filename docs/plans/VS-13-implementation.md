# VS-13 Implementation Plan — Free Discovery Adapters

## Objective

Turn the certified VS-12 sector/source plans into real free/public discovery calls without changing the generic Hunter architecture.

## Architecture

```text
Brand Intelligence Profile
  -> Sector Pack
  -> Source Policy
  -> Source Query Plan
  -> Hunter
  -> Kairo source-routing ToolGateway
       -> Agent Reach fallback
       -> RSS/Atom adapter
       -> Hacker News adapter
       -> Bluesky adapter
       -> YouTube adapter
  -> normalized DiscoveryEvidence
  -> cross-provider dedupe
  -> existing Hunter judgment
  -> Opportunity
```

## External interfaces verified for implementation

- Hacker News: official v0 Firebase API, no current API rate limit documented; implementation still imposes Kairo fan-out budgets.
- Bluesky: public reads may use the cached `public.api.bsky.app` AppView; public AppView limits are described as generous but still require 429-aware behavior.
- YouTube Data API: `search.list` is key-backed and uses its own granular search quota; Kairo will not paginate and will keep its own much lower per-run limit.
- RSS/Atom: only explicitly configured HTTP(S) feed URLs are fetched; no discovery-by-scraping.

## TDD work units

### 1. Provider router

Add a source-key aware gateway while preserving `KairoToolGateway` compatibility.

Tests:
- absent source uses Agent Reach fallback;
- registered source routes to correct adapter;
- unknown source fails closed;
- provider error can be returned to Hunter as isolated degradation rather than global failure.

### 2. RSS/Atom

Implement `RssAtomDiscoveryProvider` with injected fetch and feed definitions.

Tests:
- RSS 2.0 item normalization;
- Atom entry normalization;
- HTML/entity cleanup;
- tags select relevant feed definitions;
- malformed feed isolation;
- unsafe feed URL rejection;
- response-size limit;
- maxResults enforcement.

### 3. Hacker News

Implement `HackerNewsDiscoveryProvider` using official v0 endpoints.

Tests:
- list + item requests are bounded;
- dead/deleted/non-story records ignored;
- external URL preferred, HN item URL fallback;
- deterministic text relevance;
- duplicate story IDs collapsed;
- cache prevents repeated list/item network calls within TTL;
- timeout/5xx failure is provider-local.

### 4. Bluesky

Implement `BlueskyDiscoveryProvider` against public AppView `app.bsky.feed.searchPosts`.

Tests:
- request uses public host and bounded `limit`;
- post text/author/time normalize correctly;
- AT URI converts to bsky.app profile/post URL when record key and handle are available;
- malformed posts ignored;
- 429/5xx treated as provider degradation;
- no authentication header or credential accepted.

### 5. YouTube

Implement `YouTubeDiscoveryProvider` with constructor-injected API key/secret value and fetch.

Tests:
- missing/blank key => provider unavailable before network call;
- key is only in outbound provider URL/header and never returned in errors/provenance;
- `search.list` uses `part=snippet&type=video` and bounded `maxResults`;
- no pagination;
- malformed/non-video results ignored;
- 403/429 quota conditions are provider-local.

### 6. Hunter integration

Change executable source plan from Agent-Reach-only to registered discovery sources.

Tests:
- AI plan can invoke RSS/HN/Bluesky/YouTube + fallback according to source policy;
- Umrah plan never invokes HN because weight is zero;
- failure of one provider does not fail successful evidence from another;
- cross-provider same canonical URL is deduplicated before model judgment;
- explicit legacy query still performs one Agent Reach call;
- empty evidence never invokes the model.

## Cost and quota controls

- Source Registry remains the first per-run query ceiling.
- `maxEvidence` remains bounded 1..20.
- HN uses internal candidate inspection cap and cache.
- Bluesky and YouTube use one page only.
- RSS fetch count is bounded by matching configured feed definitions and source query ceiling.
- no raw unbounded feed enters the model.

## Security review points

- URL allow rules for feeds and provider endpoints.
- abort/timeouts on every network call.
- response size cap before XML/JSON parse where applicable.
- YouTube key redaction/non-propagation.
- no dynamic shell/browser execution.
- public/global scope only for these adapters.

## Certification path

`ready-for-implementation -> implementing -> testing -> certification -> certified`

At each transition:
- keep runtime head exact;
- run Product Intake, Security baseline and CI;
- freeze candidate before human certification;
- do not merge/release automatically.
