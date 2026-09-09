# Kairo V1 Completion Plan — Frozen Product, Backend and UI Decisions

**Status:** Approved and frozen

**Date:** 2026-09-09

**Scope:** Kairo UI V2 (`apps/kairo-ui-v2`) and the current Kairo backend/runtime only. Legacy Kairo is not a design or implementation authority for this plan.

---

## 1. Product proposition

Kairo discovers what is working in a Brand's market, explains why, adapts the opportunity to that Brand, creates the content, and learns from what actually performs.

The product moat is:

**Brand Intelligence × Market Intelligence × Creative Execution × Performance Learning**

The closed loop is:

**Brand DNA → Hunter → Evidence → Opportunity → Why It Worked → Your Move → Concept → Content → Critic → Publish → Performance → Learner → Better Hunter**

Kairo is not to become a generic content generator, generic trend feed or template library.

---

## 2. Product-completion principle

Kairo is technically further along than a greenfield backlog suggests. The V1 strategy is therefore **closure and hardening**, not rebuilding.

Every requirement is classified as one of:

- **KEEP** — already implemented; preserve.
- **EXTEND** — existing capability/page gets additional behaviour.
- **CONNECT** — backend/UI foundations exist but need complete wiring.
- **ADD** — genuinely missing capability.
- **CERTIFY** — appears built; requires production-grade end-to-end verification.
- **LATER** — explicitly outside V1.

---

## 3. Non-negotiable V1 rules

1. No authenticated fake/demo fallback content.
2. No fake trend or viral probability scores.
3. No invented learning statements.
4. No dead-end states.
5. No manual database intervention in the customer flow.
6. No legacy UI detours.
7. No content may be marked Ready before the required Critic gate passes or reaches an explicitly handled bounded failure state.
8. Manual Hunter is the V1 certification path. Scheduled Hunter comes only after the manual loop is complete.
9. Autopilot is later and must remain controlled.
10. The customer-facing flow must remain simple even if the backend uses multiple agents/services.

---

# 4. Kairo V1 master backlog

## EPIC 0 — Product and UI protection gate

**Priority:** P0

- KAI-001 — Freeze existing Kairo UI V2 shell/navigation — KEEP
- KAI-002 — Freeze approved page hierarchy and spacing system — KEEP
- KAI-003 — Freeze card/button/chip/table/list patterns — KEEP
- KAI-004 — No new sidebar items unless product IA genuinely requires one — RULE
- KAI-005 — Reuse existing components before introducing new UI patterns — RULE
- KAI-006 — Maintain list/grid options on existing listing pages — KEEP
- KAI-007 — Maintain global ≤4-click usability rule — KEEP
- KAI-008 — Target Opportunity → usable draft in ≤3 primary actions — EXTEND
- KAI-009 — Mockup required before modification of every affected page — GATE
- KAI-010 — Compare proposed extension against the current implemented page before approval — GATE

### Acceptance

No approved existing page may be structurally replaced unless explicitly reopened.

---

## EPIC 1 — Production Truth Gate

**Priority:** P0

- KAI-011 — Remove authenticated demo recommendation fallbacks — EXTEND
- KAI-012 — Remove fabricated authenticated learning copy — EXTEND
- KAI-013 — Real loading states — EXTEND
- KAI-014 — Real Hunter running state — CONNECT
- KAI-015 — Real Hunter success state — CONNECT
- KAI-016 — Explicit zero-result UX — EXTEND
- KAI-017 — Real failure/error UX — EXTEND
- KAI-018 — Source-degraded state — ADD
- KAI-019 — Retry manual Hunter run — EXTEND
- KAI-020 — Preserve real run failure reason — CONNECT
- KAI-021 — No fake `trending` badge without evidence — RULE
- KAI-022 — No fake viral probability — RULE
- KAI-023 — Demo data allowed only in explicitly unauthenticated/demo contexts — RULE

---

## EPIC 2 — Hunter production reliability

**Priority:** P0

