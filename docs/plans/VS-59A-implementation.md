# VS-59A implementation plan

1. Add domain types, validation/filter helpers, repository/service interfaces and provider connector contract.
2. Add forward-only `0019_content_asset_library.sql` for Brand-scoped library and asset metadata.
3. Add Postgres repository and authenticated API routes; wire them in `server.ts` without provider credentials/networking.
4. Add deterministic domain/API tests for multi-library behavior, Brand isolation, filtering and no-network connector semantics.
5. Add Brand-scoped Content Assets web API wrapper, actions and secondary workspace page.
6. Add entry points from More and Content Studio while keeping desktop primary navigation unchanged.
7. Run UI Review against Kairo design authority and responsive/accessibility expectations.
8. Run Product Intake, Security baseline and full CI on the exact implementation head; fix only concrete failures.
9. Transition governance to certification and rerun the same gate wave on one frozen final SHA.
10. Stop for owner merge approval. No Vercel deployment and no Google provider mutation.
