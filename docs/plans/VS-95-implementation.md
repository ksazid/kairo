# VS-95 implementation plan — approved interaction wiring

## Design read

Authenticated product workflow; low visual novelty; preserve the frozen Kairo Brand/Avatar/Provider information architecture and existing shell. The user job is to move from an approved visible control to a real supported destination/action with no dead ends or fabricated provider state.

## Plan

1. **Governance and contract lock**
   - Activate VS-95 as frontend-only runtime work.
   - Add a deterministic interaction-contract test covering required routes/actions and disabled unsupported controls.

2. **Brand supported actions**
   - Reuse the existing Brand inline-edit implementation unchanged.
   - Reuse Channels and Avatar routes unchanged.
   - Surface existing Instagram source refresh on Brand when a real Instagram source account is available.
   - Do not invent Website refresh; leave source management reachable and record refresh as pending.

3. **Avatar navigation and field targeting**
   - Add stable anchors/ids for Mode, Style, Voice, Language, Framing and Background.
   - Add recommendation links to those actual controls.
   - Add `Go to Settings` to the approved AI & Media Providers destination, preselecting Media Providers and Avatar context.
   - Keep `Create & Save` bound to the existing server action.
   - Render Test clip disabled with an explicit unavailable explanation.

4. **AI & Media Providers overview/navigation**
   - Add `/settings/ai-media-providers`.
   - Implement AI / Media tab query-state navigation.
   - Render approved provider catalogs as configuration targets, not fake runtime health.
   - Disable Manage/Connect/Add-provider/provider-settings/help controls that have no governed backend yet.
   - Add a Settings-home entry to the provider page.

5. **Follow-up ledger and verification**
   - Save every unsupported interaction in `docs/plans/VS-95-deferred-interactions.md` with dependency and enablement condition.
   - Run the focused interaction tests, web build, governance validation and preflight.
   - Open a PR and stop at certification/merge authorization.

## Implementation discipline

- Reuse Next.js `Link`, anchors and existing server actions.
- No new package.
- No API/schema/provider-secret change.
- No client state where query/anchor navigation is sufficient.
- No fake provider health, usage, pricing or generated media.
