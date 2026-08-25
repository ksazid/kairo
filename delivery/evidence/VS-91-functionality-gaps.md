# VS-91 Functionality Gap Register

Durable UI-first gap ledger for the frozen UI conformance program. This evidence file is reconciled into `product/UI-IMPLEMENTATION-CONTRACT-2026-08-25.md` before Milestone A certification.

| Gap ID | Surface | Approved UI/control implemented | Missing functionality | Truthful interim behaviour | Dependency / later owner | Status |
|---|---|---|---|---|---|---|
| FG-001 | Avatar (Presenter) | Provider setup / Create & Save / Test clip states | Avatar generation provider may be unavailable or unconfigured | Approved `Not ready yet` / provider-setup state; never fake generation success | Media-provider integration | VERIFY DURING IMPLEMENTATION |
| FG-002 | Home → My idea | Photo, Video and + Media controls | No verified attachment/upload or existing-media selection path is wired into the Home recommendation request | Controls remain visible but disabled with explicit unavailable affordance; URL and text continue to work | Home creation + media library/upload integration | UI IMPLEMENTED — FUNCTION PENDING |
| FG-003 | Home → For you | Bookmark/save control on recommendation cards | No verified recommendation-save persistence/API exists | Bookmark control remains visible but disabled; recommendation itself remains usable | Recommendation persistence | UI IMPLEMENTED — FUNCTION PENDING |
| FG-004 | Home → What’s working | Period selector and trend/sparkline treatment | Current Home data path exposes latest available metrics but no verified historical-series/period query for this surface | Period selector remains visible as disabled `Latest available`; no sparkline is fabricated; missing metrics show `— / No data yet` | Performance time-series query | UI IMPLEMENTED — FUNCTION PENDING |
| FG-005 | Home → For you | Thumbnail area on recommendation cards | Current opportunity DTO contains no verified thumbnail/media reference | Approved thumbnail frame is rendered with neutral format-aware placeholder rather than a fake image | Recommendation/media enrichment | UI IMPLEMENTED — FUNCTION PENDING |
| FG-006 | Content → List | Thumbnail-led content rows | Current content-list view model contains format/channel/status metadata but no verified preview/thumbnail URL | Approved thumbnail frame is rendered with a neutral format-aware placeholder; no fake creative is shown | Content preview/media enrichment | UI IMPLEMENTED — FUNCTION PENDING |
| FG-007 | Content → Preview / Detail | Replace media secondary control | No verified single general-purpose replace-media action is exposed on the destination-aware preview surface; carousel/reel media editing remains available through their dedicated editors | `Replace media` remains present but disabled on the shared preview until a destination-safe replacement action is wired | Content media editing | UI IMPLEMENTED — FUNCTION PENDING |
| FG-008 | Content → Reel destination preview | Large final platform-aware video preview | The current campaign-detail/video-project web path exposes structured scenes and editor state but no verified finished-video URL for the frozen preview surface | Render a truthful `Video preview isn’t ready yet` state with a route to the Reel editor; never represent the storyboard as a finished video | Reel rendering/media output projection | UI IMPLEMENTED — FUNCTION PENDING |

## Rules

- UI gaps do not authorize design changes.
- Do not implement gap behavior until the complete frozen UI program reaches Milestone A unless rendering/testing a truthful state strictly requires it.
- Never close a gap because its control merely renders.
- Add exact evidence as each later surface is audited.
