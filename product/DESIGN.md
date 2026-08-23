---
title: Kairo Product Design System & Experience Specification
document_id: CIE-DESIGN-002
version: 2.0
status: User-approved design direction; repository governance approval pending
owner: Product Design
last_updated: 2026-08-23
supersedes: CIE-DESIGN-001 only after governed approval
depends_on:
  - CIE-PRD-001
  - CIE-TRD-001
  - AGENTS.md
  - delivery/current-slice.json
implementation_target: 100-percent user-facing route and state coverage
---

# Kairo Product Design System & Experience Specification v2.0

## 0. Purpose

This document is the implementation contract for the approved Kairo Hybrid redesign.

It exists to ensure the approved design is not reduced to a one-screen mock-up, a global CSS repaint, or a partially migrated application. The final product must preserve the same information hierarchy, interaction language, component behavior, responsive behavior, accessibility standards, loading behavior, and visual character across the complete authenticated product.

The governing experience rule is:

> **Show the user the outcome, the state, and the next useful decision. Hide internal machinery unless the user explicitly asks for detail.**

The intended product experience is:

- calm;
- minimal;
- content-first;
- outcome-first;
- highly legible;
- premium without ornament;
- human-controlled;
- responsive;
- accessible;
- consistent;
- operational rather than theatrically AI-themed.

A screen is not complete merely because it works. It is complete only when it satisfies the visual, interaction, state, responsive, accessibility, performance, copy, and evidence requirements in this document.

---

# 1. Governance & Authority

## 1.1 Repository authority order

This specification remains subordinate to the repository authority chain:

1. approved PRD;
2. approved TRD;
3. approved security decisions;
4. approved ADRs;
5. approved design baseline;
6. approved delivery plan;
7. typed approvals and approved decision records;
8. active vertical slice and implementation permission;
9. repository skills;
10. Superpowers implementation plans;
11. generated suggestions.

If a conflict is found, stop and record the conflict instead of silently choosing a preferred interpretation.

## 1.2 Current governance state

At the time this document was produced, the active governed slice is:

`VS-83 — Production Object Storage and Live Carousel Verification`

with:

- lifecycle: `testing`;
- risk: `high`;
- implementation mode: `runtime-disabled`;
- redesign implementation not authorized by that slice;
- certification, release, and production-enable approvals still pending.

Therefore:

> **This document may be reviewed and approved as design authority, but whole-product redesign implementation must start only in a separately approved design/UX migration slice or other explicitly authorized governed scope.**

No current production-verification work should be mixed with the redesign merely because both touch `apps/web/**`.

## 1.3 Design approval state

The user has approved:

- **C — Kairo Hybrid App Shell**
- **Kairo Hybrid Core Interaction Controls**

The new five-part primary navigation direction is also approved at product-design level:

- Home
- Create
- Content
- Calendar
- Results

Because this materially changes the previous navigation hierarchy, repository governance must record the design decision before implementation is treated as authorized.

---

# 2. Approved Visual Sources of Truth

## 2.1 App shell

Reference file:

`product/design/references/KAIRO-SHELL-C-APPROVED.webp`

Repository reference SHA-256:

`cd81ba48e3792c09a2ae1dea1a3d6e1f0f34388baa2cb77bda11c29d3756978f`

Original approved PNG SHA-256:

`a21e3152f95fe2ae258bf137de4e3f8e12b45243fe71a1e2cb26355ecb01ddb8`

Approved selection:

**C — Kairo Hybrid**

The shell combines:

- Kiranism-inspired navigation clarity;
- shadcn-admin-inspired shell structure and responsive behavior;
- Deepika Content Engine-inspired simplicity and information restraint;
- Kairo's existing brand accent and calm product character.

The screenshot is a visual source of truth for:

- sidebar proportions;
- Brand switcher placement;
- selected navigation treatment;
- quiet white shell;
- restrained primary accent;
- page-header density;
- spacing rhythm;
- compact KPI presentation;
- mobile collapse behavior;
- minimal secondary controls.

## 2.2 Core interaction controls

Reference file:

`product/design/references/KAIRO-CORE-CONTROLS-HYBRID-APPROVED.webp`

Repository reference SHA-256:

`9633bae8b1b341b1e8b21f7cc5bbb4b86f15a56410dade66b1e548a60a150b03`

Original approved PNG SHA-256:

`f9e9fb426326c5e20d4a371d08f8f5b2d53845c922a3c8201a6ee2ef9d955177`

Approved selection:

**Kairo Hybrid controls**

This reference locks the design language for:

- AI/progress state;
- skeleton loading;
- buttons;
- status badges;
- tabs/segmented controls;
- empty states;
- error states;
- toast/success feedback.

The screenshot is the visual source of truth for these patterns unless this document explicitly defines a responsive or accessibility adaptation.

---

# 3. Design Inputs Applied

## 3.1 Installed repository skills applied

### UI UX Pro Max — primary product UX authority

Applied to:

- information architecture;
- task flows;
- progressive disclosure;
- loading, empty, partial, error, reconnect, permission, and success states;
- desktop/tablet/mobile behavior;
- accessibility;
- navigation predictability;
- data-display semantics;
- calendar behavior;
- scarcity of primary actions.

### Design Taste Frontend — supplementary redesign lens

Applied to:

