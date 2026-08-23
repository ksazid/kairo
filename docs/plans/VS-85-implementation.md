# VS-85 Implementation Plan — Simplified Home Intelligence and Creation

## Objective
Implement the approved Home experience without replacing Kairo's existing governed intelligence and publishing architecture.

## Execution sequence

### 1. Delivery/governance handoff
- move VS-84 out of the active slice while keeping REL-005 in post-release observation;
- track the unobserved zero-Workspace production path in issue #175;
- activate VS-85 with the already approved Home scope and implementation authority;
- do not imply certification, merge, release or production enablement.

### 2. Home view model
Build a small Home-specific view-model layer from existing sources:
- channel accounts / actionable connection state;
- Brand Opportunities;
- Calendar publish commands;
- Performance metrics;
- accepted Brand Learnings;
- Ideas and Campaigns.

Each secondary source must fail independently so one unavailable dataset does not make Home unavailable.

### 3. My Idea preflight recommendation
Add a side-effect-free recommendation contract before durable simple creation.

Input:
- Brand ID;
- idea/request text;
- optional public link;
- optional input kind when a real media path exists.

Output:
- inferred immediate goal;
- recommended format;
- concise reason;
- supported format choices.

Initial ranking should be deterministic and explainable, using:
- explicit input cues;
- information density/length;
- source/media kind;
- accepted Brand performance/format learning where available.

The preflight must not create an Idea, Research dossier, Angle or Campaign.

### 4. My Idea composer
Create a focused client component on Home:
1. user enters idea/link;
2. Kairo analyses;
3. recommended format appears;
4. user accepts or overrides;
5. `Create <format>` starts the existing simple-creation pipeline using the inferred goal.

Do not retain the legacy goal questionnaire.

### 5. For You
Transform eligible Opportunities into:
- one Spotlight top pick;
- up to three Compact alternatives;
- optional secondary path to deeper Discover.

No Opportunity means an honest minimal empty state, not filler.

### 6. Up Next
Use Calendar publish commands and map internal states to plain states:
- scheduled → Scheduled;
- failed/manual-required → Needs attention;
- published → Published where it is still useful context.

Prefer future/next actionable content. Do not surface dispatch/retry/provider internals.

### 7. What's Working
Use actual Performance metrics and accepted Learnings.
- show a maximum of a few meaningful KPIs;
- surface one supported learning/interpretation;
- route `Create similar` into My Idea with a useful starting point where possible;
- keep Results as secondary navigation.

### 8. Continue
Rank unfinished current Brand work from Ideas/Campaigns.
- one Spotlight item;
- up to two Compact items;
- context action Continue/View;
- no full history dump.

### 9. Visual hierarchy and motion
Use distinct section treatments while preserving one system.
- avoid repeated identical card shells;
- use small entrance/stagger motion only where it improves orientation;
- keep press/state transitions short;
- support reduced motion;
- mobile first with five primary destinations.

### 10. Verification
Required before certification readiness:
- typecheck;
- unit/integration tests for recommendation logic;
- web build;
- responsive/static UI checks where available;
- `npm run preflight`;
- `npm run runtime:verify`;
- Product Intake;
- Security baseline;
- CI;
- UI Review against VS-85 acceptance criteria.

## No-migration preference
VS-85 should remain migration-free unless implementation evidence proves durable schema changes are necessary. The format recommendation is intentionally side-effect-free and should not introduce another source of truth.

## Rollback direction
Before any future release, prepare rollback to the immediately previous certified Home runtime. No data rollback should be required if VS-85 remains migration-free. Existing durable Ideas/Campaigns created by the simple-creation pipeline must remain valid if the Home presentation is rolled back.
