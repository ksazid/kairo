---
title: Kairo Glossary
document_id: CIE-GLOSSARY-001
version: 1.0
status: Approved
owner: Product
last_updated: 2026-08-12
depends_on:
  - CIE-PRD-001
  - CIE-TRD-001
  - CIE-DESIGN-001
used_by:
  - PES intake
  - Kairo implementation
  - Kairo product copy
---

# Kairo — Content Intelligence Engine Glossary v1.0

## Naming

**Kairo** — the customer-facing product name.

**Content Intelligence Engine (CIE)** — the product category and stable internal/document namespace used by approved artifact identifiers such as `CIE-PRD-001`, `CIE-TRD-001` and `CIE-DESIGN-001`. Renaming the product to Kairo does not require renumbering approved CIE artifacts.

## Core product terms

**Workspace** — the top-level account/team boundary containing one or more Brands and Workspace-level policies.

**Brand** — an independent content-intelligence identity with its own Brand Brain, knowledge, content history, metrics and private learning. A Brand may represent a person, company, product, page, publication or client property.

**Brand Brain** — the structured, inspectable collection of Brand identity, positioning, audience, voice, goals, content strategy, knowledge, examples and boundaries. Material inferred facts remain distinguishable from user-confirmed facts.

**Signal** — raw public, connected or user-supplied information that may indicate a worthwhile content opportunity.

**Opportunity** — a Signal, topic or theme that has sufficient relevance, evidence, novelty, timing or evergreen value for a specific Brand to consider developing.

**Idea** — an Opportunity or user-originated concept intentionally saved or developed toward content creation.

**Research Dossier** — the evidence and context assembled for an Idea, including sources, dates, competing interpretations, uncertainties, Claims and Brand relevance.

**Claim** — a factual or assertive statement tracked with evidence, provenance, freshness and verification state where applicable.

**Angle** — the selected framing or perspective through which an Idea becomes content for a target audience, objective, format or channel.

**Campaign** — the parent object connecting an approved Idea/Angle to one or more channel-specific Content Assets while preserving common lineage.

**Content Asset** — a piece of content intended for a particular format or channel.

**Content Version** — an immutable revision of a Content Asset. Editing an approved version creates a new version and may require reapproval.

**Published Post** — an externally published execution that retains its Campaign, Idea, Angle, Asset, approved-version and channel lineage.

**Performance** — measured outcomes associated with a Published Post, including only metrics that are actually available or reliably attributable.

**Performance Memory** — Brand-specific historical relationships among audience, topic, hook, Angle, format, channel, timing, CTA and measured outcomes. It is evidence, not automatic causal truth.

**Learning** — an evidence-backed Brand-specific conclusion derived from measured behaviour or outcomes. A Learning can be accepted, rejected, weakened, corrected or superseded as evidence changes.

**Experiment** — an intentional comparison with an explicit hypothesis, variant(s), primary metric, result and resulting Learning.

## Intelligence scopes

**Global Intelligence** — reusable public signals, research and general patterns that are safe to use across Brands. Private Brand information does not enter this scope without approved policy.

**Workspace Intelligence** — approved context, policies or shared research available within one Workspace.

**Brand Intelligence** — private Brand-specific knowledge, history, performance and Learnings. It must remain isolated from other Brands unless an explicit policy permits otherwise.

## Agent roles

**Hunter** — the discovery role that finds, normalises and prioritises potential Signals and Opportunities.

**Researcher** — the role that assembles evidence, Claims, source context and uncertainty into a Research Dossier.

**Strategist** — the role that evaluates Brand fit, audience value, positioning and candidate Angles.

**Drafter** — the role that creates candidate content from approved context, Research and Angle.

**Critic** — the logically independent role that evaluates content against Brand, audience, quality and policy rubrics. It cannot override hard platform policy.

**Judge** — the role that selects among valid candidates or hooks after required policy checks.

**Analyst** — the role that interprets measured outcomes and identifies evidence-supported performance patterns.

**Learner** — the role that proposes Candidate Learnings from performance evidence. It cannot directly rewrite authoritative Brand truth.

## Skills, capabilities and tools

**Skill** — a versioned specialised instruction/capability package that may be selected for an agent under CIE policy.

**Skill Version** — a pinned, traceable release of a Skill including source, licence, hash/revision, permissions and compatibility metadata.

**Capability** — an abstract job such as hook generation, carousel planning, Instagram adaptation or LinkedIn adaptation. Multiple Skills may implement one Capability.

**Skill Registry** — the governed catalogue of available Skill Versions, metadata, permissions, approval status and benchmark status.

**Brand Skill Selection** — the approved Skill implementation/configuration selected for a Capability for a particular Brand.

**Capability Router** — the CIE-controlled component that selects an eligible Skill Version according to policy, Brand configuration, compatibility, benchmark evidence, cost and approved routing rules.

**Tool** — a controlled external action or integration exposed to an agent under explicit permissions. A Tool is not a Skill and cannot grant itself additional permissions.

**Skill Benchmark** — a controlled evaluation comparing Skill implementations using metrics such as Brand fit, factuality, human preference, Critic pass rate, edit distance, latency, cost and, where valid, downstream performance.

## Safety and control

**Truth / Claims Gate** — the CIE-owned deterministic policy boundary that blocks unsupported factual claims, fabricated first-person experience, prohibited Brand statements or other hard claim failures before publication.

**Human Approval** — the mandatory V1 authority required before external publication. Approval applies to a specific Content Version and destination context.

**Publishing Adapter** — deterministic channel-specific software that publishes an approved Content Version through an authorised external API and records the external outcome.

**Metric Provenance** — the source, capture time and transformation history needed to understand where a performance metric came from.

**Candidate Learning** — a proposed Learning with evidence, sample period, confidence, contradictions and scope that has not yet become an accepted active Learning.

## Runtime and infrastructure

**Agent Runtime** — the replaceable environment that executes an agent role, such as the preferred Hermes candidate or a direct-model fallback. It is not the source of truth for Kairo domain state.

**Agent Control Plane** — an optional orchestration layer for dispatch, budgets, schedules, persistent tasks and operational coordination. Paperclip is an evaluation candidate; the control plane is not authoritative over Kairo domain state.

**Model Gateway** — the provider-neutral boundary through which approved model calls are made and recorded.

**Vector Retrieval Provider** — the replaceable semantic-retrieval boundary. Qdrant/TurboQuant is the preferred direction subject to benchmark validation; relational business truth remains in PostgreSQL.

**Evolution Provider** — an optional component that may propose strategy or Skill improvements from outcomes. EvoMap Evolver is an R&D candidate; evolved proposals require evaluation and approval before production use.

**PES Web/AI Profile** — the reusable implementation profile that applies TypeScript/Node, Python-runtime, contract, migration, AI-evaluation, Skill-security and agent-control execution rules beneath technology-neutral PES governance.

## Canonical language rule

Product UI and documentation should prefer these terms consistently. Internal implementation names may differ only where necessary and must remain traceable to the canonical product term. New ambiguous domain terms should be added to this glossary before becoming cross-module public contracts.