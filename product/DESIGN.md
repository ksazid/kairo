---
title: Content Intelligence Engine Design Baseline
document_id: CIE-DESIGN-001
version: 1.2
status: Approved
owner: Product Design
last_updated: 2026-08-23
depends_on:
  - CIE-PRD-001
  - CIE-TRD-001
used_by:
  - PES intake
  - CIE web implementation
  - future CIE mobile implementation
---

# Content Intelligence Engine Design Baseline v1.2

## Design authority

This document is the approved visual and interaction baseline for CIE/Kairo. PES may refine implementation details and responsive behaviour but may not silently replace the visual language, navigation hierarchy or core interaction principles. Material changes require an approved design decision.

The approved visual reference is the user-selected CIE Design Baseline board from 2026-08-12. The source image supplied during approval is 1536x1024 pixels and has SHA-256 fingerprint:

`dac322756cfd9606ce0941332e83fbcf0fdbbfda76d4b254cd10a10adbe689f1`

The 2026-08-23 product simplification approval updates information architecture and onboarding while preserving that visual language. The 2026-08-23 shell clarification fixes the Header, Desktop Sidebar and Mobile Bottom Navigation contract. This document is the implementation authority for the combined direction.

## Design intent

Kairo should feel like a calm, intelligent editorial workspace rather than a dense enterprise social-media dashboard.

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
Ideas, recommendations, Content, Calendar and Results take visual priority over technical workflow controls.

### Calm and minimal
Use whitespace, neutral surfaces, thin borders and restrained elevation. Avoid excessive cards, gradients, glow effects, glassmorphism and ornamental AI visuals.

### Consistent everywhere
The same design tokens and component semantics apply across web and mobile. Platform-native interaction may differ, but the visual DNA remains stable.

### Purposeful colour
Kairo uses one restrained primary accent. Semantic colours communicate status or meaning; they are not decoration.

### Human + intelligent
AI should reduce decisions and configuration. The user sees useful outcomes, one recommended next action and human checkpoints only when judgment is genuinely required.

## Product values expressed by the UI

- **AI power, human control:** AI generates and recommends; the user decides at meaningful checkpoints.
- **Trust and truth:** evidence, provenance and unsupported-claim warnings remain available when relevant without becoming default workflow steps.
- **Brand first:** every output visibly belongs to the selected Brand context.
- **Privacy and security:** Workspace/Brand scope and connected-account state are understandable.
- **Performance driven:** the product connects actions to measured outcomes and future recommendations.
- **Progressive disclosure:** technical details stay under the hood until the user needs them.

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

Home sections must be visually distinct through spacing, hierarchy and restrained surface treatment rather than becoming one long wall of identical cards.

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

Primary navigation contains exactly five product destinations:

- **Home**;
- **Content**;
- **Calendar**;
- **Results**;
- **Brand**.

Creation is not a separate primary destination. `My Idea` and `For You` begin creation from Home. Historical Campaign, Research, Critic, rendering and publishing workflow objects remain available behind user-facing Content/detail surfaces where needed but do not expand primary navigation.

Desktop uses a persistent left navigation rail/sidebar with clear selected state and Workspace/Brand context. Settings, help, operations and other management functions remain secondary utilities rather than primary destinations.

## Mobile information architecture

Mobile uses the same five conceptual destinations in bottom navigation:

- Home;
- Content;
- Calendar;
- Results;
- Brand.

There is no sixth `More` destination. Settings and account utilities live inside Profile, not primary navigation.

The mobile product must not recreate the entire desktop sidebar as a cramped phone menu. Secondary management remains inside the relevant destination or contextual menus.

## Product shell: Header, Sidebar and Bottom Navigation

The authenticated product shell is a shared design-system surface. Individual pages may not replace or restyle it independently.

### Mobile header

The mobile header is a quiet, compact Brand-context bar approximately 60-64px high.

Left side:

- current Brand accent/mark;
- current Brand name;
- current product destination/page label.

Right side contains exactly two persistent utilities:

1. **Notifications**;
2. **Profile / Settings**.

Rules:

- Settings live inside the Profile menu/sheet;
- appearance controls, account actions and sign-out are Profile-level utilities;
- search, theme mode, density and desktop/sidebar controls must not occupy persistent mobile header chrome;
- do not show both a mobile page label and a redundant breadcrumb trail;
- the header uses the dominant neutral surface, one thin divider and no decorative gradient, glass treatment or oversized control group;
- controls use simple outline icons and comfortable touch targets.

### Desktop sidebar

Desktop uses one persistent left navigation rail approximately 240-248px wide.

Order:

1. Kairo wordmark/product identity;
2. current Brand switcher/context;
3. the five primary destinations: Home, Content, Calendar, Results, Brand;
4. flexible whitespace;
5. Notifications and Profile / Settings utilities.

Rules:

- selected navigation uses restrained primary emphasis;
- the sidebar must not become a secondary dashboard;
- Add Brand belongs to Brand switching/profile context rather than primary navigation;
- Settings, appearance, help and sign-out remain inside Profile or another secondary utility surface;
- theme/density/sidebar controls must not appear as a permanent row of shell controls;
- technical workflow destinations never expand the five primary destinations.

### Mobile bottom navigation

Mobile bottom navigation contains exactly five equal-width destinations in this order:

1. Home;
2. Content;
3. Calendar;
4. Results;
5. Brand.

Each destination uses one outline icon plus a text label. The active destination uses the primary accent; inactive destinations use muted neutral treatment.

The bar uses a solid dominant surface, a thin top divider and safe-area padding. It must not use glassmorphism, gradients, a floating capsule container or a sixth `More` item.

### Shell consistency rules

- Header, Sidebar and Bottom Navigation must use shared reusable components and shared shell tokens.
- Responsive behaviour changes placement, not navigation meaning.
- Shell controls must not inherit page-specific card, gradient or experimental CSS.
- The shell is visually quieter than page content so Brand work remains the focus.
- Any material shell change requires an explicit update to this document before implementation can be certified.

## Home

Home is the visual and behavioural anchor of the product. It answers:

> What needs me, what can I create, and what is Kairo doing next?

Home is composed of six distinct sections:

1. **Needs Attention** — shown only when Kairo cannot safely continue without the user; one dominant item and at most two smaller extras.
2. **My Idea** — user-led creation from text, URL, image, video or existing media; Kairo recommends format after understanding the input.
3. **For You** — one ranked spotlight recommendation plus up to three compact alternatives; discovery/research stays under the hood.
4. **Up Next** — one spotlight upcoming item plus up to two compact rows for scheduled or pending work.
5. **What’s Working** — compact proof, interpretation and one useful next action such as `Create similar`.
6. **Continue** — the most relevant unfinished item plus up to two smaller recent items.

Needs Attention is not an inbox. Empty sections that have no useful content may disappear. Each item presents one obvious primary action; secondary actions use progressive disclosure.

A newly onboarded Brand without an authenticated publishing destination should show a `Connect a channel` Needs Attention item on Home. Once an appropriate channel is connected, that item disappears.

## Brand onboarding

Onboarding should feel like one handoff to Kairo, not a technical setup wizard.

Approved first-run flow:

```text
Paste one public Brand URL
  → Kairo learns
  → concise Brand confirmation
  → Home
```

Rules:

- one labelled public URL field is the default input;
- the URL may be a website, public social profile/content URL, product page, blog or another supported public page;
- Kairo infers the Brand name, audience, voice, positioning, content direction and provisional goals where evidence supports them;
- inferred goals stay under the hood during onboarding;
- do not show channel OAuth choices, provider scopes, adapter terminology, research controls or technical progress details in onboarding;
- a public social URL is evidence only and never implies authenticated publishing or private Insights access;
- channel authentication happens after onboarding from Home Needs Attention or Brand;
- if public-reference learning is limited, preserve the created Brand and let the user continue rather than forcing setup to restart;
- confirmation shows only a concise useful summary such as What you do, Who you serve, Your style and Main topics;
- the primary confirmation action is `Looks right`; deeper editing remains available later under Brand.

