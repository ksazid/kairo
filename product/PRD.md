---
title: Content Intelligence Engine Product Requirements Document
document_id: CIE-PRD-001
version: 1.0
status: Approved
owner: Product
last_updated: 2026-08-22
used_by:
  - CIE TRD
  - CIE Design Baseline
  - PES intake
  - CIE pilot
---

# Content Intelligence Engine Product Requirements Document v1.0

## Product authority

This document is the approved product authority for Content Intelligence Engine v1.0.

Stable functional requirements are `FR-01` through `FR-20`.

PES may decompose these requirements into numbered vertical slices but may not silently expand product scope.

## Executive summary

Content Intelligence Engine, abbreviated **CIE**, is a multi-Brand content intelligence platform.

It helps creators, founders and lean marketing operators determine:

- what their Brand should talk about;
- why the topic matters now;
- which angle is strongest;
- how to express it across channels;
- whether the resulting content worked;
- what should be done differently next time.

Its core promise is:

> **Add a Brand. Give CIE its knowledge and channels. CIE continuously discovers opportunities, creates high-quality content, measures what happens and learns what works for that specific Brand.**

CIE is not primarily an AI writer or social-media scheduler.

The core product is the closed intelligence loop:

```text
Discover
   ↓
Research
   ↓
Strategise
   ↓
Create
   ↓
Critique
   ↓
Approve
   ↓
Publish
   ↓
Measure
   ↓
Learn
   ↓
Better next decision
```

## Vision

CIE should become the intelligence layer behind every Brand a person or organisation operates.

One Workspace may eventually contain:

```text
Workspace
│
├── Personal Brand
├── Educational Instagram Page
├── Product
├── Company
├── Client Brand
└── Future Brand
```

Each Brand develops its own private understanding of:

- identity;
- audience;
- positioning;
- voice;
- knowledge;
- content history;
- topics;
- hooks;
- formats;
- channels;
- performance;
- experiments;
- learned patterns.

CIE should progressively become more useful because it remembers what actually worked.

## Positioning

CIE is:

> **A multi-Brand Content Intelligence Engine that discovers what each Brand should say, creates and evaluates the content, tracks its performance and continuously learns what works.**

The differentiation equation is:

> **Brand Context × Live Signals × Content Judgment × Performance Memory**

CIE does not compete primarily on the number of posts it can generate.

It competes on the quality of the **next content decision**.

## Target customer

### Primary initial ICP

Creators, founders and lean content/marketing operators who manage approximately **2–10 active Brands, pages, products or properties**.

Typical characteristics:

- regularly publish content;
- operate more than one Brand or content identity;
- lack a large dedicated content team;
- use several disconnected tools;
- manually search for ideas;
- use AI tools for drafting;
- manually coordinate scheduling;
- inspect analytics separately;
- struggle to turn historical performance into the next content decision;
- care about maintaining distinct Brand voices.

### Secondary customer

Single-Brand creators and founders who publish frequently enough to benefit from continuous content intelligence.

### Later customers

Potential later segments include agencies, venture studios, multi-brand organisations, franchise operators and larger marketing teams. Enterprise complexity is not part of V1.

## Primary job to be done

> When I need to grow or maintain one or more Brands, I want CIE to identify worthwhile content opportunities, prepare strong content grounded in my Brand and evidence, and tell me what worked, so I don't have to manually combine research, AI writing, scheduling and analytics.

## Product principles

1. **Intelligence before generation.**
2. **Quality before content volume.**
3. **Brand isolation before convenience.**
4. **Evidence before confident claims.**
5. **Human authority before autonomous publication.**
6. **Content before dashboards.**
7. **Simple decisions before complicated analytics.**
8. **One Idea can power many channel executions.**
9. **Every published post should retain its lineage.**
10. **Performance must improve future decisions.**
11. **Never create content merely to make the system look active.**
12. **Never fabricate personal experience, sources or results.**
13. **Do not optimise only for vanity metrics.**
14. **Use agents for judgement and software for guarantees.**
15. **Web first; mobile for fast decisions and capture.**
16. **Provider-neutral AI infrastructure.**
17. **Explain recommendations rather than exposing hidden reasoning traces.**
18. **Never mix one Brand's private intelligence with another Brand.**

