import { useEffect, useId, useMemo, useRef, useState, type MouseEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ChevronRight, Loader2, RefreshCw, Search } from 'lucide-react';
import { sapiensService } from '../../core/services/sapiensService';
import type { AwarenessRunDetail, AwarenessRunStep, AwarenessRunSubject, AwarenessRunsResponse, AwarenessMemoryReference } from '../../types/awarenessRunTypes';
import type { AwarenessBeat } from '../../types/sapiensTypes';
import { matchedTrace, traceObject, traceText } from '../workspace/awarenessTrace';
import { DiagnosticBadge, DiagnosticDisclosure, DiagnosticText } from './DiagnosticPrimitives';
import { AwarenessTechnicalDetails } from './AwarenessTechnicalDetails';
import { absoluteTime, actionSummary, assessmentLabel, inspectionError, matchesRun, processingLabel, safeEvidence, stepView, subjectLabel } from './awarenessPresentation';
import '../../../styles/awareness-reader.css';

function hasOmission(value: unknown): boolean {
  if (typeof value === 'string') return /\[shortened\]|\[truncated\]/.test(value);
  if (Array.isArray(value)) return value.some(hasOmission);
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return record.omitted === true || record._truncated === true || Object.values(record).some(hasOmission);
}

function SavedValue({ value }: { value: unknown }) {
  if (value === undefined || value === null) return <p className="awareness-caption">Not recorded.</p>;
  // API action fields are bounded and credential-scrubbed. Render as inert text,
  // including HTML returned by a tool; do not use the legacy payload filter here.
  return <>{hasOmission(value) && <p className="awareness-caution">Only part of this value was retained or returned.</p>}
    <pre className="awareness-saved-value" tabIndex={0} aria-label="Saved value">{typeof value === 'string' ? value || '(Empty text)' : JSON.stringify(value, null, 2)}</pre></>;
}

function sameReference(a?: AwarenessMemoryReference | null, b?: AwarenessMemoryReference | null) {
  return !!a && !!b && a.id === b.id && a.memory_source === b.memory_source
    && (a.container_id || '') === (b.container_id || '');
}

function Subject({ subject, sources }: { subject: AwarenessRunSubject; sources: AwarenessRunDetail['source_records'] }) {
  if (subject.availability === 'not_recorded') return <p>The exact initiating event was not saved for this older run. Any retained selected focus is shown separately.</p>;
  if (subject.availability === 'not_applicable') return <p>This run began without an incoming trigger. See the selected focus below if one was retained.</p>;
  const source = sources.find(item => sameReference(item.reference, subject.source_reference));
  return <>
    <div className="awareness-source"><strong>{subjectLabel(subject)}</strong>
      {subject.recipient?.name && <span>To {subject.recipient.name}</span>}
      {subject.event_at && <time dateTime={subject.event_at}>{absoluteTime(subject.event_at)}</time>}
    </div>
    <DiagnosticText text={subject.content || 'Event text was not recorded.'} limit={300}/>
    {subject.content_truncated && <p className="awareness-caption">This saved excerpt may be incomplete.</p>}
    {subject.origin_relation === 'related_subject' && <p className="awareness-caption">Related-source details describe earlier work, not the author of this event.</p>}
    {source && <DiagnosticDisclosure title="Open linked source record">
      <p className="awareness-caption">Current saved source, read separately from this run’s historical snapshot.</p>
      {source.availability === 'available' ? <>
        <DiagnosticText text={source.content ?? 'Source text was not recorded.'}/>
        {source.content_truncated && <p className="awareness-caution">Source text was shortened.</p>}
        <SavedValue value={source.metadata}/>
      </> : <p>The exact linked source could not be read. No substitute is shown.</p>}
    </DiagnosticDisclosure>}
    <DiagnosticDisclosure title="Source identifiers"><SavedValue value={subject}/></DiagnosticDisclosure>
  </>;
}

