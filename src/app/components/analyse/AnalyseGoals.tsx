import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnalyseControls } from './AnalyseControls';
import { RecordText, recordDate, sourceName, useListReaderNavigation } from '../workspace/ContextReader';
import { goalsService } from '../../core/services/goalsService';
import { useSapiensStore } from '../../core/state/sapiensStore';
import type { GoalContext, GoalDetail, Plan, WorkflowRecord } from '../../types/goalTypes';
import { workflowLifecycle, workflowState } from '../../utils/goalPresentation';
import '../../../styles/analyse-goals.css';

const views = ['open', 'finished', 'retired'] as const;
type GoalView = typeof views[number];
function completion(record: Pick<WorkflowRecord, 'finished'>) {
  return record.finished === true ? 'Marked finished' : record.finished === false ? 'Unfinished' : 'Completion unknown';
}
function planSummary(plan?: Plan | null) {
  if (!plan) return 'No plan recorded';
  if (!plan.tasks.length) return 'Plan has no recorded steps';
  const unknown = plan.tasks.filter(step => step.finished === null).length;
  return `${plan.tasks.filter(step => step.finished === true).length} of ${plan.tasks.length} steps marked finished${unknown ? ` · ${unknown} unknown` : ''}`;
}
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};

// Shared by this screen's list and reader. Poll only visible pages; ignore late
// responses after a goal/filter/Sapien switch, retaining data on refresh errors.
function useGoalRead<T>(key: string, load: () => Promise<T>) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ key: string; data?: T; error?: string; loading: boolean; at?: string }>();
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let active = true, request = 0;
    const read = async () => {
      if (document.visibilityState === 'hidden') return;
      const id = ++request;
      setState(previous => ({ key, data: previous?.key === key ? previous.data : undefined, at: previous?.key === key ? previous.at : undefined, loading: true }));
      try {
        const data = await load();
        if (active && id === request) setState({ key, data, loading: false, at: new Date().toISOString() });
      } catch (error) {
        if (active && id === request) setState(previous => ({ ...previous, key, loading: false, error: (error as Error).message || 'Could not load saved goals.' }));
      }
    };
    void read();
    const timer = setInterval(read, 120_000);
    const visible = () => { if (document.visibilityState === 'visible') void read(); };
    document.addEventListener('visibilitychange', visible);
    return () => { active = false; request++; clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
    // key contains the request inputs; render-created load functions are not dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, revision]);
  const current = state?.key === key ? state : undefined;
  return { data: current?.data, error: current?.error, loading: !current || current.loading, at: current?.at, refresh };
}

function GoalState({ record }: { record: WorkflowRecord }) {
  const tone = record.retired === true ? 'muted' : record.finished === true ? 'success' : 'neutral';
  return <><span className="ag-state" data-tone={tone}>{workflowLifecycle(record)}</span><span>{workflowState(record.state)}</span></>;
}

function SavedData({ title, value }: { title: string; value: unknown }) {
  return <details className="ag-disclosure"><summary>{title}</summary><pre>{JSON.stringify(value, null, 2)}</pre></details>;
}

function GoalRequest({ sapienId, goalId, scope, stepId, onAccepted }: {
  sapienId: number; goalId: string; scope: 'goal' | 'plan' | 'step' | 'revise'; stepId?: string; onAccepted: () => void;
}) {
  const [open, setOpen] = useState(false), [text, setText] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const trigger = useRef<HTMLButtonElement>(null), field = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(true), submitting = useRef(false);
  const id = useId();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (open) field.current?.focus(); }, [open]);
  const label = scope === 'revise' ? 'Ask to revise the plan' : `Add information to this ${scope}`;
  const close = () => { if (!submitting.current) { setOpen(false); setError(''); trigger.current?.focus(); } };
  async function submit() {
    if (submitting.current || !text.trim()) return;
    submitting.current = true; setBusy(true); setError(''); setNotice('');
    try {
      let queued = false;
      if (scope === 'revise') await goalsService.replan(sapienId, goalId, text.trim());
      else queued = (await goalsService.comment(sapienId, goalId, { comment: text.trim(), scope, ...(stepId ? { step_id: stepId } : {}) }))?.queued === true;
      if (!mounted.current) return;
      setNotice(scope === 'revise' ? 'Revision request accepted for background processing. The plan has not been confirmed as changed.' : queued ? 'Information queued for background processing.' : 'Request received. Changes have not been confirmed.');
      setText(''); setOpen(false); trigger.current?.focus(); onAccepted();
    } catch (caught) { if (mounted.current) setError((caught as Error).message || 'Could not send the request. Please try again.'); }
    finally { submitting.current = false; if (mounted.current) setBusy(false); }
  }
  return <div className="ag-request">
    <button ref={trigger} type="button" className="ag-text-button" aria-expanded={open} aria-controls={id} onClick={() => { if (open) close(); else setOpen(true); }}>{label}</button>
    {open && <form id={id} onSubmit={event => { event.preventDefault(); void submit(); }} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
      <label htmlFor={`${id}-text`}>{scope === 'revise' ? 'What changed, or what should be different?' : `What should Sapiens know about this ${scope}?`}</label>
      <textarea ref={field} id={`${id}-text`} value={text} onChange={event => setText(event.target.value)} rows={3} disabled={busy} aria-describedby={`${id}-help`} />
      <p id={`${id}-help`} className="ag-muted">This sends a request for background processing; it does not directly edit the record.</p>
      {error && <p role="alert" className="ag-error">{error}</p>}
      <div className="ag-actions"><button className="analyse-button" disabled={busy || !text.trim()}>{busy ? 'Sending…' : scope === 'revise' ? 'Send revision request' : 'Send information'}</button><button type="button" className="ag-text-button" disabled={busy} onClick={close}>Cancel</button></div>
    </form>}
    {notice && <p role="status" className="ag-muted">{notice}</p>}
  </div>;
}

