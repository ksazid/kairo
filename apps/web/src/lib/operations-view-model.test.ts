import { describe, expect, it } from "vitest";
import type { OperationalFailureView, OperationsSummaryView } from "./operations-api";
import { budgetPercent, buildOperationsView, canRetryOperationalFailure } from "./operations-view-model";

function failure(id: string, disposition: OperationalFailureView["retryDisposition"], attempt = 1, maxAttempts = 3, occurredAt = "2026-08-18T12:00:00.000Z"): OperationalFailureView {
  return {
    id,
    workspaceId: "workspace-1",
    brandId: "brand-1",
    workflowId: `workflow-${id}`,
    stage: "publishing",
    diagnosticCode: `CODE-${id}`,
    summary: `Failure ${id}`,
    retryDisposition: disposition,
    attempt,
    maxAttempts,
    state: "failed",
    occurredAt,
  };
}

function operations(failures: OperationalFailureView[]): OperationsSummaryView {
  return {
    brandId: "brand-1",
    failures,
    budgets: [
      { id: "budget-1", workspaceId: "workspace-1", brandId: "brand-1", workflowId: "workflow-a", currency: "USD", limitMicros: 10_000_000, spentMicros: 10_000_000, remainingMicros: 0, status: "exhausted", createdAt: "2026-08-18T10:00:00.000Z" },
      { id: "budget-2", workspaceId: "workspace-1", brandId: "brand-1", workflowId: "workflow-b", currency: "USD", limitMicros: 20_000_000, spentMicros: 5_000_000, remainingMicros: 15_000_000, status: "active", createdAt: "2026-08-18T10:00:00.000Z" },
    ],
    costs: [],
    automations: [
      { id: "automation-1", workspaceId: "workspace-1", brandId: "brand-1", automationKey: "hunter", stage: "hunter", status: "disabled", version: 2, createdAt: "2026-08-18T10:00:00.000Z", disabledReason: "Operator pause" },
    ],
    interventions: [],
  };
}

describe("operations view model", () => {
  it("orders safe retries before manual review and blocked failures", () => {
    const view = buildOperationsView(operations([
      failure("blocked", "blocked"),
      failure("review", "manual-review"),
      failure("safe", "safe"),
    ]));

    expect(view.orderedFailures.map((item) => item.id)).toEqual(["safe", "review", "blocked"]);
    expect(view.safeRetryCount).toBe(1);
    expect(view.manualReviewCount).toBe(1);
    expect(view.blockedCount).toBe(1);
  });

  it("does not present an exhausted retry attempt as safe", () => {
    const exhausted = failure("safe-exhausted", "safe", 3, 3);
    expect(canRetryOperationalFailure(exhausted)).toBe(false);
    expect(buildOperationsView(operations([exhausted])).safeRetryCount).toBe(0);
  });

  it("summarises supporting operational state without turning it into the primary task", () => {
    const view = buildOperationsView(operations([failure("safe", "safe")]));
    expect(view.attentionCount).toBe(2);
    expect(view.spentMicros).toBe(15_000_000);
    expect(view.limitMicros).toBe(30_000_000);
    expect(view.exhaustedBudgetCount).toBe(1);
    expect(view.disabledAutomationCount).toBe(1);
  });

  it("bounds budget progress for accessible presentation", () => {
    expect(budgetPercent(5, 10)).toBe(50);
    expect(budgetPercent(20, 10)).toBe(100);
    expect(budgetPercent(5, 0)).toBe(0);
  });
});
