# VS-104 production closed-loop smoke remediation

Purpose: close the remaining Batch 7 release gate with a production-safe representative persistence check.

The smoke is opt-in through `KAIRO_STARTUP_CLOSED_LOOP_SMOKE=vs104-closed-loop-production-smoke-20260826`, is covered by the existing exact-SHA startup-action guard, and runs inside a database transaction.

It verifies on an existing authorized Brand opportunity:

- Seen feedback persistence through `opportunity_feedback_events`.
- Feedback idempotency through the unique closed-loop key.
- Opportunity-to-Idea lineage through `ideas.source_type='opportunity'` and `opportunity_id`.
- Developing state transition.
- Full rollback cleanup: temporary feedback/Idea do not persist and the original opportunity status is restored.

The smoke never publishes content, changes OAuth authority, changes scheduler behavior, or leaves test data behind.
