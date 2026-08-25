# VS-95 deferred approved interactions

This is the durable follow-up ledger requested by the Product Owner on 2026-08-25. These controls are present in approved/frozen designs but cannot be truthfully enabled with the current governed runtime contracts. They must remain disabled, omitted, or route only to safe existing management until the dependency below is implemented and approved.

| Surface | Approved control | Current reason it cannot be fully enabled | Required implementation before enablement |
| --- | --- | --- | --- |
| Brand → Sources | Website `Refresh` | Web client exposes add/enable/disable/remove Knowledge Source operations, but no governed Website re-ingestion/refresh command | Add a Brand-authorized refresh/re-ingestion API contract with provenance, failure state, idempotency and source-health result; then wire the Brand action |
| Brand → Channels | YouTube `Manage` | Current authenticated channel-account management supports the existing governed channel adapters; YouTube publishing-management is not implemented as an authenticated destination | Add approved YouTube channel authentication/capability/publishing contract and management route; do not infer publishing authority from public YouTube evidence |
| Avatar | `Test clip` | VS-90 explicitly has no avatar test-clip execution API/provider adapter | Implement governed AvatarProvider test-clip execution, private media handling, status/failure contract and Preview/review boundary |
| Avatar | `View help center` | No approved Help Center information architecture/content route exists | Design/approve Help Center or provider best-practices destination, then link it |
| Avatar → provider setup | Actual Avatar-provider connection/configuration | Presenter capability is fail-closed, but provider credential/config persistence is intentionally absent | Approve and implement Settings → Manage Avatar Provider flow, secure credential/endpoint storage and provider capability verification |
| Settings → AI Providers | Ollama `Manage` | No approved/default AI-provider configuration write contract in the web/API | Implement provider-neutral AI configuration contract, health test and secure endpoint/model configuration; then bind Manage |
| Settings → AI Providers | OpenAI `Connect` | No governed provider credential/config flow | Reusable secure third-party/BYOK provider connection flow; secrets server-side only |
| Settings → AI Providers | Azure OpenAI `Connect` | No governed provider credential/config flow | Same reusable flow with Azure endpoint/deployment/key validation |
| Settings → AI Providers | Anthropic Claude `Connect` | No governed provider credential/config flow | Same reusable flow with provider capability/health validation |
| Settings → AI Providers | Custom Provider `Connect` | Custom/self-hosted provider flow is still unapproved design work | Approve Manage/Add Custom Provider UX, then implement endpoint/auth/model/capability validation |
| Settings → AI Providers | `Add provider` | Reusable provider-add flow is not implemented | Implement only after the approved reusable connection pattern exists |
| Settings → AI & Media Providers | `Provider settings` | Specialist global provider settings page has no approved contract | Define only settings that are genuinely cross-provider and approve the page before implementation |
| Settings → AI & Media Providers | `Learn more` | No approved product documentation/help destination exists | Add approved documentation/help route and content |
| Settings → Media Providers | Image / FLUX.1 Schnell `Manage` | Approved management page exists visually, but current governed provider-config backend is absent | Implement image provider configuration/capability test contract, then connect the frozen Manage Image Provider page |
| Settings → Media Providers | Video / Wan 2.2 `Manage` | Approved management page exists visually, but current governed provider-config backend is absent | Implement video provider configuration/capability test contract, then connect the frozen Manage Video Provider page |
| Settings → Media Providers | Voice / Kokoro `Manage` | Approved management page exists visually, but current governed provider-config backend is absent | Implement voice provider configuration/capability test contract, then connect the frozen Manage Voice Provider page |
| Settings → Media Providers | Music / ACE-Step `Manage` | Manage Music Provider design is the next unapproved page | Finish/approve the design, then implement provider configuration/capability contract |
| Settings → Media Providers | Avatar / MuseTalk `Manage` | Manage Avatar Provider design/connection flow is still unapproved | Approve design and implement secure AvatarProvider setup + capability verification |
| Settings → Media Providers | Custom/self-hosted `Add provider` | Add Custom/self-hosted Provider flow is still unapproved | Approve reusable custom-provider flow, then implement secure provider config |
| Settings navigation | General | Page not explicitly approved | Design and approve before implementation |
| Settings navigation | Team | Page not explicitly approved | Design and approve before implementation |
| Settings navigation | Billing | Page not explicitly approved | Design and approve before implementation |
| Settings navigation | Notifications | Page not explicitly approved | Design and approve before implementation |
| Settings navigation | Integrations | Page not explicitly approved | Design and approve before implementation |
| Settings navigation | Security | Page not explicitly approved | Design and approve before implementation |
| Settings navigation | Audit log | Page not explicitly approved | Design and approve before implementation |

## Enablement rule

A visual approval alone does not authorize secrets, provider endpoints, publishing authority, billing behavior, security policy or external execution. Each deferred control is enabled only after its runtime contract is implemented, verified, and the governing slice receives the required approvals.
