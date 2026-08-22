# Content Intelligence Engine Decision Log

## CIE-DEC-001 — Product category

**Decision:** CIE is a multi-Brand Content Intelligence Engine, not merely an AI writer, bulk generator or social scheduler.

**Rationale:** The differentiated product thesis is the closed loop from opportunity discovery through performance learning.

**Reopen only if:** Customer evidence shows generation/scheduling alone is the stronger and more defensible product.

---

## CIE-DEC-002 — Primary operating object

**Decision:** Brand/Property is the primary content-intelligence object beneath a Workspace.

**Rationale:** CIE must support personal brands, educational pages, companies, products and future client properties without forcing all users into a legal-business model.

**Reopen only if:** Multi-tenant or product evidence demonstrates a materially better boundary.

---

## CIE-DEC-003 — Intelligence isolation

**Decision:** Each Brand maintains isolated knowledge, voice, audience, content history, performance memory and learned patterns. Private Brand intelligence must not train or contaminate another Brand without a separately approved policy.

**Reopen only if:** A privacy-reviewed aggregate-learning design is explicitly approved.

---

## CIE-DEC-004 — Core product loop

**Decision:** The core loop is Discover -> Research -> Strategise -> Create -> Critique -> Approve -> Publish -> Measure -> Learn.

**Rationale:** CIE's value is the closed learning loop and quality of the next content decision.

---

## CIE-DEC-005 — V1 platform priority

**Decision:** Web is the primary V1 product. Native mobile is a later focused companion for capture, approvals, opportunities, alerts and quick actions.

**Reopen only if:** Pilot workflow evidence shows mobile is required for first value or retention.

---

## CIE-DEC-006 — V1 autonomy

**Decision:** V1 targets semi-autonomous operation: AI may discover and prepare content, but a human must approve before external publication.

**Out of scope:** unrestricted autonomous publishing, paid-ad execution and autonomous spend.

---

## CIE-DEC-007 — Primary pilot channels

**Decision:** Instagram and LinkedIn are the primary pilot channel targets. The core channel model remains extensible and may support manual publishing/metric import for unsupported channels.

**Reopen only if:** API feasibility, pilot-customer evidence or cost makes a different initial channel set materially better.

---

## CIE-DEC-008 — Content lineage

**Decision:** Idea/Campaign lineage is preserved through Research, Angle, Content Asset, Published Post, Performance and Learning. Individual channel posts are not isolated parent objects.

**Rationale:** Cross-channel experiments and learning require common provenance.

---

## CIE-DEC-009 — Content quality roles

**Decision:** Drafting, Critique and Judging are logically separated. Hard truth/Brand/policy failures cannot be compensated by aggregate quality scores. Revision loops are bounded.

**Rationale:** Independent review is a core quality-control mechanism and avoids self-evaluation bias.

---

## CIE-DEC-010 — Atlas relationship

**Decision:** CIE remains independently usable. Atlas is an important future integration and distribution route but is not a mandatory dependency and Atlas-origin demand is not treated as proven until measured.

**Rationale:** Preserve CIE as a reusable product while retaining the strategic owned/adjacent channel opportunity.

---

## CIE-DEC-011 — IVF recommendation

**Decision:** Proceed with conditions through product definition and controlled validation.

**Conditions:** first ICP, willingness to pay, closed-loop learning value, operating cost, multi-Brand isolation, channel/platform constraints and safe publishing must be validated before scale.

---

## CIE-DEC-012 — PRD v1.0 approval

**Decision:** `CIE-PRD-001 v1.0` is approved as the product authority for CIE V1. Stable functional requirements are `FR-01` through `FR-20`.

**Rationale:** The PRD freezes the web-first multi-Brand product, Brand Brain, Hunter/Discover, research/angles, Campaign/Content Studio, independent quality review, human approval, publishing, performance intelligence and Brand Learning while explicitly excluding broad social-suite expansion and autonomous paid growth.

**Reopen only if:** New customer evidence, material technical/platform constraints, legal/privacy requirements or failed validation assumptions justify a product decision change.