## Core domain model

The fundamental product lineage is:

```text
Brand
  ↓
Signal
  ↓
Opportunity / Idea
  ↓
Research
  ↓
Angle
  ↓
Campaign
  ↓
Content Asset
  ↓
Published Post
  ↓
Performance
  ↓
Learning
```

Supporting dimensions include Audience, Content Pillar, Topic, Hook, Format, Channel, CTA, Goal, Experiment, Source and Evidence. This lineage must remain queryable.

## Brand model

**Brand** is the primary content-intelligence object.

A Brand may represent a personal brand, company, product, social page, educational channel, newsletter, community or client account. A Brand must not require incorporation or a formal business entity.

## Brand Brain

Every Brand maintains a structured **Brand Brain**.

It may contain:

### Identity
Name, description, website, category, geography and purpose.

### Positioning
Value proposition, differentiation and market position.

### Audience
Primary audiences, pains, motivations, sophistication and geography.

### Voice
Tone, vocabulary, style, prohibited wording and example content.

### Content strategy
Content pillars, topics, formats, objectives and channels.

### Knowledge
Websites, documents, notes, URLs, research, product information and approved source material.

### Boundaries
Claims to avoid, sensitive subjects, unsupported claims and Brand-specific policies.

### Performance Memory
Previous content, topics, angles, hooks, formats, CTAs, publishing context and measured outcomes.

The user must be able to correct important Brand Brain information.

## Intelligence scopes

CIE conceptually supports three intelligence scopes.

### Global Intelligence
May contain public trends, public research, topic clusters, hook patterns, channel patterns and general content structures. Private Brand information must not enter Global Intelligence without an explicit approved policy.

### Workspace Intelligence
May contain shared team preferences, approval policies, common research and operational settings.

### Brand Intelligence
Contains private Brand-specific information and learning. Brand Intelligence must remain isolated.

## Opportunity eligibility

An Opportunity may be recommended only when it has sufficient Brand relevance, audience relevance, novelty, evidence, timeliness or evergreen value, content potential and channel suitability.

It must not be materially duplicated by recently published or pending content.

CIE may consider Relevance, Evidence strength, Novelty, Timeliness, Brand authority, Historical performance, Audience fit, Saturation and Production effort.

The user should understand **why the Opportunity is being recommended**.

CIE must be allowed to say: `No strong opportunity found.` It must never manufacture filler.

## Functional requirements

### FR-01 — Account and Workspace
Users can register, sign in, sign out, recover access, create or join a Workspace, manage Account preferences, request data export and delete the Account subject to applicable retention requirements. V1 may support one primary owner per Workspace. Complex enterprise access control is deferred.

### FR-02 — Brand creation
The user can create multiple Brands. Minimum creation should remain extremely lightweight. Initial inputs may be Brand name, Website or social profile, and what the Brand does. Where possible, CIE may research supplied public sources and propose an initial Brand Brain. The user confirms or corrects material information before it becomes authoritative Brand context.

Brand onboarding keeps both sources available in Brand Brain permanently and offers four combinable choices: Connect Instagram (recommended, Professional account through Instagram Login without requiring a Facebook Page), Connect Facebook + Instagram, Connect Facebook only, and Paste Website (optional). Website and channel adapters used during onboarding are the same replaceable adapters used for later refresh, reconnect, replacement and removal.

### FR-03 — Brand Brain
The user can inspect and modify positioning, audience, goals, voice, content pillars, preferred topics, prohibited subjects, examples, language, geography, channels and Brand knowledge. AI-inferred and user-confirmed information must remain distinguishable where material.

