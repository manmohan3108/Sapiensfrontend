import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ChevronRight, Loader2, RefreshCw, Search } from 'lucide-react';
import { sapiensService } from '../../core/services/sapiensService';
import type { AwarenessRunDetail, AwarenessRunStep, AwarenessRunSubject, AwarenessRunsResponse, AwarenessMemoryReference } from '../../types/awarenessRunTypes';
import type { AwarenessBeat } from '../../types/sapiensTypes';
import { matchedTrace, traceObject, traceText } from '../workspace/awarenessTrace';
import { DiagnosticBadge, DiagnosticDisclosure, DiagnosticText } from './DiagnosticPrimitives';
import { AwarenessTechnicalDetails } from './AwarenessTechnicalDetails';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { absoluteTime, actionSummary, assessmentLabel, groupRunSteps, inspectionError, processingLabel, safeEvidence, stepView, subjectLabel } from './awarenessPresentation';
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

function StepRow({ step, position, inferredLoop }: { step: AwarenessRunStep; position: number; inferredLoop?: boolean }) {
  const view = stepView(step);
  const action = step.action_detail;
  const isAction = (step.kind || step.evidence?.stage) === 'action' || !!action;
  const detail = traceObject(step.evidence?.detail || step.evidence?.technical_details);
  const proposals = Array.isArray(detail.actions) ? detail.actions.map(traceObject)
    : detail.action ? [traceObject(detail.action)] : [];
  const preview = view.summary.length > 180 ? view.summary.slice(0, 180).trimEnd() + '…' : view.summary;
  const tool = [action?.server, action?.tool].filter(Boolean).join(' / ') || traceText(detail.capability);
  return <li className="awareness-flow-step">
    <details className="awareness-step-disclosure">
      <summary><span className="awareness-flow-marker" aria-hidden="true">{position}</span>
        <span className="awareness-flow-label"><span className="awareness-step-title">{view.title}</span>
          {isAction && tool && <span className="awareness-flow-tool">{tool}</span>}
          {preview && preview !== view.title && <span className="awareness-flow-preview">{preview}</span>}
          {view.when && <time dateTime={view.when} className="awareness-step-meta">{absoluteTime(view.when)}</time>}
        </span>
        <span className="awareness-flow-state"><DiagnosticBadge tone={view.tone}>{view.status}</DiagnosticBadge><ChevronRight size={16} aria-hidden="true"/></span>
      </summary>
      <div className="awareness-step-body">
        <DiagnosticText text={view.summary || 'No explanation was retained.'} limit={300}/>
        {view.response && view.response !== view.summary && <><h4>Prepared reply</h4><DiagnosticText text={view.response}/></>}
        {view.response && <p className="awareness-caption">Prepared text alone does not establish delivery.</p>}
        {view.reason && view.reason !== view.summary && view.reason !== view.response && <><h4>Recorded reason</h4><DiagnosticText text={view.reason}/></>}
        {view.consequence && ![view.summary, view.response, view.reason].includes(view.consequence) && <><h4>What followed</h4><DiagnosticText text={view.consequence}/></>}
        {traceText(detail.focus) && <><h4>Focus at this step</h4><DiagnosticText text={traceText(detail.focus)}/></>}
        {!!proposals.length && <><h4>Proposed tools</h4><p className="awareness-caption">These tools were proposed. Check the recorded action results to see what ran.</p>
          <ul>{proposals.map((item, index) => <li key={index}>{traceText(item.capability) || 'Tool not recorded'}</li>)}</ul>
          {detail.actions_truncated === true && <p className="awareness-caption">Only part of the proposed batch was retained.</p>}
        </>}
        {isAction && (action?.match_status === 'exact' ? <>
          <h4>Arguments sent to the tool</h4><SavedValue value={action.arguments}/>
          <h4>{action.result_kind === 'activity_record' ? 'Saved tool activity' : 'Returned result'}</h4><SavedValue value={action.result}/>
          {action.result_kind === 'activity_record' && <p className="awareness-caption">The exact activity record includes bounded arguments and result text; it is not the full raw tool response.</p>}
          {action.result_detail_truncated && <p className="awareness-caution">The saved result was already shortened.</p>}
          <p className="awareness-caption">{[action.server, action.tool].filter(Boolean).join(' / ')}{action.observed_at ? ' · ' + absoluteTime(action.observed_at) : ''}</p>
        </> : <p className="awareness-caption">{action?.match_status === 'ambiguous'
          ? 'Conflicting records match this activity. No arguments or result are attached.'
          : 'Exact action details are unavailable. They may not have been retained, or the backend detail update may not be deployed.'}</p>)}
        <DiagnosticDisclosure title="Technical evidence">
          <p className="awareness-caption">{step.phase ? 'Phase: ' + step.phase.replaceAll('_', ' ') + '. ' : ''}{step.round !== null ? 'Loop: ' + step.round + (inferredLoop ? ' (inferred from the older trace).' : '.') : 'No loop number recorded.'}</p>
          <SavedValue value={safeEvidence(step.evidence)}/>
        </DiagnosticDisclosure>
      </div>
    </details>
  </li>;
}

