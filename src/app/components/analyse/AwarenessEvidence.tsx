import { useEffect, useState } from 'react';
import type { AwarenessRunDetail, AwarenessRunSubject } from '../../types/awarenessRunTypes';
import type { AwarenessBeat } from '../../types/sapiensTypes';
import { sapiensService } from '../../core/services/sapiensService';
import { matchedTrace, traceObject, traceText } from '../workspace/awarenessTrace';
import { DiagnosticDisclosure, DiagnosticText } from './DiagnosticPrimitives';
import { AwarenessTechnicalDetails } from './AwarenessTechnicalDetails';
import { absoluteTime, deliveryAudits, inspectionError, sameReference, sourceGroups, subjectLabel } from './awarenessPresentation';

export function hasOmission(value: unknown): boolean {
  if (typeof value === 'string') return /\[shortened\]|\[truncated\]/.test(value);
  if (Array.isArray(value)) return value.some(hasOmission);
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return record.omitted === true || record._truncated === true || Object.values(record).some(hasOmission);
}

export function SavedValue({ value }: { value: unknown }) {
  if (value === undefined || value === null) return <p className="awareness-caption">Not recorded.</p>;
  // API action fields are bounded and credential-scrubbed. Render as inert text,
  // including HTML returned by a tool; do not use the legacy payload filter here.
  return <>{hasOmission(value) && <p className="awareness-caution">Only part of this value was retained or returned.</p>}
    <pre className="awareness-saved-value" tabIndex={0} aria-label="Saved value">{typeof value === 'string' ? value || '(Empty text)' : JSON.stringify(value, null, 2)}</pre></>;
}

export function Subject({ subject, sources }: { subject: AwarenessRunSubject; sources: AwarenessRunDetail['source_records'] }) {
  if (subject.availability === 'not_recorded') return <p>The exact initiating event was not saved for this older run. Any retained selected focus is shown separately.</p>;
  if (subject.availability === 'not_applicable') return <p>This run began without an incoming trigger. See the selected focus below if one was retained.</p>;
  const source = sources.find(item => sameReference(item.reference, subject.source_reference));
  return <>
    <div className="awareness-source"><strong>{subjectLabel(subject)}</strong>
      {subject.recipient?.name && subject.origin_relation !== 'related_subject' && <span>To {subject.recipient.name}</span>}
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

export function AwarenessEvidence({ data }: { data: AwarenessRunDetail }) {
  const [originalOpen, setOriginalOpen] = useState(false);
  const run = data.run;
  const selection = data.focus_selection;
  const context = traceObject(data.context.curation);
  const candidates = traceObject(data.context.candidate_summary);
  const considered = Array.isArray(candidates.considered_candidates) ? candidates.considered_candidates.map(traceObject) : [];
  const selectedContext = Array.isArray(context.selected_context) ? context.selected_context.map(traceObject) : [];
  const groups = sourceGroups(data);
  return <div className="awareness-evidence">
    <h3>Sources that shaped the focus</h3>
    <p className="awareness-caption">Original information is kept separate from Sapiens’ interpretation. One source can have several roles.</p>
    {groups.length ? <ol className="awareness-evidence-list">{groups.map((entry, index) => <li key={index}>
      <div className="awareness-source-roles">{[...new Set(entry.roles)].join(' · ')}</div>
      <Subject subject={entry.subject} sources={data.source_records}/>
    </li>)}</ol> : <p className="awareness-caption">No source records were retained for this review.</p>}
    {selection?.contributors_truncated && <p className="awareness-caution">Only part of the source list was retained.</p>}
    {selection?.provenance === 'legacy' && <p className="awareness-caption">This older record may have incomplete source and selection details.</p>}
    <DiagnosticDisclosure title="How the focus was chosen">
      <h4>Recorded focus</h4><DiagnosticText text={selection?.content || (selection?.status === 'no_focus' ? 'No focus was chosen.' : 'The formed focus was not recorded separately.')}/>
      {selection?.content_truncated && <p className="awareness-caution">The saved focus is incomplete.</p>}
      {selection?.reason && <><h4>Recorded reason</h4><DiagnosticText text={selection.reason}/></>}
      <DiagnosticDisclosure title="Selection identifiers"><SavedValue value={selection ? { status: selection.status, reason_code: selection.reason_code, provenance: selection.provenance } : undefined}/></DiagnosticDisclosure>
    </DiagnosticDisclosure>
    <DiagnosticDisclosure title="Other information considered">
      {typeof candidates.considered_count === 'number' && <p>{candidates.considered_count} pieces of information were considered when choosing a focus.</p>}
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
    <DiagnosticDisclosure title="Context used for this review">
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
      {deliveryAudits(data).map((audit, index) => <p key={index} className="awareness-caption">
        {audit.subject ? subjectLabel(audit.subject) : 'Linked message'}: latest delivery status {audit.status}.
      </p>)}
    </DiagnosticDisclosure>
    <DiagnosticDisclosure title="Technical details">
      <SavedValue value={{ run_id: run.id, title: run.title, mode: run.mode, started_at: run.started_at, completed_at: run.completed_at, understanding: data.understanding,
        round_count: data.activity.round_count, thought_link: run.thought_link, assessment: data.assessment, ...data.technical }}/>
      {run.thought_link.status === 'exact' && run.thought_link.id && <details className="diagnostic-disclosure" onToggle={event => setOriginalOpen(event.currentTarget.open)}>
        <summary>Original trace and flow graph</summary>
        <p className="awareness-caption">The existing advanced view, matched to this exact run. It may contain more retained selection diagnostics.</p>
        {originalOpen && <OriginalTrace sapienId={String(data.sapien_id)} runId={run.id} thoughtId={run.thought_link.id}/>}
      </details>}
    </DiagnosticDisclosure>
  </div>;
}