Brand Brain also presents source health and accepted Performance Memory. Connection health includes granted permissions, last verification/synchronisation, expiry, failures and one recovery action without exposing credentials. Imported Instagram profile/content and bounded visual analysis may propose positioning, audience, voice, palette, imagery or typography directions, but these remain evidence-linked suggestions until the owner confirms them.

### FR-04 — Knowledge and sources
Users can add approved knowledge using supported sources including URLs, websites, documents, notes, pasted material, research and product information. CIE tracks provenance where available. A Brand source can be enabled, disabled, replaced or removed. Removing private source material must respect deletion and derived-memory policies defined by the TRD.

### FR-05 — Channels
The product model must support multiple content channels. Primary pilot targets are Instagram and LinkedIn. The architecture must permit later support for X, TikTok, YouTube, Facebook, blogs, newsletters and other authorised channels. Unsupported channels may initially be represented through manual publishing and metric entry/import. Channel support must degrade safely when third-party APIs are unavailable.

### FR-06 — Hunter / Discover
CIE continuously or periodically searches approved public and connected sources for potential content signals. Signals may include industry developments, news, audience questions, emerging discussions, evergreen opportunities, competitor/public content, product developments, user-supplied ideas and previous high-performing themes. The Hunter should operate globally where safe so common research does not need to be repeated separately for every Brand. Brand-specific scoring then determines relevance. The Discover experience includes Opportunity title, reason it matters, Brand relevance, source/evidence summary, novelty, suggested angle, Opportunity score or qualitative strength, Develop, Save and Ignore.

### FR-07 — Duplicate and novelty intelligence
Before accepting a new Opportunity, CIE compares it against previous Ideas, published posts, active Campaigns, recent signals and semantically similar content. CIE should warn when content is materially similar. A similar topic may still proceed when the proposed angle is meaningfully different.

### FR-08 — Research dossier
A selected Idea can generate an evidence dossier containing core facts, source references, dates, competing interpretations, important context, claim confidence, unresolved uncertainty and Brand-specific relevance. Research and Brand opinion must remain distinguishable. CIE must not invent evidence to support an attractive content angle.

### FR-09 — Angle development
One Idea should not immediately become one draft. CIE generates multiple candidate framings where appropriate, including educational, beginner, technical, founder perspective, contrarian, data-led, comparison, story, tutorial and case study. Each Angle may include intended audience, objective, hook direction, expected value, effort, recommended format/channel and supporting evidence. The user can select or modify an Angle.

### FR-10 — Campaign
An approved Idea/Angle becomes a **Campaign**, the parent object for multiple channel executions. Not every channel must be produced. All executions retain common lineage to the original Idea, research and Campaign.

### FR-11 — Content Studio
The Content Studio provides a quiet content-first editing environment. The user can view generated content, edit manually, request alternatives, simplify, expand, adjust technical depth, strengthen the opening, regenerate a section, inspect supporting evidence and compare versions. CIE stores useful content metadata including Brand, audience, objective, channel, format, topic, Angle, hook type, CTA, source Idea and Campaign. AI controls must not dominate the interface.

Instagram creation supports structured Carousel, Reel and image output. Carousel structures include AIDA, PAS, listicle, case study, story and comparison. Finished media is rendered and reviewed visually; users can edit slide text, replace imagery, reorder slides, switch templates and regenerate one slide. Approved Brand logos, imagery, palette and supported fonts are applied by the renderer. Unsupported assets fail closed. Rendered media and deterministic thumbnails retain immutable Content → Asset → Asset Version lineage.

### FR-12 — Drafter, Critic and Judge
Content generation and evaluation must be logically separated. The Drafter produces candidate content. The Critic evaluates content independently against the relevant rubric, which may include truth/evidence, Brand fit, audience fit, clarity, usefulness, originality, hook quality, structural quality, CTA and channel fit. The Judge selects the strongest candidate or hook when multiple valid alternatives exist. Hard failures such as fabricated experience, unsupported factual claims, prohibited Brand language or serious policy breaches cannot be compensated by a high overall score. Revision loops must be bounded.