function GoalContextView({ context, title }: { context: GoalContext | null; title: string }) {
  if (!context) return <p className="ag-muted">{title}: no context supplied.</p>;
  const empty = !context.facts.length && !context.decisions.length && !context.assumptions.length && !context.open_questions.length;
  return <section className="ag-context"><h4>{title}</h4>{empty && <p className="ag-muted">No context entries recorded.</p>}
    {context.open_questions.length > 0 && <><h5>Questions and answers</h5><ul>{context.open_questions.map(question => <li key={question.id}><p>{question.question}</p><small>{question.resolved_at ? `Resolved ${recordDate(question.resolved_at)}` : 'Unresolved'}</small>{question.resolution && <RecordText text={question.resolution} />}</li>)}</ul></>}
    {context.decisions.length > 0 && <><h5>Recorded decisions</h5><ul>{context.decisions.map((decision, index) => <li key={index}><RecordText text={decision.decision} />{decision.rationale && <p className="ag-muted">{decision.rationale}</p>}<small>{recordDate(decision.at)}</small></li>)}</ul></>}
    {context.facts.length > 0 && <><h5>Saved facts</h5><dl>{context.facts.map((fact, index) => <div key={index}><dt>{fact.key}</dt><dd><RecordText text={fact.value} /><small>Source: {fact.source || 'Not recorded'}</small></dd></div>)}</dl></>}
    {context.assumptions.length > 0 && <><h5>Assumptions</h5><ul>{context.assumptions.map((assumption, index) => <li key={index}><RecordText text={assumption.text} /><small>{assumption.status || 'Status not recorded'}</small></li>)}</ul></>}
  </section>;
}

function GoalReader({ sapienId, goalId, close }: { sapienId: number; goalId: string; close: () => void }) {
  const read = useGoalRead(`${sapienId}/${goalId}`, () => goalsService.getGoal(sapienId, goalId));
  const [submitted, setSubmitted] = useState(0);
  const overloaded = useSapiensStore(state => state.isOverloaded);
  useEffect(() => {
    if (!submitted) return;
    const timers = [10, 40, 70, 100, 130, 160].map(seconds => setTimeout(read.refresh, seconds * 1000));
    return () => timers.forEach(clearTimeout);
  }, [submitted, read.refresh]);
  const accepted = () => setSubmitted(value => value + 1);
  const request = { sapienId, goalId, onAccepted: accepted };
  return <article className="ag-reader" aria-label="Selected goal">
    <div className="ag-reader-toolbar"><button type="button" className="ag-text-button" data-reader-back onClick={close}>← All goals</button><button className="analyse-button" disabled={read.loading} onClick={read.refresh}>Refresh details</button></div>
    {read.error && <p role="alert" className="ag-error">{read.error} {read.data && 'Showing the previously loaded record.'}</p>}
    {read.loading && <p role="status" className="ag-muted">{read.data ? 'Refreshing goal…' : 'Loading goal…'}</p>}
    {read.data && <GoalRecord detail={read.data} request={request} overloaded={overloaded} />}
  </article>;
}

