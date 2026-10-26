import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { sapiensService } from '../../core/services/sapiensService';
import type { AwarenessBeat, AwarenessBeatsResponse, AwarenessHistoryItem, AwarenessResponse } from '../../types/sapiensTypes';
import type { ApiError } from '../../types/apiTypes';
import { matchedTrace, traceContext, traceObject, traceText } from '../workspace/awarenessTrace';
import { DiagnosticBadge, DiagnosticDisclosure, DiagnosticText } from './DiagnosticPrimitives';
import { AwarenessTechnicalDetails } from './AwarenessTechnicalDetails';
import { absoluteTime, assessmentLabel, matchesRun, runSteps, runTitle, safeEvidence, eventEvidence, type RunStep } from './awarenessPresentation';
import '../../../styles/awareness-reader.css';

function StepRow({ step, prefix }: { step: RunStep; prefix: string }) {
  const tone = /failure|fail|error|not approved/.test(step.status) ? 'danger' : /uncertain/.test(step.status) ? 'warning' : step.status === 'Tool reported success' ? 'success' : 'neutral';
  const texts = [step.summary, step.response, step.reason, step.event?.consequence ?? ''].filter(Boolean);
  const unique = [...new Set(texts)];
  return <li className="awareness-activity-row" id={`${prefix}-${step.id}`} tabIndex={-1}>
    <div className="awareness-step-heading"><strong>{step.title}</strong><DiagnosticBadge tone={tone}>{step.status}</DiagnosticBadge></div>
    <p className="awareness-caption">{step.kind === 'action' ? 'Action record' : step.kind === 'decision' ? 'Decision' : step.kind === 'review' ? 'Review' : 'Recorded step'}{step.round !== null ? ` · Round ${step.round}` : ''}{step.event?.occurred_at || step.event?.at ? ` · ${absoluteTime(step.event.occurred_at || step.event.at)}` : ''}</p>
    {unique.length ? unique.map((text, index) => <div key={index} className="awareness-step-text">{text === step.response && <p className="awareness-caption">Prepared reply · delivery is not established by this text</p>}{text === step.reason && text !== step.summary && <p className="awareness-caption">Recorded reason</p>}<DiagnosticText text={text} limit={300}/></div>) : <p className="awareness-caption">No explanation or result text was saved for this step.</p>}
    {step.event && <DiagnosticDisclosure title="Inspect saved evidence"><pre>{JSON.stringify(eventEvidence(step.event), null, 2)}</pre></DiagnosticDisclosure>}
  </li>;
}

function ActivityHistory({ beat, prefix }: { beat: AwarenessBeat; prefix: string }) {
  const steps = useMemo(() => runSteps(beat), [beat]);
  const important = steps.filter(step => step.important);
  const shown = important.length ? important : steps;
  const context = traceContext(beat);
  const incomplete = beat.events_truncated || beat.run_flow?.truncated;
  return <>
    {incomplete && <p role="status" className="awareness-caution">Only part of this run was saved. Missing steps may change the picture.</p>}
    <p className="awareness-caption">Decisions describe intended next moves. Action records show what was attempted and what the tool reported.</p>
    {shown.length ? <ol className="awareness-activity">{shown.map(step => <StepRow key={step.id} step={step} prefix={prefix}/>)}</ol> : <p>No individual decisions or actions were saved for this run.</p>}
    <DiagnosticDisclosure title={`Context used · ${context.length} saved ${context.length === 1 ? 'item' : 'items'}`}>
      <p className="awareness-caption">These items were selected to help interpret the situation. The saved list may not include information used later.</p>
      {context.length ? <ul className="awareness-context-list">{context.map((entry, index) => <li key={index}><p className="awareness-caption">Source: {entry.source || 'Not recorded'}</p><DiagnosticText text={entry.content || 'Content not retained'}/></li>)}</ul> : <p>No selected context was saved.</p>}
    </DiagnosticDisclosure>
    <DiagnosticDisclosure title={`Full decision trace · ${steps.length} saved ${steps.length === 1 ? 'step' : 'steps'}`}>
      <p className="awareness-caption">Each round records another choice about what to do next. Steps follow saved event order; order alone does not prove cause.</p>
      <ol className="awareness-full-trace">{steps.map((step, index) => shown.includes(step) ? <li key={step.id}><span>{index + 1}. {step.title}</span><a href={`#${prefix}-${step.id}`}>View above</a>{step.round !== null && <small>Round {step.round}</small>}</li> : <StepRow key={step.id} step={step} prefix={prefix}/>)}</ol>
      {!steps.length && <p>No step-by-step record was retained.</p>}
    </DiagnosticDisclosure>
  </>;
}

