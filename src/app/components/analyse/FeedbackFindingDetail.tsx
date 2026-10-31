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
  const sources = [finding.activity, finding.experience];
  const previews = sources.map(reference => feedbackNodePreview(reference, names));
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
      <p className="feedback-help">Sapiens compared these records to form the interpretation below.</p>
      <div className="feedback-merge-graph">
        <div className="feedback-graph-sources">
          {previews.map((preview, index) => <section key={index} className="feedback-graph-node" data-selected={selected === index} aria-labelledby={`${id}-source-${index}`}>
            <div className="feedback-node-heading"><span className="feedback-node-marker" aria-hidden="true">{index === 0 ? 'A' : 'B'}</span>
              <h4 id={`${id}-source-${index}`}>{preview.title}</h4>
            </div>
            <p className="feedback-node-context">{[preview.service, preview.context].filter(Boolean).join(' · ') || (index === 0 ? 'Activity under review' : 'Record compared with it')}</p>
            {preview.caption && <p className="feedback-node-caption">{preview.caption}</p>}
            <p className="feedback-node-excerpt">{preview.excerpt}</p>
            {preview.status && <DiagnosticBadge tone={preview.tone}>{preview.status}</DiagnosticBadge>}
            {preview.partial && <p className="feedback-note">Partial saved record</p>}
            <footer className="feedback-node-footer"><span>{feedbackTime(sources[index]?.occurred_at)}</span>
              <button type="button" className="diagnostic-link" aria-expanded={selected === index} aria-controls={`${id}-details`} aria-label={`More info: ${preview.title} (record ${index === 0 ? 'A' : 'B'})`} onClick={event => inspect(index, event.currentTarget)}>More info</button>
            </footer>
          </section>)}
        </div>
        <div className="feedback-merge-connector" aria-hidden="true"><span /></div>
        <section className="feedback-graph-conclusion" data-selected={selected === 2} aria-labelledby={`${id}-conclusion`}>
          <div className="feedback-conclusion-heading"><h3 id={`${id}-conclusion`}>What Sapiens concluded</h3><FeedbackStateBadge state={finding.state} /></div>
          <p className="feedback-node-excerpt">{finding.meaning || 'No conclusion was recorded.'}</p>
          <div className="feedback-node-footer"><span>Saved interpretation</span>
            <button type="button" className="diagnostic-link" aria-expanded={selected === 2} aria-controls={`${id}-details`} aria-label="More info: Sapiens’ conclusion" onClick={event => inspect(2, event.currentTarget)}>More info</button>
          </div>
        </section>
      </div>
      <p className="feedback-help feedback-mode-note">{feedbackMode(mode)}</p>
    </section>
    <section className="feedback-node-details" id={`${id}-details`} ref={detailPanel} tabIndex={-1} aria-labelledby={`${id}-details-title`} hidden={selected === null}>
      {selected !== null && <div key={selected}>
        <header className="feedback-detail-heading"><h3 id={`${id}-details-title`}>{selected === 2 ? 'Conclusion details' : `Record ${selected === 0 ? 'A' : 'B'} details`}</h3>
          <button type="button" className="analyse-button" onClick={closeDetails}>Back to graph</button>
        </header>
        {selected < 2 ? <FeedbackReferenceView label={selected === 0 ? 'Activity under review' : 'Record compared with it'} value={sources[selected]} names={names} /> : <section className="feedback-interpretation">
          <p className="feedback-help">{finding.state === 'ambiguous' ? 'Sapiens could not clearly determine how these events are related.'
            : finding.state === 'interpreted' ? 'Sapiens’ interpretation, based on the linked records.'
            : finding.state === 'superseded' ? 'A newer finding replaced this conclusion. This older record is kept for reference.'
            : finding.state === 'unrelated' ? 'Sapiens did not find a useful connection between these events.' : 'This is the interpretation saved with the finding.'}</p>
          <DiagnosticText text={finding.meaning || 'No conclusion was recorded.'} limit={850} />
          <dl className="feedback-facts"><dt>Model confidence</dt><dd>{Number.isFinite(finding.confidence) ? finding.confidence : 'Not recorded'}<small>How certain the model was about this finding; not measured accuracy.</small></dd></dl>
        </section>}
      </div>}
    </section>
    {!!changes.length && <DiagnosticDisclosure title="Compare the two requests"><section className="feedback-request-changes">
      <h3>What changed in the request</h3>
      <p className="feedback-help">Differences in the saved fields for the same tool.</p>
      <div className="feedback-comparison-wrap" role="region" aria-label="Request changes" tabIndex={0}>
        <table className="feedback-comparison">
          <caption className="sr-only">Recorded request differences, not a claim about what caused the result.</caption>
          <thead><tr><th scope="col">Field</th><th scope="col">Record A request</th><th scope="col">Record B request</th></tr></thead>
          <tbody>{changes.map((change, index) => <tr key={index}><th scope="row">{change.label}</th>
            <td><DiagnosticText text={change.earlier} limit={220} /></td><td><DiagnosticText text={change.later} limit={220} /></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section></DiagnosticDisclosure>}
    {!!extra.references.length && <DiagnosticDisclosure title={`More context used in this review (${extra.references.length})`}><section className="feedback-extra-evidence">
      <div className="feedback-evidence-pair">{extra.references.map((ref, index) => <FeedbackReferenceView key={`${ref.id}-${index}`} label="Additional event" value={ref} names={names} />)}</div>
    </section></DiagnosticDisclosure>}
    {extra.repeated > 0 && <p className="feedback-help">{extra.repeated} repeated {extra.repeated === 1 ? 'reference is' : 'references are'} shown only once. All references remain in the record details.</p>}
    <DiagnosticDisclosure title="Record details">
      <dl className="feedback-facts">
        <dt>Finding ID</dt><dd><code>{finding._id}</code></dd><dt>Sapien ID</dt><dd>{finding.sapien_id}</dd>
        {(['created_at', 'updated_at', 'last_surfaced_at', 'acknowledged_at'] as const).map(field => <div className="feedback-fact-row" key={field}><dt>{({ created_at: 'Finding recorded', updated_at: 'Finding updated', last_surfaced_at: 'Last made available', acknowledged_at: 'Acknowledged' })[field]}</dt><dd>{feedbackTime(finding[field], true)}</dd></div>)}
      </dl>
      {!!finding.supporting_experiences?.length && <><h5>All supporting references as saved</h5><SavedValue value={finding.supporting_experiences} /></>}
    </DiagnosticDisclosure>
  </article>;
}
