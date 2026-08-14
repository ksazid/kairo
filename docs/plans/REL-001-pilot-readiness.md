# REL-001 — Kairo V1 Pilot Release Readiness

**Status:** Release pending — readiness reconciled; deployment not started  
**Release candidate:** `84b778660f9d0152a7a0aa248317b476f15215d4`  
**Release:** `REL-001`  
**Included slices:** VS-01 through VS-11  
**Release approval:** Granted for the exact SHA above  
**Production-enable approval:** **Not granted**

## Purpose

Prepare and govern the certified Kairo V1 pilot release without expanding product scope. REL-001 now binds the merged, security-hardened VS-11 candidate. Release approval authorizes the controlled release path only; it does not authorize production-enabled behaviour or imply that deployment/production verification has completed.

## Reconciled readiness evidence

1. **Exact-SHA governance**
   - Certified merged candidate: `84b778660f9d0152a7a0aa248317b476f15215d4`.
   - Human release approval is bound to the same SHA.
   - PR #31 is merged; the merge delta from its certified PR head was governance-only.
   - DEC-008 is approved.

2. **Deployment topology — DEC-008**
   - Web: Vercel Hobby for the bounded non-commercial pilot.
   - API: Render Free Web Service, Frankfurt.
   - Database: Neon Free Postgres, AWS Europe (Frankfurt).
   - Paid-plan/capacity reassessment is mandatory before commercial use or production enablement.

3. **Database and dependency readiness**
   - CI #330 applied migrations `0001` through `0013` successfully on clean PostgreSQL 18 for the exact certified SHA.
   - CI #330 production dependency audit passed at the high-severity threshold.
   - CI #330 preflight/governance, runtime verification and dashboard build passed.

4. **Configuration and secrets**
   - Required runtime contract: `DATABASE_URL`, OIDC issuer/audience/JWKS settings, `KAIRO_API_URL`, `NEON_AUTH_BASE_URL`, secret-managed `NEON_AUTH_COOKIE_SECRET`, model-gateway configuration and approved channel credentials.
   - Secrets remain outside Git.
   - Instagram and LinkedIn remain capability-gated with explicit manual fallback when unsupported.

5. **Rollback readiness**
   - `RB-001` is ready for REL-001.
   - Default response to a failed release is to stop pilot traffic, disable external publishing automation, preserve audit evidence, prefer forward database recovery, and use the approved backup only when required.
   - Last known-good certified pilot runtime for runtime rollback: `cb273c59e83c3043313127f15afc717b33577958`.
   - Reopening traffic requires health, version provenance, authentication and tenant-isolation verification.

## Release-order contract

`database/migrations → API → API health/version check → web → authenticated end-to-end smoke → production verification`

All released components must identify `84b778660f9d0152a7a0aa248317b476f15215d4`.

## Execution gates still pending

The following are release-execution checks and must pass before REL-001 may be marked `released`:

- API `/health/live`, `/health/ready` and `/version` against the deployed exact SHA.
- Authenticated Workspace/Brand flow.
- Cross-tenant denial.
- Publishing success through an approved capability or explicit manual fallback.
- Pilot Operations failure/retry observability with redacted telemetry.
- End-to-end smoke against the deployed exact SHA.
- Production verification recorded as passed.

## Current governance position

REL-001 is **approved and release-pending** with rollback readiness established. No production-enable approval has been granted. No deployment success or production verification is claimed by this document.
