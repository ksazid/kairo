---
title: Content Intelligence Engine Design Baseline
document_id: CIE-DESIGN-001
version: 1.0
status: Approved
owner: Product Design
last_updated: 2026-08-12
depends_on:
  - CIE-PRD-001
  - CIE-TRD-001
used_by:
  - PES intake
  - CIE web implementation
  - future CIE mobile implementation
---

# Content Intelligence Engine Design Baseline v1.0

## Design authority

This document is the approved visual and interaction baseline for CIE. PES may refine implementation details and responsive behaviour but may not silently replace the visual language, navigation hierarchy or core interaction principles. Material changes require an approved design decision.

The approved reference is the user-selected CIE Design Baseline board from 2026-08-12. The source image supplied during approval is 1536x1024 pixels and has SHA-256 fingerprint:

`dac322756cfd9606ce0941332e83fbcf0fdbbfda76d4b254cd10a10adbe689f1`

The reference board is the visual source of truth; this document translates it into implementation rules.

## Design intent

CIE should feel like a calm, intelligent editorial workspace rather than a dense enterprise social-media dashboard.

The design language is:

- simple;
- minimalist;
- content-first;
- quiet and premium;
- highly legible;
- consistent across web and mobile;
- human-controlled rather than theatrically AI-themed.

Web and mobile must look like the same product. They share typography, colour, spacing, iconography, component language, status semantics and information hierarchy. Mobile adapts interactions and density to the device instead of copying desktop layouts literally.

## Visual principles

### Clarity over clutter
Focus attention on the next useful decision. Remove decorative UI that does not improve understanding or action.

### Content first
Ideas, Opportunities, Research, Content, Campaigns and Performance Intelligence take visual priority over controls and dashboards.

### Calm and minimal
Use whitespace, neutral surfaces, thin borders and restrained elevation. Avoid excessive cards, gradients, glow effects, glassmorphism and ornamental AI visuals.

### Consistent everywhere
The same design tokens and component semantics apply across web and mobile. Platform-native interaction may differ, but the visual DNA remains stable.

### Purposeful colour
CIE uses one restrained primary accent. Semantic colours communicate status or meaning; they are not decoration.

### Human + intelligent
AI supports the user. The interface preserves human authority, explicit approval, evidence and controllability.

## Product values expressed by the UI

- **AI power, human control:** AI generates and recommends; the user decides.
- **Trust and truth:** evidence, provenance and unsupported-claim warnings are visible when relevant.
- **Brand first:** every output visibly belongs to the selected Brand context.
- **Privacy and security:** Workspace/Brand scope and connected-account state are understandable.
- **Performance driven:** the product connects actions to measured outcomes and future recommendations.

## Colour system

Approved core palette from the reference board:

| Token | Value | Use |
|---|---|---|
| Neutral 900 | `#0F1115` | Primary text, high-emphasis icons |
| Neutral 700 | `#33363D` | Secondary text |
| Neutral 400 | `#8A8F98` | Muted metadata, disabled/supporting text |
| Neutral 200 | `#E7E9ED` | Borders, dividers, subtle surfaces |
| Neutral 50 | `#F7F8FA` | Quiet backgrounds and secondary surfaces |
| Primary | `#4F46E5` | Primary actions, selected navigation, focused emphasis |
| Success | `#16A34A` | Approved, positive outcome, healthy state |
| Warning | `#F59E0B` | Needs review, caution, medium-risk state |
| Danger | `#EF4444` | Failure, destructive action, hard policy issue |
| Info | `#0EA5E9` | Informational state where a distinct semantic colour is needed |

White remains the dominant application surface.

Primary purple must not be applied to large decorative backgrounds. It is primarily an interaction and emphasis colour.

## Typography

Primary typeface: **Inter**, with native/system fallback when necessary.

Approved type scale:

| Style | Size / line height | Weight |
|---|---|---|
| H1 | 32 / 40 | Bold |
| H2 | 24 / 32 | SemiBold |
| H3 | 20 / 28 | SemiBold |
| Body | 16 / 24 | Regular |
| Small | 14 / 20 | Regular |
| Caption | 12 / 16 | Regular |