function StepRow({ step }: { step: AwarenessRunStep }) {
  const view = stepView(step);
  const action = step.action_detail;
  const isAction = step.evidence?.stage === 'action' || !!action;
  return <li className="awareness-activity-row">
    <details className="awareness-step-disclosure">
      <summary><ChevronRight size={16} aria-hidden="true"/><span className="awareness-step-title">{view.title}</span>
        <DiagnosticBadge tone={view.tone}>{view.status}</DiagnosticBadge>
        <span className="awareness-step-meta">{step.round !== null ? 'Round ' + step.round : 'Recorded step'}{view.when ? ' · ' + absoluteTime(view.when) : ''}</span>
      </summary>
      <div className="awareness-step-body">
        <DiagnosticText text={view.summary || 'No explanation was retained.'} limit={300}/>
        {view.response && view.response !== view.summary && <><h4>Prepared reply</h4><DiagnosticText text={view.response}/></>}
        {view.response && <p className="awareness-caption">Prepared text alone does not establish delivery.</p>}
        {view.reason && view.reason !== view.summary && view.reason !== view.response && <><h4>Recorded reason</h4><DiagnosticText text={view.reason}/></>}
        {view.consequence && ![view.summary, view.response, view.reason].includes(view.consequence) && <><h4>What followed</h4><DiagnosticText text={view.consequence}/></>}
        {isAction && (action?.match_status === 'exact' ? <>
          <h4>Arguments sent to the tool</h4><SavedValue value={action.arguments}/>
          <h4>Returned result</h4><SavedValue value={action.result}/>
          {action.result_detail_truncated && <p className="awareness-caution">The saved result was already shortened.</p>}
          <p className="awareness-caption">{[action.server, action.tool].filter(Boolean).join(' / ')}{action.observed_at ? ' · ' + absoluteTime(action.observed_at) : ''}</p>
        </> : <p className="awareness-caption">{action?.match_status === 'ambiguous'
          ? 'Conflicting records match this activity. No arguments or result are attached.'
          : 'Exact action details are unavailable. They may not have been retained, or the backend detail update may not be deployed.'}</p>)}
        <DiagnosticDisclosure title="Technical evidence"><SavedValue value={safeEvidence(step.evidence)}/></DiagnosticDisclosure>
      </div>
    </details>
  </li>;
}

function OriginalTrace({ sapienId, runId, thoughtId }: { sapienId: string; runId: string; thoughtId: string }) {
  const [beat, setBeat] = useState<AwarenessBeat | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setBeat(null); setError('');
    void sapiensService.getAwarenessBeats(sapienId, 20, thoughtId).then(result => {
      if (!active) return;
      const exact = matchedTrace(result, sapienId, thoughtId);
      if (exact?._id === runId) setBeat(exact);
      else setError('No exact original trace is available for this run.');
    }).catch(caught => { if (active) setError(inspectionError(caught, true)); });
    return () => { active = false; };
  }, [sapienId, runId, thoughtId, attempt]);
  if (error) return <p role="alert" className="awareness-error">{error} <button type="button" className="diagnostic-link" onClick={() => setAttempt(value => value + 1)}>Retry original trace</button></p>;
  return beat ? <AwarenessTechnicalDetails beat={beat}/> : <p role="status">Loading original trace…</p>;
}

