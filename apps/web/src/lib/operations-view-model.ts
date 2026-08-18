import type { OperationalFailureView, OperationsSummaryView } from "./operations-api";

export function canRetryOperationalFailure(failure: OperationalFailureView) {
  return failure.retryDisposition === "safe" && failure.attempt < failure.maxAttempts;
}

export function operationalFailurePresentation(failure: OperationalFailureView) {
  if (canRetryOperationalFailure(failure)) {
    return { statusLabel: "Safe retry", statusTone: "safe", guidance: null } as const;
  }
  if (failure.retryDisposition === "safe") {
    return { statusLabel: "Retry limit reached", statusTone: "blocked", guidance: "Retry limit reached" } as const;
  }
  if (failure.retryDisposition === "manual-review") {
    return { statusLabel: "Manual review", statusTone: "manual-review", guidance: "Review required" } as const;
  }
  return { statusLabel: "Blocked", statusTone: "blocked", guidance: "Automatic retry blocked" } as const;
}

export function buildOperationsView(operations: OperationsSummaryView) {
  const orderedFailures = [...operations.failures].sort((left, right) => {
    const priority = failurePriority(left) - failurePriority(right);
    if (priority !== 0) return priority;
    return Date.parse(right.occurredAt) - Date.parse(left.occurredAt);
  });
  const safeRetryCount = orderedFailures.filter(canRetryOperationalFailure).length;
  const manualReviewCount = orderedFailures.filter((failure) => failure.retryDisposition === "manual-review").length;
  const blockedCount = orderedFailures.filter((failure) => failure.retryDisposition === "blocked").length;
  const spentMicros = operations.budgets.reduce((sum, budget) => sum + budget.spentMicros, 0);
  const limitMicros = operations.budgets.reduce((sum, budget) => sum + budget.limitMicros, 0);
  const exhaustedBudgetCount = operations.budgets.filter((budget) => budget.status === "exhausted").length;
  const disabledAutomationCount = operations.automations.filter((control) => control.status === "disabled").length;

  return {
    orderedFailures,
    safeRetryCount,
    manualReviewCount,
    blockedCount,
    attentionCount: orderedFailures.length + exhaustedBudgetCount,
    spentMicros,
    limitMicros,
    exhaustedBudgetCount,
    disabledAutomationCount,
  };
}

export function budgetPercent(spentMicros: number, limitMicros: number) {
  if (limitMicros <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((spentMicros / limitMicros) * 100)));
}

function failurePriority(failure: OperationalFailureView) {
  if (canRetryOperationalFailure(failure)) return 0;
  if (failure.retryDisposition === "manual-review") return 1;
  return 2;
}