---

## CIE-DEC-013 — Dynamic Skill Platform

**Decision:** CIE will use an extensible, versioned Skill Registry rather than freezing one permanent skill set. Skills may be selected and configured by capability and, where permitted, by Brand. Multiple implementations of one capability may be benchmarked against controlled evaluation and real Brand performance evidence.

**Rationale:** Content channels, external skill ecosystems and Brand needs will change. CIE's defensibility should come from routing, evaluation, Brand-specific performance intelligence and proprietary policy/learning rather than dependency on one third-party prompt package.

**Non-replaceable controls:** Brand/Workspace isolation, Truth/Claims policy, publishing authorisation, spend controls, metric provenance, Brand Learning policy, skill approval/benchmarking and cross-Brand privacy remain CIE-controlled.

**Reopen only if:** Security, operability or customer evidence shows dynamic skills create unacceptable complexity relative to value.

---

## CIE-DEC-014 — Agent runtime and control-plane candidates

**Decision:** Hermes Agent is the preferred reasoning-runtime candidate. Paperclip is an approved TRD evaluation candidate for agent coordination, persistent tasks, schedules, budgets, approvals, auditability and skill assignment. EvoMap Evolver is an optional R&D evolution-provider candidate. None of these components is approved for implementation solely by this decision.

**Rationale:** CIE requires specialised Hunter, Researcher, Strategist, Drafter, Critic, Judge, Analyst and Learner roles, but the product must retain authority over tenancy, domain state, lineage, policy, Brand memory and publishing guarantees.

**Architecture constraint:** external runtimes/control planes must sit behind replaceable application-owned boundaries. The TRD must define a viable native fallback and must not make Paperclip or Evolver an irreversible dependency.

**Reopen only if:** TRD prototyping, licensing, operational complexity, security, cost or maturity evidence demonstrates a materially better runtime/control-plane design.

---

## CIE-DEC-015 — TRD v1.0 approval

**Decision:** `CIE-TRD-001 v1.0` is approved as the technical authority for CIE V1.

**Architecture:** CIE uses a web-first TypeScript modular monolith, PostgreSQL as authoritative source of truth, Qdrant as a derived semantic layer, PostgreSQL-backed durable jobs, deterministic publishing and policy controls, provider-neutral AI boundaries, Hermes as the preferred but replaceable agent runtime, and a dynamic Brand-aware Skill Registry.

**Paperclip:** Paperclip remains an optional control-plane candidate and requires a focused spike plus separate approval before implementation dependency is accepted.

**Reopen only if:** Prototype evidence, security, cost, platform/API feasibility, operational complexity or pilot evidence materially invalidates the approved design.

---

## CIE-DEC-016 — PES remains stack-agnostic

**Decision:** CIE will not alter PES core governance to fit TypeScript or Python. PES remains technology-neutral. At PES handoff, CIE will use a reusable Web/AI implementation profile defining TypeScript/Node, Python runtime, contract, migration, AI-evaluation, skill-security and agent-control execution rules.

**Rationale:** PES governs how approved work moves through slices, Loop, Superpowers, deterministic checks, reviews, gates, certification and human merge. Technology-specific execution belongs in implementation profiles, allowing CIE to use the right stack without coupling PES to one product.

**Reopen only if:** PES governance itself proves incapable of expressing a required CIE delivery control, rather than merely lacking a stack-specific profile.

---

## CIE-DEC-017 — Design Baseline v1.0 approval

**Decision:** `CIE-DESIGN-001 v1.0` is approved as the visual and interaction authority for CIE/Kairo. The product uses a simple, minimalist, content-first design with shared visual DNA across web and native mobile, while allowing platform-appropriate interaction patterns.

**Approved direction:** Inter typography, neutral light-first surfaces, restrained `#4F46E5` primary accent, generous whitespace, subtle elevation, simple outline iconography, purposeful motion and strong web/mobile consistency.

**Reopen only if:** Usability, accessibility or pilot evidence demonstrates that a material design change is required.