### FR-13 — Approval workflow
Supported content states include Draft, Review, Approved, Scheduled, Published, Failed and Archived. V1 requires human approval before external publication. The system records approver, approved version, time, destination and scheduled time where applicable. Autonomous publishing is deferred.

### FR-14 — Calendar and scheduling
Users can view upcoming content across one or multiple Brands. The calendar supports filtering by Brand, Campaign, channel and status. Users can schedule approved content where the connected channel supports it. The UI should remain significantly simpler than enterprise campaign-management products. A later assisted **Plan My Week** function may recommend a balanced schedule based on available content and Brand strategy.

### FR-15 — Publishing
For supported integrations, CIE can publish approved content. The system records channel, destination account, external post identifier, publication status, publication time and failure/retry state. Publishing infrastructure must be deterministic rather than delegated to unrestricted agent behaviour. Failed publication must never silently appear successful.

Instagram publishing uses a replaceable `InstagramPublisher` beneath Meta MCP tools for account discovery, image/Reel/carousel publication, status and Insights. Meta receives temporary public delivery URLs for the exact approved asset version. State progresses through Approved → Publishing → Processing → Published or Failed, retaining Meta container/publish IDs, retries, failure reason and published URL.

### FR-16 — Performance tracking
Published posts retain their original content lineage. Where supported, CIE captures relevant metrics such as impressions, reach, views, watch time, retention, likes, comments, shares, saves, clicks, followers, leads, conversions and attributable revenue where reliable evidence exists. Metrics unavailable from a channel must be clearly labelled unavailable. CIE may compare a post with the Brand's normal baseline.

### FR-17 — Performance Intelligence
The Performance experience should answer three questions: What happened? Why might it have happened? What should we do next? It summarises meaningful results, identifies evidence-supported patterns without overstating causation, and recommends a practical next content experiment or change. The primary experience must be narrative and action-oriented rather than a wall of charts.

Comparable Brand-scoped posts may produce separate topic, hook, structure, template, format and timing pattern candidates. Every candidate retains the exact post and metric observations used, excludes unavailable measurements rather than treating them as zero, and describes correlation without claiming causation.

### FR-18 — Brand Learning
CIE can derive candidate Learnings from repeated behaviour and measured results. Each Learning should retain supporting posts/data, relevant time period, confidence, applicable audience/channel, date learned and contradictory evidence where relevant. Users may accept, reject or correct important Learnings. A Learning is not permanent truth; new evidence can reduce confidence or supersede it.

Only owner-accepted Learnings enter Brand Brain Performance Memory or influence later recommendations. Confirmed Brand facts are never overwritten by performance inference. Where an accepted format pattern is applicable, Kairo may use it as an explainable ranking input for the next recommended execution.

### FR-19 — Experiments
CIE supports intentional content experimentation. An Experiment may define Hypothesis, Variant A, Variant B, Primary metric, Result and Learning. Experiment results become Brand Intelligence only when supported by sufficient evidence.

### FR-20 — Pilot Operations and Controls
Authorised internal operators can inspect Brand setup failures, Hunter failures, research failures, generation failures, Critic results, publication failures, metric-ingestion failures, inference cost, research/tool cost, manual intervention and safety/Brand-policy issues. Operators can retry safe failed workflows, disable problematic automation, withdraw unsafe generated content before publication, correct system configuration and record intervention provenance. This is an internal pilot capability, not a full enterprise admin product.

## Web product

The **web application is the primary V1 product**.

Primary navigation should remain approximately:

```text
Today

Discover
Ideas
Content
Calendar
Performance

────────

Brands

+ Add Brand

────────

Settings
```

The exact information architecture is frozen later in the Design Baseline.

## Today

Today is the default intelligence briefing. It should prioritise actions, not statistics, and answer: **What deserves my attention now?**

## Mobile product direction

