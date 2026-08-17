# VS-53 UI Remediation Plan

## Scope

Remediate the existing Performance / Learning / Experiments experience and the Account Groups channel-management surface without changing their product contracts.

## Design decisions

### Performance Intelligence

Use the approved narrative sequence as the dominant hierarchy:

1. **What happened?** — concise measured outcome summary.
2. **Why might it have happened?** — cautious Learning interpretation with confidence/status context.
3. **What should we try next?** — the next explicit Experiment hypothesis and primary metric.

Raw metrics are evidence, not the homepage of Performance. Keep them behind inspectable per-post measurement disclosure with provenance retained.

### Brand Learning

Keep Learning separate from observation and Experiment state. Candidate Learnings expose Accept/Reject as deliberate human actions. Accepted/rejected/superseded states remain text-labelled. Confidence, evidence count, period, applicability and contradictions stay inspectable.

### Experiments

Render Experiments as intentional tests. Hypothesis and result/primary metric are primary; variants are supporting detail. Do not imply that an Experiment result is automatically accepted Brand Learning.

### Channel management

Keep Instagram connection state visible in Performance because this existing surface already owns its selection/reconnect/disconnect flow. Do not touch the OAuth route or provider actions.

Move Account Groups onto the shared shell with a dedicated destination-management hierarchy:

- available accounts first;
- truthful connection/capability state;
- groups second;
- group creation on demand;
- group editing on demand;
- destructive deletion visually separated from normal save actions.

## Responsive / accessibility

- shared `KairoProductShell`;
- focusable `#kairo-main-content` target;
- desktop Performance nav, mobile More fallback for secondary management;
- native `details/summary` for progressive disclosure;
- labelled status text rather than colour-only meaning;
- forms/fieldset/legend retained;
- supporting layouts collapse to one column without page-level horizontal scrolling;
- reduced-motion preference respected.

## Safety

No modifications to:

- Performance, Learning or Experiment API/domain logic;
- Instagram provider/OAuth routes;
- channel account credentials/capabilities;
- Account Group server actions;
- publishing approval or scheduling behaviour;
- production infrastructure.
