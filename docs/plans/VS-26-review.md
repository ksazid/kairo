# VS-26 review — Guided Brand Brain Setup & Review Control

## Review scope

Review of the VS-26 runtime implementation against `docs/slices/VS-26.md`, FR-02/03/04/20, DEC-006 and the approved Kairo design baseline.

Runtime head reviewed: `b227ee2d68f830fa92deed201be28042142f48b7`.

## Delivered behavior

- First-run Brand creation is reduced to Workspace name, Brand name and one optional website/social profile reference.
- The default Brand Brain surface asks only for the owner-controlled primary objective and an optional explicit hard directive, then offers **Build my Brand Brain**.
- Kairo proposes allow-listed Brand strategy fields through the existing provider-neutral AgentRuntime boundary with Brand-private scope and zero tools.
- Generated strategy is persisted as `inferred`; owner goal/directive are persisted as `confirmed`.
- Existing `confirmed` fields are not silently overwritten by guided inference.
- Every inferred proposal must name the specific inspected Brand Knowledge source IDs that support it; foreign/uninspected provenance is rejected.
- Public reference retrieval is bounded, DNS-validated, address-pinned and redirect-revalidated before egress. Local/private literal or resolved addresses fail closed.
- Public page text is treated as untrusted evidence, never as instructions, and malformed/unavailable sources degrade without fabricated success.
- The former detailed Brand Brain editor is preserved under **Advanced Brand Brain / Review & Control**.
- Advanced Knowledge entry is expressed as user intents (**Add a link**, **Paste something Kairo should know**) while the underlying source lifecycle remains unchanged.
- No raw document-upload shortcut was added because that would bypass the existing quarantine/malware boundary.

## TDD / defects found

1. RED tests established owner-authority, source-provenance, confirmed-field non-overwrite, safe-degradation, SSRF-safe public reference retrieval and zero-tool proposal contracts before the runtime implementation.
2. Review tightened provenance from “all inspected sources” to field-level `sourceIds`; each proposal must now cite only inspected sources that actually support that field.
3. CI #583 reached the production Next.js build after all typechecks/tests/API build had passed, then caught an invalid `"use server"` re-export bridge on the Advanced Review & Control route. The bridge was replaced with explicit async server-action wrappers rather than weakening the build gate.
4. An API-level regression test was added after that repair to prove the bootstrap endpoint rejects unauthenticated requests and persists owner-confirmed goal/directive when inference is unavailable.

## Exact implementation-head verification

Head `b227ee2d68f830fa92deed201be28042142f48b7`:

- CI #589 — PASS.
  - immutable install PASS;
  - clean PostgreSQL 18 migrations PASS;
  - production dependency audit PASS;
  - governance/preflight PASS;
  - runtime verification PASS;
  - production API build PASS;
  - production Next.js/dashboard build PASS;
  - artifact upload PASS.
- Security baseline #528 — PASS.
- Product Intake #453 — PASS.
- PR #59 review threads: zero at review time.

## Security / privacy review

- No Brand-private context is exported to the public reference fetch boundary; that boundary receives only an explicit public URL.
- Retrieved public content enters only Brand-scoped strategist context and remains untrusted data.
- Strategist invocation has `capabilities: []` and `maxToolCalls: 0`; it has no publishing or secret authority.
- Generated field keys and sections are allow-listed and values are bounded.
- Inferred writes require active source provenance through the existing repository/domain contract.
- Brand/Workspace authorization remains enforced through the authenticated API account boundary.
- No cross-Brand learning/sharing was introduced.
- No database migration, new credential, Meta/Auth policy, publishing authority, infrastructure or release workflow change exists in the PR.

## UX review

The new hierarchy matches the approved design requirement that Brand Brain feel like a structured profile/knowledge workspace rather than developer configuration:

1. minimal first-run Brand input;
2. owner goal / optional hard directive;
3. compact **What Kairo learned** review cards;
4. a small human-attention queue for stale or inferred boundary items;
5. full correction/source controls only in **Advanced Brand Brain / Review & Control**.

Responsive CSS keeps the guided setup and summary cards single-column on narrow screens and does not introduce a new visual identity. Deterministic review covers source/layout code plus the production Next build; no live deployed browser screenshot is claimed by this review.

## Known operational limitation

Some social platforms may refuse server-side public page retrieval. VS-26 deliberately treats that as unavailable evidence and does not fabricate Brand Brain suggestions. The owner goal remains saved, and the user can add another public Brand reference or private Knowledge source. This limitation does not weaken the safety/provenance contract.

## Scope review

Changed paths remain inside VS-26 allowed contracts/domain/worker/API/web/tests/docs/delivery/state paths. No protected migration, infrastructure or release-workflow path is changed.

## Certification boundary

This review supports transition to formal testing. It does not authorize certification, merge, release, deployment or production enablement. A later immutable certification candidate still requires fresh exact-SHA deterministic gates and explicit human approval.