- KAI-024 — Manual Hunter execution — CERTIFY
- KAI-025 — Hunter run persistence — KEEP
- KAI-026 — Run lineage to Brand snapshot — CERTIFY
- KAI-027 — Discovery Plan lineage — CERTIFY
- KAI-028 — Topic Graph integration — CERTIFY
- KAI-029 — Brand Intelligence context — CERTIFY
- KAI-030 — Source adapter health tracking — EXTEND
- KAI-031 — Source timeout handling — EXTEND
- KAI-032 — Partial/degraded run handling — EXTEND
- KAI-033 — Source-content deduplication — EXTEND
- KAI-034 — Duplicate-opportunity detection — EXTEND
- KAI-035 — Refresh must produce genuinely refreshed evidence — CERTIFY
- KAI-036 — Hunter run telemetry — EXTEND
- KAI-037 — Production Hunter test suite — EXTEND
- KAI-038 — No fixture/mock evidence in authenticated production — CERTIFY

---

## EPIC 3 — Outlier Intelligence V1

**Priority:** P0

### Inputs

- KAI-039 — Creator follower/audience size
- KAI-040 — Views/impressions where available
- KAI-041 — Likes
- KAI-042 — Comments
- KAI-043 — Shares
- KAI-044 — Saves where available
- KAI-045 — Publish timestamp
- KAI-046 — Creator historical-content baseline
- KAI-047 — Niche/content-cohort baseline
- KAI-048 — Cross-platform recurrence

### Derived intelligence

- KAI-049 — Creator-baseline multiplier
- KAI-050 — Niche-baseline multiplier
- KAI-051 — Engagement rate
- KAI-052 — Engagement velocity
- KAI-053 — Recency score
- KAI-054 — Cross-platform recurrence score
- KAI-055 — Brand DNA relevance
- KAI-056 — Topic relevance
- KAI-057 — Content novelty
- KAI-058 — Evidence completeness
- KAI-059 — Evidence confidence
- KAI-060 — Explainable Opportunity Score

### Explainability requirement

Preferred user-facing output:

> 3.8× above this creator's recent baseline

Not:

> Viral probability 97%

---

## EPIC 4 — Opportunity Evidence Contract

**Priority:** P0

- KAI-061 — Source content ID
- KAI-062 — Source URL
- KAI-063 — Platform
- KAI-064 — Creator
- KAI-065 — Creator profile URL where available
- KAI-066 — Thumbnail/media
- KAI-067 — Original caption/title
- KAI-068 — Published date
- KAI-069 — Raw engagement metrics
- KAI-070 — Creator baseline
- KAI-071 — Niche baseline
- KAI-072 — Outlier multiplier
- KAI-073 — Velocity
- KAI-074 — Recency
- KAI-075 — Cross-platform recurrence
- KAI-076 — Brand relevance
- KAI-077 — Novelty
- KAI-078 — Evidence confidence
- KAI-079 — Evidence collection timestamp
- KAI-080 — Evidence provenance

---

## EPIC 5 — Discover Listing Intelligence

**Priority:** P0

Current Discover list/grid behaviour is preserved.

- KAI-081 — Platform/source indicator
- KAI-082 — Outlier multiplier
- KAI-083 — Brand Fit indicator
- KAI-084 — Confidence indicator
- KAI-085 — Recency
- KAI-086 — Compact `Why now`
- KAI-087 — Recommended format
- KAI-088 — Preserve save/dismiss actions
- KAI-089 — Preserve list/grid view
- KAI-090 — Preserve existing filters
- KAI-091 — Optional Strong Outliers filter
- KAI-092 — Optional High Brand Fit filter

### UX constraint

Do not turn Discover cards/table rows into miniature analytics dashboards. Intelligence must remain compact and scannable.

---

## EPIC 6 — Opportunity Intelligence Page

**Priority:** P0

Existing route and hero are preserved:

`apps/kairo-ui-v2/app/discover/[opportunityId]/page.tsx`

### Approved extension

The hero remains unchanged. All improvement lives below/inside the existing structure.

### Section A — Opportunity header / existing hero