Mobile is not required to prove the first web-based intelligence loop. The eventual native mobile companion should focus on Today, Discover, Create, Calendar and Me. Primary mobile jobs include capturing an Idea, recording a voice thought, pasting a URL, uploading media, reviewing an Opportunity, approving/rejecting content, receiving intelligence alerts, inspecting exceptional performance and pausing automation. Mobile should not replicate every web configuration screen.

## Capture

A future mobile experience should make idea capture extremely low friction through record thought, type idea, add link, upload screenshot and upload photo/video. A voice thought can be transformed into an Idea and optionally researched before development.

## Intelligence notifications

Notifications should represent meaningful intelligence rather than application activity: important Opportunity, content ready for approval, publishing failure, unusually strong performance, meaningful performance decline, new evidence-backed Learning and weekly intelligence summary. The user controls frequency, quiet hours and categories.

## Ask CIE

A conversational Brand intelligence interface is desirable but not required for initial validation. A later version may answer questions such as what should I post today, why did this post outperform, which topics am I overusing, what haven't I covered recently and turn my best-performing Idea into new approaches. This interface must query CIE's actual Brand Intelligence rather than behave as an ungrounded general chatbot.

## Atlas integration

CIE remains an independent product. Atlas must not become a mandatory dependency.

However, Atlas represents an important future integration and acquisition route.

A future flow may be:

```text
Atlas identifies a growth Opportunity
        ↓
User chooses Create / Run Campaign
        ↓
CIE receives approved Business/Opportunity context
        ↓
CIE generates Campaign
        ↓
Owner approves
        ↓
Content/ad execution layer
        ↓
Performance / conversion
        ↓
CIE learning
        ↓
Atlas outcome intelligence
```

Potential benefits include owned acquisition channel for CIE, CIE upsell to Atlas users, deeper Business context for Campaign creation, linking content activity to business outcomes and future Atlas Growth Agent capability. Atlas-origin users must not be treated as proven CIE demand until measured. Paid advertising remains outside CIE V1.

## AI behaviour

CIE may use AI for signal classification, semantic clustering, Opportunity scoring support, research synthesis, Angle generation, drafting, critique, candidate judging, Brand-context summarisation, performance interpretation and candidate Learning generation.

CIE must preserve source provenance where available, distinguish facts from Brand opinion, avoid invented first-person experience, avoid fabricated evidence, validate structured outputs, enforce bounded workflow budgets, record relevant model/runtime provenance, degrade safely and permit human correction.

CIE does not expose hidden chain-of-thought. User-facing explanations should provide concise reasons, sources and relevant evidence instead.

## Agent autonomy model

### Level 0 — Manual
AI assists when explicitly requested.

### Level 1 — Assisted
AI creates; user controls workflow.

### Level 2 — Semi-autonomous
AI discovers and prepares content; user approves. **This is the target V1 operating level.**

### Level 3 — Policy-based publishing
Eligible content may be automatically published under explicit policy. Deferred.

### Level 4 — Autonomous growth
Content and paid experiments execute under business/budget policy. Deferred.

## Cost principles

CIE must measure model input/output tokens, model cost, research/search cost, social connector cost, storage, semantic retrieval, media processing, workflow duration, retries and manual intervention.

The initial engineering target is:

> **Normal text-centric AI inference below approximately $5 per active Brand/month**, excluding significant external connector fees and expensive image/video generation.

This is a target to validate, not a guaranteed cost. Shared research and Global Hunter activity should reduce duplicate work where privacy permits.

## Free product hypothesis

CIE should be capable of supporting a limited free experience if unit economics permit it. Initial hypothesis: 1 Brand, limited monthly Ideas/Opportunities, limited content generation, basic Brand Brain, limited history, manual or constrained publishing and basic performance insight. Exact quotas are not frozen until cost behaviour is measured.

## Paid model hypothesis

Potential progression: Free, Creator, Pro, Agency. Pricing is deliberately not frozen in the PRD. Before scale, customers must demonstrate credible willingness to pay. Potential pricing dimensions include number of Brands, content volume, connected channels, intelligence frequency, history, automation and team access. Complex usage billing should not be introduced without evidence.