---

## CIE-DEC-018 — Product name: Kairo

**Decision:** The customer-facing product name is **Kairo**. **Content Intelligence Engine (CIE)** remains the product category and stable internal/document namespace.

**Rationale:** Kairo is short, memorable and aligns with the product's purpose of identifying the right thing for a Brand to say at the right moment. Retaining the CIE namespace avoids unnecessary churn in already approved requirements, technical and design artifact identifiers.

**Naming rule:** New customer-facing copy should use Kairo. Architecture, governance and historical artifact IDs may continue to use CIE where clarity or traceability requires it.

**Reopen only if:** Trademark/domain validation or material market evidence requires a different customer-facing name.

---

## CIE-DEC-019 — Glossary v1.0 approval

**Decision:** `CIE-GLOSSARY-001 v1.0` is approved as the canonical vocabulary authority for Kairo/CIE product, design and engineering work.

**Rationale:** Shared meanings for Brand, Opportunity, Idea, Campaign, Skill, Capability, Agent roles, Performance Memory and other core terms are required before PES decomposition to prevent semantic drift across TypeScript, Python, UI and AI contracts.

**Reopen only if:** An approved product/technical decision introduces a materially new concept or changes the meaning of an existing canonical term.

---

## CIE-DEC-020 — Approved Venture Package and PES handoff

**Decision:** `VENTURE-PACKAGE.yaml v1.0` is approved and frozen as the Kairo/CIE Approved Venture Package. Kairo is now **Ready for PES** under the IVF `Proceed with conditions` recommendation.

**Handoff authority:** PES receives the approved PRD, TRD, Design Baseline, Glossary, dynamic skills/agent architecture input, decision history, V1 exclusions, validation obligations and conditions. PES may decompose `FR-01..FR-20` into numbered vertical slices but may not silently expand product scope or replace approved product, technical, design or vocabulary authority.

**Implementation profile:** PES remains technology-neutral. Kairo requires the approved Web/AI implementation profile for TypeScript/Node, Python runtime boundaries, AI evaluations, Skill security, migrations, agent controls and deterministic certification gates.

**External component rule:** Hermes, Paperclip, Qdrant/TurboQuant, third-party Skills and channel integrations are promoted only after the validation required by the TRD/package. Paperclip remains evaluation-only and requires separate approval before becoming an implementation dependency.

**Naming condition:** Kairo remains the approved customer-facing name, but trademark/domain validation is required before public launch.

**Implementation boundary:** This handoff approval authorises PES intake and decomposition; it does not by itself approve production deployment, autonomous publishing, paid advertising or autonomous spend.

**Reopen only if:** PES intake identifies a material contradiction among approved artifacts, required validation invalidates a technical assumption, or new customer/legal/platform evidence requires an approved change.

---

## CIE-DEC-021 — Instagram intelligence, approved media and Performance Memory boundaries

**Decision:** Instagram onboarding and later Brand Brain refresh use the same replaceable adapters. Instagram Login is the recommended Professional-account path; Facebook Login remains available for Facebook Pages and linked Instagram accounts. Website remains optional and may be selected alongside either connection.

**Rendering boundary:** Brand palette plus approved resolved logo/imagery and explicitly supported font assets may enter deterministic rendering. A URL or asset identifier alone is not render authority. Carousel/Reel thumbnails share the immutable asset-version fingerprint and private-object lineage of the approved media.

**Learning boundary:** Performance patterns are typed as topic, hook, structure, template, format or timing, retain exact Brand-scoped post/metric evidence and remain causal-restrained Candidate Learnings. Only human-accepted Learnings appear in Brand Brain Performance Memory or influence later recommendations; they do not overwrite confirmed Brand facts.

**Operational boundary:** Production verification is exact-SHA bound and read-only unless the owner separately authorises an external publish. Temporary smoke resources may be removed only after their run evidence is preserved.

**Reopen only if:** Meta platform changes, renderer safety evidence or pilot learning quality materially invalidates these boundaries.