Typography should carry hierarchy before colour, borders or shadows do.

Long-form research and content editing may use comfortable reading widths rather than stretching text across the full viewport.

## Spacing and layout

Use a consistent spacing system derived from a 4px base grid. Implementation should prefer tokenised spacing rather than arbitrary values.

Recommended core steps: 4, 8, 12, 16, 24, 32, 40 and 48px.

Large desktop surfaces should retain generous whitespace. Information density may increase on specialist pages but should remain visually grouped and scannable.

## Radius and elevation

Use modest rounded corners and subtle elevation. Cards should feel like contained working surfaces, not floating decorative tiles.

Recommended baseline:

- controls: approximately 6-8px radius;
- cards/panels: approximately 10-12px radius;
- modals/sheets: approximately 12-16px radius;
- shadows: soft, low contrast, used only where hierarchy needs separation.

Most hierarchy should come from whitespace and borders before shadow.

## Iconography

Use simple outline icons with consistent stroke weight, rounded caps/joins where supported and minimal visual detail.

Icons supplement text; they do not replace important labels unless the meaning is universally understood and accessible.

Avoid mixed icon families in the same product surface.

## Web information architecture

The approved board establishes the following primary working areas:

- Today;
- Discover;
- Ideas;
- Campaigns;
- Content Studio;
- Calendar;
- Performance;
- Brand Brain;
- Settings;
- Help/Support where applicable.

Exact route naming may be normalised against the approved PRD during PES intake, but the product must preserve this simple, content-centric hierarchy rather than expand into enterprise-style navigation.

Desktop uses a persistent left navigation rail/sidebar with clear selected state and Workspace/Brand context.

## Mobile information architecture

Mobile uses a maximum of five primary bottom-navigation destinations.

Approved baseline:

- Today;
- Discover;
- Ideas/Create as appropriate to the final route model;
- Calendar;
- More.

More may contain Performance, Brand Brain, Settings and secondary management flows.

The mobile product must not recreate the entire desktop sidebar as a cramped phone menu.

## Today

Today is the visual and behavioural anchor of the product.

It should answer:

> What deserves my attention now?

The baseline screen contains:

- concise daily briefing language;
- a short ranked list of meaningful Opportunities;
- clear relevance/evidence status;
- short `Why now` explanation;
- one obvious development action;
- lightweight save/bookmark behaviour;
- upcoming work/approvals;
- a compact performance signal.

The product should prefer three strong Opportunities over a wall of weak recommendations.

## Opportunity cards

Opportunity cards prioritise:

1. signal strength/status;
2. title;
3. concise rationale;
4. why now;
5. primary action;
6. optional save/secondary actions.

Images are optional supporting context, not mandatory decoration.

Statuses use restrained semantic text/chips such as High relevance, Medium relevance, Strong evidence, Growing or New.

## Buttons

Three action levels:

- **Primary:** filled primary accent; one dominant action in a local context.
- **Secondary:** neutral/outlined control.
- **Tertiary:** text or low-emphasis action.

Do not fill every card with a purple button. Primary emphasis is scarce.

All controls require hover/focus/pressed/disabled states appropriate to platform.

## Inputs

Inputs remain visually quiet with clear labels, neutral borders and obvious focus state.

Placeholder text cannot replace labels for important fields.

Validation messages use semantic colours plus text/icon indication; colour alone is insufficient.

## Chips and tags

Chips represent compact metadata such as relevance, status, channel and approval state.

They should be short, low-noise and semantically consistent.

Channel chips may use channel identity cues sparingly, but CIE should not visually fragment into multiple external brand systems.

## Cards and panels

Use cards only when a real conceptual grouping or interaction boundary exists.

Avoid the anti-pattern of turning every metric and paragraph into its own card.

Performance pages should favour narrative intelligence plus a few relevant charts rather than a dense tile dashboard.

## Content Studio

The editor should be a calm, content-first workspace.

