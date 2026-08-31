# Kairo UI v2 — Design QA

## Home

Reference: approved Kairo Home mockup supplied by the Product Owner.

| Surface | Result |
| --- | --- |
| Independent dark shell and dedicated design tokens | Passed |
| Sidebar, brand controls, creation formats and viral-link analysis | Passed |
| Three-column recommendation, Continue Working, learning and discovery rail | Passed |
| Desktop and mobile responsive behavior | Passed |

## Discover Table and Grid

Reference: `/workspace/scratch/9b13db4cc8b7/upload/0241D33D-99EC-40CD-8D4F-3240222ADB62.jpeg` (1536 × 1024).

Implementation: `https://kairo-ui-v2-9tdybjbk3-sazid62-gmailcoms-projects.vercel.app/discover`, captured in the cloud browser at 1363 × 936 in Table state.

### Visual comparison

The approved reference and the browser-rendered implementation were reviewed together in one comparison pass. The implementation preserves the reference hierarchy, dark shell, typography scale, image-led opportunity rows, fit and trend evidence, format/source metadata, circular BI confidence, and aligned Preview/Save/Dismiss action row. The approved Table/Grid control is additive. At the narrower QA viewport the filters wrap to a safe second row instead of colliding.

| Surface | Result |
| --- | --- |
| Kairo shell, navigation and active Discover state | Passed |
| Discover heading, search, status filters and Refresh action | Passed |
| Detailed Table columns and opportunity imagery | Passed |
| Brand-fit, trend, format, channel, source and BI confidence data | Passed |
| Preview, Save and Dismiss action alignment | Passed |
| Alternate visual Grid using the same records and actions | Passed |
| Table/Grid selection persistence | Passed |
| Responsive filter wrapping and safe table width | Passed |

### Iteration history

1. Initial comparison found filter collision and clipped Actions at 1363 px (P1).
2. Filters were moved to a responsive second row below 1400 px and table columns were rebalanced.
3. Final comparison confirmed all Actions visible, no broken images, no page overflow, and no remaining P0/P1/P2 visual issue.

### Interaction verification

- Table/Grid parity: 6 records in both views.
- View persistence: Grid persisted across reload; Table restored on selection.
- Search: `airport` returned the single matching opportunity.
- Developing filter: returned the road-trip checklist opportunity.
- Save: changed the selected item to its saved state.
- Dismiss: reduced the result set from 6 to 5.
- Refresh discovery: restored all 6 records.
- Preview: routed to the matching `/discover/[id]` concept-preview page; browser Back returned to Discover.
- Console: no application-origin warnings or errors. Cloud-browser extension metadata errors were excluded as external tooling noise.

### Accepted responsive differences

- The reference shows 4 rows at 1536 px; the implementation uses 6 realistic records and naturally continues below the viewport.
- The implementation includes the approved Table/Grid selector and Channel filter.
- The 1363 px QA viewport uses a two-row filter layout; the 1536 px target retains the wider composition.

## Content List

Reference: `/workspace/scratch/9b13db4cc8b7/upload/2694B50A-D08B-4AF4-97DC-3B7175C7C1B0.jpeg` (1536 × 1024).

Implementation: Vercel preview deployment `dpl_9kdo3ioa8jBCVijZQLeEmsTaB5te`, captured in the cloud browser at 1365 × 936 in Table state.

### Visual comparison

The approved reference and browser-rendered implementation were reviewed together in one comparison pass. The implementation preserves the approved dark shell, heading and action hierarchy, three filter groups, image-led rows, channel and format metadata, lifecycle status, update timestamp, and aligned Open Preview action. The approved shared Table/Grid listing control and Campaigns shell link are additive.

| Surface | Result |
| --- | --- |
| Kairo shell, navigation and active Content state | Passed |
| Content heading, Create Content action and filter hierarchy | Passed |
| Detailed Table columns, row dimensions and imagery | Passed |
| Format, channel, status and timestamp metadata | Passed |
| Open Preview action alignment | Passed |
| Alternate visual Grid using the same records and actions | Passed |
| Table/Grid selection persistence | Passed |
| Responsive wrapping and safe table width | Passed |

### Interaction verification

- Table/Grid parity: 4 records in both views.
- View persistence: Grid persisted across reload; Table restored on selection.
- Search: `Scenic` returned the single matching asset.
- Scheduled filter: returned 1 asset.
- Carousel filter: returned 2 assets.
- Preview: each Open Preview action routed to the matching `/content/[campaignId]/[assetId]` page.
- Media: all browser-rendered images completed with a non-zero natural width.

### Accepted responsive differences

- The implementation includes the approved shared Table/Grid selector and the separately approved Campaigns shell link.
- Preview mode identifies fixture data in the top bar; authenticated mode projects existing Brand-scoped records.
- At the 1365 px QA viewport, spacing and typography scale proportionally while retaining the reference hierarchy.

## Content Preview

Reference: approved Content Preview hierarchy preserved in the existing Kairo content-preview implementation and the same Kairo visual language as the supplied Content List reference.

Implementation: `/content/malta-summer/content-one` in Vercel preview deployment `dpl_9kdo3ioa8jBCVijZQLeEmsTaB5te`.

| Surface | Result |
| --- | --- |
| Back link, content identity and lifecycle metadata | Passed |
| Platform-aware Post, Reel and Carousel media | Passed |
| Caption and social-preview context | Passed |
| Content details and evidence-safe performance state | Passed |
| Carousel navigation and card rail | Passed |
| AI assistance preview states | Passed |
| Approve, lock and schedule interactions | Passed |
| Authenticated handoff to the canonical full editor | Passed |

