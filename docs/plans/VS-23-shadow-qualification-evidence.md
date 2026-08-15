# VS-23 prerequisite evidence — motorcycle carousel shadow qualification

## Purpose
Prepare the governed evidence run required by issue #58 before VS-23 Marketing Lab Live Evaluation can be activated.

This is evidence scaffolding only. It does not activate VS-23, promote a challenger, change Brand routing, publish content, or use private production Brand data.

## Qualification scope
All four cases use one exact benchmark scope:

- dataset: `marketing-lab-cross-sector-synthetic-fixtures`
- workspace: `workspace-marketing-lab`
- Brand: `brand-motorcycle-synth`
- sector: `Motorcycles / Bikes`
- capability: `carousel-strategy`
- format: `carousel`
- audience: `enthusiast buyers`
- objective: `comparison and saves`

Cases:

1. `motorcycle-carousel-01` — choose by real riding use instead of a universal winner.
2. `motorcycle-carousel-02` — compare modifications by rider goal without unsupported performance claims.
3. `motorcycle-carousel-03` — compare daily-commute vs weekend-riding setup priorities.
4. `motorcycle-carousel-04` — pre-purchase ownership considerations without invented model-specific costs/specifications.

## Baseline and challenger

Baseline:
- `kairo-native-carousel@1`
- Kairo-owned/native baseline
- zero tools
- same benchmark fingerprint contract as shadow

Challenger:
- `corey-social-shadow@2.2.0+7868cb9`
- source `coreyhaines31/marketingskills`
- pinned commit `7868cb9251fad80a73d26e488a5ad5f6c4a9f335`
- `skills/social/SKILL.md`
- Git blob `ab1d083ef4a9dd2a91c1eaedfb5cb745c3055d24`
- sandboxed shadow only
- network/secrets/publishing denied

## Evidence still required
The prepared fixture/harness is not qualification evidence by itself. A governed run must still preserve, for all four pairs:

- exact input fingerprint;
- baseline and challenger creative output;
- Truth result;
- Kairo-owned quality scores;
- measured latency;
- measured cost;
- genuine blind human-preference score;
- edit-distance percentage.

The default policy then requires:

- 4 paired cases;
- 100% baseline and challenger Truth pass;
- challenger mean quality delta >= 5;
- cost ratio <= 2x;
- latency ratio <= 2x;
- genuine human-preference delta >= 5;
- edit-distance delta <= 0.

Only a deterministic `advance-to-live` result permits a separate VS-23 approval request. It does not activate live execution itself.

## Important runtime blocker
The current OpenAI-compatible model gateway records token counts and latency but does not inherently guarantee billable `costUsd` metadata. The qualification harness therefore fails closed when measured cost is absent rather than treating unknown cost as zero. Before the evidence run can be accepted, the chosen evaluation runtime must provide defensible measured cost evidence (including a genuinely zero billable cost only if that is actually true for the selected runtime).

## Human scoring
Human preference must be collected blind. Baseline/challenger identity must not be revealed to the evaluator until the four preference scores are recorded. Scores must not be generated or backfilled by Kairo.