Do not use a multi-step progress stepper for this flow. During analysis, show one truthful calm learning state rather than simulated technical stages.

## Smart Item interaction grammar

Reusable working items share a consistent interaction grammar without forcing every section into identical cards:

- optional useful visual/icon;
- title;
- one-line context or insight;
- status/type where needed;
- one obvious primary action;
- `•••` for uncommon actions;
- tapping the item inspects it;
- consistent status placement;
- no more than two or three metadata points by default.

Variants are Spotlight, Standard Item and Compact Item. Thumbnail imagery appears only when it adds decision value.

Context-aware primary actions include `Continue`, `Review`, `Publish`, `View`, `See results`, `Fix` and `Use idea`.

## Opportunity / recommendation items

Recommendation items prioritise:

1. signal strength/status where useful;
2. title;
3. concise rationale;
4. why it matters now;
5. one primary action;
6. optional save/secondary actions.

Images are optional supporting context, not mandatory decoration.

The product should prefer one strong recommendation plus a few alternatives over a wall of equal choices.

## Buttons

Three action levels:

- **Primary:** filled primary accent; one dominant action in a local context.
- **Secondary:** neutral/outlined control.
- **Tertiary:** text or low-emphasis action.

Do not fill every item with a purple button. Primary emphasis is scarce.

All controls require hover/focus/pressed/disabled states appropriate to platform.

## Inputs

Inputs remain visually quiet with clear labels, neutral borders and obvious focus state.

Placeholder text cannot replace labels for important fields.

Validation messages use semantic colours plus text/icon indication; colour alone is insufficient.

## Chips and tags

Chips represent compact metadata such as status, format, channel and approval state.

They should be short, low-noise and semantically consistent.

Channel chips may use channel identity cues sparingly, but Kairo should not visually fragment into multiple external brand systems.

## Cards and panels

Use cards only when a real conceptual grouping or interaction boundary exists.

Avoid the anti-pattern of turning every metric and paragraph into its own card.

Results pages should favour narrative intelligence plus a few relevant charts rather than a dense tile dashboard.

## Content

Content is the user-facing home for everything Kairo has created. Campaigns, asset versions, render lineage and technical workflow state remain implementation detail unless a specialist view genuinely needs them.

Default filters should use user language such as All, Needs you, Ready, Scheduled and Published. Primary actions are state-aware: Continue, Review, Publish, View or See results.

The content editor remains calm and content-first. AI controls are contextual and secondary rather than occupying permanent visual prominence.

## Brand

Brand should read as a structured profile and source workspace, not a developer configuration screen.

User-confirmed and AI-inferred information must be distinguishable where material. Shared Brand Memory is an internal intelligence layer, not a separate Business Intelligence dashboard.

Source connection, health and recovery controls live here after onboarding. Provider-specific technical details are progressively disclosed.

## Results

Results answers:

1. What happened?
2. Why might it have happened?
3. What should we do next?

Use a small number of charts when they improve interpretation. Narrative recommendations and evidence should take precedence over decorative analytics.

## Web/mobile consistency

The same task should retain the same conceptual hierarchy across platforms. Mobile may collapse supporting detail, use sheets, gestures or native navigation, but hierarchy and wording remain familiar.

## Responsive behaviour

Web layouts should progressively collapse rather than abruptly change product structure.

Desktop may use a main content column plus a narrow secondary context column. Tablet may stack or partially collapse the secondary column. Mobile becomes a single primary flow.

