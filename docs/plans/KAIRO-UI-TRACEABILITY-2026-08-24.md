---
title: Kairo UI Implementation Traceability
status: Approved-design input
owner: Product Design / Frontend
last_updated: 2026-08-24
sources:
  - product/PRD.md
  - product/TRD.md
  - product/DESIGN.md
  - product/DESIGN-APPROVALS.md
  - delivery/decisions.json
---

# Kairo UI Implementation Traceability

## Purpose

This document is the implementation-readiness map for the approved Kairo UI. It does not create new product scope. It maps user-facing surfaces to existing product/design authority so frontend implementation can be reviewed for fidelity instead of reinterpreting the design.

## Global implementation contract

- `product/DESIGN.md` is the visual and interaction authority.
- `product/DESIGN-APPROVALS.md` contains later explicit approvals and supersedes older conflicting design details until folded into the next DESIGN version.
- Primary navigation remains exactly: Home, Content, Calendar, Insights, Brand.
- Creation starts from Home through `My Idea` or `For You`.
- Settings remains secondary under Profile/Settings.
- Primary user outcomes should stay within four clicks where Kairo can safely do the rest.
- AI reduces decisions and suggests useful defaults; it does not expose agent machinery.
- One obvious primary action per local context.
- Technical/provider details use progressive disclosure.
- Web and mobile share the same information hierarchy and design language.

## Screen and interaction traceability

| Surface | Product authority | Design authority | Locked interaction | Implementation status |
|---|---|---|---|---|
| Authenticated shell | PRD web/mobile product | DESIGN shell | Five destinations; Brand context; Notifications; light/dark; Profile/Settings | Ready |
| Home | PRD product principles, Brand onboarding/channel follow-up | DESIGN Home | Needs Attention, My Idea, For You, Up Next, What’s Working, Continue | Ready |
| Content list | FR-11, FR-13 | DESIGN Content + approvals | Calm Smart Item list; state-aware action; user-language filters | Ready |
| Content detail/editor | FR-11, FR-12 | DESIGN Content | Content-first editor; contextual AI; evidence/technical detail secondary | Ready |
| Preview | FR-11, FR-13, FR-15 | DESIGN approvals | Exact final per-channel assets/copy; selected channel tabs only | Ready |
| Approval | FR-13 | DESIGN approvals | `Approve & Lock`; freeze exact version/asset lineage | Ready |
| Publish now | FR-15 + VS-70 | DESIGN approvals | Primary post-approval action on Preview | Ready |
| Schedule | FR-14 + VS-07/VS-70 | DESIGN approvals | Secondary progressive action; common time default; per-channel time advanced | Ready |
| Calendar desktop | FR-14 | DESIGN + approvals | Week default; Month/Agenda secondary; lightweight detail; no duplicate editor | Ready |
| Calendar mobile | FR-14 | DESIGN approvals | Week/date strip + chronological agenda grouped by day | Ready |
| Insights | FR-16, FR-17, FR-18 | DESIGN Results + approvals rename | What happened → Why → What to do next; 1–2 useful charts; actionable ranked content | Ready |
| Brand profile | FR-03 | DESIGN Brand + approvals | Identity, Audience, Voice & Style, Content Pillars; inline-first editing | Ready |
| Brand Sources | FR-03, FR-04 | DESIGN Brand + approvals | Brand-learning sources; health/sync/recovery; confirmed vs inferred | Ready |
| Brand Channels | FR-05 + DEC-004/DEC-011 | DESIGN approvals | Authenticated publish/Insights destinations; Connect/Manage; OAuth and destination selection | Ready |
| Brand Avatar | Brand/content extension approved in design log | DESIGN approvals | Optional presenter profile; AI-assisted setup; no new primary workflow | Ready |
| Presenter during creation | FR-11-compatible optional media execution | DESIGN approvals | Hidden unless Brand has avatar; `None` default; Kairo may recommend | Ready |
| Notifications | Shell + operational recovery requirements | DESIGN shell + approvals | Deep-link to actual affected Content, Channel, Calendar or Insights context | Ready |
| Settings | FR-01 / secondary utility policy | DESIGN shell + approvals | Profile/Settings only; no primary-nav destination | Ready |
| AI & Media Providers | Provider-neutral AI principle | DESIGN approvals | Capability-first overview; managed/custom/self-hosted; default/fallback; advanced technical disclosure | Ready |