- anti-template discipline;
- visual hierarchy;
- typography;
- spacing;
- density;
- avoiding conflicting component systems;
- retaining the approved visual authority;
- preventing decorative AI styling;
- preventing over-designed marketing language inside the product.

Taste is supplementary, not the primary authority for Kairo's dense product workflows.

### UI Review — final quality gate

Applied to:

- visual-baseline adherence;
- accessibility;
- responsiveness;
- state completeness;
- interaction quality;
- content stress;
- explicit evidence and verdicts.

### Using Superpowers — implementation methodology

Applied to:

- requiring approved slice context before coding;
- bounded implementation plans;
- test-first behavior where appropriate;
- systematic debugging;
- specification-compliance review;
- code-quality review;
- deterministic preflight;
- human merge/release gates.

### Implementer

Applied to:

- minimum necessary change;
- reusing existing components/dependencies;
- explicit evidence;
- no self-approval.

### Project Planner / Slice Planner / Task Decomposer

Applied to:

- phased migration;
- small executable slices;
- bounded path scope;
- explicit non-goals;
- independently verifiable tasks;
- acceptance criteria.

### Requirement Normalizer

Applied to:

- source-linked design requirements;
- explicit distinction between approved rules and proposed implementation details;
- no silent scope expansion.

### Architecture Baseline

Applied to:

- preserving the existing modular-monolith direction;
- avoiding new services or infrastructure for visual redesign;
- keeping the web implementation within the existing Next.js/React/TypeScript architecture;
- preferring semantic shared design tokens and reusable product components.

### Verifier / Release Verifier

Applied to:

- independent acceptance review;
- evidence-based completion;
- exact-SHA verification;
- migration and rollback readiness;
- environment readiness;
- no release claims without governed evidence.

## 3.2 External design-engineering references applied

The following are not currently installed as project-local Kairo skills. Their public guidance was used as advisory input only.

### Impeccable

Applied as an **Operate-mode** product-design lens:

- the brief wins;
- product UI prioritizes task completion and scanability;
- redesign replaces a rejected visual world rather than halfway polishing it;
- bounded QA passes instead of endless polish;
- anti-slop patterns;
- typography, spacing, responsive behavior, interaction, error, and UX-copy discipline.

### Emil Design Engineering

Applied to purposeful interaction feel:

- do not animate something unless motion clarifies state or spatial change;
- subtle press feedback;
- origin-aware menus/popovers;
- avoid `scale(0)` entrances;
- prefer transform/opacity over layout-heavy animation;
- use the cheapest mechanism that works;
- motion must include reduced-motion behavior;
- motion should feel fast and interruptible.

### Ponytail

Applied as implementation restraint:

1. Does this UI/code need to exist?
2. Is an approved Kairo component already available?
3. Does the web platform already solve it?
4. Is an installed dependency already sufficient?
5. Only then add the minimum new implementation.

No new dependency should be added merely to copy a reference-library aesthetic.

## 3.3 External pattern references
| Reference | Role |
|---|---|
| Deepika Content Engine | simplicity, hierarchy, restrained dashboard information |
| Kiranism | controls, forms, tables, filters, SaaS interaction patterns |
| shadcn-admin | shell, navigation, spacing, responsive interaction behavior |
| Tremor | metrics, charts, progress, analytics presentation |
| TailAdmin | control catalogue and edge-case inventory |

These sources are **benchmarks, not design authorities**.

Kairo must not look like a stitched collection of templates.

---

# 4. Product Experience Constitution

## 4.1 Clarity over completeness

Do not show information merely because the backend provides it.

Display information only when it:

- changes a decision;
- explains an important state;
- enables an action;
- establishes trust;
- helps recovery.

## 4.2 Outcome over machinery

The normal product mental model is:

**Create → Review → Publish → Results**

Internal concepts such as:

- Hunter;
- Researcher;
- Strategist;
- Drafter;
- Critic;
- Judge;
- runtime provider;
- model name;
- orchestration engine;
- adapter type;
- storage key;
- execution ID;

must not compete with the user's normal workflow.

## 4.3 One obvious primary action

Each local context should normally expose one dominant action.

Examples:

- Create content
- Review
- Approve
- Schedule
- Publish
- Retry

Two equally weighted primary buttons require explicit justification.

## 4.4 Progressive disclosure

Secondary and technical information belongs behind:

- View details;
- Why?;
- Evidence;
- Advanced;
- a sheet;
- a drawer;
- a popover;
- an accordion;
- a tooltip.

Permanent secondary panels are not the default.

## 4.5 Calm before density

Complexity may exist in the product, but it must be grouped and staged.

A user should never feel that every CIE capability is asking for attention simultaneously.

## 4.6 No dead UI

Do not show:

- disabled future navigation;
- non-functional settings;
- `Coming soon` primary controls;
- dead toolbar icons;
- empty feature categories with no valid action.

If functionality is unavailable and the user cannot act, hide it unless the unavailable state itself is a required product message.

## 4.7 Human authority

V1 remains assisted/semi-autonomous.

The interface must make human approval clear before external publication.

Automation must never make publication appear successful when the underlying system has failed.

---

# 5. Primary Information Architecture

## 5.1 Primary navigation

Exactly five primary destinations:

1. **Home**
2. **Create**
3. **Content**
4. **Calendar**
5. **Results**

No additional primary navigation item may be introduced without an approved design decision.