### Interaction verification

- Carousel navigation advanced from card `1/4` to `2/4` and card selection stayed synchronized.
- Improve Copy updated the preview caption and exposed a save-in-editor notice.
- Approve & Lock enabled Schedule; Schedule advanced the preview to its scheduled state.
- Reel rendered a visible Play control; Post rendered without Carousel controls.
- Back to Content returned to the shared list.
- No application-origin browser warnings or errors were recorded. Cloud-browser extension metadata errors were excluded as external tooling noise.

### Iteration history

1. Initial build used a 3.1 MB generated harbour PNG (P2 delivery weight).
2. The same generated asset was converted to an optimized 332 KB WebP without changing its crop or visual role.
3. Final comparison confirmed the approved hierarchy, healthy images, aligned actions and no remaining P0/P1/P2 visual issue.

## Campaign List

Reference: `/workspace/scratch/9b13db4cc8b7/upload/4F1108A2-D536-4B69-B508-6EB84281F826(1).jpeg` (1536 × 1024).

Implementation: `/campaigns`, captured in the cloud browser at 1365 × 917 in Table state.

### Visual comparison

The approved reference and the browser-rendered implementation were opened together and compared at the same desktop state. The implementation preserves the approved dark shell, Campaigns hierarchy, image-led rows, objective, circular progress, date range, status, aligned Open Campaign action, and pagination. The separately approved Campaigns shell link and Table/Grid selector are additive.

| Surface | Result |
| --- | --- |
| Kairo shell, navigation and active Campaigns state | Passed |
| Campaigns heading, Create Campaign action and filter hierarchy | Passed |
| Detailed Table columns, row density and image crops | Passed |
| Format, channel, progress, date and lifecycle metadata | Passed |
| Open Campaign action alignment | Passed |
| Alternate visual Grid using the same records and actions | Passed |
| Table/Grid selection persistence | Passed |
| Responsive wrapping and safe table width | Passed |

### Interaction verification

- Table/Grid parity: 3 campaigns in both views.
- View persistence: Grid persisted across reload; Table restored on selection.
- Search: `engagement` returned the single matching campaign.
- Draft filter: returned the single draft campaign; All restored all 3 campaigns.
- Open Campaign: routed to the matching `/campaigns/[campaignId]` preview.
- Layout: all 3 Open Campaign actions remained visible at 1365 px with no horizontal page overflow.
- Media: all browser-rendered images completed with a non-zero natural width.
- Console: no application-origin warnings or errors. Cloud-browser extension metadata errors were excluded as external tooling noise.

### Iteration history

1. Initial comparison found the Actions column clipped at the 1365 px QA viewport (P1).
2. Campaign columns and gaps were rebalanced while preserving the 1536 px reference proportions.
3. Final comparison confirmed all Actions visible and no remaining P0/P1/P2 visual issue.

### Accepted responsive differences

- Preview mode identifies fixture data in the top bar; authenticated mode projects existing Brand-scoped records.
- The Malta imagery follows the approved subject, palette and crop direction but is not the exact reference photograph; this is accepted P3 polish pending the planned per-section image agent.

## Campaign Preview

Reference: `/workspace/scratch/9b13db4cc8b7/upload/5E5819BA-6F5C-49B2-B908-18494710679D(1).jpeg` (1536 × 1024).

Implementation: `/campaigns/malta-summer`, captured in the cloud browser at 1365 × 917 in Draft state.

### Visual comparison

The approved reference and the browser-rendered implementation were opened together and compared at the same desktop state. The implementation preserves the approved campaign identity, objective and readiness summary, two-column Overview/Content Set composition, quality score, channel timeline, and three-part publishing action row.

| Surface | Result |
| --- | --- |
| Back link, lifecycle badge, campaign identity and readiness | Passed |
| Continue Campaign and Save actions | Passed |
| Campaign overview terms and campaign-quality score | Passed |
| Three-item coordinated Content Set and asset actions | Passed |
| Instagram and LinkedIn channel schedule | Passed |
| Review, Schedule and Publish action row | Passed |
| Responsive stacking and safe page width | Passed |

### Interaction verification

- Save changed visibly to Saved.
- View Recommendations exposed campaign guidance.
- LinkedIn selected its channel timeline state.
- View Full Schedule exposed a schedule notice.
- Review All exposed a review-ready notice.
- Schedule Campaign changed the campaign to scheduled state.
- Publish Campaign changed the campaign to published state.
- Every Content Set Open action routed to the matching v2 Content Preview.
- Back to Campaigns returned to the shared Campaign List.
- Media: all browser-rendered images completed with a non-zero natural width.
- Console: no application-origin warnings or errors. Cloud-browser extension metadata errors were excluded as external tooling noise.

### Iteration history

1. Initial comparison found preview objective/date copy and asset titles did not fully match the approved reference (P2).
2. Copy, dates, content titles and top workspace spacing were corrected.
3. Final comparison confirmed the complete approved section hierarchy and no remaining P0/P1/P2 visual issue.

### Accepted responsive differences

- At the 1365 × 917 QA viewport the publishing row starts below the first viewport and remains directly beneath the schedule; the 1536 × 1024 reference shows it in-frame.
- Malta images use the same approved visual direction rather than the exact source photographs; this is accepted P3 polish pending the planned per-section image agent.

final result: passed
