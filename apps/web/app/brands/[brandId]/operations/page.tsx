import Link from "next/link";
import { getBrand } from "../../../../src/lib/kairo-api";
import { getOperations, type OperationalFailureView, type OperationsBudgetView } from "../../../../src/lib/operations-api";
import { KairoSidebar } from "../ideas/page";
import { disableAutomationAction, retryOperationalFailureAction } from "./actions";
import "../../../performance.css";
import "../../../operations.css";

type Params=Promise<{brandId:string}>;
type SearchParams=Promise<{notice?:string;error?:string}>;

export default async function OperationsPage({params,searchParams}:{params:Params;searchParams:SearchParams}){
  const {brandId}=await params;
  const brand=await getBrand(brandId);
  if(!brand)return <main className="auth-page"><section className="auth-card"><h1>Brand not found.</h1><Link className="primary-button" href="/">Return to Today</Link></section></main>;
  const [operations,messages]=await Promise.all([getOperations(brand.id),searchParams]);
  const safe=operations.failures.filter(canRetry);
  const spent=operations.budgets.reduce((sum,budget)=>sum+budget.spentMicros,0);
  const limit=operations.budgets.reduce((sum,budget)=>sum+budget.limitMicros,0);
  const disabled=operations.automations.filter(control=>control.status==="disabled").length;

  return <div className="app-shell">
    <KairoSidebar brandId={brand.id} active="Operations"/>
    <main className="workspace-main operations-main">
      <header className="topbar operations-topbar"><div><p className="eyebrow">Pilot Operations</p><h1>See failures, spend and controls without exposing Brand-private content.</h1><p className="lede">Diagnostics are redacted. Safe retries use Kairo’s existing durable queue, and every operator intervention is recorded.</p></div><Link className="secondary-button" href={`/brands/${encodeURIComponent(brand.id)}/performance`}>Open Performance</Link></header>
      {messages.notice?<p className="notice success" role="status">{messages.notice}</p>:null}
      {messages.error?<p className="notice error" role="alert">{messages.error}</p>:null}

      <section className="operations-summary" aria-label="Pilot Operations summary">
        <Summary label="Failures" value={String(operations.failures.length)} detail={`${safe.length} safe to expedite`}/>
        <Summary label="Budget tracked" value={formatMoney(spent,"USD")} detail={limit?`${formatMoney(limit,"USD")} configured limit`:"No workflow limits configured"}/>
        <Summary label="Automations disabled" value={String(disabled)} detail={`${operations.automations.length} controls registered`}/>
        <Summary label="Interventions" value={String(operations.interventions.length)} detail="Audited operator actions"/>
      </section>

      <section className="operations-panel" aria-labelledby="failure-title"><div className="operations-heading"><div><p className="eyebrow">Failure diagnostics</p><h2 id="failure-title">What needs attention</h2></div><span className="operations-count">{operations.failures.length}</span></div>
        {operations.failures.length?operations.failures.map(failure=><FailureRow key={failure.id} brandId={brand.id} failure={failure}/>):<Empty title="No operational failures" text="Kairo has not recorded a redacted workflow failure for this Brand."/>}
      </section>

      <section className="operations-grid">
        <div className="operations-panel"><div className="operations-heading"><div><p className="eyebrow">Cost controls</p><h2>Workflow budgets</h2></div></div>
          {operations.budgets.length?operations.budgets.map(budget=><BudgetRow key={budget.id} budget={budget}/>):<Empty title="No budgets configured" text="Runtime cost enforcement activates when a workflow budget is present."/>}
          {operations.costs.length?<div className="cost-feed"><h3>Recent measured cost</h3>{operations.costs.slice(0,6).map(cost=><div className="cost-row" key={cost.id}><div><strong>{label(cost.kind)}</strong><span>{cost.provider} · {shortWorkflow(cost.workflowId)}</span></div><b>{formatMoney(cost.costMicros,cost.currency)}</b></div>)}</div>:null}
        </div>

        <div className="operations-panel"><div className="operations-heading"><div><p className="eyebrow">Automation safety</p><h2>Non-destructive controls</h2></div></div>
          {operations.automations.length?operations.automations.map(control=><article className="automation-row" key={control.id}><div className="automation-copy"><span className={`operations-status ${control.status}`}>{label(control.status)}</span><h3>{label(control.automationKey)}</h3><p>{label(control.stage)} · version {control.version}</p>{control.disabledReason?<small>{control.disabledReason}</small>:null}</div>{control.status==="enabled"?<form className="disable-form" action={disableAutomationAction.bind(null,brand.id,control.automationKey,control.version)}><label>Reason<input name="reason" required maxLength={500} placeholder="Why should this automation stop?"/></label><button className="tertiary-button" type="submit">Disable</button></form>:null}</article>):<Empty title="No automation controls" text="Only explicitly registered pilot automations appear here."/>}
        </div>
      </section>

      <section className="operations-panel" aria-labelledby="audit-title"><div className="operations-heading"><div><p className="eyebrow">Audit trail</p><h2 id="audit-title">Operator interventions</h2></div></div>
        {operations.interventions.length?<div className="intervention-list">{operations.interventions.map(item=><article className="intervention-row" key={item.id}><div><strong>{label(item.action)}</strong><p>{item.reason}</p><small>{label(item.targetType)} · {item.targetId}</small></div><time dateTime={item.at}>{formatTime(item.at)}</time></article>)}</div>:<Empty title="No interventions yet" text="Safe retries, automation disablement and other governed actions appear here."/>}
      </section>
    </main>
  </div>;
}