- KAI-093 — Existing opportunity title — KEEP
- KAI-094 — Source platform — EXTEND
- KAI-095 — Outlier multiplier — EXTEND
- KAI-096 — Brand Fit — KEEP/EXTEND
- KAI-097 — Confidence — EXTEND
- KAI-098 — Original media/thumbnail — KEEP
- KAI-099 — Open original source — EXTEND

### Section B — Evidence

- KAI-100 — Views/impressions
- KAI-101 — Engagement
- KAI-102 — Creator baseline
- KAI-103 — Niche baseline
- KAI-104 — Velocity
- KAI-105 — Recency
- KAI-106 — Recurrence
- KAI-107 — Evidence confidence
- KAI-108 — Explain why Kairo flagged the opportunity

### Section C — Why This Worked

- KAI-109 — Hook
- KAI-110 — Curiosity gap
- KAI-111 — Emotional driver
- KAI-112 — Pattern interrupt
- KAI-113 — Story structure
- KAI-114 — Visual mechanism
- KAI-115 — Retention mechanism
- KAI-116 — CTA mechanism
- KAI-117 — Share/save/comment motivation
- KAI-118 — Reusable mechanism
- KAI-119 — What not to copy

### Section D — Your Move

- KAI-120 — Brand-specific angle
- KAI-121 — Opening hook
- KAI-122 — Premise
- KAI-123 — Recommended format
- KAI-124 — Execution structure
- KAI-125 — CTA
- KAI-126 — Brand DNA rationale

### Section E — Concept Mockup

- KAI-127 — Preserve existing concept-mockup component
- KAI-128 — Concept generated from Your Move
- KAI-129 — Regenerate concept
- KAI-130 — Create Content CTA
- KAI-131 — Persist concept lineage

### Frozen tab structure

Only these tabs are approved:

**Why It Worked → Your Move → Concept Mockup**

**Performance is explicitly NOT part of the Opportunity page.** Performance belongs after publishing in Content/Insights.

### Approved interaction model

- Expanded state for each of the three tabs
- Minimized/collapsed state for each section
- Progressive disclosure
- Existing hero remains visually and structurally unchanged
- No new sidebar destination

---

## EPIC 7 — Why This Worked engine

**Priority:** P0

- KAI-132 — Hook detection
- KAI-133 — Narrative structure detection
- KAI-134 — Emotional-trigger extraction
- KAI-135 — Visual-mechanism extraction
- KAI-136 — Retention-device analysis
- KAI-137 — CTA mechanism analysis
- KAI-138 — Engagement-motivation analysis
- KAI-139 — Reusable-mechanism synthesis
- KAI-140 — Originality/copy-risk warning
- KAI-141 — Confidence per explanation

---

## EPIC 8 — Your Move engine

**Priority:** P0

- KAI-142 — Read Brand DNA
- KAI-143 — Read Visual DNA
- KAI-144 — Read audience
- KAI-145 — Read tone/voice
- KAI-146 — Read products/services
- KAI-147 — Read historical learning
- KAI-148 — Preserve winning opportunity mechanism
- KAI-149 — Change wording/creative expression
- KAI-150 — Generate branded hook
- KAI-151 — Generate premise
- KAI-152 — Select format
- KAI-153 — Generate execution plan
- KAI-154 — Generate CTA
- KAI-155 — Explain adaptation

---

## EPIC 9 — Concept layer

**Priority:** P0

- KAI-156 — Preserve current Concept Mockup design — KEEP
- KAI-157 — Opportunity → Concept lineage — CONNECT
- KAI-158 — Your Move → Concept — CONNECT
- KAI-159 — Format-specific mockup — EXTEND
- KAI-160 — Brand visual context — EXTEND
- KAI-161 — Presenter/avatar where applicable — CONNECT
- KAI-162 — Fast regenerate — EXTEND
- KAI-163 — Create Content from concept — CONNECT

---

## EPIC 10 — Creation Experience

**Priority:** P0

Backend may orchestrate:

**Researcher → Strategist → Drafter → Critic**

The customer must not need to manage those agents individually.

Approved customer-facing progress model:

- Understanding opportunity
- Adapting to your Brand
- Creating content
- Quality checking

Backlog:

