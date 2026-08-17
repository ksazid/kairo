# VS-51 — Ideas + Research + Angles UI Remediation Plan

## Authority

- `AGENTS.md`
- `product/PRD.md`
- `product/TRD.md`
- `product/DESIGN.md`
- `docs/slices/VS-51.md`
- `.agents/skills/ui-ux-pro-max/SKILL.md`
- `.agents/skills/ui-review/SKILL.md`
- `.agents/skills/using-superpowers/SKILL.md`
- `.agents/skills/slice-planner/SKILL.md`
- `.agents/skills/implementer/SKILL.md`
- `.agents/skills/verifier/SKILL.md`

## Implementation steps

1. Reuse VS-50's shared `KairoProductShell` and `KairoScopePicker` for Ideas and Idea detail.
2. Keep compatibility exports from the old Ideas page temporarily so untouched legacy pages do not break before their own remediation slices.
3. Replace the permanent sticky Idea-creation panel with a native `details/summary` capture surface.
4. Preserve the Ideas list as the primary working surface and retain source/status semantics.
5. Restructure Research so summary + claims lead the page; raw evidence and unresolved uncertainty move into one accessible secondary disclosure.
6. Replace the Angle two-column grid with a single-column comparison list.
7. Keep framing visible; move complete strategy metadata and framing edit controls into per-Angle disclosure.
8. Keep selection authority visible and preserve all existing server actions.
9. Rewrite only `apps/web/app/ideas.css` for the bounded hierarchy/responsive changes using Kairo tokens.
10. Run UI review, Product Intake, Security, preflight/runtime verification and dashboard build on the final exact SHA.

## Verification focus

- No changes to create/edit/select action bindings.
- Existing Idea source and lifecycle states remain visible.
- Research claims, verification state, confidence, evidence counts and freshness remain visible.
- Evidence URLs/provenance remain reachable and open safely in a new tab as before.
- Unresolved uncertainty remains explicit rather than hidden or removed.
- Angle audience/objective/hook/value/effort/channel/format remain accessible.
- Selected Angle state remains text-labelled, not colour-only.
- Desktop/tablet/mobile progressively collapse without horizontal overflow.
- Keyboard operation works for capture, Research support and Angle strategy disclosures.

## Explicit exclusions

- No changes to `actions.ts`, API routes, domain packages, migrations, publishing, providers or Content Studio.
- No new dependency.
- No deployment, release, production enablement or merge without the separate gate.
