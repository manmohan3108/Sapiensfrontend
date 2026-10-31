import { useEffect, useId, useRef, useState } from 'react';
import type { FeedbackFinding, FeedbackReference } from '../../types/feedbackTypes';
import { DiagnosticBadge, DiagnosticDisclosure, DiagnosticText } from './DiagnosticPrimitives';
import { feedbackLabels, feedbackMode, feedbackTime } from './feedbackPresentation';
import { additionalEvidence, changedRequestFields, eventEvidence, evidenceNames, feedbackNodePreview, type EvidenceField } from './feedbackEvidence';

export function FeedbackStateBadge({ state }: { state: FeedbackFinding['state'] }) {
  return <DiagnosticBadge tone={state === 'ambiguous' ? 'warning' : 'neutral'}>{feedbackLabels[state] || state}</DiagnosticBadge>;
}

function SavedValue({ value }: { value: unknown }) {
  return <pre tabIndex={0}>{typeof value === 'string' ? value : JSON.stringify(value, null, 2) ?? 'Not recorded'}</pre>;
}

function FieldList({ fields }: { fields: EvidenceField[] }) {
  return <dl className="feedback-facts">{fields.map(field => <div className="feedback-fact-row" key={field.key}>
    <dt>{field.label}</dt><dd><DiagnosticText text={field.value} limit={220} /></dd>
  </div>)}</dl>;
}

function ToolResult({ event }: { event: ReturnType<typeof eventEvidence> }) {
  const items = event.resultItems;
  return <div className="feedback-tool-result">
    <h5>What the tool returned</h5>
    {event.error ? <div className="feedback-tool-error"><DiagnosticText text={event.error} limit={400} /></div>
      : event.resultText ? <DiagnosticText text={event.resultText} limit={500} />
      : items ? <>
        <p className="feedback-help">{items.length} {items.length === 1 ? 'entry' : 'entries'} in the saved result.</p>
        <ol className="feedback-result-items">{items.slice(0, 3).map((item, index) => <li key={index}>
          {item.author && <p className="feedback-result-author">{item.author}</p>}
          {item.text ? <DiagnosticText text={item.text} /> : item.fields.length ? <FieldList fields={item.fields} /> : <p className="feedback-help">Entry {index + 1}: fields are available in the original record.</p>}
        </li>)}</ol>
        {items.length > 3 && <DiagnosticDisclosure title={`Show remaining ${items.length - 3} saved entries`}>
          <ol className="feedback-result-items" start={4}>{items.slice(3).map((item, index) => <li key={index}>
            {item.author && <p className="feedback-result-author">{item.author}</p>}
            {item.text ? <DiagnosticText text={item.text} /> : item.fields.length ? <FieldList fields={item.fields} /> : <p className="feedback-help">Fields are available in the original record.</p>}
          </li>)}</ol>
        </DiagnosticDisclosure>}
      </> : event.resultFields.length ? <FieldList fields={event.resultFields} />
      : <p className="feedback-help">No readable result details were supplied. The original record is available below.</p>}
  </div>;
}

