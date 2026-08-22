# VS-74 implementation plan

1. Add Brand-source contracts and shared URL classification for Website and Instagram onboarding inputs.
2. Update initial and additional Brand creation to preserve Website input and a post-create Instagram connection intent.
3. Add Brand Brain Website/Instagram source cards using existing Knowledge and Instagram connection APIs.
4. Preserve a validated local return target through Meta OAuth callback and candidate selection.
5. Extend the Meta adapter with bounded profile/business fields and recent media/caption reads.
6. Persist a sanitized Instagram snapshot as a Brand-private active Knowledge source with stable refresh identity.
7. Feed the imported snapshot through the existing Brand Brain proposal generator and provenance rules.
8. Extend the allow-list with bounded visual-direction fields without changing the section model.
9. Add tests for onboarding, OAuth return flow, import bounds, idempotency, credential secrecy, tenant isolation and confirmed-field preservation.
10. Run deterministic review, governance validation, preflight and runtime verification; open a draft PR and stop at the human merge gate.

## Security controls
- Official Meta OAuth and existing encrypted credential-vault boundaries only.
- Instagram Professional accounts only; explicit selection for multiple candidates.
- No provider token in domain records, Knowledge content, prompts, logs or browser state.
- Bounded provider requests and imported payload size/count.
- Public Website retrieval remains fail-closed and SSRF-safe.
- Imported provider text is untrusted evidence, never instructions.

## Non-goals
- Database redesign or a second token model.
- Unbounded Instagram history ingestion.
- Image download, computer vision or media transcoding.
- Automatic owner confirmation.
- Merge, release or deployment authority.