function GoalRecord({ detail, request, overloaded }: { detail: GoalDetail; request: { sapienId: number; goalId: string; onAccepted: () => void }; overloaded?: boolean }) {
  const { goal, current_plan: plan, attention, history } = detail;
  const assessment = object(attention?.outcome?.assessment);
  const pending = !!attention?.request_id && attention.request_id !== attention.resolved_id;
  const understanding = typeof assessment.understanding === 'string' ? assessment.understanding : '';
  const remaining = typeof assessment.remaining === 'string' ? assessment.remaining : '';
  return <>
    <header className="ag-goal-header"><h2>{goal.description || 'Goal description not recorded'}</h2><div className="ag-meta"><GoalState record={goal} />{goal.retired === true && <span>{completion(goal)}</span>}<span>Updated {recordDate(goal.updated_at)}</span></div>
      {goal.motivation && <div className="ag-motivation"><h3>Why this goal exists</h3><RecordText text={goal.motivation} /></div>}
      <p className="ag-muted">{planSummary(plan)}{goal.progress !== null && ` · Reported goal progress: ${Math.round(goal.progress * 100)}%`}</p>
      {goal.progress === null && <p className="ag-muted">Goal progress not reported.</p>}
      <GoalRequest {...request} scope="goal" />
      {overloaded && <p className="ag-muted">Sapiens is busy. New information and plan revision requests may take longer to process.</p>}
    </header>
    <section className="ag-section"><h3>{pending ? 'Last retained assessment' : 'Latest recorded assessment'}</h3>
      {pending && <p className="ag-muted">A newer review was requested {recordDate(attention?.requested_at)}. No matching resolution is recorded yet.</p>}
      {!understanding && !remaining ? <p className="ag-muted">No assessment text supplied for this goal.</p> : <>
        {understanding && <RecordText text={understanding} />}
        {remaining && <div className="ag-remaining"><h4>What remains, according to this assessment</h4><RecordText text={remaining} /></div>}
        <p className="ag-muted">Recorded {recordDate(attention?.resolved_at)}. An assessment is not confirmation of completion.</p>
      </>}
    </section>
    <section className="ag-section"><h3>Current plan</h3>
      {!plan ? <p className="ag-muted">No plan has been recorded for this goal.</p> : <>
        <RecordText text={plan.description || 'Plan description not recorded'} />
        <div className="ag-meta"><GoalState record={plan} />{plan.retired === true && <span>{completion(plan)}</span>}<span>{planSummary(plan)}</span></div>
        <GoalRequest {...request} scope="plan" />
        {!plan.tasks.length && <p className="ag-muted">This plan has no recorded steps yet.</p>}
        <ol className="ag-steps">{plan.tasks.map((step, index) => <li key={step.id || index}><span className="ag-step-number" aria-hidden="true">{index + 1}</span><div>
          <RecordText text={step.description || 'Step description not recorded'} />
          <div className="ag-meta"><span>{workflowLifecycle(step)}</span><span>{workflowState(step.state)}</span></div>
          {(step.result || step.evidence_refs.length > 0) && <details className="ag-disclosure"><summary>{step.result ? 'View result' : 'View evidence references'}</summary>{step.result && <RecordText text={step.result} />}{step.evidence_refs.length > 0 && <p className="ag-muted">Evidence references: {step.evidence_refs.join(', ')}</p>}</details>}
          {step.id && <GoalRequest {...request} scope="step" stepId={step.id} />}
        </div></li>)}</ol>
      </>}
      <GoalRequest {...request} scope="revise" />
      <p className="ag-muted">Workflow state, reported progress and completion flags are separate. A step marked finished does not establish success.</p>
    </section>
    <section className="ag-section"><h3>Supporting information</h3><GoalContextView context={detail.context} title="Goal context" />{plan && <GoalContextView context={detail.plan_context} title="Plan context" />}</section>
    <section className="ag-section"><h3>History & record details</h3>
      <details className="ag-disclosure"><summary>Goal change history{history ? ` (${history.length})` : ''}</summary><p className="ag-muted">Up to 100 stored changes, oldest first; not a complete lifetime history.</p>{history === undefined ? <p>History was not supplied by the API.</p> : !history.length ? <p>No changes returned.</p> : <ol className="ag-history">{history.map((entry, index) => <li key={index}><p>{entry.reason || 'No reason recorded'}</p><small>{entry.operation || 'Operation not recorded'} · {entry.actor || 'Actor unknown'} · {recordDate(entry.at)}</small></li>)}</ol>}</details>
      <details className="ag-disclosure"><summary>Ownership, schedule & provenance</summary><dl className="ag-facts"><div><dt>Source</dt><dd>{sourceName(goal.source)}</dd></div><div><dt>Owner</dt><dd>{goal.owner || 'Not recorded'}</dd></div><div><dt>Created by</dt><dd>{goal.creator || 'Not recorded'}</dd></div><div><dt>Requested by</dt><dd>{goal.requested_by || 'Not recorded'}</dd></div><div><dt>Review enabled</dt><dd>{goal.review_enabled === null ? 'Unknown' : goal.review_enabled ? 'Yes' : 'No'}</dd></div><div><dt>Scheduled review</dt><dd>{goal.review_at ? recordDate(goal.review_at) : 'Not scheduled'}</dd></div></dl></details>
      <SavedData title="Full saved record, evidence & state rules" value={detail} />
    </section>
  </>;
}

