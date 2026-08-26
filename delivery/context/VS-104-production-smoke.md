# VS-104 production closed-loop smoke remediation

Purpose: close the remaining Batch 7 release gate with a production-safe representative persistence check.

The smoke is opt-in through `KAIRO_STARTUP_CLOSED_LOOP_SMOKE=vs104-closed-loop-production-smoke-20260826`, is covered by the existing exact-SHA startup-action guard, and runs inside a database transaction.

The first production attempt failed closed because production had no existing authorized Brand opportunity. The smoke is therefore self-contained: it creates a temporary account, workspace, active owner membership, Brand and Brand opportunity inside the transaction, then re-resolves that exact fixture through the normal membership → Brand → opportunity authorization join.

It verifies:

- Seen feedback persistence through `opportunity_feedback_events`.
- Feedback idempotency through the unique closed-loop key.
- Opportunity-to-Idea lineage through `ideas.source_type='opportunity'` and `opportunity_id`.
- Developing state transition.
- Full rollback cleanup of the temporary account, workspace, membership, Brand, opportunity, feedback and Idea.

The smoke never requires or modifies a real Brand opportunity, never publishes content, changes OAuth authority, changes scheduler behavior, or leaves test data behind.