- KAI-164 — Preserve existing Simple Creation flow — KEEP
- KAI-165 — Pass Opportunity lineage into creation — CONNECT
- KAI-166 — Research context — CONNECT
- KAI-167 — Strategy/angle context — CONNECT
- KAI-168 — Draft generation — CONNECT
- KAI-169 — Visual generation — EXTEND
- KAI-170 — Progress state — EXTEND
- KAI-171 — Failure state with retry — EXTEND
- KAI-172 — Do not expose internal-agent complexity — RULE

---

## EPIC 11 — Pre-Publish Intelligence

**Priority:** P0

- KAI-173 — Hook score
- KAI-174 — Retention score
- KAI-175 — Brand Fit score
- KAI-176 — Opportunity Fit score
- KAI-177 — Novelty score
- KAI-178 — CTA score
- KAI-179 — Platform-suitability score
- KAI-180 — Visual-consistency score
- KAI-181 — Evidence confidence
- KAI-182 — Overall quality result

All scores must be explainable. No fake viral prediction.

---

## EPIC 12 — Critic Gate V2

**Priority:** P0

Required state machine:

**Generate → Critic → PASS**

or

**Generate → Critic → REVISION_REQUIRED → automatic revision → Critic → PASS**

After bounded attempts:

**NEEDS_ATTENTION**

Backlog:

- KAI-183 — Brand-fit rubric
- KAI-184 — Hook rubric
- KAI-185 — Retention rubric
- KAI-186 — Opportunity-mechanism rubric
- KAI-187 — Originality rubric
- KAI-188 — Platform-suitability rubric
- KAI-189 — CTA rubric
- KAI-190 — Visual-consistency rubric
- KAI-191 — Truth/claim consistency
- KAI-192 — Revision instructions
- KAI-193 — Automatic revision
- KAI-194 — Automatic re-review
- KAI-195 — Bounded revision count
- KAI-196 — Pass / Revision / Unavailable states
- KAI-197 — Persist scoring history

---

## EPIC 13 — Post generation

**Priority:** P0

Definition of finished Post: **copy + actual final visual**.

- KAI-198 — Platform-ready caption
- KAI-199 — Hook
- KAI-200 — Body copy
- KAI-201 — CTA
- KAI-202 — Hashtags where appropriate
- KAI-203 — Generated image
- KAI-204 — Brand styling
- KAI-205 — Correct format dimensions
- KAI-206 — Quality gate
- KAI-207 — Preview
- KAI-208 — Edit
- KAI-209 — Regenerate

---

## EPIC 14 — Carousel generation

**Priority:** P0

- KAI-210 — Slide structure
- KAI-211 — Cover
- KAI-212 — Narrative sequence
- KAI-213 — Final CTA
- KAI-214 — Brand typography
- KAI-215 — Brand colors
- KAI-216 — Images/graphics
- KAI-217 — Actual rendered slides
- KAI-218 — Slide editing
- KAI-219 — Regenerate one slide
- KAI-220 — Regenerate complete carousel
- KAI-221 — Caption
- KAI-222 — Critic gate
- KAI-223 — Platform-ready export

---

## EPIC 15 — Reel V1

**Priority:** P0

V1 definition: **script + storyboard + scene assets**.

- KAI-224 — Hook
- KAI-225 — Complete script
- KAI-226 — Scene breakdown
- KAI-227 — Narration
- KAI-228 — On-screen text
- KAI-229 — Shot/visual direction
- KAI-230 — Generated scene assets
- KAI-231 — Presenter/avatar instructions
- KAI-232 — Timing
- KAI-233 — CTA
- KAI-234 — Critic gate
- KAI-235 — Storyboard preview

Full automated video synthesis is LATER.

---

## EPIC 16 — Content Preview

**Priority:** P0

Current Content Preview architecture is preserved.

- KAI-236 — Finished asset preview
- KAI-237 — Format controls
- KAI-238 — Quality score
- KAI-239 — Critic status
- KAI-240 — Opportunity lineage
- KAI-241 — Concept lineage
- KAI-242 — Edit
- KAI-243 — Regenerate
- KAI-244 — Approve
- KAI-245 — Publish/schedule
- KAI-246 — Needs Attention state