## 5.2 Mapping existing product concepts

| Existing concept | V2 location |
|---|---|
| Today | Home |
| Discover / Hunter | Home and Create, contextually |
| Ideas | Create + Content |
| Campaigns | Content grouping/filtering |
| Content Studio | Content detail/editor/review |
| Performance | Results |
| Brand Brain | Brand Settings |
| Connections | Brand Settings / Channels |
| Add Brand | Brand switcher |
| Replay Guide | Help |
| Product Guide | onboarding/help only |
| Research dossier | on-demand detail |
| Claim ledger | advanced detail |
| internal agent pipeline | system-only |

Removing a top-level destination does **not** remove its underlying product capability.

## 5.3 Home

Answers:

> **What needs my attention now?**

## 5.4 Create

Answers:

> **What do I want Kairo to make or develop?**


## 5.5 Content

Answers:

> **What content do I have, what state is it in, and what can I do next?**

## 5.6 Calendar

Answers:

> **What is scheduled, published, failed, or needs action?**


## 5.7 Results

Answers:

> **What worked, why might it have worked, and what should I do next?**

---

# 6. Visibility Contract

Every user-facing piece of information must be assigned one level.

## ALWAYS
Visible whenever relevant to the current task.

Examples:

- selected Brand;
- content state;
- approval required;
- current primary action;
- publish failure;
- scheduled/published state.

## CONTEXTUAL

Shown only when the current object/state makes it useful.

Examples:

- scheduled time;
- channel destination;
- evidence warning;
- reconnect requirement;
- retry state.

## ON DEMAND

Available through a disclosure control.

Examples:

- research sources;
- evidence rationale;
- detailed quality checks;
- generated alternatives.

## ADVANCED

Available in explicitly advanced surfaces.

Examples:

- full claim ledger;
- provenance detail;
- technical publishing metadata;
- raw observation lineage.

## SYSTEM ONLY

Not shown in the ordinary customer UI.

Examples:

- model/provider name;
- agent/runtime name;
- execution ID;
- storage identifier;
- adapter implementation;
- internal orchestration state.

## REMOVE

No user value; should not exist in the interface.

---

# 7. Visual Foundation

## 7.1 Color

Preserve the approved Kairo palette.

| Token | Value | Use |
|---|---|---|
| Neutral 900 | `#0F1115` | primary text |
| Neutral 700 | `#33363D` | secondary text |
| Neutral 400 | `#8A8F98` | muted metadata |
| Neutral 200 | `#E7E9ED` | borders/dividers |
| Neutral 50 | `#F7F8FA` | quiet background |
| White | `#FFFFFF` | dominant surface |
| Primary | `#4F46E5` | primary action/selection/focus |
| Success | `#16A34A` | success/published/healthy |
| Warning | `#F59E0B` | caution/draft/review |
| Danger | `#EF4444` | failure/destructive |
| Info | `#0EA5E9` | informational state |

Rules:

- White remains dominant.
- Purple is interaction emphasis, not decoration.
- No decorative purple hero blocks in authenticated product UI.
- State color must always be supported by icon/text.
- Prefer borders/whitespace before shadows.

## 7.2 Typography

Primary typeface:

**Inter**, with system fallback.

Type scale:

| Role | Size / line-height | Weight |
|---|---|---|
| H1 | 32 / 40 | Bold |
| H2 | 24 / 32 | SemiBold |
| H3 | 20 / 28 | SemiBold |
| Body | 16 / 24 | Regular |
| Small | 14 / 20 | Regular |
| Caption | 12 / 16 | Regular |

Rules:

- typography creates hierarchy before decorative styling;
- sentence case by default;
- no tiny type as a density workaround;
- page titles normally 2–5 words;
- long-form content uses a readable measure.

## 7.3 Spacing

4px base grid.

Canonical values:

`4, 8, 12, 16, 24, 32, 40, 48`

Default:

- desktop page padding: 32px;
- laptop: 24px;
- tablet: 20–24px;
- mobile: 16px;
- card internal padding: 16–24px;
- standard control gap: 8–12px;
- section gap: 32–40px.

No arbitrary spacing proliferation.

## 7.4 Radius

- inputs/buttons: 8px;
- compact badge/chip: 6px or pill where semantically appropriate;
- cards: 10–12px;
- overlays: 14–16px.

## 7.5 Elevation

Default card:

- white surface;
- thin neutral border;
- no or minimal shadow.

Use shadow mainly for:

- menus;
- popovers;
- dialogs;
- sheets;
- floating layers.

## 7.6 Icons

One coherent outline family.

Icons:

- supplement labels;
- use consistent stroke/size;
- have accessible names where necessary;
- do not replace unfamiliar text.

---

# 8. Responsive Grid

## Large desktop `>= 1440px`

- expanded sidebar;
- 12-column grid;
- generous whitespace;
- two-column review/detail layouts allowed.

## Desktop/laptop `1024–1439px`

- expanded or compact sidebar according to space;
- 12 logical columns;
- reduced card spans/gaps as needed.

## Tablet `768–1023px`

- compact rail or drawer;
- two-column layouts progressively stack;
- sticky actions remain reachable;
- no page-level horizontal scroll.

## Mobile `< 768px`

- no desktop sidebar;
- five-destination mobile navigation;
- single primary content flow;
- secondary controls in sheets;
- no hover dependence;
- mobile-specific table/calendar treatment.

