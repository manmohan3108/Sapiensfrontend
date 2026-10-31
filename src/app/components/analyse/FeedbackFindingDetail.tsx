import type { FeedbackFinding, FeedbackReference } from '../../types/feedbackTypes';
import { DiagnosticBadge, DiagnosticDisclosure, DiagnosticText } from './DiagnosticPrimitives';
import { feedbackLabels, feedbackOrigin, feedbackTime } from './feedbackPresentation';

export function FeedbackStateBadge({ state }: { state: FeedbackFinding['state'] }) {
  return <DiagnosticBadge tone={state === 'ambiguous' ? 'warning' : 'neutral'}>{feedbackLabels[state] || state}</DiagnosticBadge>;
}

function SavedValue({ value }: { value: unknown }) {
  return <pre>{typeof value === 'string' ? value : JSON.stringify(value, null, 2) ?? 'Not recorded'}</pre>;
}

export function FeedbackReferenceView({ label, value }: { label: string; value: FeedbackReference }) {
  const details = value?.details;
  const display = details?.available ? details.display : undefined;
  const origin = feedbackOrigin(value);
  return <section className="feedback-evidence">
    <h4>{label}</h4>
    <p className="feedback-origin"><strong>{origin.primary}</strong>{origin.secondary && <span>{origin.secondary}</span>}</p>
    <dl className="feedback-facts">
      {display?.tool && <><dt>Tool-reported result</dt><dd>{display.outcome || 'Not recorded'}</dd></>}
      <dt>Event time</dt><dd>{feedbackTime(value?.occurred_at, true)}</dd>
    </dl>
    {details?.available ? <>
      {(!display?.tool || display.text !== details.content) ? <DiagnosticText text={display?.text || details.content || 'No stored event text.'} limit={600} />
        : <p className="feedback-help">The tool action is shown above. Its saved request and result are in the technical details.</p>}
      {details.truncated && <p className="feedback-note">This saved evidence is shortened; it is not the full original event.</p>}
      {details.metadata?._truncated === true && <p className="feedback-note">Stored metadata is also shortened.</p>}
    </> : <p className="feedback-help">Original event details are unavailable.</p>}
    <DiagnosticDisclosure title="Event record and technical details">
      <dl className="feedback-facts"><dt>Reference ID</dt><dd><code>{value?.id || 'Not recorded'}</code></dd><dt>Source type</dt><dd>{value?.source || 'Not recorded'}</dd>
        {details?.available && <><dt>Observed at</dt><dd>{feedbackTime(details.observed_at, true)}</dd></>}
      </dl>
      {details?.available && <><h5>Saved event text</h5><SavedValue value={details.content} /><h5>Saved metadata</h5><SavedValue value={details.metadata} /></>}
    </DiagnosticDisclosure>
  </section>;
}

export function FeedbackFindingDetail({ finding }: { finding: FeedbackFinding }) {
  return <article className="feedback-finding">
    <div className="feedback-finding-meta"><FeedbackStateBadge state={finding.state} /><span>Recorded {feedbackTime(finding.created_at)}</span></div>
    <section className="feedback-interpretation">
      <h3>Recorded interpretation</h3>
      <p>{finding.meaning || 'No interpretation recorded.'}</p>
      <p className="feedback-help">{finding.state === 'ambiguous' ? 'The relationship between these events is uncertain.'
        : finding.state === 'interpreted' ? 'A possible lesson, not evidence that behavior changed.'
        : finding.state === 'superseded' ? 'A later finding replaced this interpretation.'
        : finding.state === 'unrelated' ? 'No relevant relationship was established.' : 'Review the saved interpretation and its evidence.'}</p>
    </section>
    <h3>Evidence behind this finding</h3>
    <div className="feedback-evidence-pair">
      <FeedbackReferenceView label="Earlier activity" value={finding.activity} />
      <FeedbackReferenceView label="Later experience" value={finding.experience} />
    </div>
    {!!finding.supporting_experiences?.length && <DiagnosticDisclosure title={`Other evidence considered (${finding.supporting_experiences.length})`}>
      <div className="feedback-evidence-pair">{finding.supporting_experiences.map((ref, index) => <FeedbackReferenceView key={`${ref.id}-${index}`} label="Supporting evidence" value={ref} />)}</div>
    </DiagnosticDisclosure>}
    <DiagnosticDisclosure title="Finding details and model confidence">
      <dl className="feedback-facts">
        <dt>Model confidence</dt><dd>{Number.isFinite(finding.confidence) ? finding.confidence : 'Not recorded'}<small>Model estimate, not measured accuracy.</small></dd>
        <dt>Finding ID</dt><dd><code>{finding._id}</code></dd><dt>Sapien ID</dt><dd>{finding.sapien_id}</dd>
        {(['created_at', 'updated_at', 'last_surfaced_at', 'acknowledged_at'] as const).map(field => <div className="feedback-fact-row" key={field}><dt>{({ created_at: 'Created', updated_at: 'Updated', last_surfaced_at: 'Last surfaced', acknowledged_at: 'Acknowledged' })[field]}</dt><dd>{feedbackTime(finding[field], true)}</dd></div>)}
      </dl>
    </DiagnosticDisclosure>
  </article>;
}