---

## EPIC 17 — Visual Brand DNA

**Priority:** P1

Visual Identity belongs inside the existing Brand Brain; no new top-level navigation.

- KAI-247 — Logo
- KAI-248 — Brand colors
- KAI-249 — Fonts
- KAI-250 — Photography style
- KAI-251 — Illustration style
- KAI-252 — Graphic treatments
- KAI-253 — Composition rules
- KAI-254 — Presenter/person style
- KAI-255 — Reference posts
- KAI-256 — Approved generated assets
- KAI-257 — Visual DNA completeness
- KAI-258 — Use Visual DNA during generation
- KAI-259 — Use Visual DNA during Critic review

---

## EPIC 18 — Avatar / Presenter

**Priority:** P1

Keep within existing Settings/Avatar direction.

- KAI-260 — Avatar identity
- KAI-261 — Presenter preferences
- KAI-262 — Appearance
- KAI-263 — Approved references
- KAI-264 — Usage permissions/preferences
- KAI-265 — Generation integration
- KAI-266 — Reel storyboard integration
- KAI-267 — Visual DNA integration

---

## EPIC 19 — Content Library

**Priority:** P1

Current Content list stays.

- KAI-268 — List view — KEEP
- KAI-269 — Grid view — KEEP
- KAI-270 — Status filters — EXTEND
- KAI-271 — Format filters — KEEP/EXTEND
- KAI-272 — Campaign filter — KEEP
- KAI-273 — Opportunity source/linkage — EXTEND
- KAI-274 — Quality state — EXTEND
- KAI-275 — Published/performance state — EXTEND
- KAI-276 — Continue Working behaviour — CERTIFY

---

## EPIC 20 — Campaigns

**Priority:** P1

Existing campaign pages remain.

- KAI-277 — Campaign list — KEEP
- KAI-278 — Campaign preview — KEEP
- KAI-279 — Related content — CONNECT
- KAI-280 — Campaign goal — EXTEND
- KAI-281 — Opportunity lineage — EXTEND
- KAI-282 — Status — EXTEND
- KAI-283 — Performance rollup — P1

---

## EPIC 21 — Publishing

**Priority:** P0/P1

- KAI-284 — Instagram connection — CERTIFY
- KAI-285 — Facebook/Instagram account state — CERTIFY
- KAI-286 — Image publish — CERTIFY
- KAI-287 — Carousel publish — CERTIFY
- KAI-288 — Reel publish when asset support permits — CERTIFY
- KAI-289 — Publish-status polling — CERTIFY
- KAI-290 — Publish errors — EXTEND
- KAI-291 — Retry — EXTEND
- KAI-292 — Calendar integration — CONNECT
- KAI-293 — Schedule content — CERTIFY
- KAI-294 — Persist actual platform URL — CONNECT

---

## EPIC 22 — Calendar

**Priority:** P1

Current Calendar UI is preserved.

- KAI-295 — Today
- KAI-296 — Week
- KAI-297 — Month
- KAI-298 — List
- KAI-299 — Draft content
- KAI-300 — Scheduled content
- KAI-301 — Published content
- KAI-302 — Click → Content Preview
- KAI-303 — Reschedule
- KAI-304 — Publish state

---

## EPIC 23 — Performance

**Priority:** P0/P1

Performance belongs after content is published, not on the Opportunity page.

- KAI-305 — Published-content metrics
- KAI-306 — Views/impressions
- KAI-307 — Likes
- KAI-308 — Comments
- KAI-309 — Shares
- KAI-310 — Saves
- KAI-311 — Watch/retention metrics where available
- KAI-312 — Follower/account growth
- KAI-313 — Content-format comparison
- KAI-314 — Hook comparison
- KAI-315 — Topic comparison
- KAI-316 — Expected vs actual result

---

## EPIC 24 — Learner

**Priority:** P0