Every reusable component must define:

- desktop behavior;
- tablet behavior;
- mobile behavior;
- long-label behavior;
- keyboard behavior;
- touch behavior.

---

# 9. Approved App Shell — C

## 9.1 Desktop sidebar order

1. Kairo wordmark.
2. Brand switcher.
3. primary navigation.
4. flexible whitespace.
5. secondary `More` / settings utility as required.
6. account/profile area.

## 9.2 Primary destinations

- Home
- Create
- Content
- Calendar
- Results

## 9.3 Brand switcher

The switcher:

- shows current Brand;
- opens Brand switching;
- contains `Add Brand`;
- exposes Brand Settings where appropriate.

There is no permanent `Add Brand` navigation item.

## 9.4 Header

The header remains compact.

Allowed:

- menu/collapse button;
- page title/context;
- notification control;
- one global Create action.

Avoid redundant Brand/context repetition.

## 9.5 Breadcrumbs

Use only for genuine hierarchy.

Good:

`Content → Campaign → Carousel review`

Avoid on shallow pages:

`Kairo → Brand → Home`

## 9.6 Mobile shell

Primary destinations remain:

- Home
- Create
- Content
- Calendar
- Results

Brand/account/secondary settings move to the top/profile/Brand menu.

## 9.7 Prohibited shell content

Do not permanently show:

- Replay Guide;
- disabled Settings;
- separate Add Brand;
- large Product Guide blocks;
- shallow breadcrumbs;
- duplicate utilities in sidebar and header.

---

# 10. Page Hierarchy

Every primary page follows this order:

1. page title;
2. optional one-line context;
3. one primary action when applicable;
4. primary work surface;
5. secondary information;
6. on-demand/advanced information.

Default copy rule:

- no explanatory paragraph unless genuinely necessary;
- one short supporting sentence maximum;
- help via tooltip or disclosure;
- technical detail on demand.

---

# 11. Copy Contract

## Labels

Prefer:

- Create content
- Review
- Approve
- Schedule
- Publish
- Retry
- View details
- View evidence

Avoid implementation language.

## Errors

Always state:

1. what happened;
2. what the user can do.

Example:

**Couldn't publish**

`Instagram rejected this publish. Reconnect the account and try again.`

## Empty states

Always state:

1. what is absent;
2. one next action.

Example:

**No content yet**

`Create your first piece of content.`

`Create content`

## AI language

Prefer:

`Preparing your carousel…`

Avoid:

`Strategist complete. Critic running. Judge pending.`

---

# 12. Canonical Hybrid Controls

# 12.1 Buttons

### Primary

- filled Primary;
- white label;
- one dominant action per local context.

### Secondary

- white/neutral surface;
- subtle border;
- dark label.

### Tertiary

- text/low-emphasis action;
- no unnecessary container.

### Icon button

Only for universal or clearly labeled actions.

Must have accessible name.

### Loading

- retain width where practical;
- disable repeat submission;
- show compact spinner/state.

### Press feedback

A subtle press transform is allowed where it improves tactile feedback.

Do not add a motion dependency solely for button press feedback.

---

# 12.2 Progress / AI Processing

Use when work lasts long enough that absence of feedback would create uncertainty.

### Determinate

Only when progress is real.

Example:

**Creating carousel** `72%`

progress bar

`Rendering slides…`

### Indeterminate

Use when percentage is not truthfully measurable.

### Optional user-facing stages

Allowed examples:

- Research
- Content
- Render
- Review

Internal agent names are not user-facing stages.

### Details

`View details` may expose user-relevant stage information, retry state, and actionable failure detail.

Never fabricate progress percentages.

---

# 12.3 Skeleton Loaders

Skeletons match destination geometry.

Variants:

- KPI/cards;
- list/table;
- detail/content;
- image/media preview.

Rules:

- preserve layout;
- low-noise animation;
- reduced-motion aware;
- no entire-page spinner where skeleton is appropriate;
- no blank `Loading…` screen.

---

# 12.4 Status Badges

Canonical states include:

- Published
- Scheduled
- Draft
- Archived
- Error

Additional domain states reuse the same semantic language.

Rules:

- compact;
- consistent;
- icon/text where useful;
- never rely on color alone;
- no per-page bespoke badge design.

---

# 12.5 Tabs / Segmented Controls

### Underline tabs

Simple page sections.

### Pill tabs

Stronger scope selection.

### Segmented icon + label

Compact view/state switching.

Do not nest competing tab systems.

---

# 12.6 Empty States

Variants:

- minimal;
- lightly illustrated;
- search/filter empty.

Rules:

- concise title;
- one-line explanation if needed;
- one useful action;
- illustration must not dominate.

---

# 12.7 Error States

Variants:

- inline;
- block;
- permission/access.

Rules:

- explain the problem;
- provide recovery;
- preserve user work;
- never show stack traces/internal IDs to ordinary users.

---

# 12.8 Toast / Feedback

Semantics:

- success;
- info;
- warning;
- error.

Rules:

- concise;
- non-blocking when safe;
- dismissible;
- auto-dismiss only when safe;
- actionable errors must remain discoverable outside transient toast UI.

---

# 13. Working Controls

## 13.1 Search

Use only when dataset size warrants it.

Must:

- search the visible scope;
- provide zero-results behavior;
- remain compact.

## 13.2 Filters

Preferred:

- filter trigger;
- removable active chips;
- clear/reset action;
- URL-backed state when useful.

Do not show a permanent giant filter panel by default.

## 13.3 Tables

Desktop tables show only task-relevant columns.

Rules:

- identity first;
- status scannable;
- actions compact;
- sorting only when meaningful;
- pagination when needed;
- no tiny text;
- row click must be discoverable and keyboard accessible.

## 13.4 Mobile table adaptation

Choose:

1. priority columns + contained horizontal scroll;
2. responsive cards;
3. master/detail list.

Do not compress desktop tables until unreadable.

## 13.5 Sheet / drawer

Preferred for secondary tasks that should preserve context.

Examples:

- evidence;
- content details;
- filters;
- schedule details;
- connection details;
- advanced settings.

## 13.6 Dialog

Use for:

- confirmations;
- destructive decisions;
- short forms;
- focused decisions.

No long multi-step workflow in a small modal.

## 13.7 Popover

Use for:

- compact option selection;
- contextual menu;
- lightweight filter;
- date/option choice.

Popover motion must be anchored to its trigger where animated.

## 13.8 Forms

Structure:

- label;
- field;
- optional short hint;
- local validation;
- action area.

Do not use placeholder-only labels.

Advanced fields belong under `Advanced`.

---

# 14. Home

## Purpose

Answer:

> **What needs my attention now?**

## Structure

### Header

- Brand-aware greeting/context;
- `Create content`.

### KPI row

Use a small set of meaningful metrics, for example:

- Reach;
- Engagement;
- Published;
- Ideas/Opportunities ready.

Only show real supported metrics.

### Needs attention

Ranked, actionable items:

- approval required;
- publish failure;
- reconnect required;
- schedule issue;
- meaningful opportunity.

### Upcoming

Compact scheduled content.

### Performance signal

One compact chart/trend.

### Recent content

Show:

- title/thumbnail;
- state;
- channel;
- concise result.

## Home prohibitions

No:

- agent pipeline;
- full research report;
- wall of recommendations;
- ten equal KPI tiles;
- explanatory essays.

---

# 15. Create

## Purpose

Move from intent to usable content with the fewest decisions.

## Flow

1. objective;
2. idea/context;
3. format/channel;
4. Create;
5. progress;
6. Review.

## Objective examples

- Grow awareness
- Educate audience
- Drive engagement
- Promote something

Do not front-load strategy configuration.

## Idea input

Use a spacious prompt/editor.

Example:

`Tell Kairo what you want to say…`

## Format/channel

Compact selectors.

No adapter terminology.

## Processing

Use canonical progress.

## Completion

The dominant next action is:

`Review`

Do not terminate on an internal execution report.

---

# 16. Content

## Purpose

The user's content library and workflow hub.

## Controls

- Create content;
- search when useful;
- compact status filter;
- channel/format filter where useful;
- list/grid switch only if both provide real value.

## Item hierarchy

1. title/topic;
2. preview;
3. status;
4. channel/format;
5. meaningful timestamp;
6. next action.

## Campaigns

Campaign becomes an organizational grouping/filter, not a permanent global destination.

## Evidence/research

On demand.

---

# 17. Review Workspace

## Purpose

A focused decision surface.

## Desktop

Two-column layout where space allows.

### Main

- exact content preview;
- carousel/reel/media controls;
- slide/page navigation;
- edit affordance when allowed.

### Decision column

- status;
- caption/copy;
- channel/format;
- concise quality summary;
- secondary editing actions.

### Decision area

Primary:

`Approve`

Secondary:

`Edit` or `Regenerate` depending context.

## Quality summary

Default:

- Brand match
- Claims verified
- Image quality

Only failures/warnings expand automatically.

## Evidence

`View evidence`

Do not show full claim ledger by default.

## Mobile

- preview first;
- sticky action area;
- expandable detail;
- secondary control sheet.

---

# 18. Calendar

## Purpose

Answer:

- what is scheduled;
- what is published;
- what failed;
- what needs action.

## Header

- current range;
- previous/next;
- Today;
- view switch if useful;
- Create content.

## Desktop

Month/week grid.

Item shows only:

- concise content label;
- channel;
- time where relevant;
- status.

## Detail

Open a sheet/detail view rather than forcing multi-page navigation.

## Mobile

Use agenda/focused day-week presentation.

Do not squeeze a desktop month grid onto a phone.

## Accessibility

Provide a chronological representation when the visual calendar alone would be insufficient.

---

# 19. Results

## Purpose

Answer:

> **What worked, why might it have worked, and what should I do next?**

## Scope controls

Compact:

- period;
- channel;
- Brand scope only where needed.

## KPI row

Examples:

- Reach;
- Engagement;
- Saves;
- followers/conversions where supported.

Each metric should provide:

- value;
- period;
- compact delta if meaningful.

## Charts

One clear question per chart.

Rules:

- accessible legend/labels;
- no 3D;
- no rainbow palette;
- no decorative chart;
- tooltips for detail.

## Top content

Compact ranked list/table.

## Insights

Narrative and actionable.

Example:

**What works**

`Numbered carousel hooks generated more saves this month.`

`View evidence`

Avoid causal claims unless evidence supports them.

---

# 20. Brand Settings / Brand Brain