function RunContent({ data }: { data: AwarenessRunDetail }) {
  const [originalOpen, setOriginalOpen] = useState(false);
  const run = data.run;
  const assessment = traceObject(data.assessment);
  const remaining = traceText(assessment.remaining) || run.remaining_preview;
  const reason = traceText(assessment.reason);
  const steps = data.activity.steps;
  const context = traceObject(data.context.curation);
  const selectedContext = Array.isArray(context.selected_context) ? context.selected_context.map(traceObject) : [];
  return <>
    <div className="awareness-run-heading">
      <h3>{run.title}</h3><span>{absoluteTime(run.started_at)}</span>
      <p>{processingLabel(run.processing_state)}</p>
    </div>
    <section className="awareness-outcome" aria-label="Recorded outcome">
      <div className="awareness-step-heading"><h3>Where it stands</h3>
        <DiagnosticBadge tone={run.assessment_state === 'blocked' ? 'danger' : ['waiting', 'unresolved'].includes(run.assessment_state) ? 'warning' : 'neutral'}>
          {assessmentLabel(run.assessment_state)}
        </DiagnosticBadge>
      </div>
      <p className="awareness-caption">{actionSummary(run)}</p>
      {reason && <DiagnosticText text={reason} limit={260}/>}
      {remaining && <div className="awareness-remaining"><h4>Still needed</h4><DiagnosticText text={remaining} limit={260}/></div>}
      <p className="awareness-caption">This is Sapien’s assessment. Finished processing and successful tools do not prove the whole task is complete.</p>
    </section>
    <div className="awareness-origin-grid">
      <section className="awareness-reading-section"><h3>What prompted the run</h3>
        <Subject subject={data.trigger} sources={data.source_records}/>
      </section>
      <section className="awareness-reading-section"><h3>What Sapien understood</h3>
        <DiagnosticText text={data.understanding || 'No separate understanding was retained.'} limit={300}/>
        <p className="awareness-caption">An interpretation, not independently verified facts.</p>
        <DiagnosticDisclosure title="What it selected to focus on">
          <Subject subject={data.focus} sources={data.source_records}/>
        </DiagnosticDisclosure>
      </section>
    </div>
    <section className="awareness-reading-section">
      <h3>Decisions and actions <span>{steps.length} saved steps</span></h3>
      <p className="awareness-caption">Open a step to see its explanation and recorded result. Steps follow saved order.</p>
      {(data.activity.truncated || run.actions.trace_truncated) && <p role="status" className="awareness-caution">Only part of this run was retained. Counts and steps may be incomplete.</p>}
      {steps.length ? <ol className="awareness-activity">{steps.map(step => <StepRow key={step.event_index} step={step}/>)}</ol>
        : <p>No step-by-step record was retained.</p>}
    </section>
    <DiagnosticDisclosure title="Context used to understand the situation">
      {hasOmission(context) && <p className="awareness-caution">Only part of the context was returned. This list may be incomplete.</p>}
      {selectedContext.length ? <ul className="awareness-context-list">{selectedContext.map((item, index) => <li key={index}>
        <p className="awareness-caption">{traceText(item.source) || 'Source not recorded'}</p>
        <DiagnosticText text={traceText(item.content) || traceText(item.summary) || (item.omitted ? 'This context item was omitted from the returned detail.' : 'Context text was not retained.')}/>
      </li>)}</ul> : <p>No selected context items are available in this response.</p>}
      <DiagnosticDisclosure title="Preparation and context diagnostics"><SavedValue value={data.context}/></DiagnosticDisclosure>
    </DiagnosticDisclosure>
    <DiagnosticDisclosure title="Reply and delivery information">
      <p className="awareness-caption">A prepared reply is separate from a confirmed send. Source delivery audits below describe their latest saved state, which can be later than this run.</p>
      <dl className="awareness-record-details">
        <div><dt>Outward reply expected</dt><dd>{run.delivery.outward_expected === true ? 'Yes' : run.delivery.outward_expected === false ? 'No' : 'Not recorded'}</dd></div>
        <div><dt>Reply text prepared</dt><dd>{run.delivery.response_present === true ? 'Yes' : run.delivery.response_present === false ? 'No' : 'Not recorded'}</dd></div>
        <div><dt>Reply satisfied through a tool</dt><dd>{run.delivery.reply_satisfied_by_tool === true ? 'Yes' : run.delivery.reply_satisfied_by_tool === false ? 'No' : 'Not recorded'}</dd></div>
        <div><dt>Confirmed tool messages</dt><dd>{run.delivery.confirmed_tool_messages ?? 'Not recorded'}</dd></div>
      </dl>
      <SavedValue value={data.delivery}/>
      {data.source_records.map(source => typeof source.metadata.reply_delivery_status === 'string' && <p key={source.reference.id} className="awareness-caption">
        Linked message {source.reference.id}: latest delivery status {source.metadata.reply_delivery_status}.
      </p>)}
    </DiagnosticDisclosure>
    <DiagnosticDisclosure title="Technical details">
      <SavedValue value={{ run_id: run.id, mode: run.mode, started_at: run.started_at, completed_at: run.completed_at,
        round_count: data.activity.round_count, thought_link: run.thought_link, assessment: data.assessment, ...data.technical }}/>
      {run.thought_link.status === 'exact' && run.thought_link.id && <details className="diagnostic-disclosure" onToggle={event => setOriginalOpen(event.currentTarget.open)}>
        <summary>Original trace and flow graph</summary>
        <p className="awareness-caption">The existing advanced view, matched to this exact run. It may contain more retained selection diagnostics.</p>
        {originalOpen && <OriginalTrace sapienId={String(data.sapien_id)} runId={run.id} thoughtId={run.thought_link.id}/>}
      </details>}
    </DiagnosticDisclosure>
  </>;
}