- KAI-317 — Content → opportunity lineage
- KAI-318 — Content → concept lineage
- KAI-319 — Content → Brand snapshot lineage
- KAI-320 — Performance attribution
- KAI-321 — Identify successful hooks
- KAI-322 — Identify successful topics
- KAI-323 — Identify successful formats
- KAI-324 — Identify successful CTA patterns
- KAI-325 — Identify visual patterns
- KAI-326 — Confidence threshold before learning
- KAI-327 — Persist performance patterns
- KAI-328 — Feed learning into Hunter
- KAI-329 — Feed learning into Your Move
- KAI-330 — Feed learning into content generation
- KAI-331 — User-visible `What Kairo learned`

---

## EPIC 25 — Insights

**Priority:** P1

Current Insights page is extended, not redesigned.

- KAI-332 — Current performance summary
- KAI-333 — Best content
- KAI-334 — Format learning
- KAI-335 — Topic learning
- KAI-336 — Hook learning
- KAI-337 — What Kairo Learned
- KAI-338 — Supporting sample count
- KAI-339 — Confidence
- KAI-340 — `Used in future recommendations` indication
- KAI-341 — Expected-vs-actual comparison

---

## EPIC 26 — Brand Brain completion

**Priority:** P1

Current Brand Brain page/tabs are preserved.

- KAI-342 — Overview persistence — CERTIFY
- KAI-343 — Brand DNA persistence — CERTIFY
- KAI-344 — Discovery Intelligence persistence — CERTIFY
- KAI-345 — Sources persistence — CONNECT
- KAI-346 — Learning persistence — CONNECT
- KAI-347 — Source health
- KAI-348 — BI completeness
- KAI-349 — Visual DNA
- KAI-350 — Refresh/recalculate
- KAI-351 — Last-updated state
- KAI-352 — Evidence provenance

---

## EPIC 27 — Source Intelligence

**Priority:** P1

- KAI-353 — Website
- KAI-354 — Instagram
- KAI-355 — Facebook
- KAI-356 — YouTube
- KAI-357 — LinkedIn where public extraction permits
- KAI-358 — Source-type detection
- KAI-359 — Source extraction status
- KAI-360 — Data freshness
- KAI-361 — Source contribution to Brand Intelligence
- KAI-362 — Remove source
- KAI-363 — Refresh source
- KAI-364 — Recalculate BI after source change

---

## EPIC 28 — Onboarding certification

**Priority:** P0 before commercial launch

Approved onboarding is preserved unless testing exposes a defect.

- KAI-365 — New user
- KAI-366 — Authentication
- KAI-367 — Brand creation
- KAI-368 — Website source
- KAI-369 — Instagram source
- KAI-370 — Multi-source
- KAI-371 — Extraction
- KAI-372 — Brand Brain creation
- KAI-373 — BI readiness
- KAI-374 — Hunter eligibility
- KAI-375 — User reaches Home successfully
- KAI-376 — Empty/failure recovery
- KAI-377 — Add source after onboarding

---

## EPIC 29 — Commercial Product Shell

**Priority:** P1

- KAI-378 — Product entitlement model
- KAI-379 — Hunter usage limits
- KAI-380 — Generation usage limits
- KAI-381 — Brand limits
- KAI-382 — Publishing limits if applicable
- KAI-383 — Usage display
- KAI-384 — Plan gating
- KAI-385 — Upgrade state
- KAI-386 — Billing integration
- KAI-387 — Subscription state
- KAI-388 — Trial
- KAI-389 — Cancellation
- KAI-390 — Account state
- KAI-391 — Support/contact pathway

Pricing is a separate commercial decision and must not distort the core product UX before closure.

---

## EPIC 30 — Product Health and Operations

**Priority:** P1

- KAI-392 — Hunter failure telemetry
- KAI-393 — Generation failure telemetry
- KAI-394 — Publishing failure telemetry
- KAI-395 — Source-adapter health
- KAI-396 — AI-provider health
- KAI-397 — Cost tracking per Hunter run
- KAI-398 — Cost tracking per generated asset
- KAI-399 — Latency tracking
- KAI-400 — Error correlation/run ID
- KAI-401 — Safe retries
- KAI-402 — Admin diagnostics

