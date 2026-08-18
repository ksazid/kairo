import Link from "next/link";
import { getBrand } from "../../../../src/lib/kairo-api";
import { getOperations, type OperationalFailureView, type OperationsBudgetView } from "../../../../src/lib/operations-api";
import { budgetPercent, buildOperationsView, canRetryOperationalFailure } from "../../../../src/lib/operations-view-model";
import { KairoProductShell, KairoScopePicker } from "../../../kairo-product-shell";
import { disableAutomationAction, retryOperationalFailureAction } from "./actions";
import "../../../operations.css";

type Params = Promise<{ brandId: string }>;
type SearchParams = Promise<{ notice?: string; error?: string }>;

export default async function OperationsPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { brandId } = await params;
  const brand = await getBrand(brandId);
  if (!brand) return <main className="auth-page"><section className="auth-card"><h1>Brand not found.</h1><Link className="primary-button" href="/">Return to Today</Link></section></main>;
  const [operations, messages] = await Promise.all([getOperations(brand.id), searchParams]);
  const view = buildOperationsView(operations);

  return <KairoProductShell brandId={brand.id} workspaceId={brand.workspaceId} active={null} mobileActive="More">
    <main className="workspace-main operations-main" id="kairo-main-content">
      <header className="topbar operations-topbar">
        <div>
          <p className="eyebrow">Pilot Operations</p>
          <h1>Handle what needs attention.</h1>
          <p className="lede">Start with failures that require a safe retry or operator judgment. Cost, automation and audit detail stay available without competing with the task.</p>
        </div>
        <KairoScopePicker brandName={brand.name} meta="Internal pilot controls" />
      </header>
      {messages.notice ? <p className="notice success" role="status">{messages.notice}</p> : null}
      {messages.error ? <p className="notice error" role="alert">{messages.error}</p> : null}

      <div className="operations-facts" aria-label="Operational status summary">
        <span><strong>{operations.failures.length}</strong> failures · {view.safeRetryCount} safe to retry</span>
        <span><strong>{formatMoney(view.spentMicros, "USD")}</strong>{view.limitMicros ? ` of ${formatMoney(view.limitMicros, "USD")} tracked` : " tracked"}</span>
        <span><strong>{view.disabledAutomationCount}</strong> automations paused</span>
        <span><strong>{operations.interventions.length}</strong> audited interventions</span>
      </div>

      <section className="operations-attention" aria-labelledby="failure-title">
        <div className="operations-heading">
          <div><p className="eyebrow">Attention queue</p><h2 id="failure-title">What needs an operator</h2><p>Safe retries come first, followed by manual-review and blocked failures.</p></div>
          <span className="operations-count">{operations.failures.length}</span>
        </div>
        {view.orderedFailures.length ? view.orderedFailures.map((failure) => <FailureRow key={failure.id} brandId={brand.id} failure={failure} />) : <Empty title="Nothing needs attention" text="Kairo has not recorded a redacted workflow failure for this Brand." />}
      </section>

      <section className="operations-support" aria-label="Supporting operational controls">
        <details className="operations-disclosure" open={view.exhaustedBudgetCount > 0}>
          <summary><span><strong>Workflow budgets & measured cost</strong><small>{view.exhaustedBudgetCount ? `${view.exhaustedBudgetCount} exhausted budget${view.exhaustedBudgetCount === 1 ? "" : "s"}` : `${operations.budgets.length} budgets tracked`}</small></span><span aria-hidden="true">+</span></summary>
          <div className="operations-disclosure-body">
            {operations.budgets.length ? operations.budgets.map((budget) => <BudgetRow key={budget.id} budget={budget} />) : <Empty title="No budgets configured" text="Runtime cost enforcement activates when a workflow budget is present." />}
            {operations.costs.length ? <div className="cost-feed"><h3>Recent measured cost</h3>{operations.costs.slice(0, 6).map((cost) => <div className="cost-row" key={cost.id}><div><strong>{label(cost.kind)}</strong><span>{cost.provider} · {shortWorkflow(cost.workflowId)}</span></div><b>{formatMoney(cost.costMicros, cost.currency)}</b></div>)}</div> : null}
          </div>
        </details>

        <details className="operations-disclosure" open={view.disabledAutomationCount > 0}>
          <summary><span><strong>Automation safety controls</strong><small>{view.disabledAutomationCount ? `${view.disabledAutomationCount} currently disabled` : `${operations.automations.length} controls registered`}</small></span><span aria-hidden="true">+</span></summary>
          <div className="operations-disclosure-body">
            {operations.automations.length ? operations.automations.map((control) => <article className="automation-row" key={control.id}><div className="automation-copy"><span className={`operations-status ${control.status}`}>{label(control.status)}</span><h3>{label(control.automationKey)}</h3><p>{label(control.stage)} · version {control.version}</p>{control.disabledReason ? <small>{control.disabledReason}</small> : null}</div>{control.status === "enabled" ? <form className="disable-form" action={disableAutomationAction.bind(null, brand.id, control.automationKey, control.version)}><label>Reason<input name="reason" required maxLength={500} placeholder="Why should this automation stop?" /></label><button className="tertiary-button" type="submit">Disable</button></form> : null}</article>) : <Empty title="No automation controls" text="Only explicitly registered pilot automations appear here." />}
          </div>
        </details>

        <details className="operations-disclosure">
          <summary><span><strong>Operator intervention history</strong><small>{operations.interventions.length ? `${operations.interventions.length} audited actions` : "No interventions yet"}</small></span><span aria-hidden="true">+</span></summary>
          <div className="operations-disclosure-body">
            {operations.interventions.length ? <div className="intervention-list">{operations.interventions.map((item) => <article className="intervention-row" key={item.id}><div><strong>{label(item.action)}</strong><p>{item.reason}</p><small>{label(item.targetType)} · {item.targetId}</small></div><time dateTime={item.at}>{formatTime(item.at)}</time></article>)}</div> : <Empty title="No interventions yet" text="Safe retries, automation disablement and other governed actions appear here." />}
          </div>
        </details>
      </section>

      <p className="operations-footnote">Diagnostics remain redacted and every operator intervention is audited. <Link href={`/brands/${encodeURIComponent(brand.id)}/performance`}>Open Performance</Link> for measured content intelligence.</p>
    </main>
  </KairoProductShell>;
}

