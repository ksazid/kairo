# VS-34 — Format Intelligence Library implementation plan

## Design read

Authenticated secondary product workflow. The user job is to choose an appropriate Kairo content format with enough guidance to make a decision quickly. Density is moderate and should reuse the existing More/Ideas design family: quiet rows, restrained metadata, visible Brand scope and no dashboard-style tile wall.

## Implementation strategy

1. Add a pure domain `format-intelligence` module with validated canonical profiles for text, image, video, carousel and reel.
2. Map each profile to the existing `PublishContentType` and, when applicable, the existing Marketing Lab `MarketingFormat`.
3. Encode advisory channel fit, common objectives, production effort, strengths, trade-offs, composition guidance and review checks.
4. Add a deterministic ranking function whose score is derived only from visible inputs and whose reasons are returned to callers.
5. Keep actual publication support outside this module; the existing `ChannelAccount.capabilities` / publishing gateway remains authoritative.
6. Cover uniqueness, stable ordering, mapping, objective/channel/effort ranking and anti-causal language constraints with domain tests.
7. Export the new module from `@kairo/domain`.
8. Add `/brands/:brandId/formats` as a server-rendered page with URL-state filters for channel, objective and effort.
9. Add the page to the existing More surface instead of expanding primary navigation.
10. Run formal UI review against `product/DESIGN.md` and UI UX Pro Max: semantic headings/labels, keyboard-first native controls, no colour-only meaning, responsive single-column collapse, calm content-first hierarchy.
11. Move the slice to testing and run Product Intake, Security, repository preflight, runtime verification and dashboard build through PR CI.
12. Freeze an exact SHA and stop for certification + merge approval.

## Domain model

### Format profile

Each profile contains:

- `key`: current Kairo publish content type;
- `strategyFormat`: existing Marketing Lab vocabulary when it maps cleanly;
- `label` and concise summary;
- production effort (`low`, `medium`, `high`);
- objective tags;
- channel-fit records (`primary`, `useful`, `limited`);
- strengths;
- trade-offs;
- composition guidance;
- pre-approval review checks;
- optional existing creative-plan contract (`carousel-plan`, `reel-plan`).

### Recommendation

Inputs:

- optional channel;
- optional objective;
- optional maximum production effort.

Output:

- stable ranked profiles;
- deterministic numeric score used only for ordering;
- concise user-visible reasons.

The score is not a performance prediction and must never be presented as one.

## Recommendation scoring

- channel fit: primary +30, useful +18, limited +4;
- objective match: +24;
- requested effort compatibility: incompatible formats are filtered out;
- lower effort receives a small deterministic tie-break preference when no objective differentiates formats;
- final tie break is canonical catalog order.

## UI states

- normal: ranked format guidance with filters;
- filtered: active filter values remain visible in native controls;
- no-match: explain that current filters have no matching format and provide a clear reset link;
- Brand missing: reuse existing Brand-not-found treatment.

No loading skeleton or client error state is required because the library is compile-time domain data and the page is server-rendered; Brand retrieval keeps the existing route-level behavior.

## Responsive behavior

- Desktop: page header plus one readable working column; filters may share a row when space permits.
- Tablet: filter controls wrap naturally.
- Mobile: single-column filters and format rows; no horizontal scrolling; primary bottom navigation remains unchanged.

## Test strategy

- all current publish content types represented exactly once;
- profile IDs/keys are unique and immutable;
- MarketingFormat mapping is valid;
- carousel/reel point to their existing creative-plan contracts;
- ranking is stable for identical inputs;
- channel and objective matches outrank weaker fit;
- max-effort filter removes higher-effort profiles;
- recommendation reasons are concise and do not claim guaranteed performance;
- repository preflight/runtime/dashboard build;
- Product Intake + Security;
- formal source/responsive/accessibility UI review.

## Safety

- no credentials;
- no network calls;
- no provider limits treated as authoritative;
- no database change;
- no approval mutation;
- no PublishCommand creation;
- no autonomous scheduling or publication;
- no deployment.
