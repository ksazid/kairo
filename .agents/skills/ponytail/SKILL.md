---
name: ponytail
description: Minimal React/Next.js implementation discipline for Kairo: reuse existing code, prefer native platform capabilities, avoid speculative abstractions and dependencies, and make the smallest correct root-cause change.
source: https://github.com/DietrichGebert/ponytail/tree/2ed6c52c9d7e5e56942508591085fd45dea277d3/skills/ponytail
source_commit: 2ed6c52c9d7e5e56942508591085fd45dea277d3
license: MIT
---

# Ponytail — Kairo integration

Use the shortest correct implementation only after tracing the actual Kairo flow end to end.

## Ladder

1. Do not build speculative functionality.
2. Reuse an existing Kairo helper, adapter, type, route, component, or CSS pattern before writing another one.
3. Prefer standard library and native browser/CSS behavior.
4. Prefer already-installed dependencies over adding a package.
5. Add the minimum new code that satisfies the approved slice.

## Kairo rules

- Reuse existing Website/public-reference, Brand Brain, source, connection and publishing boundaries. Do not create onboarding-specific source or Brand Memory persistence.
- Fix shared/root behavior once rather than patching each caller.
- No generic repository, factory, event bus, one-implementation interface, or scaffolding for imagined future providers.
- Prefer deletion and simplification when replacing the old onboarding flow.
- Use CSS for the approved onboarding motion unless an existing dependency is already required for a behavior CSS cannot correctly provide.
- Leave one focused deterministic test for non-trivial parsing/state logic.
- Never simplify away trust-boundary validation, tenant isolation, secrets, error handling that prevents data loss, accessibility, or human publishing approval.

## Output/verification

Keep the implementation diff focused. Run the smallest relevant checks first, then the repository's required deterministic verification, UI Review, governance validation and preflight before claiming readiness.

## Conflict rule

Approved PRD/TRD, design baseline, security decisions, active slice, and typed approvals override this skill.