function FailureRow({ brandId, failure }: { brandId: string; failure: OperationalFailureView }) {
  const retry = canRetryOperationalFailure(failure);
  return <article className="failure-row"><div className="failure-main"><div className="failure-meta"><span className={`operations-status ${failure.retryDisposition}`}>{retry ? "Safe retry" : label(failure.retryDisposition)}</span><span>{label(failure.stage)}</span><time dateTime={failure.occurredAt}>{formatTime(failure.occurredAt)}</time></div><h3>{failure.summary}</h3><p><code>{failure.diagnosticCode}</code> · attempt {failure.attempt} of {failure.maxAttempts}</p></div>{retry ? <form action={retryOperationalFailureAction.bind(null, brandId, failure.id)}><button className="primary-button" type="submit">Expedite retry</button></form> : <span className="failure-guidance">{failure.retryDisposition === "manual-review" ? "Review required" : "Automatic retry blocked"}</span>}</article>;
}

function BudgetRow({ budget }: { budget: OperationsBudgetView }) {
  const pct = budgetPercent(budget.spentMicros, budget.limitMicros);
  return <article className="budget-row"><div className="budget-title"><div><strong>{shortWorkflow(budget.workflowId)}</strong><span>{budget.status === "exhausted" ? "Budget exhausted" : `${pct}% used`}</span></div><b>{formatMoney(budget.spentMicros, budget.currency)} / {formatMoney(budget.limitMicros, budget.currency)}</b></div><div className="budget-track" role="progressbar" aria-label={`${shortWorkflow(budget.workflowId)} workflow budget`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><span style={{ width: `${pct}%` }} /></div></article>;
}

function Empty({ title, text }: { title: string; text: string }) { return <div className="operations-empty"><strong>{title}</strong><p>{text}</p></div>; }
function formatMoney(micros: number, currency: string) { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(micros / 1_000_000); }
function formatTime(value: string) { return new Date(value).toLocaleString(); }
function shortWorkflow(value: string) { return label(value.replace(/^agent:/, "").replace(/^publishing:/, "Publish ")); }
function label(value: string) { return value.replace(/([A-Z])/g, " $1").replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase()); }