## Four-click checks

### Ready content → publish now

1. Open content
2. Approve & Lock
3. Publish now

Pass: 3 clicks.

### Ready content → schedule

1. Open content
2. Approve & Lock
3. Schedule for later
4. Confirm

Pass: 4 clicks.

### Calendar → reschedule

1. Open scheduled item
2. Reschedule
3. Choose time
4. Confirm

Pass: 4 clicks.

### Brand → create optional avatar

1. Brand → Avatar
2. Create avatar
3. Review/accept AI suggestions
4. Create & Save

Pass: 4 clicks for the normal path.

### Channel connection

Normal path should remain: Brand → Channels → Connect → authorize/select destination → connected. If the external OAuth provider itself requires additional consent screens, those provider-controlled interactions do not justify adding more Kairo configuration steps.

## Shared state model

Every relevant surface should implement only the states it genuinely needs from this shared vocabulary:

- Loading
- Empty
- Ready
- Processing
- Success
- Needs attention
- Failed

Examples:

- Publishing: Approved → Publishing/Processing → Published or Failed.
- Channel: Connected / Needs attention / Not connected.
- Media provider: Ready / Fallback active / Needs attention / Failed.
- Analytics: unavailable metrics are labelled `Unavailable`, never coerced to zero.
- Avatar failure should not block non-avatar content generation; user can proceed without presenter where safe.

## Responsive implementation gates

### Desktop

- Persistent ~240–248px sidebar.
- Main content hierarchy remains visually dominant over shell.
- Secondary context columns only where useful.
- No dense dashboard reinterpretation.

### Mobile

- ~60–64px quiet header.
- Exactly five equal-width bottom-nav destinations.
- Single-column primary flows.
- Calendar uses agenda/week, not compressed month grid.
- Brand editing remains inline-first where touch-safe; use a focused sheet only when an edit is genuinely too complex for local editing.

## Visual fidelity gates

Reject implementation if it introduces any of the following without a new approved design decision:

- additional primary navigation;
- generic KPI-card dashboard treatment;
- gradients, glow, glassmorphism or ornamental AI visuals;
- large decorative primary-purple surfaces;
- card-per-paragraph/card-per-metric clutter;
- permanent agent/research/critic/judge workflow chrome;
- technical provider credentials in normal UX;
- mandatory avatar setup;
- separate mandatory Publish/Schedule page;
- platform previews for channels that were not selected;
- false `Published` state before provider settlement;
- forms/modals replacing simple Brand inline edits.

## Skill order for frontend implementation

Per `AGENTS.md`, repository skills remain subordinate to approved requirements and design:

1. Approved PRD/TRD/decisions/active slice
2. `product/DESIGN.md` and `product/DESIGN-APPROVALS.md`
3. UI UX Pro Max for workflow, responsive behaviour, states and accessibility
4. Impeccable for bounded visual polish/drift correction when installed
5. Emil Design Engineering only where purposeful motion adds clarity when installed
6. Ponytail for React/Next.js implementation quality when installed
7. Superpowers implementation/review workflow
8. Automated accessibility, responsive, visual, security and certification checks

Do not substitute Taste as the primary product-workflow skill.

## Readiness verdict

**Design traceability: PASS**

The previous Brand editing conflict has been resolved in `product/DESIGN-APPROVALS.md` by explicitly superseding the old sheets/forms-first rule with the approved inline-first rule.

No unresolved product-design decision remains in the reviewed primary Kairo flow. Runtime implementation must still obey active-slice scope/implementation approvals and repository governance before code changes begin.
