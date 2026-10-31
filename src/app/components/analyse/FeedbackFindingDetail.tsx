import { useId, useRef, type Ref } from 'react';
import type { FeedbackFinding, FeedbackReference } from '../../types/feedbackTypes';
import { DiagnosticBadge, DiagnosticDisclosure, DiagnosticText } from './DiagnosticPrimitives';
import { feedbackLabels, feedbackMode, feedbackTime } from './feedbackPresentation';
import { additionalEvidence, changedRequestFields, eventEvidence, evidenceNames, type EvidenceField } from './feedbackEvidence';

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
          {item.text ? <DiagnosticText text={item.text} /> : item.fields.length ? <FieldList fields={item.fields} /> : <p className="feedback-help">Entry {index + 1}: fields are available in the original record.</p>}
        </li>)}</ol>
        {items.length > 3 && <DiagnosticDisclosure title={`Show remaining ${items.length - 3} saved entries`}>
          <ol className="feedback-result-items" start={4}>{items.slice(3).map((item, index) => <li key={index}>
            {item.text ? <DiagnosticText text={item.text} /> : item.fields.length ? <FieldList fields={item.fields} /> : <p className="feedback-help">Fields are available in the original record.</p>}
          </li>)}</ol>
        </DiagnosticDisclosure>}
      </> : event.resultFields.length ? <FieldList fields={event.resultFields} />
      : <p className="feedback-help">No readable result details were supplied. The original record is available below.</p>}
  </div>;
}

export function FeedbackReferenceView({ label, value, names = new Map<string, string>(), step, id, sectionRef }: {
  label: string; value: FeedbackReference; names?: Map<string, string>;
  step?: number; id?: string; sectionRef?: Ref<HTMLElement>;
}) {
  const details = value?.details;
  const event = eventEvidence(value, names);
  return <section className="feedback-evidence" data-kind={event.kind} id={id} ref={sectionRef} tabIndex={id ? -1 : undefined} aria-labelledby={id ? `${id}-title` : undefined}>
    <p className="feedback-event-position">{step && <span className="feedback-step-number" aria-hidden="true">{step}</span>}{label}</p>
    <h4 id={id ? `${id}-title` : undefined}>{event.title}</h4>
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
        <dt>Event time</dt><dd>{feedbackTime(value?.occurred_at, true)}</dd>
        {details?.available && <><dt>Observed at</dt><dd>{feedbackTime(details.observed_at, true)}</dd></>}
      </dl>
      {details?.available && <><h5>Saved event text</h5><SavedValue value={details.content} /><h5>Saved metadata</h5><SavedValue value={details.metadata} /></>}
    </DiagnosticDisclosure>
  </section>;
}

export function FeedbackFindingDetail({ finding, mode }: { finding: FeedbackFinding; mode?: string }) {
  const id = useId();
  const sections = useRef<Array<HTMLElement | null>>([]);
  const names = evidenceNames([finding.activity, finding.experience, ...(finding.supporting_experiences || [])]);
  const changes = changedRequestFields(finding, names);
  const extra = additionalEvidence(finding);
  const steps = [finding.activity, finding.experience].map((reference, index) => {
    const event = eventEvidence(reference, names);
    return {
      label: index === 0 ? 'Activity under review' : 'Evidence compared',
      title: event.title,
      context: !reference?.details?.available ? 'Details unavailable'
        : event.actor || (event.tool?.outcome ? `Tool reported: ${event.tool.outcome}` : event.state ? `Recorded state: ${event.state}` : ''),
    };
  });
  steps.push({ label: 'Sapiens’ conclusion', title: feedbackLabels[finding.state] || finding.state, context: '' });
  const jumpToStep = (index: number) => {
    const section = sections.current[index];
    section?.focus({ preventScroll: true });
    section?.scrollIntoView({ block: 'start', behavior: 'instant' });
  };
  return <article className="feedback-finding">
    <section className="feedback-events" aria-label="Events linked by this finding">
      <h3>What happened</h3>
      <p className="feedback-help">Read the linked records, then Sapiens’ conclusion. Select a step to jump to it.</p>
      <nav className="feedback-reading-flow" aria-label="Finding reading order">
        <ol>{steps.map((step, index) => <li key={index}>
          <button type="button" className="feedback-flow-step" aria-controls={`${id}-step-${index}`} onClick={() => jumpToStep(index)}>
            <span className="feedback-step-number" aria-hidden="true">{index + 1}</span>
            <span className="feedback-flow-copy"><span className="feedback-flow-label">{step.label}</span><strong>{step.title}</strong>
              {step.context && <span className="feedback-flow-context">{step.context}</span>}
            </span>
          </button>
        </li>)}</ol>
      </nav>
      <div className="feedback-evidence-pair">
        <FeedbackReferenceView label={steps[0].label} step={1} id={`${id}-step-0`} sectionRef={node => { sections.current[0] = node; }} value={finding.activity} names={names} />
        <FeedbackReferenceView label={steps[1].label} step={2} id={`${id}-step-1`} sectionRef={node => { sections.current[1] = node; }} value={finding.experience} names={names} />
      </div>
    </section>
    {!!changes.length && <section className="feedback-request-changes">
      <h3>What changed in the request</h3>
      <p className="feedback-help">Differences in the saved fields for the same tool.</p>
      <div className="feedback-comparison-wrap" role="region" aria-label="Request changes" tabIndex={0}>
        <table className="feedback-comparison">
          <caption className="sr-only">Recorded request differences, not a claim about what caused the result.</caption>
          <thead><tr><th scope="col">Field</th><th scope="col">Request in step 1</th><th scope="col">Request in step 2</th></tr></thead>
          <tbody>{changes.map((change, index) => <tr key={index}><th scope="row">{change.label}</th>
            <td><DiagnosticText text={change.earlier} limit={220} /></td><td><DiagnosticText text={change.later} limit={220} /></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>}
    <section className="feedback-interpretation" id={`${id}-step-2`} ref={node => { sections.current[2] = node; }} tabIndex={-1} aria-labelledby={`${id}-conclusion`}>
      <div className="feedback-conclusion-heading"><span className="feedback-step-number" aria-hidden="true">3</span><h3 id={`${id}-conclusion`}>What Sapiens concluded</h3><FeedbackStateBadge state={finding.state} /></div>
      <p className="feedback-help">{finding.state === 'ambiguous' ? 'Sapiens could not clearly determine how these events are related.'
        : finding.state === 'interpreted' ? 'Sapiens’ interpretation, based on the records shown above.'
        : finding.state === 'superseded' ? 'A newer finding replaced this conclusion. This older record is kept for reference.'
        : finding.state === 'unrelated' ? 'Sapiens did not find a useful connection between these events.' : 'This is the interpretation saved with the finding.'}</p>
      <DiagnosticText text={finding.meaning || 'No conclusion was recorded.'} limit={850} />
      <p className="feedback-help feedback-mode-note">{feedbackMode(mode)}</p>
    </section>
    {!!extra.references.length && <section className="feedback-extra-evidence">
      <h3>More context used in this review</h3>
      <div className="feedback-evidence-pair">{extra.references.map((ref, index) => <FeedbackReferenceView key={`${ref.id}-${index}`} label="Additional event" value={ref} names={names} />)}</div>
    </section>}
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