export function AnalyseGoals({ sapienId }: { sapienId: number }) {
  const [params, setParams] = useSearchParams();
  const view: GoalView = views.includes(params.get('goalView') as GoalView) ? params.get('goalView') as GoalView : 'open';
  const selected = params.get('goal');
  const search = params.get('goalSearch') || '', source = params.get('goalSource') || '';
  const read = useGoalRead(`${sapienId}/${view}`, () => goalsService.listGoals(sapienId, { activeOnly: false, finished: view === 'retired' ? undefined : view === 'finished', retired: view === 'retired', topK: 30, orderBy: 'priority', includePlan: true }));
  const { container, list, remember } = useListReaderNavigation(selected, sapienId);
  function update(key: string, value: string | null, replace = false) {
    setParams(current => { const next = new URLSearchParams(current); if (value) next.set(key, value); else next.delete(key); if (key === 'goalView') { next.delete('goal'); next.delete('goalSource'); next.delete('goalSearch'); } return next; }, { replace });
  }
  const goals = read.data?.goals || [];
  const sources = [...new Set([...goals.map(goal => goal.source), ...(source ? [source] : [])])].filter(Boolean);
  const visible = goals.filter(goal => (!source || goal.source === source) && `${goal.description} ${goal.id} ${goal.state}`.toLowerCase().includes(search.toLowerCase().trim()));
  return <div className="analyse-goals" ref={container}>
    <p className="analyse-page-purpose">See what this Sapien is working towards, its current plans and the progress recorded so far.</p>
    <AnalyseControls primary={<>
      <div role="group" aria-label="Goal lifecycle" className="ag-views">{views.map(value => <button type="button" key={value} aria-pressed={view === value} onClick={() => update('goalView', value)}>{value === 'open' ? 'Open' : value === 'finished' ? 'Finished' : 'Retired'}</button>)}</div>
      <label>Search loaded goals<input value={search} onChange={event => update('goalSearch', event.target.value, true)} placeholder="Goal, workflow state or ID…" /></label>
      <label>Source<select value={source} onChange={event => update('goalSource', event.target.value)}><option value="">All loaded sources</option>{sources.map(value => <option key={value} value={value}>{sourceName(value)}</option>)}</select></label>
    </>} summary={`${visible.length} shown from ${goals.length} loaded · Up to 30 goals, ordered by priority. Search and source filter this loaded set.${view === 'retired' ? ' Retired goals are set aside; this does not mean they succeeded.' : ''}`} onRefresh={read.refresh} busy={read.loading} />
    {read.error && <p role="alert" className="ag-error">{read.error} {read.data && 'Showing the previously loaded list.'}</p>}
    <div className={`ag-layout ${selected ? 'has-selection' : ''}`}>
      <section className="ag-list" ref={list} aria-label="Goals">
        <h2 data-reader-heading tabIndex={-1} className="ag-list-heading">{view === 'open' ? 'Open goals' : view === 'finished' ? 'Finished goals' : 'Retired goals'}</h2>
        {read.loading && <p role="status" className="ag-muted">{read.data ? 'Refreshing goals…' : 'Loading goals…'}</p>}
        {!read.loading && !read.error && !visible.length && <div className="ag-empty"><h3>{search || source ? 'No goals match these filters' : `No ${view} goals returned`}</h3><p>{search || source ? 'Search only covers the loaded goals. Clear these filters to see the returned list.' : 'Goals appear here when Sapiens records something to work towards. Try another view or refresh.'}</p>{(search || source) && <button className="analyse-button" onClick={() => setParams(current => { const next = new URLSearchParams(current); next.delete('goalSearch'); next.delete('goalSource'); return next; })}>Clear search and source</button>}</div>}
        {visible.map(goal => <button type="button" key={goal.id} data-record-id={goal.id} aria-pressed={selected === goal.id} className="ag-goal-row" onClick={() => { remember(goal.id); update('goal', goal.id); }}><strong>{goal.description || 'Goal description not recorded'}</strong><div className="ag-meta"><GoalState record={goal} /><span>{planSummary(goal.current_plan)}</span></div><small>Updated {recordDate(goal.updated_at)}</small></button>)}
      </section>
      {selected && <GoalReader key={`${sapienId}/${selected}`} sapienId={sapienId} goalId={selected} close={() => update('goal', null)} />}
    </div>
    {read.at && <p className="ag-muted">List refreshed {recordDate(read.at)}</p>}
  </div>;
}