function RunReader({ sapienId, runId, revision }: { sapienId: string; runId: string; revision: number }) {
  const [data, setData] = useState<AwarenessRunDetail | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setData(null); setError('');
    void sapiensService.getAwarenessRun(sapienId, runId, controller.signal)
      .then(result => { if (active) setData(result); })
      .catch(caught => { if (active) setError(inspectionError(caught, true)); });
    return () => { active = false; controller.abort(); };
  }, [sapienId, runId, revision, attempt]);
  if (error) return <div role="alert" className="awareness-error">{error} <button type="button" className="diagnostic-link" onClick={() => setAttempt(value => value + 1)}>Retry details</button></div>;
  if (!data) return <p role="status" className="awareness-empty">Loading the selected run…</p>;
  return <RunContent data={data}/>;
}

function RunBrowser({ sapienId }: { sapienId: string }) {
  const [params, setParams] = useSearchParams();
  const scoped = params.get('awarenessFor') === sapienId;
  const parsedOffset = scoped ? Number(params.get('awarenessOffset') || 0) : 0;
  const offset = Number.isSafeInteger(parsedOffset) && parsedOffset >= 0 && parsedOffset <= 2147483647 ? parsedOffset : 0;
  const requestedId = scoped ? params.get('awarenessRun') || '' : '';
  const search = scoped ? params.get('awarenessSearch') || '' : '';
  const validRunId = !requestedId || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(requestedId);
  const [loaded, setLoaded] = useState<AwarenessRunsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const listId = useId();
  const data = loaded?.sapien_id === Number(sapienId) && loaded.offset === offset ? loaded : null;
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true); setError('');
    void sapiensService.getAwarenessRuns(sapienId, offset, controller.signal).then(result => {
      if (active) setLoaded(result);
    }).catch(caught => { if (active) setError(inspectionError(caught)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [sapienId, offset, revision]);
  const rows = data?.items ?? [];
  const selectedId = requestedId || rows[0]?.id || '';
  const filtered = useMemo(() => rows.filter(row => matchesRun(row, search)), [rows, search]);
  const query = (values: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    if (!scoped) for (const key of ['awarenessRun', 'awarenessOffset', 'awarenessSearch']) next.delete(key);
    next.set('awarenessFor', sapienId);
    for (const [key, value] of Object.entries(values)) value === null ? next.delete(key) : next.set(key, value);
    return next;
  };
  const page = (nextOffset: number) => setParams(query({ awarenessOffset: String(nextOffset), awarenessRun: null }));
  const refresh = () => {
    setParams(query({ awarenessOffset: '0', awarenessRun: selectedId || null }), { replace: true });
    setRevision(value => value + 1);
  };
  const choose = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    setPickerOpen(false);
    if (window.matchMedia('(max-width: 900px)').matches) requestAnimationFrame(() => heading.current?.focus());
  };
  return <div className="awareness-reader">
    <header className="awareness-intro"><div><h2>See how Sapien responds to a situation.</h2><p>Follow what prompted a run, what it understood and what happened next.</p></div>
      <button type="button" className="analyse-button" onClick={refresh} disabled={loading}>{loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true"/> : <RefreshCw size={16} aria-hidden="true"/>}Refresh</button>
    </header>
    {!scoped && params.has('awarenessFor') && <p role="status" className="awareness-caption">The linked selection belongs to another Sapien. Showing records for the currently selected Sapien.</p>}
    {error && <div role="alert" className="awareness-error">{data ? 'Refresh failed; showing the last loaded page. ' : ''}{error} <button type="button" className="diagnostic-link" disabled={loading} onClick={() => setRevision(value => value + 1)}>Retry list</button></div>}
    <div className="awareness-reader-layout">
      <aside className="awareness-run-picker" aria-label="Saved runs">
        <button type="button" className="awareness-mobile-picker" aria-expanded={pickerOpen} aria-controls={listId} onClick={() => setPickerOpen(value => !value)}>
          <span>{pickerOpen ? 'Close run list' : 'Choose a run'}</span><small>{data ? data.total.toLocaleString() + ' saved runs' : 'Saved Awareness runs'}</small>
        </button>
        <div id={listId} className="awareness-run-list-body" data-open={pickerOpen}>
          <div className="awareness-list-heading"><h3>Saved runs</h3><span>{data ? data.total.toLocaleString() + ' total' : ''}</span></div>
          <label className="awareness-search"><Search size={16} aria-hidden="true"/><input name="awarenessSearch" aria-label="Search this page of runs" autoComplete="off" value={search}
            onChange={event => setParams(query({ awarenessSearch: event.target.value || null, awarenessRun: selectedId || null }), { replace: true })} placeholder="Search this page…"/></label>
          {search && <button type="button" className="diagnostic-link" onClick={() => setParams(query({ awarenessSearch: null }), { replace: true })}>Clear search</button>}
          {loading && <p role="status" className="awareness-caption">Loading runs…</p>}
          <nav className="awareness-run-list" aria-label="Choose a saved run">{filtered.map(item => <Link key={item.id}
            to={{ search: '?' + query({ awarenessRun: item.id }) }} aria-current={selectedId === item.id ? 'true' : undefined} onClick={choose}>
            <span className="awareness-run-excerpt">{item.title}</span>
            <span className="awareness-caption awareness-run-preview">{item.focus.content || item.understanding_preview || 'No subject text retained'}</span>
            <span className="awareness-run-meta"><DiagnosticBadge>{assessmentLabel(item.assessment_state)}</DiagnosticBadge>
              {item.processing_state !== 'completed' && <span className="awareness-caption">{processingLabel(item.processing_state)}</span>}</span>
            <time className="awareness-caption" dateTime={item.started_at || undefined}>{absoluteTime(item.started_at)}</time>
          </Link>)}</nav>
          {!loading && data && !rows.length && <p role="status" className="awareness-caption">{offset ? 'No records remain on this page. Return to the latest runs.' : 'No runs have been saved yet. Refresh after Sapien processes information.'}</p>}
          {!loading && !!rows.length && !filtered.length && <p role="status" className="awareness-caption">No matches on this page. Clear the search or browse another page.</p>}
          <div className="awareness-pagination">
            <button type="button" className="analyse-button" disabled={loading || offset === 0} onClick={() => page(Math.max(0, offset - 20))}>Newer</button>
            <button type="button" className="analyse-button" disabled={loading || !data?.has_more || data.next_offset == null} onClick={() => data?.next_offset != null && page(data.next_offset)}>Older</button>
          </div>
          <p className="awareness-caption" aria-live="polite">{data && rows.length ? 'Showing ' + (offset + 1) + '–' + (offset + rows.length) + ' of ' + data.total.toLocaleString() + '.' : ''} Search covers this page only.</p>
          <DiagnosticDisclosure title="About these records"><p>Saved runs, not a live queue. Times use your timezone; simulation dates can be ahead of today. Refresh returns to the latest page. New runs can shift page boundaries.</p></DiagnosticDisclosure>
        </div>
      </aside>
      <article className="awareness-run-reader" aria-label="Selected run">
        <h2 ref={heading} tabIndex={-1} className="awareness-selected-heading">Selected run</h2>
        {!validRunId ? <p role="alert" className="awareness-error">The run ID in this link is invalid. Select a saved run.</p>
          : selectedId ? <><p className="awareness-caption">{data && !rows.some(row => row.id === selectedId) ? 'The selected run is outside this page.' : search && !filtered.some(row => row.id === selectedId) ? 'The selected run is outside these search results.' : ''}</p>
            <RunReader key={sapienId + ':' + selectedId + ':' + revision} sapienId={sapienId} runId={selectedId} revision={revision}/></>
            : <p className="awareness-empty">{loading ? 'Loading saved runs…' : error ? 'Use Retry list to load saved runs.' : 'Select a run to inspect its recorded decisions and actions.'}</p>}
      </article>
    </div>
  </div>;
}

export function AwarenessDiagnostics({ sapienId }: { sapienId: string }) {
  // Remount all page/detail state on an identity change, including failed requests.
  return <RunBrowser key={sapienId} sapienId={sapienId}/>;
}
