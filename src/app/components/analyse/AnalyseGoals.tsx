import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { AnalyseControls } from './AnalyseControls';
import { sourceName, useListReaderNavigation } from '../workspace/ContextReader';
import { goalsService } from '../../core/services/goalsService';
import { useSapiensStore } from '../../core/state/sapiensStore';
import type { Plan } from '../../types/goalTypes';
import { GoalRecord, GoalState } from './GoalRecord';
import { absoluteTime } from './awarenessPresentation';
import { goalExcerpt, goalTargets, planSummary } from './goalInspectionPresentation';
import { hasSelectedRecordText } from './recordRowInteraction';
import { useRememberedState } from '../navigation/NavigationState';
import '../../../styles/analyse-goals.css';

const views = ['open', 'finished', 'retired'] as const;
type GoalView = typeof views[number];
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

function GoalRequest({ sapienId, goalId, scope, stepId, onAccepted, targets }: {
  sapienId: number; goalId: string; scope: 'goal' | 'plan' | 'step' | 'revise'; stepId?: string; onAccepted: () => void;
  targets?: ReturnType<typeof goalTargets>;
}) {
  const [open, setOpen] = useState(false);
  const draftKey = `analyse-goal-request:${sapienId}:${goalId}:${scope}:${stepId || ''}`;
  const [text, setText] = useRememberedState(`${draftKey}:text`, '');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [targetKey, setTargetKey] = useRememberedState(`${draftKey}:target`, 'goal');
  const target = targets?.find(item => item.key === targetKey);
  const targetMissing = !!targets && !target;
  const selectedScope = target?.scope || scope;
  const selectedStep = target && 'stepId' in target ? target.stepId : stepId;
  const trigger = useRef<HTMLButtonElement>(null), field = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(true), submitting = useRef(false);
  const id = useId();
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (open) field.current?.focus(); }, [open]);
  const label = scope === 'revise' ? 'Request a plan review' : targets ? 'Add information' : `Add information to this ${scope}`;
  const close = () => { if (!submitting.current) { setOpen(false); setError(''); trigger.current?.focus(); } };
  async function submit() {
    if (submitting.current || !text.trim() || targetMissing) return;
    submitting.current = true; setBusy(true); setError(''); setNotice('');
    try {
      let queued = false;
      if (scope === 'revise') await goalsService.replan(sapienId, goalId, text.trim());
      else queued = (await goalsService.comment(sapienId, goalId, { comment: text.trim(), scope: selectedScope as 'goal' | 'plan' | 'step', ...(selectedStep ? { step_id: selectedStep } : {}) }))?.queued === true;
      if (!mounted.current) return;
      setNotice(scope === 'revise' ? 'Revision request accepted for background processing. The plan has not been confirmed as changed.' : queued ? 'Information queued for background processing.' : 'Request received. Changes have not been confirmed.');
      setText(''); setOpen(false); trigger.current?.focus(); onAccepted();
    } catch (caught) { if (mounted.current) setError((caught as Error).message || 'Could not send the request. Please try again.'); }
    finally { submitting.current = false; if (mounted.current) setBusy(false); }
  }
  return <div className="ag-request">
    <button ref={trigger} type="button" className="ag-text-button" aria-expanded={open} aria-controls={id} onClick={() => { if (open) close(); else setOpen(true); }}>{label}{!open && text.trim() ? ' (draft)' : ''}</button>
    {open && <form id={id} onSubmit={event => { event.preventDefault(); void submit(); }} onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } }}>
      {targets && <><label htmlFor={`${id}-target`}>Attach information to</label><select name="informationTarget" id={`${id}-target`} value={targetKey} disabled={busy} onChange={event => setTargetKey(event.target.value)}>
        {targetMissing && <option value={targetKey}>Previous target is no longer in this plan</option>}{targets.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}
      </select>{targetMissing && <p role="status" className="ag-error">The plan changed. Choose a target before sending; your draft is kept.</p>}</>}
      <label htmlFor={`${id}-text`}>{scope === 'revise' ? 'What should Sapiens reconsider when planning?' : `What should Sapiens know about this ${selectedScope}?`}</label>
      <textarea ref={field} name="information" autoComplete="off" id={`${id}-text`} value={text} onChange={event => setText(event.target.value)} rows={3} disabled={busy} aria-describedby={`${id}-help`} />
      <p id={`${id}-help`} className="ag-muted">This sends a request for background processing; it does not directly edit the record.</p>
      {error && <p role="alert" className="ag-error">{error}</p>}
      <div className="ag-actions"><button className="analyse-button" disabled={busy || !text.trim() || targetMissing}>{busy ? 'Sending…' : scope === 'revise' ? 'Send revision request' : 'Send information'}</button><button type="button" className="ag-text-button" disabled={busy} onClick={close}>Cancel</button></div>
    </form>}
    {notice && <p role="status" className="ag-muted">{notice}</p>}
  </div>;
}

function GoalActions({ request, plan, overloaded }: { request: { sapienId: number; goalId: string; onAccepted: () => void }; plan: Plan | null; overloaded?: boolean }) {
  return <section className="ag-request-section" aria-label="Requests to Sapiens">
    {overloaded && <p className="ag-muted">Sapiens is busy. New requests may take longer to process.</p>}
    <GoalRequest {...request} scope="goal" targets={goalTargets(plan)} />
    <GoalRequest {...request} scope="revise" />
  </section>;
}