Important controls must remain reachable without horizontal scrolling. Primary touch targets should remain comfortably usable at phone widths.

## Motion

Motion is purposeful, restrained and subordinate to task speed.

Use it for:

- pressed/selected feedback;
- state changes;
- opening/closing contextual surfaces;
- list insertion/removal;
- publishing/progress feedback where useful;
- rare first-run/onboarding continuity when it clarifies what just happened.

Interaction guidance:

- button press feedback: roughly 100-160ms;
- small state/popover transitions: roughly 125-200ms;
- onboarding/panel entrances: roughly 180-260ms;
- ordinary product UI should remain below 300ms;
- use responsive ease-out for enter/exit and immediate feedback; avoid slow ease-in interactions;
- prefer CSS/native transitions before adding animation dependencies;
- never delay a frequent task merely to show animation.

Onboarding may use subtle opacity/translation for surface continuity and a restrained progress indicator while Kairo learns. Do not use theatrical AI effects, confetti, large-scale morphs or looping decorative motion.

Respect `prefers-reduced-motion` on web and equivalent accessibility settings on mobile. Reduced-motion mode must preserve understandable state changes without movement.

## AI presentation

Kairo must not use generic AI tropes such as constant sparkle icons, glowing gradients, animated robots or excessive assistant bubbles.

AI should appear through useful outcomes, recommendations, evidence and contextual actions.

Conversation UI is used only when conversation is the appropriate interaction model.

## Accessibility

Implementation must support:

- WCAG-oriented colour contrast;
- keyboard navigation on web;
- visible focus states;
- screen-reader labels and live regions for meaningful asynchronous state;
- semantic headings;
- sufficient touch targets;
- non-colour status indicators;
- reduced-motion preferences;
- readable text scaling on mobile.

Accessibility failures are implementation defects, not optional polish.

## Dark mode

Dark mode is not required by this baseline. The approved visual source is light-first. If dark mode is introduced later, it must preserve hierarchy and semantics rather than simply invert colours.

## Brand imagery

Kairo may use editorial imagery, thumbnails and generated/connected Brand media where context benefits from it. Product chrome should remain neutral so customer Brand content can stand out.

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
- arbitrary external-brand visual styles leaking into Kairo chrome;
- technical workflow steps the user does not need to perform;
- onboarding channel/provider setup before first value;
- motion for decoration rather than feedback.

## Implementation source of truth

The product repository should maintain shared design tokens and reusable components. Web and future mobile implementations should consume the same semantic token definitions where technically appropriate.

Design-system implementation should cover at minimum:

- colour tokens;
- typography tokens;
- spacing tokens;
- radius/elevation tokens;
- icons;
- Button;
- Input/TextArea/Select;
- Chip/Tag;
- Smart Item variants;
- Navigation;
- Status treatment;
- Empty/loading/error states;
- content editor surfaces;
- approval controls;
- metric/performance primitives.

## Design QA

PES implementation should validate the product against this baseline through responsive screenshots, accessibility checks and visual review. UI UX Pro Max owns product-flow/accessibility structure; Impeccable may perform bounded refinement; Emil Design Engineering principles may be used selectively for purposeful motion; Ponytail should keep React/Next.js implementation minimal; UI Review remains the final design/accessibility/responsive quality gate. None of these skills may independently redefine this approved baseline.

Shell QA must additionally verify:

- desktop sidebar contains exactly five primary destinations;
- mobile bottom navigation contains exactly five equal-width destinations;
- mobile header shows Brand/page context plus Notifications and Profile only;
- Settings and appearance controls are inside Profile rather than persistent shell chrome;
- no redundant mobile breadcrumbs;
- no shell gradient/glass treatment or inherited page-specific decorative CSS.

## Reopening conditions

Reopen the baseline only when user testing, accessibility evidence, platform constraints or product evidence demonstrates a material problem. Minor implementation tuning that preserves the approved visual language does not require reopening the design gate.
