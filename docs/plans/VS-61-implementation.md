# VS-61 implementation plan — Content Asset Selection in Content Studio

## Governing skills

Use `using-superpowers`, `slice-planner`, `ui-ux-pro-max`, `ui-review`, `implementer` and `verifier` where applicable. `product/DESIGN.md` remains the product-design authority.

## Sequence

1. **Domain contract and tests**
   - Add a bounded server-owned Content Library reference snapshot to `ContentVersion`.
   - Add `asset-selection` action.
   - Add a `ContentAssetSelectionService` that reuses `CampaignRepository` and `ContentAssetLibraryRepository`.
   - Validate Brand/workspace scope, duplicate/max-count limits, stale versions and no-op requests.
   - Ensure manual edits and generated text versions inherit current references.

2. **Persistence and tests**
   - Add PostgreSQL migration `0021_content_asset_selection.sql`.
   - Persist/reload `library_asset_refs` in `PgCampaignRepository`.
   - Add optional efficient batch lookup of library assets to `PgContentAssetLibraryRepository`; keep the domain repository backward-compatible for existing test doubles.
   - Verify migration from the existing schema on PostgreSQL 18.

3. **API boundary and tests**
   - Register a dedicated selection route at the existing Campaign/Content Asset boundary.
   - Authenticate through the same OIDC/session path as other Brand-scoped routes.
   - Accept only `{ expectedVersion, libraryAssetIds }`; never accept provider provenance fields from the client.
   - Return the normal Campaign detail after the immutable version append.

4. **Content Studio UI and tests**
   - Extend the web DTO with library-asset references.
   - Load existing Brand Content Asset Libraries and indexed candidates using the current library API.
   - Add a contextual `Production assets` disclosure per Content Asset.
   - Show current selection, candidate filter controls, explicit metadata-only notice and save action.
   - Show selected-asset count/source in version history.
   - Preserve the existing AI/evidence/review hierarchy and responsive behavior.

5. **Verification**
   - Domain/API/web focused tests.
   - `git diff --check` equivalent through repository/CI validation.
   - Product Intake, Security baseline and full CI on a frozen implementation SHA.
   - Implementation-level UI Review against `product/DESIGN.md`.
   - Governance-only transition into certification.
   - Re-run Product Intake, Security and CI on one frozen exact certification SHA.
   - Stop for owner certification + merge approval.

## Security invariants

- No Drive or other provider network access is performed during selection.
- No access/refresh token, OAuth state, encryption key or binary asset is copied into Content Versions.
- Client-supplied provider metadata is ignored by contract because it is not accepted at all.
- Cross-account, cross-Brand and cross-workspace references fail closed.
- Historical snapshots are immutable provenance; library re-index/disconnect cannot rewrite them.
- Selection changes invalidate current-version review/approval by advancing the Content Version.

## Explicit production boundary

No Vercel/Render deployment, Google Cloud/OAuth mutation, real provider connection, publishing action, production migration, or production enablement is authorized by this plan.
