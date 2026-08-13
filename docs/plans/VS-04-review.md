# VS-04 Review — Ideas, Research and Angles

## Verdict

Conditionally approved for certification preparation. The implementation satisfies FR-08/FR-09 in local deterministic review; exact-SHA certification remains blocked until the final pull-request CI run, including PostgreSQL integration tests, is green.

## Traceability

| Acceptance criterion | Implementation evidence | Verification |
| --- | --- | --- |
| Research retains sources and explicit uncertainty | `ResearchDossier`, `EvidenceReference`, Claim/evidence tables and Ideas detail UI | Domain, worker, API and PostgreSQL integration tests |
| Unsupported evidence is not invented | Claim evidence IDs are checked against the dossier; Strategist references validated Claims only | Domain and Researcher/Strategist tests |
| Users can select and edit among multiple Angles | Candidate grid, select action and bounded framing edit with optimistic versions | API, memory and PostgreSQL tests; responsive UI review |
| Claims are ready for later Truth/Claims enforcement | Classification, confidence, evidence strength, verification, freshness and first-person authorization are persisted | Domain and persistence tests |
| Retrieved-content prompt injection is covered | Retrieved text is untrusted, runtime tool budget is zero and outputs cannot expand capabilities | Researcher security tests |
| Outputs are validated before persistence | Researcher and Strategist schemas plus domain invariants run before repository sinks | Worker and domain tests |

## Security review

- Brand/Workspace authorization is enforced before Idea, Research and Angle access.
- Guessed or cross-Brand identifiers fail with safe not-found behavior.
- Runtime calls are budgeted and receive no model-controlled tool calls.
- Retrieved evidence cannot grant tools, request secrets or override policy.
- Evidence URLs reject credentials, local names, private/link-local IPv4 and IPv6 literals.
- Claim/evidence and Angle/Claim lineage is enforced before persistence.
- Angle selection and framing edits reject stale versions.
- No release workflow or infrastructure path changed.

Security verdict: supported. One review finding (private evidence IP literals) was fixed with a regression test before certification preparation.

## UI review

- Uses the approved Kairo shell and tokens without redesigning Today, Discover or Brand Brain.
- Ideas list/detail, Research, evidence, uncertainty and candidate Angle hierarchy is present.
- Loading, error, empty and pending-research states are present.
- Angle comparison collapses from two columns to one; narrow layouts stack metadata and actions.
- Forms have labels, bounded fields, status/error messaging and keyboard-native controls.
- Evidence links use safe new-tab attributes.

UI verdict: supported against the approved code/design baseline. No separate design-plugin package exists in this repository; review followed `product/DESIGN.md` and the installed UI review procedure.

## Deterministic evidence

- `npm run runtime:typecheck`: passed.
- `npm run runtime:test`: 68 non-database tests passed; 13 PostgreSQL tests skip locally when `TEST_DATABASE_URL` is absent.
- `npm run governance:validate`: passed.
- `npm run preflight`: passed.
- `git diff --check origin/main...HEAD`: passed.
- Security baseline and Product intake checks: passed on the reviewed PR head.
- Required final CI/PostgreSQL result: pending; record in certification handoff.

## Scope review

The diff remains inside VS-04 allowed paths. It does not implement final drafting, campaign creation, publishing, scheduling, performance learning, release, deployment or production enablement.
