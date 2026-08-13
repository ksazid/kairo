"use server";

import {
  disableOperationsAutomation,
  requestOperationsRetry,
} from "../../../../src/lib/operations-api";

export async function retryOperationalFailureAction(
  brandId: string,
  failureId: string,
) {
  // One operational failure represents one underlying attempt. Reusing the
  // failure id keeps repeated form submissions on the same idempotency key.
  await requestOperationsRetry(brandId, failureId, failureId);
}

export async function disableAutomationAction(
  brandId: string,
  automationKey: string,
  expectedVersion: number,
  formData: FormData,
) {
  const reason = String(formData.get("reason") ?? "").trim();
  await disableOperationsAutomation(
    brandId,
    automationKey,
    expectedVersion,
    reason,
  );
}