## Entry

From:

- Brand switcher;
- Brand menu;
- Settings.

## Sections

- Identity
- Positioning
- Audience
- Voice
- Content strategy
- Knowledge/Sources
- Connections
- Publishing
- Performance Memory
- Advanced

## Editing

Use:

- concise fields;
- current values;
- focused edit state;
- explicit save where material.

## Explanations

No repeated paragraphs under every field.

Use help only when needed.

## Provenance

User-confirmed and AI-inferred information remain distinguishable where material.

---

# 21. Notifications

Surface meaningful intelligence/action only.

Priority notifications:

- approval needed;
- publish failed;
- reconnect required;
- exceptional performance;
- meaningful learning/opportunity.

Do not notify for routine internal job completion.

Notification structure:

- what happened;
- object;
- time;
- direct action.

---

# 22. Loading & Perceived Performance

## Page loading

Use skeletons.

## Local action

Use inline/button loading.

## Long operation

Use real determinate progress or truthful indeterminate state.

## Background work

Allow the app to remain usable when blocking is unnecessary.

Example:

**Creating carousel**

`You can continue working.`

## Layout stability

Loaded content should replace skeletons without major shift.

---

# 23. Motion System

Motion exists only to:

- acknowledge input;
- explain state;
- establish spatial continuity;
- communicate progress;
- make overlay movement understandable.

## Allowed

- press feedback;
- drawer/sheet movement;
- popover/menu origin motion;
- tab/state transition;
- skeleton-to-content transition;
- progress advancement;
- reorder movement;
- concise success feedback.

## Motion ingredients

Prefer:

- transform;
- opacity;
- platform/native CSS behavior;
- existing installed motion utilities.

Avoid animating layout-heavy properties when transform/opacity works.

## Timing guidance

- press/micro: roughly 120–180ms;
- standard UI transition: roughly 160–250ms;
- sheet/dialog: roughly 220–320ms.

Motion must feel fast.

## Entrance rules

- never animate from `scale(0)`;
- if scale is used, begin close to final size;
- anchored overlays animate from the trigger origin;
- modal origin remains centered.

## Reduced motion

Support `prefers-reduced-motion`.

Motion must not be required to understand state.

## Dependency rule

Do not install a motion library for simple CSS-capable transitions.

---

# 24. Accessibility

Accessibility is a release requirement.

Required:

- semantic landmarks;
- correct heading order;
- keyboard operation;
- visible focus;
- sufficient contrast;
- non-color status communication;
- accessible input labels;
- accessible icon-button names;
- reduced motion;
- meaningful alternative text;
- dialog focus management;
- screen-reader-compatible errors;
- appropriate touch targets;
- text resizing support.

## Dynamic states

Progress, success, and error updates should use appropriate live-region semantics without repeatedly spamming assistive technology.

## Charts

Provide understandable labels or an equivalent textual/data view.

---

# 25. Performance

The design system must not make Kairo slower.

Rules:

- prefer existing Next.js/React capabilities;
- minimize unnecessary client components;
- reuse existing primitives;
- avoid large dependencies for a single control;
- lazy-load heavy charts/media where appropriate;
- optimize media;
- preserve layout dimensions;
- avoid expensive decorative effects.

External template libraries are pattern references, not dependency requirements.

---

# 26. Canonical Component Architecture

There must be one reusable implementation of each recurring pattern.

Recommended component vocabulary:

- `KairoShell`
- `KairoSidebar`
- `KairoMobileNav`
- `KairoBrandSwitcher`
- `KairoPageHeader`
- `KairoGrid`
- `KairoCard`
- `KairoMetric`
- `KairoButton`
- `KairoBadge`
- `KairoTabs`
- `KairoProgress`
- `KairoSkeleton`
- `KairoEmptyState`
- `KairoErrorState`
- `KairoToast`
- `KairoSearch`
- `KairoFilterBar`
- `KairoDataTable`
- `KairoSheet`
- `KairoDialog`
- `KairoPopover`
- `KairoField`
- `KairoSelect`
- `KairoCalendar`
- `KairoChart`
- `KairoInsight`
- `KairoReviewWorkspace`

Names may align with existing repository conventions.

## No local clones

A page must not invent its own:

- button;
- badge;
- progress bar;
- error block;
- tabs;
- sheet;
- dialog;
- filter;
- card;
- table styling;

when a canonical component already exists.

## New pattern gate

Before introducing a new component:

1. prove an existing Kairo component cannot solve it;
2. prefer native web behavior;
3. prefer an already installed dependency;
4. define states;
5. define responsive behavior;
6. verify accessibility;
7. record the new pattern;
8. then implement it.

---

# 27. Semantic Tokens

Implementation should use semantic tokens rather than raw page-specific values.

Recommended:

```css
--kairo-bg-app
--kairo-bg-surface
--kairo-bg-subtle

--kairo-text-primary
--kairo-text-secondary
--kairo-text-muted

--kairo-border-default
--kairo-border-strong

--kairo-action-primary
--kairo-action-primary-hover
--kairo-focus

--kairo-success
--kairo-warning
--kairo-danger
--kairo-info

--kairo-radius-control
--kairo-radius-card
--kairo-radius-overlay

--kairo-space-1
--kairo-space-2
--kairo-space-3
--kairo-space-4
--kairo-space-6
--kairo-space-8
--kairo-space-10
--kairo-space-12
```