Primary content remains central. AI controls should be contextual and secondary rather than occupying permanent visual prominence.

Research evidence, version history, Critic findings and approval state should be accessible without crowding the writing surface.

## Brand Brain

Brand Brain should read as a structured profile/knowledge workspace, not a developer configuration screen.

User-confirmed and AI-inferred information must be distinguishable where material, consistent with the PRD.

## Performance

Performance design answers:

1. What happened?
2. Why might it have happened?
3. What should we do next?

Use a small number of charts when they improve interpretation. Narrative recommendations and evidence should take precedence over decorative analytics.

## Web/mobile consistency

The same task should retain the same conceptual hierarchy across platforms.

Example:

```text
Web Today
  Opportunity title
  Relevance/evidence
  Why now
  Develop

Mobile Today
  Opportunity title
  Relevance/evidence
  condensed Why now
  Develop
```

Mobile may collapse supporting detail, use sheets, gestures or native navigation, but the hierarchy and wording remain familiar.

## Responsive behaviour

Web layouts should progressively collapse rather than abruptly change product structure.

Desktop may use a main content column plus a narrow secondary context column. Tablet may stack or partially collapse the secondary column. Mobile becomes a single primary flow.

Important controls must remain reachable without horizontal scrolling.

## Motion

Motion is purposeful and restrained.

Use it for:

- navigation continuity;
- pressed/selected feedback;
- state changes;
- opening/closing contextual surfaces;
- list insertion/removal;
- publishing/progress feedback where useful.

Avoid ornamental motion, long easing sequences and animation that delays work.

Respect `prefers-reduced-motion` on web and equivalent accessibility settings on mobile.

## AI presentation

CIE must not use generic AI tropes such as constant sparkle icons, glowing gradients, animated robots or excessive assistant bubbles.

AI should appear through useful outcomes, recommendations, evidence and contextual actions.

Conversation UI is used only when conversation is the appropriate interaction model.

## Accessibility

Implementation must support:

- WCAG-oriented colour contrast;
- keyboard navigation on web;
- visible focus states;
- screen-reader labels;
- semantic headings;
- sufficient touch targets;
- non-colour status indicators;
- reduced-motion preferences;
- readable text scaling on mobile.

Accessibility failures are implementation defects, not optional polish.

## Dark mode

Dark mode is not required by this baseline. The approved visual source is light-first. If dark mode is introduced later, it must preserve hierarchy and semantics rather than simply invert colours.

## Brand imagery

CIE may use editorial imagery, thumbnails and generated/connected Brand media where context benefits from it. Product chrome should remain neutral so customer Brand content can stand out.

## Design anti-patterns

Do not introduce without a separately approved design change:

- dense enterprise dashboards;
- excessive card grids;
- multiple competing accent colours;
- heavy gradients/glows;
- glassmorphism as core UI language;
- permanently visible AI chat panels;
- oversized hero areas inside the authenticated product;
- inconsistent web/mobile styling;
- desktop UI embedded in a mobile WebView;
- arbitrary external-brand visual styles leaking into CIE chrome;
- motion for decoration rather than feedback.

## Implementation source of truth

At PES handoff, the product repository should convert this baseline into shared design tokens and reusable components. Web and future mobile implementations should consume the same semantic token definitions where technically appropriate.

Design-system implementation should cover at minimum:

- colour tokens;
- typography tokens;
- spacing tokens;
- radius/elevation tokens;
- icons;
- Button;
- Input/TextArea/Select;
- Chip/Tag;
- Card/Panel;
- Navigation;
- Opportunity card;
- Status treatment;
- Empty/loading/error states;
- content editor surfaces;
- approval controls;
- metric/performance primitives.

## Design QA

PES implementation should validate the product against this baseline through responsive screenshots, accessibility checks and visual review. Design/motion review skills may improve implementation quality but may not independently redefine this approved baseline.

## Reopening conditions

Reopen the baseline only when user testing, accessibility evidence, platform constraints or product evidence demonstrates a material problem. Minor implementation tuning that preserves the approved visual language does not require reopening the design gate.
