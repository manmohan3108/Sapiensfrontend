import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { DiagnosticBadge, DiagnosticDisclosure, DiagnosticText } from '../analyse/DiagnosticPrimitives';
import { Button } from '../ui/button';
import { simulationService } from '../../core/services/simulationService';
import type { InspectionActivity, InspectionStory } from '../../types/simulationTypes';
import { activityLabel, canInspectDecision, readableSimulationLabel, simulationText, simulationTime, toolOutcome } from './simulationOverviewModel';

export function activityOrigin(item: InspectionActivity, names: Map<string, string>, channels: Map<string, string>) {
  const person = (id: unknown) => { const value = simulationText(id); return names.get(value) || value || 'Person not recorded'; };
  if (item.event_type === 'MessageDelivered') {
    return `${person(item.payload.sender_id)} → ${item.channel_id ? channels.get(item.channel_id) || `Channel ${item.channel_id}` : person(item.payload.recipient_id)}`;
  }
  const actor = simulationText(item.payload.actor_id || item.payload.recipient_id);
  const service = simulationText(item.connection || item.payload.server);
  return [actor ? person(actor) : null, service, item.issue_key].filter(Boolean).join(' · ') || 'Source not recorded';
}

function RecordedBody({ item }: { item: InspectionActivity }) {
  const body = simulationText(item.payload.text);
  const outcome = toolOutcome(item);
  return <>
    {outcome && <div className="sv-tool-outcome"><DiagnosticBadge tone={outcome.tone}>{outcome.label}</DiagnosticBadge><p>A tool result does not establish that the wider task is complete.</p></div>}
    {body ? <DiagnosticText text={body} limit={700} /> : !outcome && <p className="sv-muted">No message text was recorded. The saved fields are available below.</p>}
    {item.event_type === 'ToolActivity' && <div className="sv-tool-record">
      <h4>Recorded request</h4>{item.arguments && Object.keys(item.arguments).length ? <dl className="sv-request-fields">{Object.entries(item.arguments).map(([key, value]) => <div key={key}><dt>{readableSimulationLabel(key)}</dt><dd>{typeof value === 'string' ? <DiagnosticText text={value} limit={360} /> : <pre>{JSON.stringify(value, null, 2)}</pre>}</dd></div>)}</dl> : <p className="sv-muted">{item.arguments ? 'No arguments were recorded for this request.' : 'Request arguments were not retained.'}</p>}
      <DiagnosticDisclosure title="Recorded tool result">{item.result ? <pre>{JSON.stringify(item.result, null, 2)}</pre> : <p>No structured result was retained. Inspect the raw evidence for any saved payload.</p>}</DiagnosticDisclosure>
    </div>}
  </>;
}

function LinkedDecisions({ runId, source, participant, names, channels, hrefFor }: {
  runId: string; source: InspectionActivity; participant: string | null; names: Map<string, string>; channels: Map<string, string>; hrefFor: (section: string) => string;
}) {
  const [story, setStory] = useState<InspectionStory | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setStory(null); setError('');
    void simulationService.inspectionStory(runId, source.sequence, controller.signal)
      .then(value => { if (!controller.signal.aborted) setStory(value); })
      .catch(problem => { if (!controller.signal.aborted) setError(problem instanceof Error ? problem.message : 'The linked evidence could not load.'); });
    return () => controller.abort();
  }, [runId, source.sequence, attempt]);
  if (error) return <div role="alert"><p>{error}</p><Button type="button" variant="outline" onClick={() => setAttempt(value => value + 1)}>Retry linked evidence</Button></div>;
  if (!story) return <p role="status">Loading linked evidence…</p>;
  if (story.link_status !== 'linked') return <div className="sv-link-gap">
    <p>{story.link_status === 'ambiguous' ? 'More than one decision may match this message, so no response is attributed to it here.' : 'This message has no uniquely linked decision in the retained history.'}</p>
    <div className="sv-reader-links"><Link to={hrefFor('messages')}>Browse conversations<ArrowRight size={14} aria-hidden="true" /></Link><Link to={hrefFor('sapien')}>Browse Sapien activity<ArrowRight size={14} aria-hidden="true" /></Link></div>
    <DiagnosticDisclosure title="Link details"><p>{readableSimulationLabel(story.reason || 'No reason recorded')}</p><p>Linked evidence snapshot #{story.through}</p></DiagnosticDisclosure>
  </div>;
  const decisions = story.beat?.events || [];
  return <div className="sv-linked-evidence">
    <p className="sv-muted">These records share an exact decision-cycle link. They may concern other work too; the link does not prove this message was resolved.</p>
    {(story.actions_truncated || story.beat?.events_truncated || story.missing_operation_ids.length > 0) && <p className="sv-partial">Some linked records were not retained or are truncated.</p>}
    {decisions.length > 0 && <ol className="sv-decisions">{decisions.map((event, index) => <li key={`${event.sequence}:${index}`}><strong>{event.title || readableSimulationLabel(event.stage)}</strong><DiagnosticText text={event.summary || 'No explanation recorded.'} /></li>)}</ol>}
    {!decisions.length && <p>No decision text was retained.</p>}
    {story.actions.length > 0 ? <div className="sv-linked-actions"><h4>Linked actions</h4>{story.actions.map(item => <DiagnosticDisclosure key={item.record_id} title={<span>{activityLabel(item, participant)} <span className="sv-muted">{activityOrigin(item, names, channels)}</span></span>}><p className="sv-meta">Simulated time: {simulationTime(item.occurred_at)}</p><RecordedBody item={item} /><pre className="sv-raw">{JSON.stringify(item, null, 2)}</pre></DiagnosticDisclosure>)}</div> : <p>No external action is included in this linked record.</p>}
    {!!Object.keys(story.beat?.assessment || {}).length && <DiagnosticDisclosure title="Sapien’s own assessment"><p className="sv-muted">This is the Sapien’s recorded assessment, not an independent evaluation.</p><pre>{JSON.stringify(story.beat?.assessment, null, 2)}</pre></DiagnosticDisclosure>}
    <p className="sv-meta">Linked evidence snapshot #{story.through}. This lookup may include records saved after the overview snapshot.</p>
  </div>;
}

export function SimulationRecordReader({ records, runId, participant, names, channels, hrefFor }: {
  records: InspectionActivity[]; runId: string; participant: string | null; names: Map<string, string>; channels: Map<string, string>; hrefFor: (section: string) => string;
}) {
  const [showDecision, setShowDecision] = useState(false);
  const item = records[0];
  return <article className="sv-record" aria-label="Selected activity">
    <header><p className="sv-record-kind">{activityLabel(item, participant)}</p><h3>{activityOrigin(item, names, channels)}</h3><p className="sv-meta">Simulated time: <time dateTime={item.occurred_at}>{simulationTime(item.occurred_at)}</time></p></header>
    <RecordedBody item={item} />
    {records.length > 1 && <p className="sv-meta">{records.length} delivery records for this message in the loaded activity. All retained below.</p>}
    {canInspectDecision(item, participant) && <details className="sv-decision" onToggle={event => setShowDecision(event.currentTarget.open)}>
      <summary>Linked decisions & actions</summary>
      {showDecision && <LinkedDecisions runId={runId} source={item} participant={participant} names={names} channels={channels} hrefFor={hrefFor} />}
    </details>}
    <DiagnosticDisclosure title="Technical evidence"><p className="sv-meta">Observed at (real time): {simulationTime(item.observed_at)}</p><pre>{JSON.stringify(records, null, 2)}</pre></DiagnosticDisclosure>
  </article>;
}
