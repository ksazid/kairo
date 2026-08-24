# VS-86 Implementation Plan — Shell Normalization and Recovery Navigation

## Objective
Apply the approved Kairo shell language and recovery routing with the smallest correct frontend change. Preserve internal route/domain compatibility and defer production rollout until deployment capacity is available.

## Execution sequence

### 1. Governance handoff
- keep VS-85 release/production observation pending rather than fabricating production proof;
- activate VS-86 for runtime implementation only;
- certification, merge, release, production-enable and deployment remain separate gates.

### 2. Product navigation compatibility layer
- preserve internal `Results` as the stable destination key;
- add user-facing display label `Insights`;
- keep existing `/performance` route during this slice;
- update both desktop and mobile rendering to use the display label while active-state logic continues using the stable key.

### 3. Legacy navigation helper normalization
- update `legacy-pilot-navigation.tsx` to expose Home, Content, Calendar, Insights, Brand only;
- update `pilot-mobile-nav.tsx` to expose the same five destinations and map legacy active values into the correct primary destination;
- do not redesign legacy Calendar/Formats page content in this slice.

### 4. Notification deep links
- publishing failure: prefer the affected Campaign/Content detail when `campaignId` exists; otherwise route to Content;
- Instagram reconnect: route directly to existing Instagram connect/recovery path;
- non-Instagram connection recovery: route to Brand until the dedicated Channels landing is implemented;
- preserve existing notification titles/details and truthful state semantics.

### 5. Settings route
- turn Profile → Settings into a real link;
- add a minimal authenticated `/settings` page using the Kairo shell;
- include Appearance using the existing ThemeToggle and account utility/sign-out;
- do not add provider configuration placeholders that imply unsupported functionality.

### 6. Tests
Add/adjust deterministic tests for:
- five primary destinations;
- Insights display label while internal Results remains stable;
- notification recovery href mapping;
- no More item in legacy mobile navigation;
- Settings profile link.

### 7. Verification
Before certification readiness:
- web typecheck;
- relevant unit tests;
- web build;
- governance validation;
- repository preflight;
- Product Intake;
- Security baseline;
- CI;
- UI Review for desktop/mobile navigation, focus, labels and no horizontal overflow.

## No-migration / no-provider change
VS-86 must not require a database migration, provider credential change, provider scope change, publishing worker change or infrastructure change.

## Production deferral
No production deployment is required to complete implementation/testing. Production validation remains deferred until deployment capacity is available and must not be represented as passed beforehand.
