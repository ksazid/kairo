# VS-70 Implementation Plan — Publish Now

## Authority

- `product/PRD.md`: FR-13, FR-14, FR-15.
- `product/TRD.md`: deterministic Approved Version → Publishing Command → Channel Adapter → External API boundary.
- `product/DESIGN.md`: scarce primary emphasis, accessible controls, progressive disclosure.
- `.agents/skills/using-superpowers/SKILL.md` and `.agents/skills/ui-ux-pro-max/SKILL.md`.

## Plan

1. **Domain/TDD**
   - Extend `PublishingService.schedule` so omitted `scheduledFor` means immediate queueing at one captured server timestamp.
   - Preserve exact destination approval, current-version validation and idempotent command creation.
   - Add regression coverage for immediate timestamping, duplicate immediate requests, conflicting future schedule, dispatch and reconciliation.

2. **Web boundary**
   - Add a narrow server-only helper that invokes the existing authenticated `/schedule` endpoint without a client timestamp for Publish now.
   - Do not create a second provider-dispatch path.

3. **Content Studio interaction**
   - Reuse the existing scheduling server action and distinguish `publishMode=now` from `publishMode=schedule`.
   - Show Publish now as the primary action for LinkedIn text, the currently complete publish-ready web payload.
   - Keep Schedule for later in progressive disclosure.
   - Keep response copy truthful: queued immediately, not published until provider confirmation.

4. **Verification**
   - Run repository runtime tests/build, governance validation and preflight through CI.
   - Confirm no direct provider credential/API path was introduced in web code.
   - Confirm scheduling and existing worker behavior remain unchanged.
   - Review responsive/accessibility behavior of the changed control surface.

## Completion boundary

The branch may be committed, pushed and opened as one draft PR under the owner's 2026-08-20T03:50+02:00 authorization. Merge, certification, release and deployment remain separate gates.
