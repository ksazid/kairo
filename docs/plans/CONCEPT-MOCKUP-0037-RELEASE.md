# Concept Mockup migration 0037 release gate

Release-only follow-up for the approved Concept Mockup slice.

- Authorizes the exact startup migration `0037_opportunity_concept_mockups.sql`.
- No migration range expansion.
- No scheduler, cron, Graphile Worker, or production worker activation.
- Production deployment must pin `KAIRO_RELEASE_SHA` to the exact merged release commit before arming the migration.
- After the migration is observed as applied successfully, clear `KAIRO_STARTUP_MIGRATION` while keeping `KAIRO_RELEASE_SHA` pinned to the deployed commit.
