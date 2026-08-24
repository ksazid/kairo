# VS-87 implementation plan

## Design read

Page family: authenticated product workflow. User job: find content needing action, inspect the exact current execution, approve it, then publish/schedule. Density: low-to-medium. Visual family: existing Kairo calm editorial workspace; no redesign or new design system.

## Authority

1. `product/PRD.md` FR-10..FR-15
2. `product/DESIGN.md`
3. `product/DESIGN-APPROVALS.md` Content + Preview/approval/publish lock
4. `docs/plans/KAIRO-UI-TRACEABILITY-2026-08-24.md`
5. `docs/slices/VS-87.md`
6. UI UX Pro Max, Ponytail/Impeccable where installed, then Superpowers execution/review

## Steps

1. Add pure Content list state model with deterministic tests.
2. Add `/brands/:brandId/content` single-column Content library and approved filters.
3. Point primary Content navigation to the library while retaining Campaign identifiers/routes for internal lineage compatibility.
4. Add focused `/brands/:brandId/content/:campaignId/:assetId` Content Detail / Preview route.
5. Reuse exact current Content Version and existing review/approval/publishing contracts.
6. Reuse existing carousel exact-render and Reel project surfaces; never pretend a storyboard is a finished rendered video.
7. Replace raw destination account-reference input with connected destination selection on canonical Content Detail.
8. Keep AI actions, review findings, evidence and versions behind progressive disclosure.
9. Keep Presenter hidden because no Brand Avatar capability exists yet.
10. Normalize carousel/video sub-surface navigation language back to Content.
11. Add regression tests for navigation and content state mapping.
12. Run Product Intake, Security, preflight, governance, typecheck, tests and production build through PR CI.
13. Stop for exact-SHA certification/merge approval. No release or deployment.

## Responsive behavior

- Desktop: one readable list; Detail uses single dominant content flow with contextual details disclosed locally.
- Mobile: horizontal filter strip, single-column items, touch-safe actions, no compressed dashboard.
- Preview channel tabs are horizontally scrollable only when needed and contain only actual generated channel executions.

## State model

- Draft → Needs you → Continue
- Revision required → Needs you → Review
- Review passed / no approval → Needs you → Review
- Approved / no publish command → Ready → Publish
- Scheduled → Scheduled → View
- Dispatching/unknown → Publishing/Processing → Scheduled bucket → View
- Failed/manual-required → Needs you → Review
- Published → Published → See results

## Exclusions

No API/worker/database/provider/auth changes. No autonomous publish. No Avatar implementation. No Calendar/Insights redesign. No production deployment.
