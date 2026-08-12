<p align="center">
  <img src="docs/assets/pes-overview.png" alt="Product Engineering Starter Overview" width="100%">
</p>

# Kairo

Kairo is the customer-facing product name for the approved **Content Intelligence Engine (CIE)** venture.

This repository was created from the Product Engineering Starter (PES) template. PES remains the governance and delivery framework; Kairo's approved product definition now lives under `product/`.

## Approved product authority

- `product/PRD.md` — CIE-PRD-001 v1.0
- `product/TRD.md` — CIE-TRD-001 v1.0
- `product/DESIGN.md` — CIE-DESIGN-001 v1.0
- `product/GLOSSARY.md` — CIE-GLOSSARY-001 v1.0
- `product/VENTURE-PACKAGE.yaml` — frozen Kairo venture package approved for PES
- `evaluation/SKILLS-ARCHITECTURE.md` — approved dynamic Skills architecture input
- `decisions/DECISIONS.md` — authoritative Innovation Hub decision record copied for traceability

## Delivery authority

PES controls intake, traceability, planning, vertical slices, approvals, Loop lifecycle, deterministic checks, certification and human merge/release authority.

Superpowers is the default implementation methodology **inside** the PES loop after a slice is approved and activated.

No runtime implementation is authorised merely by importing the venture package.

## Kairo implementation profile

Kairo uses the approved **PES Web/AI profile** direction:

- Next.js + React + TypeScript for web;
- Node.js + TypeScript modular-monolith API/workers;
- Python only for approved runtime components such as Hermes integration;
- PostgreSQL as authoritative system of record;
- Qdrant/TurboQuant as a derived semantic layer subject to benchmark;
- provider-neutral AI boundaries;
- dynamic governed Brand-aware Skill Registry;
- deterministic Truth/Claims and publishing controls.

## Current state

Product definition: approved and imported.

PES lifecycle: intake/planning only. No active runtime slice yet.

## PES workflow

```text
Approved venture package
→ product / technical / security intake
→ source-linked requirements
→ roadmap / milestones / epics / vertical slices
→ typed approvals
→ activate one slice
→ Superpowers planning / TDD / implementation / review
→ deterministic preflight
→ certification
→ human merge / release approval
```

See `AGENTS.md` and `docs/governance/END-TO-END.md` for the authoritative repository workflow.