function GoalReader({ sapienId, goalId, close, previous, next }: { sapienId: number; goalId: string; close: () => void; previous?: () => void; next?: () => void }) {
  const read = useGoalRead(`${sapienId}/${goalId}`, async () => {
    const detail = await goalsService.getGoal(sapienId, goalId);
    if (detail.goal.id !== goalId || detail.goal.sapien_id !== sapienId) throw new Error('This response does not match the selected goal and Sapien. Refresh to try again.');
    return detail;
  });
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
    <nav className="ag-reader-toolbar" aria-label="Goal details navigation"><button type="button" className="ag-text-button" data-reader-back onClick={close}>Back to goals</button><div className="ag-reader-adjacent"><button className="analyse-button" disabled={!previous} onClick={previous}>Previous goal</button><button className="analyse-button" disabled={!next} onClick={next}>Next goal</button></div><button type="button" className="ag-text-button" disabled={read.loading} onClick={read.refresh}>Refresh details</button></nav>
    {read.error && <p role="alert" className="ag-error">{read.error} {read.data && 'Showing the previously loaded record.'}</p>}
    {read.loading && <p role="status" className="ag-muted">{read.data ? 'Refreshing goal…' : 'Loading goal…'}</p>}
    {read.data && <GoalRecord detail={read.data} actions={<GoalActions request={request} plan={read.data.current_plan} overloaded={overloaded} />} />}
    {read.at && <p className="ag-muted ag-refresh-time">Details refreshed {absoluteTime(read.at)} · real time</p>}
  </article>;
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
  const selectedIndex = visible.findIndex(goal => goal.id === selected);
  return <div className="analyse-goals" ref={container}>
    <div className="ag-list-controls" hidden={!!selected}>
    <p className="analyse-page-purpose">See what this Sapien is working towards, its current plans and the progress recorded so far.</p>
    <AnalyseControls primary={<>
      <div role="group" aria-label="Goal lifecycle" className="ag-views">{views.map(value => <button type="button" key={value} aria-pressed={view === value} onClick={() => update('goalView', value)}>{value === 'open' ? 'Open' : value === 'finished' ? 'Finished' : 'Retired'}</button>)}</div>
      <label>Search loaded goals<input type="search" name="goalSearch" autoComplete="off" value={search} onChange={event => update('goalSearch', event.target.value, true)} placeholder="Goal, workflow state or ID…" /></label>
      <label>Source<select name="goalSource" value={source} onChange={event => update('goalSource', event.target.value)}><option value="">All loaded sources</option>{sources.map(value => <option key={value} value={value}>{sourceName(value)}</option>)}</select></label>
    </>} summary={`${visible.length} shown from ${goals.length} loaded · Up to 30 goals, ordered by priority. Search and source filter this loaded set.${view === 'retired' ? ' Retired goals are set aside; this does not mean they succeeded.' : ''}`} onRefresh={read.refresh} busy={read.loading} />
    </div>
    {read.error && <p role="alert" className="ag-error">{read.error} {read.data && 'Showing the previously loaded list.'}</p>}
    <div className={`ag-layout ${selected ? 'has-selection' : ''}`}>
      <section className="ag-list" ref={list} aria-label="Goals">
        <h2 data-reader-heading tabIndex={-1} className="ag-list-heading">{view === 'open' ? 'Open goals' : view === 'finished' ? 'Finished goals' : 'Retired goals'}</h2>
        {read.loading && <p role="status" className="ag-muted">{read.data ? 'Refreshing goals…' : 'Loading goals…'}</p>}
        {!read.loading && !read.error && !visible.length && <div className="ag-empty"><h3>{search || source ? 'No goals match these filters' : `No ${view} goals returned`}</h3><p>{search || source ? 'Search only covers the loaded goals. Clear these filters to see the returned list.' : 'Goals appear here when Sapiens records something to work towards. Try another view or refresh.'}</p>{(search || source) && <button className="analyse-button" onClick={() => setParams(current => { const next = new URLSearchParams(current); next.delete('goalSearch'); next.delete('goalSource'); return next; })}>Clear search and source</button>}</div>}
        {visible.map(goal => <button type="button" key={goal.id} data-record-id={goal.id} aria-pressed={selected === goal.id} className="ag-goal-row" onClick={event => { if (event.detail !== 0 && hasSelectedRecordText(event.currentTarget)) return; remember(goal.id); update('goal', goal.id); }}>
          <span className="ag-row-title"><strong>{goalExcerpt(goal.description)}</strong><span className="ag-view-cue">View details<ChevronRight size={16} aria-hidden="true" /></span></span>
          <span className="ag-meta"><GoalState record={goal} /><span>{planSummary(goal.current_plan)}</span></span><small>Updated {absoluteTime(goal.updated_at)}</small>
        </button>)}
      </section>
      {selected && <GoalReader key={`${sapienId}/${selected}`} sapienId={sapienId} goalId={selected} close={() => update('goal', null)} previous={selectedIndex > 0 ? () => update('goal', visible[selectedIndex - 1].id, true) : undefined} next={selectedIndex >= 0 && selectedIndex < visible.length - 1 ? () => update('goal', visible[selectedIndex + 1].id, true) : undefined} />}
    </div>
    {!selected && read.at && <p className="ag-muted">List refreshed {absoluteTime(read.at)} · real time</p>}
  </div>;
}
