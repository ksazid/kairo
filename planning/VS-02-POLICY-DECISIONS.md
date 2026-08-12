# VS-02 Policy Decision Package

Status: Awaiting explicit human approval
Slice: VS-02 — Brand Brain and Knowledge

## Why a policy decision is required

FR-04 requires source removal to respect deletion and derived-memory policy. The TRD further requires deletion propagation into vectors/object storage, but it does not fully define how source-derived Brand Brain facts behave when their source disappears. Because this affects private Brand data and authoritative context, implementation must not invent the rule.

## DEC-006 — Private source deletion propagation

### Recommended option

When a private Brand source is removed or replaced:

1. raw source content and any private object payload are deleted/withdrawn from active use;
2. derived chunks, retrieval records and future semantic-index entries supported only by that source are removed;
3. a minimal content-free audit tombstone may remain, containing identifiers, action, actor and timestamps but not the deleted private content;
4. Brand Brain facts explicitly confirmed by the user remain authoritative because confirmation creates an independent user-authored fact;
5. AI-inferred facts that lose all active supporting sources become `stale`, are visibly marked for review and are excluded from authoritative AI/retrieval context until reconfirmed or supported by another active source;
6. replacing a source creates new provenance/version links and does not silently rewrite historical evidence.

### Why this option is recommended

- honours deletion propagation for private source material;
- preserves deliberate user corrections instead of unexpectedly erasing them;
- prevents unsupported AI inferences from surviving as authoritative truth;
- retains enough content-free audit metadata for operational accountability;
- keeps future vector/Qdrant deletion deterministic and reproducible from PostgreSQL authority.

### Alternatives not recommended

**Delete every derived fact including user-confirmed facts.** Strong deletion semantics, but it incorrectly treats explicit user confirmation as dependent on the original source and can destroy deliberate Brand configuration.

**Retain all derived facts after source deletion.** Convenient, but leaves private-derived memory active after the user removed its evidence and weakens the privacy contract.

## Other VS-02 policy values already fixed by approved authority

These do not need new architecture choices:

- private Brand material is Brand-scoped and does not enter Global Intelligence by default;
- PostgreSQL is authoritative;
- object storage is private and S3-compatible behind an adapter;
- uploaded documents cannot become active knowledge until content/type/size and malware controls pass;
- URLs and retrieved text are untrusted input and require SSRF/prompt-injection controls;
- semantic provider promotion remains DEC-003 in VS-03;
- production deployment/provider selection remains outside this slice.

## Approval required

A single explicit response can approve the VS-02 scope, this policy, and runtime implementation if the approver states all three. Generic approval language must not be treated as granting unrelated release or production-enable permission.

Recommended approval wording:

`Approve VS-02 scope, DEC-006 deletion policy, and VS-02 runtime implementation. Release and production-enable remain unapproved.`