function FailureRow({brandId,failure}:{brandId:string;failure:OperationalFailureView}){const retry=canRetry(failure);return <article className="failure-row"><div className="failure-main"><div className="failure-meta"><span className={`operations-status ${failure.retryDisposition}`}>{retry?"Safe retry":label(failure.retryDisposition)}</span><span>{label(failure.stage)}</span><time dateTime={failure.occurredAt}>{formatTime(failure.occurredAt)}</time></div><h3>{failure.summary}</h3><p><code>{failure.diagnosticCode}</code> · attempt {failure.attempt} of {failure.maxAttempts}</p></div>{retry?<form action={retryOperationalFailureAction.bind(null,brandId,failure.id)}><button className="primary-button" type="submit">Expedite retry</button></form>:<span className="failure-guidance">{failure.retryDisposition==="manual-review"?"Review required":"Automatic retry blocked"}</span>}</article>}
function BudgetRow({budget}:{budget:OperationsBudgetView}){const pct=Math.min(100,Math.round((budget.spentMicros/budget.limitMicros)*100));return <article className="budget-row"><div className="budget-title"><div><strong>{shortWorkflow(budget.workflowId)}</strong><span>{budget.status==="exhausted"?"Budget exhausted":`${pct}% used`}</span></div><b>{formatMoney(budget.spentMicros,budget.currency)} / {formatMoney(budget.limitMicros,budget.currency)}</b></div><div className="budget-track" aria-label={`${pct}% of workflow budget used`}><span style={{width:`${pct}%`}}/></div></article>}
function Summary({label:heading,value,detail}:{label:string;value:string;detail:string}){return <div className="operations-summary-card"><span>{heading}</span><strong>{value}</strong><small>{detail}</small></div>}
function Empty({title,text}:{title:string;text:string}){return <div className="operations-empty"><strong>{title}</strong><p>{text}</p></div>}
function canRetry(failure:OperationalFailureView){return failure.retryDisposition==="safe"&&failure.attempt<failure.maxAttempts}
function formatMoney(micros:number,currency:string){return new Intl.NumberFormat(undefined,{style:"currency",currency,maximumFractionDigits:2}).format(micros/1_000_000)}
function formatTime(value:string){return new Date(value).toLocaleString()}
function shortWorkflow(value:string){return label(value.replace(/^agent:/,"").replace(/^publishing:/,"Publish "))}
function label(value:string){return value.replace(/([A-Z])/g," $1").replaceAll("-"," ").replace(/^./,letter=>letter.toUpperCase())}