## Provider flexibility

CIE should not expose its product architecture as dependent on one AI provider. Potential future execution methods include hosted CIE models, OpenAI-compatible providers, local/open models and BYO-model/API configuration for advanced users. The exact provider strategy belongs in the TRD.

## Privacy and security

CIE requires Workspace isolation, Brand isolation, least-privilege social permissions, encryption in transit and at rest, secure secret handling, explicit account connection consent, deletion, export, retention rules, auditability and provenance for sensitive actions. Private Brand knowledge must not be used to improve another Brand's outputs. Cross-customer aggregate intelligence requires a separately approved privacy policy and product decision.

## Accessibility

Core web functionality must support keyboard navigation, screen readers, meaningful labels, sufficient contrast, text resizing, non-colour status communication, accessible errors, reduced motion and responsive layouts. The eventual mobile client must meet equivalent native accessibility expectations.

## Primary product metrics

### Activation
Brand created; Brand Brain confirmed; first useful Opportunity; first Campaign generated; first content approved; first tracked published post.

### Engagement
Weekly active Workspaces; weekly active Brands; Opportunities developed; Campaigns created; approved content; repeated weekly usage.

### Intelligence quality
Opportunity acceptance; duplicate rejection; content approval; edit intensity; unsupported-claim failures; Brand-correction frequency; Critic failure rate; user rejection reasons.

### Performance learning
Percentage of published posts with usable metrics; candidate Learnings created; Learnings accepted/corrected; evidence that later recommendations use relevant Brand history.

### Commercial
Free-to-paid conversion; Brand expansion; retention; willingness to pay; revenue per Workspace; cost per active Brand.

## Initial validation success criteria

The controlled pilot should target:

- **10–12 structured customer interviews** before commercial scale;
- **at least 5 active pilot users**;
- **2–4 weeks** of longitudinal usage;
- at least **40%** of high-confidence Opportunities developed/accepted;
- at least **70%** of selected generated content approved with only minor changes;
- measurable recurring time saving;
- evidence that recommendations become more relevant through Brand Memory;
- at least **3 of 5 pilot users** demonstrating credible willingness to pay or continue on a paid basis;
- no unresolved critical privacy, cross-tenant or publishing safety failures.

These are validation thresholds, not existing results.

## Explicit V1 exclusions

The first validation product does **not** include paid ad execution, autonomous ad spend, unrestricted autonomous publishing, enterprise approval hierarchies, full CRM, social customer-service inbox, influencer marketplace, full SEO platform, full email marketing platform, community management, complex social listening at enterprise scale, unrestricted competitor scraping, advanced video editor, expensive automatic video generation, full creative asset DAM, white-label agency portals, advanced billing complexity, guaranteed content performance, guaranteed leads or revenue, automatic causal attribution or Atlas-specific logic inside CIE Core.

## Candidate product delivery sequence

PES retains final engineering decomposition authority. The product naturally breaks down approximately as:

```text
VS-01 — Account, Workspace and Brand
VS-02 — Brand Brain and Knowledge
VS-03 — Hunter and Discover
VS-04 — Ideas, Research and Angles
VS-05 — Campaign and Content Studio
VS-06 — Critic, Judge and Approval
VS-07 — Calendar and Publishing
VS-08 — Performance Tracking
VS-09 — Performance Intelligence and Brand Learning
VS-10 — Pilot Operations, Safety and Cost Controls
```

Mobile work follows after the primary web intelligence loop is validated unless separately approved earlier.

## Final product decision

Content Intelligence Engine v1.0 will prove whether users managing active Brands value a system that:

> **finds worthwhile content opportunities, creates and quality-checks the resulting content, tracks what happens and uses Brand-specific performance memory to make the next recommendation better.**

The primary experiment is not: `Can AI generate posts?`

The experiment is:

> **Can a closed-loop Content Intelligence system consistently make better content decisions for each Brand—and is that valuable enough for customers to keep using and pay for?**

No major product expansion should occur before that hypothesis is tested.
