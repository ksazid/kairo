# VS-103 production migration blocker

Production deployment `dep-da7cqiu1egvs73e816ng` reached the runtime rollout path on exact merge SHA `ec026f26f9eddc7306f9ae088abf1f7c98738c70`, but migration `0031_brand_intelligence_topic_graph.sql` is not in the allowlist in `scripts/start-api.mjs`.

The API runtime can start without applying 0031, so release closeout must not claim the Topic Graph persistence schema is production-ready until the startup migration allowlist is updated, re-certified on an exact SHA, and 0031 is applied through the approved exact-migration mechanism.

No direct database write was attempted. The Render PostgreSQL connector is read-only and its verification query also failed because the connector could not establish the required TLS session.
