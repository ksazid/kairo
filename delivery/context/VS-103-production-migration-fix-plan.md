# VS-103 production migration fix plan

1. Add `0031_brand_intelligence_topic_graph.sql` to the exact startup migration allowlist in `scripts/start-api.mjs`.
2. Include `scripts/start-api.mjs` in the active VS-103 allowed paths.
3. Run Product Intake, Security baseline and CI on the exact fix SHA.
4. Obtain exact-SHA certification approval for the release-plumbing fix.
5. Merge the fix.
6. Set `KAIRO_STARTUP_MIGRATION=0031_brand_intelligence_topic_graph.sql` and exact matching `KAIRO_RELEASE_SHA` for one deployment, then deploy the exact approved runtime.
7. Verify migration success, API health/startup, no error/fatal logs and Topic Graph persistence availability.
8. Clear the temporary startup migration variable immediately after successful application and redeploy the same runtime if required by the established release procedure.
9. Only then mark REL-014 / RB-014 and VS-103 released.
