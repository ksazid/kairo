import type { AutomationControl, CostEvent, InterventionRecord, OperationalFailure, RetryRequest, WorkflowBudget } from "@kairo/domain/operations";

export interface OperationsStore {
  recordFailure(failure: OperationalFailure): Promise<OperationalFailure>;
  listFailures(accountId: string, brandId: string): Promise<OperationalFailure[]>;
  createBudget(accountId: string, budget: WorkflowBudget): Promise<WorkflowBudget>;
  recordCost(event: CostEvent): Promise<WorkflowBudget>;
  createAutomationControl(accountId: string, control: AutomationControl): Promise<AutomationControl>;
  requestRetry(accountId: string, brandId: string, failureId: string, idempotencyKey: string, requestedAt: string): Promise<RetryRequest>;
  disableAutomation(accountId: string, brandId: string, automationKey: string, expectedVersion: number, reason: string, at: string): Promise<AutomationControl>;
  listInterventions(accountId: string, brandId: string): Promise<InterventionRecord[]>;
}
