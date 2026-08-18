# VS-58 implementation plan

1. **First-run view model + tests**
   - centralize local-only `returnTo` normalization;
   - normalize known Kairo auth failures;
   - never reflect arbitrary query error text;
   - test normal, known-error and unknown-error states.

2. **Kairo-owned sign-in/recovery remediation**
   - preserve `/auth/login` as the secure identity-provider handoff;
   - simplify `/sign-in` hierarchy;
   - remove decorative gradient treatment;
   - keep recovery state explicit, calm and accessible.

3. **Onboarding remediation**
   - keep one lightweight form;
   - present it as Step 1 of 2;
   - make Brand Brain review the explicit next step;
   - keep one optional public reference URL with universal URL/PDF wording;
   - explain graceful source-read fallback.

4. **Final UI consistency review**
   - verify approved Kairo typography, spacing, focus, touch targets and mobile collapse;
   - verify no Auth0-owned UX, API/domain, provider or Vercel paths changed.

5. **Verification**
   - Product Intake;
   - Security baseline;
   - full CI/preflight/runtime/build;
   - implementation-level UI Review;
   - freeze exact candidate and rerun gates after governance transition;
   - stop for owner certification + merge approval.
