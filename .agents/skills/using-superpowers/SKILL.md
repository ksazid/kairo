---
name: using-superpowers
description: Use Superpowers as the default implementation methodology after an approved vertical slice and focused context pack exist. Product Engineering Starter remains authoritative for product scope, traceability, security, certification, and release.
source: https://github.com/obra/superpowers
license: MIT
---

# Using Superpowers

Superpowers is the default development-execution methodology for this starter. It begins only after Product Engineering Starter has validated the PRD/TRD, approved the delivery plan, activated a vertical slice, and generated the slice context.

## Ownership boundary

Product Engineering Starter owns:

- PRD/TRD intake and conflict detection
- requirement IDs and source traceability
- roadmap, milestones, epics, and vertical slices
- architecture and security governance
- allowed/protected paths and human gates
- deterministic preflight and certification
- evidence, exact-SHA release, and production approval

Superpowers owns:

- feature-level brainstorming when clarification is still required
- implementation-plan generation
- isolated Git worktrees
- TDD where appropriate
- plan execution or subagent-driven development
- specification-compliance and code-quality review
- systematic debugging and verification before completion
- branch completion and PR/merge options

## Required sequence

1. Read approved PRD, TRD, ADRs, security decisions, and design baseline.
2. Confirm an approved active slice and requirement IDs exist.
3. Read the focused slice context and allowed/protected paths.
4. Use Superpowers `brainstorming` only to resolve implementation detail; never reopen approved product policy silently.
5. Use `writing-plans` to create a bounded implementation plan.
6. Use `using-git-worktrees` for isolated implementation when supported.
7. Use `test-driven-development` for domain rules, regressions, APIs, state machines, and testable behavior; use judgment for exploratory visual work.
8. Execute through `executing-plans` or `subagent-driven-development` according to risk and task size.
9. Run specification-compliance and code-quality review.
10. Run repository `preflight`, risk-triggered security review, and `certify` when the slice is complete.
11. Stop for human merge and release approval.

## Guardrails

- Superpowers plans are subordinate to approved requirements and the active slice.
- Do not implement proposed, blocked, later, or rejected scope.
- Do not change protected paths without the required human decision.
- Do not let brainstorming replace PRD/TRD authority.
- Do not auto-merge or auto-deploy.
- Prefer coherent 10–30 minute implementation steps over excessive 2–5 minute fragmentation when the change remains independently verifiable.
- Use subagents only when their expected quality or parallelism benefit justifies the additional model cost.

## Installation

Install Superpowers separately in the coding-agent harness you use.

### Codex App or Codex CLI

Open the plugin interface, search for `Superpowers`, and install it from the official plugin marketplace.

```text
/plugins
```

### Claude Code

```text
/plugin install superpowers@claude-plugins-official
```

### Cursor

```text
/add-plugin superpowers
```

For other supported harnesses, follow the upstream installation guide at `obra/superpowers`.

## Completion verdict

Superpowers execution does not itself certify a slice. Final repository verdict remains one of:

`PASS`, `FAIL`, `BLOCKED`, `HUMAN_DECISION_REQUIRED`, or `BUDGET_EXCEEDED`.
