---
title: Kairo UI Functionality Gap Register
status: Active
owner: Product / Engineering
last_updated: 2026-08-25
rule: Approved UI is implemented first; unavailable behavior remains truthful and is connected after frozen UI implementation is complete.
---

# Kairo UI functionality gap register

This register records approved controls or visual states whose supporting runtime behavior is not currently available. A missing capability must not cause the approved UI to be removed, redesigned or replaced with a different information architecture.

Interim UI must remain truthful: unavailable controls are disabled or show an explicit unavailable/not-configured state. No fake upload, save, provider, analytics or publishing behavior is permitted.

## VS-91 — Home

| ID | Approved UI | Current runtime gap | Truthful interim UI | Later implementation target |
|---|---|---|---|---|
| FG-HOME-001 | My Idea → Photo | Current Home creation request does not carry a photo attachment end to end. | Photo control is present and disabled with an availability explanation. | Add governed photo attachment upload/reference to the Home creation contract and content lineage. |
| FG-HOME-002 | My Idea → Video | Current Home creation request does not carry a video attachment end to end. | Video control is present and disabled with an availability explanation. | Add governed video attachment upload/reference to the Home creation contract and content lineage. |
| FG-HOME-003 | My Idea → + Media | Current Home flow has no approved existing-media picker binding. | + Media control is present and disabled with an availability explanation. | Connect the approved media-library picker without changing My Idea hierarchy. |
| FG-HOME-004 | For You → save/bookmark | Home does not currently expose a dedicated mutation for saving/reversing a recommendation from this surface. | Bookmark control is visible; existing saved state may be reflected, but mutation is disabled. | Reuse the governed opportunity save action on Home when its frontend binding is approved. |
| FG-HOME-005 | For You → View all | The legacy Discover/Hunter route is explicitly hidden from the normal creator UI and there is no approved replacement recommendations destination yet. | View all remains visible but disabled; Home never links to legacy Discover. | Connect to an approved creator-facing recommendation collection after the UI program is complete. |
| FG-HOME-006 | What's Working → period selection and sparklines | Current Home performance input exposes observations, not a governed selectable-period historical series suitable for truthful trends. | Last 30 days selector is visible but disabled; metric values render only when verified; no fabricated sparkline is drawn. | Add period-aware performance query/series and truthful trend rendering. |
| FG-HOME-007 | For You → useful thumbnail | Current Brand opportunity DTO contains ranking/evidence scores but no approved thumbnail/media field. | A neutral `Preview unavailable` media placeholder is shown instead of a fabricated image. | Add evidence-backed recommendation thumbnail/media projection when available. |

## Completion rule

These gaps are intentionally **not** implementation blockers for the frozen UI pass. They become runtime work only after the complete approved UI program has finished its visual implementation/certification sequence, unless a separate governed slice explicitly promotes one earlier.

When a gap is implemented, preserve this historical row and append implementation evidence/status rather than deleting the record.