export function FeedbackReferenceView({ label, value, names = new Map<string, string>() }: {
  label: string; value: FeedbackReference; names?: Map<string, string>;
}) {
  const details = value?.details;
  const event = eventEvidence(value, names);
  return <section className="feedback-evidence" data-kind={event.kind}>
    <p className="feedback-event-position">{label}</p>
    <h4>{feedbackNodePreview(value, names).title}</h4>
    <div className="feedback-event-meta">
      {event.actor && <span>{event.actor}{event.recipient ? ` → ${event.recipient}` : ''}</span>}
      {!event.actor && event.recipient && <span>To {event.recipient}</span>}
      <span>{feedbackTime(value?.occurred_at, true)}</span>
    </div>
    {event.tool && <p className="feedback-outcome"><DiagnosticBadge tone={event.tool.outcome === 'Failed' ? 'danger' : event.tool.outcome === 'Uncertain' ? 'warning' : 'neutral'}>Tool reported: {event.tool.outcome || 'result not recorded'}</DiagnosticBadge></p>}
    {event.state && <p className="feedback-outcome">Recorded state: <strong>{event.state}</strong></p>}
    {details?.available ? <>
      {event.body && <div className={event.kind === 'message' ? 'feedback-message' : 'feedback-event-text'}>
        <DiagnosticText text={event.body} limit={550} />
      </div>}
      {event.tool && event.kind !== 'message' && event.fields.length > 0 && <div className="feedback-request">
        <h5>What Sapiens requested</h5><FieldList fields={event.fields} />
      </div>}
      {event.tool && event.kind !== 'message' && <ToolResult event={event} />}
      {!event.body && !event.tool && <p className="feedback-help">No event text was saved.</p>}
      {event.kind === 'message' && event.tool?.outcome === 'Failed' && <ToolResult event={event} />}
      {event.kind === 'message' && event.tool && !event.body && <p className="feedback-help">The message text was not supplied. Check the original record below.</p>}
      {(details.truncated || details.metadata?._truncated === true) && <p className="feedback-note">Only part of the original record was saved or supplied here.</p>}
    </> : <p className="feedback-help">The original event could not be loaded. Its reference is kept below.</p>}
    <DiagnosticDisclosure title="Original record">
      <dl className="feedback-facts">
        <dt>Reference ID</dt><dd><code>{value?.id || 'Not recorded'}</code></dd>
        <dt>Source type</dt><dd>{value?.source || 'Not recorded'}</dd>
        {event.tool && <><dt>Tool operation</dt><dd>{event.tool.server} · {event.tool.tool || 'Not recorded'}</dd></>}
        <dt>Event time</dt><dd>{feedbackTime(value?.occurred_at, true)}</dd>
        {details?.available && <><dt>Observed at</dt><dd>{feedbackTime(details.observed_at, true)}</dd></>}
      </dl>
      {details?.available && <><h5>Saved event text</h5><SavedValue value={details.content} /><h5>Saved metadata</h5><SavedValue value={details.metadata} /></>}
    </DiagnosticDisclosure>
  </section>;
}

