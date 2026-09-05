# Concept Mockup 0037 release checklist

- [x] Concept Mockup PR #269 merged to main.
- [x] Post-merge CI for PR #269 merge commit is green.
- [x] Release branch contains only exact 0037 startup authorization plus release documentation.
- [ ] Release PR CI/Security/Product Intake green.
- [ ] Merge exact release head.
- [ ] Post-merge main CI green.
- [ ] Deploy `kairo-api` at exact merged SHA with `KAIRO_STARTUP_MIGRATION=0037_opportunity_concept_mockups.sql` and matching `KAIRO_RELEASE_SHA`.
- [ ] Observe migration applied and API listening.
- [ ] Clear `KAIRO_STARTUP_MIGRATION`; keep `KAIRO_RELEASE_SHA` pinned.
- [ ] Verify clean redeploy does not rerun migration.
- [ ] Verify `kairo-ui-v2` production deployment on the same merged main release lineage.
- [ ] Leave scheduler/cron/Graphile Worker OFF.