function ActionFlow({ activity, traceTruncated, noFocus }: {
  activity: AwarenessRunDetail['activity']; traceTruncated: boolean; noFocus: boolean;
}) {
  const [byLoop, setByLoop] = useState(false);
  const toggleId = useId();
  const steps = activity.steps;
  const positions = new Map(steps.map((step, index) => [step.event_index, index + 1]));
  const hasLoops = steps.some(step => step.round !== null);
  return <section className="awareness-reading-section awareness-flow" aria-label="Recorded action flow">
    <div className="awareness-flow-heading"><h3>What happened <span>{steps.length} recorded steps</span></h3>
      {hasLoops && <label className="awareness-loop-toggle" htmlFor={toggleId}>
        <input id={toggleId} type="checkbox" checked={byLoop} onChange={event => setByLoop(event.target.checked)}/>Group by loop
      </label>}
    </div>
    <p className="awareness-caption">Follow the recorded order. Select a step for its explanation and results. Connecting lines show sequence, not proof of causation.</p>
    {(activity.truncated || traceTruncated) && <p role="status" className="awareness-caution">Only part of this run was retained. Counts and steps may be incomplete.</p>}
    {byLoop && activity.rounds_inferred && <p className="awareness-caption">Older record: loop groups are inferred from saved decisions.</p>}
    {steps.length ? byLoop ? groupRunSteps(steps).map(group => <details className="awareness-loop diagnostic-disclosure" key={group.key + ':' + group.steps[0].event_index}>
      <summary>{group.label}<span>{group.steps.length} recorded steps</span></summary>
      <ol className="awareness-activity">{group.steps.map(step => <StepRow key={step.event_index} step={step} position={positions.get(step.event_index)!} inferredLoop={activity.rounds_inferred}/>)}</ol>
    </details>) : <ol className="awareness-activity">{steps.map((step, index) => <StepRow key={step.event_index} step={step} position={index + 1} inferredLoop={activity.rounds_inferred}/>)}</ol>
      : <p className="awareness-caption">{noFocus ? 'No subsequent decisions or tool actions are recorded.' : 'No step-by-step record was retained.'}</p>}
  </section>;
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
  const selection = data.focus_selection;
  const noFocus = selection?.status === 'no_focus' || run.processing_state === 'no_focus';
  const assessment = traceObject(data.assessment);
  const remaining = traceText(assessment.remaining) || run.remaining_preview;
  const reason = traceText(assessment.reason);
  const context = traceObject(data.context.curation);
  const candidates = traceObject(data.context.candidate_summary);
  const considered = Array.isArray(candidates.considered_candidates) ? candidates.considered_candidates.map(traceObject) : [];
  const selectedContext = Array.isArray(context.selected_context) ? context.selected_context.map(traceObject) : [];
  const final = traceObject(data.technical.final);
  const conclusion = traceObject(data.technical.conclusion);
  const failed = run.processing_state === 'failed';
  const hasFocusSource = !!(data.focus.content || data.focus.source_reference || data.focus.handle || data.focus.source);
  const showSourcePreview = !noFocus && !selection?.content && !!data.focus.content;
  return <>
    <div className="awareness-run-heading">
      <h3>{run.title}</h3><span>{absoluteTime(run.started_at)}</span>
      <p>{processingLabel(run.processing_state)}</p>
    </div>
    <section className="awareness-overview" aria-label="Overall summary">
      <div><h3>What prompted this</h3>
        <p className="awareness-source-name">{subjectLabel(data.trigger)}</p>
        {data.trigger.availability === 'not_applicable' ? <p className="awareness-caption">A self-directed check without an incoming trigger.</p>
          : data.trigger.availability === 'not_recorded' ? <p className="awareness-caption">The exact initiating event was not retained.</p>
          : <DiagnosticText text={data.trigger.content || 'Source text was not recorded.'} limit={180}/>}
        {data.trigger.content_truncated && <p className="awareness-caption">The saved source text is incomplete.</p>}
      </div>
      <div><h3>{noFocus ? 'No focus chosen' : showSourcePreview ? 'Selected source' : 'What Sapien focused on'}</h3>
        <DiagnosticText text={noFocus ? selection?.reason || 'The reason was not recorded.'
          : selection?.content || data.focus.content || 'The formed focus was not recorded separately. See any retained source details below.'} limit={180}/>
        {showSourcePreview && <p className="awareness-caption">This is the selected input. The formed focus was not recorded separately.</p>}
        {(showSourcePreview ? data.focus.content_truncated : selection?.content_truncated) && <p className="awareness-caption">The saved {showSourcePreview ? 'source' : 'focus'} text is incomplete.</p>}
      </div>
    </section>
    <section className="awareness-outcome" aria-label="Recorded outcome">
      <div className="awareness-step-heading"><h3>Where it stands</h3>
        <DiagnosticBadge tone={run.assessment_state === 'blocked' ? 'danger' : ['waiting', 'unresolved'].includes(run.assessment_state) ? 'warning' : 'neutral'}>
          {noFocus ? 'No focus chosen' : assessmentLabel(run.assessment_state)}
        </DiagnosticBadge>
      </div>
      {failed && <div className="awareness-failure">
        <h4>Processing stopped{traceText(final.stage) ? ' during ' + traceText(final.stage).replaceAll('_', ' ') : ''}</h4>
        <DiagnosticText text={traceText(final.reason) || 'The failure reason was not retained.'}/>
        {traceText(conclusion.summary) && <DiagnosticText text={traceText(conclusion.summary)}/>}
      </div>}
      <p className="awareness-caption">{actionSummary(run)}</p>
      {reason && <DiagnosticText text={reason} limit={260}/>}
      {(remaining || (failed && traceText(conclusion.unfinished))) && <div className="awareness-remaining"><h4>Still needed</h4>
        <DiagnosticText text={remaining || traceText(conclusion.unfinished)} limit={260}/></div>}
      <p className="awareness-caption">{noFocus
        ? 'This check ended without choosing a focus. Pending work is not thereby completed or cancelled.'
        : failed ? 'A processing failure does not establish whether the underlying work was completed.'
        : 'This is Sapien’s assessment. Finished processing and successful tools do not prove the whole task is complete.'}</p>
    </section>
    <ActionFlow activity={data.activity} traceTruncated={run.actions.trace_truncated} noFocus={noFocus}/>
    <DiagnosticDisclosure title="Original source, focus and understanding">
      <div className="awareness-origin-grid">
        <section className="awareness-reading-section"><h3>Original source</h3>
          <Subject subject={data.trigger} sources={data.source_records}/>
        </section>
        <section className="awareness-reading-section"><h3>{noFocus ? 'Why no focus was chosen' : 'Focus formed'}</h3>
          {noFocus ? <DiagnosticText text={selection?.reason || 'The specific reason was not recorded. This status alone does not prove there was nothing useful to do.'}/>
            : selection?.content ? <DiagnosticText text={selection.content} limit={300}/>
            : <p className="awareness-caption">{hasFocusSource
              ? 'The formed focus was not stored separately. Retained source details are available below.'
              : 'Neither a formed focus nor its source details were retained. This does not establish that no focus was chosen.'}</p>}
          {selection?.content_truncated && <p className="awareness-caption">The recorded focus text was shortened.</p>}
          {!noFocus && selection?.reason && <DiagnosticText text={selection.reason} limit={260}/>}
          {!noFocus && hasFocusSource && <><h4>Primary source</h4><Subject subject={data.focus} sources={data.source_records}/></>}
          {!!selection?.contributors.length && <><h4>Contributing impressions</h4><ol className="awareness-contributors">{selection.contributors.map((subject, index) => <li key={index}>
            <Subject subject={subject} sources={data.source_records}/>
          </li>)}</ol></>}
          {selection?.contributors_truncated && <p className="awareness-caution">Only part of the contributor list was retained.</p>}
          {selection?.provenance === 'legacy' && <p className="awareness-caption">Older record: contributor details and selection reasons may be incomplete.</p>}
          <DiagnosticDisclosure title="Selection identifiers"><SavedValue value={selection ? { status: selection.status, reason_code: selection.reason_code, provenance: selection.provenance } : undefined}/></DiagnosticDisclosure>
        </section>
      </div>
      <section className="awareness-reading-section"><h3>What Sapien understood</h3>
        <DiagnosticText text={data.understanding || 'The interpretation was not retained.'} limit={300}/>
        <p className="awareness-caption">The recorded interpretation, separate from the original source and formed focus.</p>
      </section>
    </DiagnosticDisclosure>
    <DiagnosticDisclosure title="What was considered before choosing a focus">
      {typeof candidates.considered_count === 'number' && <p>{candidates.considered_count} candidate impressions were supplied for selection.</p>}
      {hasOmission(candidates) && <p className="awareness-caution">Some candidate details were shortened or omitted from this response.</p>}
      {considered.length ? <ul className="awareness-context-list">{considered.map((item, index) => <li key={index}>
        <p className="awareness-caption">{[traceText(item.source), traceText(item.kind)].filter(Boolean).join(' · ') || 'Source not recorded'}</p>
        <DiagnosticText text={traceText(item.content) || (item.omitted ? 'Candidate detail omitted.' : 'Text not recorded.')} limit={240}/>
        <DiagnosticDisclosure title="Candidate identifiers and attribution"><SavedValue value={item}/></DiagnosticDisclosure>
      </li>)}</ul> : <p className="awareness-caption">The exact candidate list is unavailable in this response.</p>}
      <DiagnosticDisclosure title="Working Memory catalogue supplied to selection">
        <p className="awareness-caption">A catalogue of available memory, not proof that all its contents were read or used.</p>
        <SavedValue value={candidates.working_memory_catalog}/>
      </DiagnosticDisclosure>
    </DiagnosticDisclosure>
    <DiagnosticDisclosure title="Supporting context used after focus selection">
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
  const trigger = scoped ? params.get('awarenessTrigger') || '' : '';
  const [draftSearch, setDraftSearch] = useState(search);
  useEffect(() => setDraftSearch(search), [search]);
  const validRunId = !requestedId || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(requestedId);
  const [loaded, setLoaded] = useState<AwarenessRunsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const opener = useRef<HTMLAnchorElement | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const listId = useId();
  const data = loaded?.sapien_id === Number(sapienId) && loaded.offset === offset
    && (loaded.filters?.trigger || '') === trigger && (loaded.filters?.search || '') === search.trim() ? loaded : null;
  const categories = loaded?.trigger_categories ?? [];
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setLoading(true); setError('');
    void sapiensService.getAwarenessRuns(sapienId, offset, controller.signal, { trigger, search }).then(result => {
      if (active) setLoaded(result);
    }).catch(caught => { if (active) setError(inspectionError(caught)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [sapienId, offset, trigger, search, revision]);
  const rows = data?.items ?? [];
  const selectedId = requestedId;
  const query = (values: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    if (!scoped) for (const key of ['awarenessRun', 'awarenessOffset', 'awarenessSearch', 'awarenessTrigger']) next.delete(key);
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
    opener.current = event.currentTarget;
  };
  return <div className="awareness-reader">
    <header className="awareness-intro"><div><h2>See how Sapien responds to a situation.</h2><p>Follow what prompted a run, what it understood and what happened next.</p></div>
      <button type="button" className="analyse-button" onClick={refresh} disabled={loading}>{loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true"/> : <RefreshCw size={16} aria-hidden="true"/>}Refresh</button>
    </header>
    {!scoped && params.has('awarenessFor') && <p role="status" className="awareness-caption">The linked selection belongs to another Sapien. Showing records for the currently selected Sapien.</p>}
    {error && <div role="alert" className="awareness-error">{data ? 'Refresh failed; showing the last loaded page. ' : ''}{error} <button type="button" className="diagnostic-link" disabled={loading} onClick={() => setRevision(value => value + 1)}>Retry list</button></div>}
    <section className="awareness-runs" aria-label="Saved runs">
      <div className="awareness-table-toolbar">
          <form role="search" onSubmit={event => { event.preventDefault(); setParams(query({ awarenessSearch: draftSearch.trim() || null, awarenessOffset: '0', awarenessRun: null })); }}>
            <label className="awareness-filter" htmlFor={listId + '-search'}>Search saved run text</label>
            <div className="awareness-search"><input ref={searchInput} id={listId + '-search'} name="awarenessSearch" type="search" autoComplete="off"
              maxLength={160} value={draftSearch} onChange={event => setDraftSearch(event.target.value)} placeholder="E.g. onboarding…"/>
              <button type="submit" aria-label="Search saved runs" disabled={loading}><Search size={18} aria-hidden="true"/></button>
            </div>
          </form>
          <label className="awareness-filter">Triggered by
            <select name="awarenessTrigger" value={trigger} disabled={!categories.length}
              onChange={event => setParams(query({ awarenessTrigger: event.target.value || null, awarenessOffset: '0', awarenessRun: null }))}>
              <option value="">All sources</option>
              {trigger && !categories.some(item => item.value === trigger) && <option value={trigger}>Selected source ({trigger})</option>}
              {categories.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          {(search || trigger) && <button type="button" className="diagnostic-link" onClick={() => {
            setDraftSearch(''); setParams(query({ awarenessSearch: null, awarenessTrigger: null, awarenessOffset: '0', awarenessRun: null }));
          }}>Clear filters</button>}
      </div>
      {loaded && !categories.length && <p className="awareness-caption">Trigger filters require the backend filtering update.</p>}
      <div className="awareness-table-heading"><h3>Saved runs <span>{data ? data.total.toLocaleString() + (search || trigger ? ' matches' : ' total') : ''}</span></h3>
        <p className="awareness-caption" role="status">{loading ? 'Loading runs…' : 'Newest first · Select a row to inspect'}</p>
      </div>
      <p className="awareness-caption">Processing describes the run. Work status is Sapien’s assessment of the task.</p>
      <div className="awareness-table-wrap" aria-busy={loading}>
        <table className="awareness-table" role="table">
          <caption className="sr-only">Saved Awareness runs, newest first. Open a situation to inspect its source, decisions and actions.</caption>
          <colgroup><col className="awareness-situation-col"/><col className="awareness-trigger-col"/><col/><col/><col className="awareness-actions-col"/><col className="awareness-time-col"/></colgroup>
          <thead role="rowgroup"><tr role="row">
            <th scope="col" role="columnheader">Situation / focus</th><th scope="col" role="columnheader">Triggered by</th>
            <th scope="col" role="columnheader">Processing</th><th scope="col" role="columnheader">Work status</th>
            <th scope="col" role="columnheader">Tool actions</th><th scope="col" role="columnheader" aria-sort="descending">Started</th>
          </tr></thead>
          <tbody role="rowgroup">{rows.map(item => {
            const category = categories.find(value => value.value === item.trigger_category)?.label;
            const noFocus = item.processing_state === 'no_focus' || item.focus_selection?.status === 'no_focus';
            const preview = noFocus ? item.focus_selection?.reason || 'No focus chosen during this check.'
              : item.focus_selection?.content || item.focus.content || item.understanding_preview || '';
            const title = item.title === 'internal event' ? 'Recorded run' : item.title || 'Recorded run';
            return <tr key={item.id} role="row" data-selected={selectedId === item.id}>
              <td role="cell" className="awareness-situation-cell">
                <Link className="awareness-table-link" to={{ search: '?' + query({ awarenessRun: item.id }) }}
                  aria-haspopup="dialog" aria-current={selectedId === item.id ? 'true' : undefined} onClick={choose}>
                  <span className="awareness-run-excerpt">{title}</span><ChevronRight size={16} aria-hidden="true"/>
                </Link>
                {preview && preview !== title && <p className="awareness-caption awareness-run-preview">{preview}</p>}
              </td>
              <td role="cell" data-label="Triggered by"><span>{category || subjectLabel(item.trigger)}</span>
                {category && item.trigger.origin_relation !== 'related_subject' && item.trigger.sender?.name && <small>{item.trigger.sender.name}</small>}
              </td>
              <td role="cell" data-label="Processing"><DiagnosticBadge tone={item.processing_state === 'failed' ? 'danger' : 'neutral'}>
                {item.processing_state === 'failed' ? processingLabel(item.processing_state) : item.processing_state === 'completed' ? 'Finished' : noFocus ? 'No focus chosen' : processingLabel(item.processing_state)}
              </DiagnosticBadge></td>
              <td role="cell" data-label="Work status"><DiagnosticBadge tone={item.assessment_state === 'blocked' ? 'danger' : ['waiting', 'unresolved'].includes(item.assessment_state) ? 'warning' : 'neutral'}>
                {assessmentLabel(item.assessment_state)}
              </DiagnosticBadge></td>
              <td role="cell" data-label="Tool actions"><span>{item.actions.recorded.toLocaleString()} recorded</span>
                {!!item.actions.uncertain && <small>{item.actions.uncertain.toLocaleString()} uncertain</small>}
                {item.actions.trace_truncated && <small>Partial trace</small>}
              </td>
              <td role="cell" data-label="Started"><time dateTime={item.started_at || undefined}>{absoluteTime(item.started_at)}</time></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      {!loading && data && !rows.length && <p role="status" className="awareness-caption">{offset ? 'No records remain on this page. Return to the latest runs.'
        : search || trigger ? 'No saved runs match these filters. Try another search or clear the filters.'
        : 'No runs have been saved yet. Refresh after Sapien processes information.'}</p>}
      <div className="awareness-pagination">
        <button type="button" className="analyse-button" disabled={loading || offset === 0} onClick={() => page(Math.max(0, offset - 20))}>Newer</button>
        <button type="button" className="analyse-button" disabled={loading || !data?.has_more || data.next_offset == null} onClick={() => data?.next_offset != null && page(data.next_offset)}>Older</button>
      </div>
      <p className="awareness-caption" aria-live="polite">{data && rows.length ? 'Showing ' + (offset + 1) + '–' + (offset + rows.length) + ' of ' + data.total.toLocaleString() + (search || trigger ? ' matching runs.' : ' saved runs.') : ''}</p>
      <DiagnosticDisclosure title="Search and filter scope"><p>Filters cover all saved runs for this Sapien. Search matches literal text in retained sources, focus, decisions and assessments—not full prompts, linked memories or complete tool responses. Older or shortened records may contain less searchable text.</p>
        <p>Triggered by uses the initiating source, not the focus selected later. A self-directed check can therefore select a message as its focus. No focus chosen is a separate result, not a source.</p></DiagnosticDisclosure>
      <DiagnosticDisclosure title="About these records"><p>Saved runs, not a live queue. Times use your timezone; simulation dates can be ahead of today. Refresh returns to the latest page with your filters. New runs can shift page boundaries.</p></DiagnosticDisclosure>
    </section>
    <Dialog open={!!selectedId} onOpenChange={open => { if (!open) setParams(query({ awarenessRun: null }), { replace: true }); }}>
      <DialogContent className="awareness-reader awareness-detail-dialog" onOpenAutoFocus={event => { event.preventDefault(); detailHeading.current?.focus(); }}
        onCloseAutoFocus={event => { event.preventDefault(); if (opener.current?.isConnected) opener.current.focus(); else searchInput.current?.focus(); }}>
        <DialogTitle ref={detailHeading} tabIndex={-1} className="awareness-selected-heading">Awareness run details</DialogTitle>
        <DialogDescription className="awareness-caption">Inspect the saved source, decisions and actions. This view does not run Sapien.</DialogDescription>
        {!validRunId ? <p role="alert" className="awareness-error">The run ID in this link is invalid. Select a saved run.</p>
          : selectedId && <>{data && !rows.some(row => row.id === selectedId) && <p className="awareness-caption">The selected run is outside this result page.</p>}
            <RunReader key={sapienId + ':' + selectedId + ':' + revision} sapienId={sapienId} runId={selectedId} revision={revision}/></>}
      </DialogContent>
    </Dialog>
  </div>;
}

export function AwarenessDiagnostics({ sapienId }: { sapienId: string }) {
  // Remount all page/detail state on an identity change, including failed requests.
  return <RunBrowser key={sapienId} sapienId={sapienId}/>;
}