export function FeedbackFindingDetail({ finding, mode }: { finding: FeedbackFinding; mode?: string }) {
  const id = useId();
  const [selected, setSelected] = useState<number | null>(null);
  const detailPanel = useRef<HTMLElement | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const names = evidenceNames([finding.activity, finding.experience, ...(finding.supporting_experiences || [])]);
  const changes = changedRequestFields(finding, names);
  const extra = additionalEvidence(finding);
  const sources = [finding.activity, finding.experience, ...extra.references];
  const previews = sources.map(reference => feedbackNodePreview(reference, names));
  const sourceRole = (index: number) => index === 0 ? 'Activity under review' : index === 1 ? 'Compared record' : 'Supporting record';
  const closeDetails = () => {
    setSelected(null);
    opener.current?.focus({ preventScroll: true });
    opener.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  };
  const inspect = (index: number, button: HTMLButtonElement) => {
    if (selected === index) { closeDetails(); return; }
    opener.current = button;
    setSelected(index);
  };
  useEffect(() => {
    if (selected === null) return;
    detailPanel.current?.focus({ preventScroll: true });
    detailPanel.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }, [selected]);

  return <article className="feedback-finding">
    <section className="feedback-events" aria-labelledby={`${id}-graph-title`}>
      <h3 id={`${id}-graph-title`}>Evidence behind this finding</h3>
      <p className="feedback-help">Read the saved evidence alongside Sapiens’ interpretation.</p>
      <div className="feedback-merge-graph">
        <div className="feedback-graph-summary">
          <section className="feedback-graph-conclusion" aria-labelledby={`${id}-conclusion`}>
            <div className="feedback-conclusion-heading"><h3 id={`${id}-conclusion`}>What Sapiens concluded</h3>
              {finding.state === 'interpreted' ? <DiagnosticBadge>Interpretation recorded</DiagnosticBadge> : <FeedbackStateBadge state={finding.state} />}
            </div>
            {finding.state === 'ambiguous' && <p className="feedback-help">Sapiens could not clearly determine how these records are related.</p>}
            {finding.state === 'unrelated' && <p className="feedback-help">Sapiens did not find a useful connection between these records.</p>}
            {finding.state === 'superseded' && <p className="feedback-help">A newer finding replaced this interpretation. This record is kept for reference.</p>}
            <p className="feedback-node-excerpt">{finding.meaning || 'No conclusion was recorded.'}</p>
            <p className="feedback-mode-note">{mode === 'observe'
              ? <><strong>Saved for review — not applied.</strong> Observe mode does not apply these findings to Sapiens’ behavior.</>
              : feedbackMode(mode)}</p>
          </section>
          {!!changes.length && <section className="feedback-request-changes" aria-labelledby={`${id}-changes`}>
            <h3 id={`${id}-changes`}>What changed in the request</h3>
            <p className="feedback-help">Same tool, two saved requests. These differences alone do not prove what caused the result.</p>
            <dl className="feedback-change-list">{changes.map((change, index) => <div key={index}>
              <dt>{change.label}</dt><dd>
                <span><small>Activity request</small>{change.earlier}</span>
                <span className="feedback-change-arrow" aria-hidden="true">→</span>
                <span><small>Compared request</small>{change.later}</span>
              </dd>
            </div>)}</dl>
          </section>}
        </div>
        <div className="feedback-graph-sources">
          {previews.map((preview, index) => <section key={index} className="feedback-graph-node" data-selected={selected === index} aria-labelledby={`${id}-source-${index}`}>
            <p className="feedback-node-role">{sourceRole(index)}</p>
            <h4 id={`${id}-source-${index}`}>{preview.title}</h4>
            {(preview.service || preview.context) && <p className="feedback-node-context">{[preview.service, preview.context].filter(Boolean).join(' · ')}</p>}
            {preview.issueStatus && <p className="feedback-node-fact">Jira status: <strong>{preview.issueStatus}</strong></p>}
            {preview.caption && !['Saved result', 'Saved message', 'Issue description'].includes(preview.caption) && <p className="feedback-node-caption">{preview.caption}</p>}
            {preview.excerpt && <p className="feedback-node-excerpt">{preview.excerpt}</p>}
            {preview.entries && <ol className="feedback-graph-entries" aria-label="Entries in the saved result">{preview.entries.map((item, itemIndex) => <li key={itemIndex}>
              {item.author && <p className="feedback-result-author">{item.author}</p>}
              <p className="feedback-node-excerpt">{item.text || item.fields.map(field => `${field.label}: ${field.value}`).join('\n') || 'No readable text was supplied for this entry.'}</p>
            </li>)}</ol>}
            <div className="feedback-node-status">{preview.status && <DiagnosticBadge tone={preview.tone}>{preview.status}</DiagnosticBadge>}
              {preview.partial && <span className="feedback-note">Partial saved record</span>}</div>
            <footer className="feedback-node-footer"><span>{feedbackTime(sources[index]?.occurred_at)}</span>
              <button type="button" className="diagnostic-link" aria-expanded={selected === index} aria-controls={`${id}-details`} aria-label={`${preview.detailAction}: ${preview.title} (${sourceRole(index).toLowerCase()})`} onClick={event => inspect(index, event.currentTarget)}>{preview.detailAction}</button>
            </footer>
          </section>)}
        </div>
      </div>
    </section>
    <section className="feedback-node-details" id={`${id}-details`} ref={detailPanel} tabIndex={-1} aria-labelledby={`${id}-details-title`} hidden={selected === null}>
      {selected !== null && <div key={selected}>
        <header className="feedback-detail-heading"><h3 id={`${id}-details-title`}>{previews[selected].title}</h3>
          <button type="button" className="analyse-button" onClick={closeDetails}>Back to graph</button>
        </header>
        <FeedbackReferenceView label={sourceRole(selected)} value={sources[selected]} names={names} />
      </div>}
    </section>
    {extra.repeated > 0 && <p className="feedback-help">{extra.repeated} repeated {extra.repeated === 1 ? 'reference is' : 'references are'} shown only once. All references remain in the record details.</p>}
    <DiagnosticDisclosure title="Record details">
      <dl className="feedback-facts">
        <dt>Model confidence</dt><dd>{Number.isFinite(finding.confidence) ? finding.confidence : 'Not recorded'}<small>How certain the model was about this finding; not measured accuracy.</small></dd>
        <dt>Finding ID</dt><dd><code>{finding._id}</code></dd><dt>Sapien ID</dt><dd>{finding.sapien_id}</dd>
        {(['created_at', 'updated_at', 'last_surfaced_at', 'acknowledged_at'] as const).map(field => <div className="feedback-fact-row" key={field}><dt>{({ created_at: 'Finding recorded', updated_at: 'Finding updated', last_surfaced_at: 'Last made available', acknowledged_at: 'Acknowledged' })[field]}</dt><dd>{feedbackTime(finding[field], true)}</dd></div>)}
      </dl>
      {!!finding.supporting_experiences?.length && <><h5>All supporting references as saved</h5><SavedValue value={finding.supporting_experiences} /></>}
    </DiagnosticDisclosure>
  </article>;
}
