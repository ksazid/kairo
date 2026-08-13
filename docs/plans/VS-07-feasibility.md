# VS-07 Publishing Feasibility

Status: Passed — DEC-004 approved

## Decision

Implement official deterministic automated publishing adapters for Instagram Professional accounts and LinkedIn organization Pages. Enable automation only after account capability, OAuth permission and role checks pass. Unsupported or unapproved paths use an explicit manual publishing workflow.

## Official platform evidence

- Meta Content Publishing supports API publishing for Instagram Professional accounts, using media containers and `media_publish`; account/content-type limitations and publishing limits apply.
- LinkedIn's versioned Posts API supports organic organization posts with `w_organization_social` when the authenticated member has an allowed Page role.
- LinkedIn Community Management access begins in a restricted Development tier and requires separate approval for Standard production use.

References:

- https://developers.facebook.com/documentation/instagram-platform/content-publishing
- https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-facebook-login
- https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
- https://learn.microsoft.com/en-us/linkedin/marketing/increasing-access

## V1 boundary

- Kairo owns schedules, idempotency, retries, reconciliation and audit.
- Tokens are encrypted and exposed only to deterministic channel adapters.
- Only the exact currently approved immutable Content Version may be dispatched.
- A timeout produces `unknown` until reconciliation; it never appears successful.
- Missing platform approval, permissions, account roles or content capability becomes `manual-required`, not a simulated success.
- Agents never receive credentials and cannot approve, schedule or publish.