---

## EPIC 31 — Security / Trust / Data

**Priority:** P0 launch gate

- KAI-403 — Workspace isolation
- KAI-404 — Brand isolation
- KAI-405 — Auth enforcement
- KAI-406 — Social-token protection
- KAI-407 — Server-side secret handling
- KAI-408 — Source provenance
- KAI-409 — Publishing authorisation
- KAI-410 — Delete/disconnect social source
- KAI-411 — Delete generated asset
- KAI-412 — Audit important publishing events

---

## EPIC 32 — End-to-End Product Certification

**Priority:** P0

A fresh customer account must complete:

**Onboarding → Brand Brain → BI readiness → Manual Hunter → real Opportunity → evidence + outlier explanation → Why It Worked → Your Move → Concept Mockup → Create → Critic → Finished Content → Content Preview → Publish → Performance → Learner → improved next Hunter run**

### Hard acceptance

- No fixtures
- No fake fallback
- No manual DB intervention
- No developer intervention
- No dead-end button
- No legacy-product detour
- No unexplained AI score
- No `Ready` before required quality gate

---

## EPIC 33 — Scheduled Hunter

**Priority:** LATER, after manual loop certification

- KAI-413 — Schedule preferences
- KAI-414 — Background Hunter
- KAI-415 — Run deduplication
- KAI-416 — Opportunity digest
- KAI-417 — New-opportunity notification
- KAI-418 — Daily recommendations

---

## EPIC 34 — Controlled Autopilot

**Priority:** LATER

Frozen sequence:

**Manual Hunter → Scheduled Hunter → Daily Brief → Prepared Content → Optional controlled autopilot**

Unrestricted autonomous publishing is not part of V1.

---

## EPIC 35 — Advanced Media

**Priority:** LATER

- Full Reel rendering
- Video composition
- Voice generation
- Music selection
- B-roll generation
- Advanced avatar video
- Multi-scene video
- Advanced motion graphics

None of these may delay the V1 intelligence → creation → learning loop.

---

# 5. Page-level impact map

| Page | Decision | Impact |
|---|---|---|
| Onboarding | Preserve | Certification only |
| Home | Preserve + Extend | Truth + compact intelligence |
| Discover List | Preserve + Extend | Outlier/evidence metadata |
| Opportunity Preview | Preserve + Major extension | Evidence + Why It Worked + Your Move + Concept |
| Content List | Preserve + Extend | Lineage/quality/performance states |
| Content Preview | Preserve + Extend | Finished asset + Critic + publish |
| Campaign List | Preserve | Small metadata extensions |
| Campaign Preview | Preserve | Related intelligence later |
| Calendar | Preserve | Connection/certification |
| Insights | Preserve + Extend | What Kairo Learned |
| Brand Brain Overview | Preserve | Completeness/truth |
| Brand DNA | Preserve + Extend | Visual DNA linkage |
| Discovery Intelligence | Preserve + Extend | Hunter intelligence |
| Sources | Preserve + Extend | Health/freshness |
| Learning | Preserve + Extend | Performance memory |
| Settings | Preserve | Account-level settings |
| Avatar | Preserve + Extend | Visual/presenter intelligence |

---

# 6. Frozen UI design DNA authority

The current `apps/kairo-ui-v2` implementation is the source of truth.

Do not use legacy Kairo to generate or evaluate mockups.

Current V2 design characteristics include:

- dark base using the existing V2 tokens
- fixed V2 shell proportions
- existing sidebar/topbar/workspace measurements
- restrained violet intelligence/action hierarchy
- lime only for positive/trust signals
- dark flat panels with subtle borders
- existing typography scale and spacing density
- current list/grid/table patterns
- current button sizing and interaction language
- progressive disclosure over dense dashboard layouts

No mockup may introduce a new visual system simply because it appears more polished.

---

# 7. Kairo Mockup Governance Rule — Frozen

These rules apply to all remaining mockup work.

## 7.1 Frozen means frozen

Once a page or state is approved, it must not be regenerated, reinterpreted, included again in comparison boards or modified unless explicitly reopened.

