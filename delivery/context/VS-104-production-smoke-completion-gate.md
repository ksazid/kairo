# VS-104 production smoke completion gate

Do not close Batch 7 until all of the following are true:

1. Product Intake, Security baseline and CI pass on the exact remediation candidate.
2. The remediation PR is merged.
3. Render deploys the exact merge/runtime SHA with `KAIRO_RELEASE_SHA` matching `RENDER_GIT_COMMIT`.
4. One-shot `KAIRO_STARTUP_CLOSED_LOOP_SMOKE=vs104-closed-loop-production-smoke-20260826` logs `KAIRO_CLOSED_LOOP_SMOKE_PASSED`.
5. The one-shot smoke variable is cleared and a clean deployment is live.
6. Vercel production remains on the approved VS-104 frontend build and the web deployment gate is restored to disabled.
7. Central release/rollback/current-slice evidence is closed without overstating anything not verified.