function RunReader({ item, sapienId, revision }: { item: AwarenessHistoryItem; sapienId: string; revision: number }) {
  const [trace, setTrace] = useState<AwarenessBeatsResponse | null>(null);
  const [traceError, setTraceError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const prefix = useId().replaceAll(':', '');
  useEffect(() => {
    let active = true;
    setTrace(null); setTraceError('');
    void sapiensService.getAwarenessBeats(sapienId, 20, item.id).then(result => { if (active) setTrace(result); }).catch(error => {
      if (active) setTraceError((error as ApiError).status === 403 ? 'An administrator account is needed to inspect these steps.' : 'Couldn’t load this run’s steps. The saved input and understanding are still available.');
    });
    return () => { active = false; };
  }, [sapienId, item.id, revision, attempt]);
  const beat = trace ? matchedTrace(trace, sapienId, item.id) : null;
  const focus = beat ? traceText(traceObject(beat.focus_formation).content) || traceText(traceObject(beat.winner).content) || traceText(beat.winner) : '';
  const assessment = beat?.assessment;
  const state = item.state || assessment?.state;
  const remaining = item.remaining || assessment?.remaining;
  const reason = item.reason || assessment?.reason;
  const processing = beat ? traceText(traceObject(beat.final).status) : '';
  const understanding = item.understanding || assessment?.understanding;
  return <>
    <section className="awareness-reading-section" aria-labelledby={`${prefix}-input`}>
      <h3 id={`${prefix}-input`}><span>01</span>What started this</h3>
      <p className="awareness-caption">{beat?.mode === 'autonomous' ? 'Sapiens selected its own focus.' : beat?.mode === 'reactive' ? 'Sapiens responded to an incoming event.' : 'The input or focus saved with this record.'}</p>
      <DiagnosticText text={item.subject?.content || focus || item.focus || 'The original input was not saved.'}/>
      <div className="awareness-source"><span>Source: {item.subject?.source || beat?.trigger_source || 'Not recorded'}</span><span>{absoluteTime(item.subject?.event_at || beat?.started_at)}</span></div>
      {item.subject && <p className="awareness-caption">Sender and conversation details were not included in this record.</p>}
    </section>
    <section className="awareness-reading-section" aria-labelledby={`${prefix}-understanding`}>
      <h3 id={`${prefix}-understanding`}><span>02</span>What Sapiens understood</h3>
      <DiagnosticText text={understanding || 'No separate interpretation was saved. The selected focus is shown above.'}/>
      <p className="awareness-caption">This is Sapiens’ interpretation, not independent verification.</p>
    </section>
    <section className="awareness-reading-section" aria-labelledby={`${prefix}-activity`}>
      <h3 id={`${prefix}-activity`}><span>03</span>What it did</h3>
      {traceError ? <p role="alert" className="awareness-error">{traceError} <button type="button" className="diagnostic-link" onClick={() => setAttempt(value => value + 1)}>Retry steps</button></p>
        : !trace ? <p role="status" className="awareness-caption">Loading the matching decisions and actions…</p>
        : !beat ? <p className="awareness-caption">{trace.match_status === 'ambiguous' ? 'More than one run matches this record, so no step-by-step record is shown.' : 'No exact matching trace is available for this Sapien and record. Unrelated steps are not shown.'}</p>
        : <ActivityHistory beat={beat} prefix={prefix}/>}
    </section>
    <section className="awareness-reading-section" aria-labelledby={`${prefix}-assessment`}>
      <h3 id={`${prefix}-assessment`}><span>04</span>Where it stands</h3>
      <div className="awareness-step-heading"><DiagnosticBadge tone={state === 'blocked' ? 'danger' : ['waiting', 'unresolved'].includes(state ?? '') ? 'warning' : 'neutral'}>{assessmentLabel(state)}</DiagnosticBadge><span className="awareness-caption">Sapiens’ own assessment</span></div>
      {remaining && <div className="awareness-step-text"><h4>Still needed</h4><DiagnosticText text={remaining}/></div>}
      {reason && reason !== remaining && reason !== understanding && <div className="awareness-step-text"><h4>Recorded reason</h4><DiagnosticText text={reason}/></div>}
      {!remaining && !reason && <p className="awareness-caption">No additional assessment detail was saved.</p>}
      <p className="awareness-caption">Run processing: {processing ? processing.replaceAll('_', ' ') : 'Status not recorded'}. A finished run or successful tool call does not establish that the overall task is complete.</p>
      {beat?.delivery && <DiagnosticDisclosure title="Recorded delivery information"><p className="awareness-caption">Delivery information is separate from a prepared reply. Only the fields retained by the system are shown.</p><pre>{JSON.stringify(safeEvidence(beat.delivery), null, 2)}</pre></DiagnosticDisclosure>}
    </section>
    <DiagnosticDisclosure title="Technical details">
      <dl className="awareness-record-details"><div><dt>Record ID</dt><dd>{item.id}</dd></div><div><dt>Assessment source</dt><dd>{item.source || 'Not recorded'}</dd></div><div><dt>Assessment time</dt><dd>{absoluteTime(item.assessed_at)}</dd></div><div><dt>Created time</dt><dd>{absoluteTime(item.created_at)}</dd></div>{typeof item.confidence === 'number' && <div><dt>Reported confidence · not measured accuracy</dt><dd>{Math.round(item.confidence * 100)}%</dd></div>}</dl>
      {beat && <AwarenessTechnicalDetails beat={beat}/>}
    </DiagnosticDisclosure>
  </>;
}

export function AwarenessDiagnostics({ sapienId }: { sapienId: string }) {
  const requestVersion = useRef(0);
  const [loaded, setLoaded] = useState<{ sapienId: string; value: AwarenessResponse } | null>(null);
  const data = loaded?.sapienId === sapienId ? loaded.value : null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const listId = useId();
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setError('');
    try {
      const result = await sapiensService.getAwareness(sapienId, 20);
      if (version === requestVersion.current) { setLoaded({ sapienId, value: result }); setRevision(value => value + 1); }
    } catch (caught) {
      if (version === requestVersion.current) setError((caught as ApiError).message || 'Could not load saved understanding.');
    } finally { if (version === requestVersion.current) setLoading(false); }
  }, [sapienId]);
  useEffect(() => {
    setLoaded(null); setSelectedId(null); setSearch(''); setPickerOpen(false);
    void refresh();
    return () => { requestVersion.current += 1; };
  }, [refresh]);
  const history = useMemo(() => {
    const items = data?.history ?? [];
    return data?.current ? [data.current, ...items.filter(item => item.id !== data.current?.id)] : items;
  }, [data]);
  const selected = history.find(item => item.id === selectedId) ?? history[0];
  const filtered = useMemo(() => history.filter(item => matchesRun(item, search)), [history, search]);
  const choose = (id: string) => {
    setSelectedId(id); setPickerOpen(false);
    if (window.matchMedia('(max-width: 900px)').matches) requestAnimationFrame(() => detailHeading.current?.focus());
  };
  return <div className="awareness-reader">
    <header className="awareness-intro"><div><h2>See how Sapiens responds to a situation.</h2><p>Each run records Sapiens handling an input or choosing its own focus. Select a run to inspect its understanding, decisions and recorded results.</p></div><button type="button" className="analyse-button" onClick={() => void refresh()} disabled={loading}>{loading ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>}Refresh</button></header>
    {error && <div role="alert" className="awareness-error">{data ? 'Couldn’t refresh. You are viewing the last loaded records. ' : ''}{error} <button type="button" className="diagnostic-link" disabled={loading} onClick={() => void refresh()}>Retry</button></div>}
    {loading && !data ? <p role="status" className="awareness-empty">Loading saved runs…</p> : !data ? <p className="awareness-empty">Records could not be loaded. Use Retry to try again.</p> : !history.length ? <p className="awareness-empty">No runs have been saved yet. Return after Sapiens processes information, then use Refresh to check for records.</p> : <div className="awareness-reader-layout">
      <aside className="awareness-run-picker" aria-label="Recent runs">
        <button type="button" className="awareness-mobile-picker" aria-expanded={pickerOpen} aria-controls={listId} onClick={() => setPickerOpen(!pickerOpen)}><span>{pickerOpen ? 'Close run picker' : 'Choose a run'} · {history.length} records</span><small>{selected && runTitle(selected)}</small></button>
        <div id={listId} className="awareness-run-list-body" data-open={pickerOpen}>
          <div className="awareness-list-heading"><h3>Recent runs</h3><span>{history.length} loaded</span></div>
          <label className="awareness-search"><Search size={16} aria-hidden="true"/><input aria-label="Search recent runs" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search input, source or status"/></label>
          {search && <button type="button" className="diagnostic-link" onClick={() => setSearch('')}>Clear search</button>}
          <nav className="awareness-run-list" aria-label="Choose a saved run">{filtered.map(item => <button type="button" key={item.id} aria-current={selected?.id === item.id ? 'true' : undefined} onClick={() => choose(item.id)}>
            <span className="awareness-run-excerpt">{runTitle(item)}</span><span className="awareness-run-meta"><span className="awareness-caption">{item.subject?.source || 'Source not recorded'}</span><DiagnosticBadge>{assessmentLabel(item.state)}</DiagnosticBadge></span><time className="awareness-caption">{absoluteTime(item.assessed_at || item.created_at)}</time>
          </button>)}</nav>
          {!filtered.length && <p role="status" className="awareness-caption">No runs match this search. Clear it to see the loaded records.</p>}
          <DiagnosticDisclosure title="About these records"><p>Up to 20 recent records. Times use your timezone; simulation dates may be ahead of today. Saved text and traces may be incomplete.</p></DiagnosticDisclosure>
        </div>
      </aside>
      <article className="awareness-run-reader" aria-label="Selected run">
        <h2 ref={detailHeading} tabIndex={-1} className="awareness-selected-heading">Selected run <span>{absoluteTime(selected?.assessed_at || selected?.created_at)}</span></h2>
        {search && selected && !filtered.some(item => item.id === selected.id) && <p className="awareness-caption">The open run is outside your search results.</p>}
        {selected && <RunReader key={`${sapienId}:${selected.id}:${revision}`} item={selected} sapienId={sapienId} revision={revision}/>}
      </article>
    </div>}
  </div>;
}