No raw magic-value proliferation.

---

# 28. Requirement Traceability

The redesign changes presentation, not product truth.

Key requirement mapping:

| Requirement | Design implication |
|---|---|
| FR-01 | clear account/workspace access without enterprise-admin clutter |
| FR-02 | lightweight Brand creation and persistent Brand switcher |
| FR-03 | Brand Brain understandable, editable, provenance-aware |
| FR-04 | knowledge/source health presented without exposing credentials |
| FR-05 | channel state visible where relevant, safe degraded states |
| FR-06 | Discover capability appears as concise opportunity intelligence |
| FR-07 | duplicate warnings appear contextually |
| FR-08 | research is available on demand with evidence/provenance |
| FR-09 | angle choice is useful but not an overwhelming strategy console |
| FR-10 | Campaign remains lineage/grouping, not required primary navigation |
| FR-11 | Content Studio is calm and content-first |
| FR-12 | Critic/Judge internals are not normal UI; hard failures surface clearly |
| FR-13 | approval state and approved version are explicit |
| FR-14 | calendar remains simpler than enterprise campaign tools |
| FR-15 | publishing state is deterministic and truthful |
| FR-16 | unavailable metrics remain explicitly unavailable |
| FR-17 | Results is narrative/action-oriented, not a wall of charts |
| FR-18 | candidate learning is evidence-backed and human-controlled |
| FR-19 | experiments surface only meaningful hypothesis/result information |
| FR-20 | internal pilot operations stay internal; customer UI is not an ops console |

---

# 29. Implementation Migration Strategy

The redesign is a system migration, not a theme change.

## Phase 0 — Governance

1. record the new design decision;
2. approve `CIE-DESIGN-002`;
3. create a dedicated design migration slice;
4. define allowed/protected paths;
5. define non-goals;
6. bind implementation permission.

## Phase 1 — Foundation

1. semantic tokens;
2. core typography/spacing;
3. approved hybrid controls;
4. app shell;
5. responsive shell;
6. loading/error/empty primitives.

## Phase 2 — Primary workflow

1. Home;
2. Create;
3. Content;
4. Review;
5. Calendar;
6. Results.

## Phase 3 — Secondary workflow

1. Brand Settings / Brand Brain;
2. Connections;
3. Campaign grouping/detail;
4. evidence/research detail;
5. notifications;
6. remaining secondary routes.

## Phase 4 — Complete migration

1. reconcile actual route tree;
2. remove duplicate legacy UI;
3. remove dead styling/components;
4. responsive audit;
5. accessibility audit;
6. visual regression;
7. content stress;
8. independent UI Review;
9. full preflight.

---

# 30. Route Migration Contract

At implementation kickoff, generate the actual route inventory from the current Next.js route tree.

Every user-facing route receives exactly one disposition:

- KEEP
- SIMPLIFY
- MOVE
- HIDE
- REMOVE
- REDESIGN

No route is excluded by omission.

Known areas that must be audited include:

- root/Home;
- Brand create;
- Brand shell/context;
- Create;
- Discover;
- Brand Brain;
- Performance/Results;
- Calendar;
- Campaigns;
- Campaign detail;
- content library;
- content detail/editor;
- connection/channel surfaces;
- carousel review;
- reel/video review;
- authentication states;
- errors/loading;
- mobile navigation.

The actual route inventory, not this illustrative list, is the completion authority.

---

# 31. Legacy-to-V2 Disposition

| Existing pattern | V2 action |
|---|---|
| Brand switcher | KEEP + simplify |
| Home/Create/Content/Calendar/Results | KEEP as canonical nav |
| additional primary destinations | MOVE |
| Add Brand nav item | REMOVE; Brand switcher |
| Replay Guide permanent item | MOVE to Help |
| disabled Settings | REMOVE until usable |
| Sign out permanent item | MOVE to account menu |
| shallow breadcrumbs | REMOVE |
| deep breadcrumbs | KEEP contextually |
| Product Guide persistent block | MOVE to onboarding/help |
| agent pipeline labels | SYSTEM ONLY |
| research dossier | ON DEMAND |
| claim ledger | ADVANCED |
| evidence warning | CONTEXTUAL |
| publish state | ALWAYS when relevant |
| adapter/runtime details | SYSTEM ONLY |
| internal IDs | SYSTEM ONLY |

---

# 32. Anti-Patterns — Prohibited

Do not ship:

- competing primary actions;
- cards inside cards without structural need;
- explanation paragraphs under every heading;
- permanent advanced panels;
- disabled future navigation;
- decorative AI gradients or glow;
- tiny text for density;
- unrelated radii/shadows;
- per-page control inventions;
- fake progress percentages;
- blank `Loading…` screens;
- errors without recovery;
- empty states without action;
- color-only status;
- critical hover-only actions;
- desktop squeezed onto mobile;
- internal orchestration terminology;
- duplicate sidebar/header controls;
- different visual systems per route;
- dependencies added only to imitate a reference template.

---

# 33. Testing & Verification Contract

Every migrated route must pass:

