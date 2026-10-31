import { useId } from 'react';
import { Link } from 'react-router';
import type { InquiryDetail } from '../../types/inquiryTypes';
import { DiagnosticBadge, DiagnosticDisclosure } from './DiagnosticPrimitives';
import { absoluteTime } from './awarenessPresentation';
import { questionSourceLabel, questionStateLabel, questioningView, type QuestionEvidence } from './questioningPresentation';

function EvidenceBlock({ entry, cited = false }: { entry: QuestionEvidence; cited?: boolean }) {
  return <article className="question-evidence-card" data-cited={cited || undefined}>
    <header><h4>{entry.title}</h4>{entry.source && <p>{entry.source}</p>}
      {cited && <span className="question-citation">Used in the recorded assessment</span>}
    </header>
    <div className="question-evidence-body">
      {(entry.derived || entry.partial) && <p className="question-note">{entry.derived ? 'Saved summary of the source' : 'Partial saved record'}{entry.partial ? ' · some detail is missing' : ''}</p>}
      {entry.body && <p className="question-text">{entry.body}</p>}
      {entry.messages.map((message, index) => <blockquote key={index} className="question-message">
        <p className="question-message-origin"><strong>{message.author || 'Sender not recorded'}</strong>{message.location && <span>{message.location}</span>}{message.when && <time>{absoluteTime(message.when)}</time>}</p>
        <p className="question-text">{message.body}</p>
      </blockquote>)}
      {!entry.body && !entry.messages.length && <p className="question-help">This record has no readable message. Its saved fields are available below.</p>}
      {entry.status && <DiagnosticBadge tone={entry.status.includes('failure') ? 'danger' : entry.status.includes('uncertain') ? 'warning' : 'neutral'}>{entry.status}</DiagnosticBadge>}
    </div>
    <footer>{entry.when && <span>{entry.timeLabel}: {absoluteTime(entry.when)}</span>}
      <DiagnosticDisclosure title="Saved record details"><pre tabIndex={0}>{JSON.stringify(entry.raw, null, 2)}</pre></DiagnosticDisclosure>
    </footer>
  </article>;
}

function EvidenceList({ entries, cited = false }: { entries: QuestionEvidence[]; cited?: boolean }) {
  return <div className="question-evidence-grid">{entries.map((entry, index) => <EvidenceBlock key={`${entry.id}:${index}`} entry={entry} cited={cited} />)}</div>;
}

export function QuestioningDetail({ item, asOf }: { item: InquiryDetail['item']; asOf: string }) {
  const view = questioningView(item);
  const id = useId();
  const clock = item.simulation_run_id ? 'Simulation time' : 'Recorded event time';
  return <article className="questioning-detail">
    <header className="question-heading">
      <h3>{item.question || 'Question text unavailable'}</h3>
      <div className="question-meta"><DiagnosticBadge>{questionStateLabel(item.state)}</DiagnosticBadge>
        <span>{questionSourceLabel(item.source)}</span><span>{item.simulation_run_id ? 'Simulation record' : 'Normal runtime record'}</span>
        <span>Created {absoluteTime(item.created_at)} · {clock}</span>
      </div>
    </header>

    <section className="question-answer" aria-labelledby={`${id}-answer`}>
      <h3 id={`${id}-answer`}>{view.answer ? 'Sapiens’ recorded answer' : item.state === 'open' ? 'This question is still open' : 'Answer not retained'}</h3>
      {view.answer ? <p className="question-text">{view.answer}</p> : <p className="question-help">{item.state === 'open' ? 'No answer is stored for this question yet.' : item.state === 'stale' ? 'The record was closed without establishing an answer.' : 'The saved record does not include readable answer text.'}</p>}
      {view.answer && <p className="question-help">{item.state === 'open' ? 'The record remains open. This is its latest saved understanding.' : 'This is Sapiens’ assessment of the available evidence, not independent verification.'}</p>}
      {view.reason && <div className="question-reason"><h4>Reason for this assessment</h4><p className="question-text">{view.reason}</p></div>}
      {view.remaining && <div className="question-reason"><h4>Still unresolved in this assessment</h4><p className="question-text">{view.remaining}</p></div>}
    </section>

    <section className="question-evidence-section" aria-labelledby={`${id}-trigger`}>
      <h3 id={`${id}-trigger`}>What prompted this question</h3>
      {view.trigger.length ? <EvidenceList entries={view.trigger} /> : <p className="question-help">{view.unknownContext ? 'The initial context could not be displayed here; its saved fields are available in Technical details.' : 'The initial trigger was not retained.'}{view.cited.length || view.checked.length || view.additional.length ? ' Supporting records from the later assessment are shown below.' : ''}</p>}
    </section>

    {!!view.cited.length && <section className="question-evidence-section" aria-labelledby={`${id}-cited`}>
      <h3 id={`${id}-cited`}>Evidence cited in the answer</h3>
      <p className="question-help">The recorded assessment explicitly refers to these records.</p>
      <EvidenceList entries={view.cited} cited />
    </section>}
    {!!view.checked.length && <section className="question-evidence-section" aria-labelledby={`${id}-checked`}>
      <h3 id={`${id}-checked`}>Other recorded tool results</h3><EvidenceList entries={view.checked} />
    </section>}
    {view.hasOutcome && !view.cited.length && !view.checked.length && <p className="question-help">No linked tool results or cited records were retained with this outcome.</p>}
    {!!view.additional.length && <DiagnosticDisclosure title={`Other context available to the assessment (${view.additional.length})`}>
      <p className="question-help">Earlier understanding and guidance are context, not new actions taken to answer this question.</p>
      <EvidenceList entries={view.additional} />
    </DiagnosticDisclosure>}

    <DiagnosticDisclosure title="Technical details">
      <dl className="question-technical">
        <dt>Question ID</dt><dd>{item.id}</dd><dt>Source reference</dt><dd>{typeof item.source_handle === 'string' ? item.source_handle : JSON.stringify(item.source_handle) || 'Not recorded'}</dd>
        {item.simulation_run_id && <><dt>Simulation run</dt><dd>{item.simulation_run_id}</dd></>}
        {item.job_id && <><dt>Processing job</dt><dd><Link to={`/admin/analyse/engine-jobs?${new URLSearchParams({ engine_name:'weave_questioning', job_id:item.job_id })}`}>Inspect job</Link></dd></>}
        <dt>Event occurred</dt><dd>{absoluteTime(item.occurred_at)} · {clock}</dd>
        <dt>Closed</dt><dd>{item.closed_at ? absoluteTime(item.closed_at) : 'Not recorded'}</dd>
        <dt>Expiry recorded</dt><dd>{item.expires_at ? `${absoluteTime(item.expires_at)} · ${clock}` : 'Not recorded'}</dd>
        <dt>Fetched</dt><dd>{absoluteTime(asOf)} · real time</dd>
      </dl>
      <p className="question-help">A saved question does not establish that it was sent to someone. Simulation dates are not compared with today’s date to infer expiry.</p>
      <DiagnosticDisclosure title="Original saved question, context and outcome"><pre tabIndex={0}>{JSON.stringify(item, null, 2)}</pre></DiagnosticDisclosure>
    </DiagnosticDisclosure>
  </article>;
}
