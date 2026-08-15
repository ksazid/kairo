# VS-15 Superpowers Execution Steps

1. Keep VS-15 scope and implementation approval fixed.
2. Write failing tests for media validation, persistence hydration and Meta request sequencing.
3. Implement domain contracts and migration with no new dependency.
4. Implement repository/execution hydration.
5. Extend the existing Instagram adapter; do not create a second Instagram publishing stack.
6. Run full workspace typecheck/tests/migrations.
7. Review changed paths for secrets, unsafe URLs, unknown-outcome retries and scope drift.
8. Move implementing → testing → certification only through legal PES transitions.
9. Request exact-SHA human certification/merge after all final gates pass.
10. Do not release, deploy or production-enable from this slice.