| Check | Required |
|---|---|
| approved shell | yes |
| approved navigation | yes |
| canonical components | yes |
| visibility classification | yes |
| concise copy | yes |
| desktop | yes |
| tablet | yes |
| mobile | yes |
| keyboard | yes |
| visible focus | yes |
| labels/semantics | yes |
| loading | yes |
| empty where applicable | yes |
| error | yes |
| success/feedback | yes |
| reconnect/permission where applicable | yes |
| long-content stress | yes |
| realistic data stress | yes |
| reduced motion | yes |
| no dead UI | yes |
| no internal machinery leaked | yes |
| visual reference check | yes |
| UI Review | yes |

## Independent verification

The implementer cannot self-certify.

A separate verification pass must review:

- requirements;
- route disposition;
- diff;
- tests;
- accessibility evidence;
- visual evidence;
- responsive evidence;
- any migration risk.

---

# 34. Visual Regression

Minimum viewport set:

- desktop: `1440 × 1024`;
- laptop: `1280 × 800`;
- tablet: representative width in `768–1023`;
- mobile: representative width around `390`.

Minimum reference coverage:

- shell;
- Home;
- Create idle;
- Create processing;
- Content populated;
- Content empty;
- Review;
- Calendar;
- Results;
- Brand Settings;
- representative permission/reconnect state;
- representative error state.

Material unexplained difference from approved design fails UI review.

---

# 35. Bounded Polish Rule

Do not spend unlimited cycles polishing the same route.

For each migrated surface:

1. implement complete functionality and states;
2. capture desktop + mobile together;
3. perform one batched defect/design review;
4. fix the complete batch;
5. perform one confirmation pass;
6. stop unless a concrete acceptance failure remains.

This prevents endless visual iteration while preserving a high quality bar.

---

# 36. Simplification / Ponytail Rule

Before adding UI or code, ask in this order:

1. Does the element need to exist?
2. Can the information be removed?
3. Can the information be on demand?
4. Does Kairo already have this component?
5. Does native HTML/CSS already solve it?
6. Does an installed dependency already solve it?
7. Can the requirement be met with a smaller component?
8. Only then add something new.

Simple is a quality attribute, not a reason to skip accessibility or state handling.

---

# 37. Implementation Evidence Template

Each route must record:

```md
## Route: /example

Disposition: REDESIGN

### Requirement links
- FR-xx
- FR-yy

### Design compliance
- Shell: PASS
- Navigation: PASS
- Canonical components: PASS
- Visibility: PASS
- Copy density: PASS

### States
- Loading: PASS
- Empty: PASS / N/A
- Error: PASS
- Success: PASS / N/A
- Permission/Reconnect: PASS / N/A

### Responsive
- Desktop: PASS
- Tablet: PASS
- Mobile: PASS

### Accessibility
- Keyboard: PASS
- Focus: PASS
- Semantics: PASS
- Reduced motion: PASS

### Verification
- Tests: PASS
- Screenshot: PASS
- UI Review: PASS
- Independent verifier: PASS

Evidence:
- screenshot reference
- test reference
- commit SHA
```

No route is complete without evidence.

---

# 38. Definition of 100% Implemented

The redesign may be reported as **100% implemented** only when all of these are true:

1. the actual user-facing route tree has been inventoried;
2. every route has a disposition;
3. every retained route is migrated;
4. every retained route uses the approved shell or an explicit approved exception;
5. every recurring control uses canonical components;
6. every page uses semantic design tokens;
7. legacy duplicate navigation is removed;
8. dead/future controls are removed;
9. unintended internal AI/system detail is hidden;
10. loading states exist;
11. empty states exist where applicable;
12. error states exist;
13. permission/reconnect states exist where applicable;
14. success/feedback states exist;
15. mobile is explicitly implemented;
16. tablet is verified;
17. keyboard operation is verified;
18. visible focus is verified;
19. critical screen-reader semantics are verified;
20. reduced motion is supported;
21. long-content/data stress is verified;
22. visual regression is green;
23. typecheck is green;
24. tests are green;
25. production build is green;
26. accessibility checks are green;
27. UI Review is green;
28. independent verifier verdict is PASS;
29. route coverage contains no unexplained `TODO`, `partial`, or skipped route;
30. conflicting legacy styles/components are removed or deliberately isolated;
31. exact implementation SHA is recorded;
32. governed certification is bound to that SHA;
33. human release authorization is recorded separately;
34. post-release production verification confirms the released SHA.

Anything less must be reported as:

**PARTIALLY IMPLEMENTED**

—not 100%.

---

# 39. Release Gate

Before the redesign can be considered released:

- all design acceptance criteria pass;
- accessibility evidence is green;
- responsive evidence is green;
- visual regression is green;
- test/typecheck/build/preflight are green;
- no unresolved high-risk migration finding remains;
- exact SHA is certified;
- rollback/readiness requirements are satisfied;
- human merge/release/production approvals are present.

No agent or implementation session may self-authorize merge, release, or production enablement.

---

# 40. Product North Star

A first-time user should be able to answer immediately:

- Where am I?
- Which Brand am I working on?
- What needs my attention?
- How do I create content?
- Where is my content?
- What is scheduled?
- What performed well?
- What should I do next?

If the interface makes any of those questions harder than necessary, it violates this specification.

---

# 41. Final Rule

> **Do not introduce a new UI pattern when an approved Kairo component already solves the problem. Do not expose information merely because the backend provides it. Show only what helps the user take the next useful action.**

The final Kairo implementation must feel like one coherent product across every route, state, and viewport.