## 7.2 One page at a time

Only the next unapproved page is mocked. No multi-page boards unless explicitly requested.

## 7.3 Current Kairo UI V2 is the sole UI authority

Use only `apps/kairo-ui-v2` for design references.

## 7.4 Extension, not redesign

Existing shell, hero, navigation, typography, spacing, cards, buttons, colors, list/grid behaviour and page structure remain unchanged unless the affected region is explicitly approved for modification.

## 7.5 Pixel-level Kairo DNA

New UI must visually inherit the existing V2 design tokens, spacing, radii, type scale and component language.

## 7.6 Progressive disclosure

Summary first. Detail only when expanded. Do not expose all intelligence at once.

## 7.7 Preserve existing interaction model

Existing list/grid views, Preview actions and navigation remain unless explicitly reopened.

## 7.8 No invented product capability

Do not introduce Performance, scoring, filters, actions, tabs or features merely because they look useful. Every addition must be part of this backlog or separately approved.

## 7.9 Mockup scope declaration before generation

Before every mockup, state:

1. the page being changed
2. what remains frozen
3. exact elements being added
4. exact elements not being touched

## 7.10 Approval gate

**Generate one mockup → review → revise only that mockup if needed → approve → freeze → move to next page.**

## 7.11 No implementation before mockup approval

All affected-page mockups are approved before implementation begins for that page.

---

# 8. Opportunity Preview V1 — Approved and frozen

Route:

`/discover/[opportunityId]`

Implementation authority:

`apps/kairo-ui-v2/app/discover/[opportunityId]/page.tsx`

## Preserved

- current Kairo V2 shell
- current Back to Discover behaviour
- current Opportunity hero layout
- current media area
- current Brand-fit section
- current CTA/action area
- current recommended-format metadata rail
- current channel metadata
- current Discover relationship

## Approved extension

Below the existing hero, the page uses progressive disclosure around exactly three intelligence areas:

1. **Why It Worked**
2. **Your Move**
3. **Concept Mockup**

Each has:

- a full/expanded state
- a minimized/collapsed state

Evidence remains compact and explainable.

## Explicitly excluded

- Performance tab
- new sidebar navigation
- new page route
- replacement hero
- analytics-dashboard overload
- legacy UI components

Performance belongs only after publishing, principally within Content/Insights.

This page is now **frozen and must not be generated again** unless explicitly reopened.

---

# 9. Remaining mockup order

The remaining UI mockups will be approved one by one.

## Next

**Discover List V2 extension**

Preserve:

- current Discover header
- current search
- current filters
- current list/grid toggle
- current table layout
- current card layout
- Preview / Save / Dismiss
- current shell

Allowed additions only:

- compact Outlier signal
- compact Brand Fit
- compact Confidence
- concise Why Now

Do not add a new navigation destination, new page, analytics dashboard or dense score surface.

## Then

1. Creation progress
2. Content Preview — Post
3. Content Preview — Carousel
4. Content Preview — Reel V1
5. Critic/Quality states
6. Needs Attention
7. Brand Brain Overview extensions
8. Visual DNA
9. Discovery Intelligence
10. Sources
11. Learning
12. Avatar
13. Publish state
14. Calendar extensions
15. Insights / What Kairo Learned
16. Performance detail
17. Content List extensions
18. Campaign List/Preview extensions
19. Usage/plan state
20. Account/commercial states

Each page follows the frozen mockup governance rule.

---

# 10. V1 completion definition

Kairo V1 is complete when a fresh customer can execute this full loop without intervention:

**Brand URL/social → Brand Brain → Manual Hunter → real Opportunity → evidence + outlier explanation → Why It Worked → Your Move → Concept → finished content → Critic Pass → Preview → Publish → actual Performance → Learner → visibly improved next Hunter run**

and the system satisfies all trust, truthfulness, lineage, quality and UX gates above.

---

## Reopen policy

This document is frozen as the approved Kairo V1 completion authority.

A frozen item may be reopened only by explicit product-owner approval. A later implementation discovery may refine technical details without weakening the product, trust or UI constraints recorded here.
