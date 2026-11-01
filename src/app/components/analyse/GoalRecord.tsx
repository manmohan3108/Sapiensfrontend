import { useId, useRef, useState, type ReactNode } from 'react';
import type { GoalContext, GoalDetail, WorkflowRecord } from '../../types/goalTypes';
import { sourceName } from '../workspace/ContextReader';
import { workflowLifecycle, workflowState } from '../../utils/goalPresentation';
import { DiagnosticDisclosure, DiagnosticText } from './DiagnosticPrimitives';
import { absoluteTime, assessmentLabel } from './awarenessPresentation';
import { completion, contextCount, goalEvidenceGroups, goalExcerpt, goalInspection, goalText, planSummary } from './goalInspectionPresentation';

export function GoalState({ record }: { record: Pick<WorkflowRecord, 'finished' | 'state'> & Partial<Pick<WorkflowRecord, 'retired'>> }) {
  return <><span className="ag-state">{workflowLifecycle(record)}</span><span>{workflowState(record.state)}</span></>;
}

function SavedData({ title, value }: { title: string; value: unknown }) {
  return <DiagnosticDisclosure title={title}><pre tabIndex={0}>{JSON.stringify(value, null, 2)}</pre></DiagnosticDisclosure>;
}

function GoalContextView({ context, title }: { context: GoalContext; title: string }) {
  return <section className="ag-context"><h4>{title}</h4>
    {context.open_questions.length > 0 && <div><h5>Questions and answers</h5><ul>{context.open_questions.map(question => <li key={question.id}>
      <DiagnosticText text={question.question} /><small>{question.resolved_at ? `Resolved ${absoluteTime(question.resolved_at)}` : 'Unresolved'}</small>
      {question.resolution && <DiagnosticText text={question.resolution} />}
    </li>)}</ul></div>}
    {context.decisions.length > 0 && <div><h5>Recorded decisions</h5><ul>{context.decisions.map((decision, index) => <li key={index}>
      <DiagnosticText text={decision.decision} />{decision.rationale && <p className="ag-muted">{decision.rationale}</p>}<small>{absoluteTime(decision.at)}</small>
    </li>)}</ul></div>}
    {context.facts.length > 0 && <div><h5>Saved facts</h5><dl>{context.facts.map((fact, index) => <div key={index}>
      <dt>{fact.key}</dt><dd><DiagnosticText text={fact.value} /><small>Source: {fact.source || 'Not recorded'}</small></dd>
    </div>)}</dl></div>}
    {context.assumptions.length > 0 && <div><h5>Assumptions</h5><ul>{context.assumptions.map((assumption, index) => <li key={index}>
      <DiagnosticText text={assumption.text} /><small>{assumption.status || 'Status not recorded'}</small>
    </li>)}</ul></div>}
  </section>;
}

export function GoalRecord({ detail, actions }: { detail: GoalDetail; actions?: ReactNode }) {
  const [section, setSection] = useState('situation');
  const [evidenceKey, setEvidenceKey] = useState('');
  const evidenceControl = useRef<HTMLButtonElement>(null);
  const id = useId();
  const { goal, current_plan: plan, attention, history } = detail;
  const view = goalInspection(detail);
  const description = goalText(goal.description);
  const groups = goalEvidenceGroups(view.evidence);
  const evidence = groups.flatMap(group => group.entries);
  const selectedEvidence = evidence.find(entry => entry.key === evidenceKey) || evidence[0];
  const hasContext = contextCount(detail.context) + contextCount(detail.plan_context) > 0;
  const references = [...new Set([...description.refs, ...goal.evidence_refs, ...(goal.evidence || []).map(item => item.ref), ...view.refs])];
  return <>
    <header className="ag-goal-header">
      <div className="ag-title-row"><h2>Goal</h2><span className="ag-origin">Source: {sourceName(goal.source)}</span></div>
      <div className="ag-description"><DiagnosticText text={description.text || 'Goal description not recorded'} limit={620} /></div>
      <div className="ag-meta"><GoalState record={goal} />{goal.retired === true && <span>{completion(goal)}</span>}</div>
    </header>

    <div role="group" aria-label="Goal detail view" className="ag-reader-views">
      {[['situation', 'Situation & plan'], ['evidence', `Evidence (${view.evidence.length})`], ['record', 'Record details']].map(([value, label]) =>
        <button key={value} ref={value === 'evidence' ? evidenceControl : undefined} type="button" aria-pressed={section === value} aria-controls={`${id}-view`} onClick={() => setSection(value)}>{label}</button>)}
    </div>
    <div id={`${id}-view`} role="region" tabIndex={0} aria-label={section === 'situation' ? 'Situation and plan' : section === 'evidence' ? 'Evidence' : 'Record details'}>
    {section === 'situation' && <>
    <div className={`ag-situation ${plan ? 'ag-with-plan' : ''}`}>
    <section className="ag-assessment">
      <div className="ag-title-row"><h3>{view.pending ? 'Last retained assessment' : 'Latest recorded assessment'}</h3>{view.state && <span className="ag-assessment-state">{assessmentLabel(view.state)}</span>}</div>
      {view.pending && <p className="ag-muted">A newer review was requested {absoluteTime(attention?.requested_at)}. No matching resolution is recorded yet.</p>}
      {view.remaining && <div className="ag-remaining"><h4>What remains</h4><DiagnosticText text={view.remaining} limit={600} /></div>}
      {view.understanding && <div className="ag-understanding">{view.remaining && <h4>What Sapiens understood</h4>}<DiagnosticText text={view.understanding} limit={650} /></div>}
      {view.reason && <DiagnosticDisclosure title="Why Sapiens reached this assessment"><DiagnosticText text={view.reason} limit={900} /></DiagnosticDisclosure>}
      {!(view.understanding || view.remaining || view.reason || view.state) && <p className="ag-muted">No assessment was supplied. The goal’s workflow state is shown above.</p>}
      {!!(view.understanding || view.remaining || view.reason || view.state) && <p className="ag-muted">Sapiens’ assessment · {absoluteTime(attention?.resolved_at)}</p>}
      {view.evidence.length > 0 && <button type="button" className="ag-text-button" onClick={() => { setSection('evidence'); evidenceControl.current?.focus(); }}>Inspect the evidence ({view.evidence.length})</button>}
    </section>

    {plan && <section className="ag-plan">
      <div className="ag-title-row"><h3>Current plan</h3><span className="ag-muted">{planSummary(plan)}</span></div>
      <p className="ag-body-text">{goalText(plan.description).text || 'Plan description not recorded'}</p>
      <div className="ag-meta"><GoalState record={plan} />{plan.retired === true && <span>{completion(plan)}</span>}</div>
      {plan.tasks.length > 0 && <p className="ag-muted">Steps are shown in the saved plan order, not a history of execution.</p>}
      <ol className="ag-steps">{plan.tasks.map((step, index) => <li key={step.id || index}>
        <span className="ag-step-number" aria-hidden="true">{index + 1}</span>
        <div className="ag-step-content">
          <h4><span className="sr-only">Step {index + 1}: </span>{goalText(step.description).text || 'Step description not recorded'}</h4>
          <div className="ag-meta"><GoalState record={step} /></div>
          {step.result ? <div className="ag-step-result"><h5>Recorded result</h5><DiagnosticText text={step.result} limit={650} /></div> : <p className="ag-muted">No result recorded for this step.</p>}
          {!!(step.evidence_refs.length || goalText(step.description).refs.length) && <DiagnosticDisclosure title="Step evidence references"><ul className="ag-reference-list">{[...new Set([...step.evidence_refs, ...goalText(step.description).refs])].map(ref => <li key={ref}>{ref}</li>)}</ul></DiagnosticDisclosure>}
        </div>
      </li>)}</ol>
    </section>}
    </div>
    {!plan && <p className="ag-availability">No plan recorded for this goal.</p>}
    </>}
    <div hidden={section !== 'situation'}>{actions}</div>

    {section === 'evidence' && <>
      <h3>Evidence saved with the assessment</h3>
      <p className="ag-muted">Cited records are the sources Sapiens referenced. Earlier context and tool guidance are not new actions for this goal.</p>
      {selectedEvidence ? <>
        <label className="ag-evidence-picker" htmlFor={`${id}-evidence`}>Choose a saved record
          <select id={`${id}-evidence`} name="goalEvidence" autoComplete="off" value={selectedEvidence.key} onChange={event => setEvidenceKey(event.target.value)}>
            {groups.map(group => <optgroup key={group.key} label={`${group.title} (${group.entries.length})`}>{group.entries.map((entry, index) =>
              <option key={`${entry.id}:${index}`} value={entry.key}>{entry.title} — {goalExcerpt(entry.body || entry.messages[0]?.body || 'No readable text supplied', 75)}</option>)}</optgroup>)}
          </select>
        </label>
        <div className="ag-evidence-browser">
          <nav className="ag-evidence-index" aria-label="Saved evidence">
            {groups.map(group => <div key={group.key}><h4>{group.title} <span>({group.entries.length})</span></h4>
              {group.entries.map((entry, index) => <button key={`${entry.id}:${index}`} type="button" aria-pressed={entry === selectedEvidence} aria-controls={`${id}-evidence-content`} onClick={() => setEvidenceKey(entry.key)}>
                <strong>{entry.title}</strong><span>{goalExcerpt(entry.body || entry.messages[0]?.body || 'No readable text supplied', 95)}</span>
                {entry.when && <small>{absoluteTime(entry.when)}</small>}
              </button>)}
            </div>)}
          </nav>
          <GoalEvidenceContent key={selectedEvidence.key} id={`${id}-evidence-content`} entry={selectedEvidence} />
        </div>
      </> : <p className="ag-availability">No evidence records were supplied with this assessment.</p>}

    {hasContext && <DiagnosticDisclosure title="Additional goal and plan context">
      <div className="ag-context-grid">{detail.context && contextCount(detail.context) > 0 && <GoalContextView context={detail.context} title="Goal context" />}
        {detail.plan_context && contextCount(detail.plan_context) > 0 && <GoalContextView context={detail.plan_context} title="Plan context" />}</div>
    </DiagnosticDisclosure>}
    </>}

    {section === 'record' && <section className="ag-record-details"><h3>History & record details</h3>
      <div className="ag-meta"><span>Updated {absoluteTime(goal.updated_at)}</span>{goal.progress !== null && <span>Reported progress: {Math.round(goal.progress * 100)}%</span>}</div>
      <p className="ag-status-help">{goal.finished === true
        ? `Marked finished; the saved workflow state is “${goal.state || 'not recorded'}”. These are separate fields, not proof that the intended outcome succeeded.`
        : 'The lifecycle, workflow state and assessment are recorded separately. Reported progress does not by itself establish success.'}</p>
      {goal.motivation && <div className="ag-motivation"><h4>Why this goal exists</h4><DiagnosticText text={goal.motivation} /></div>}
      <section className="ag-section"><h4>Goal change history{history ? ` (${history.length})` : ''}</h4>
        <p className="ag-muted">Up to 100 stored changes, oldest first; not a complete lifetime history.</p>
        {history === undefined ? <p>History was not supplied by the API.</p> : !history.length ? <p>No changes returned.</p> : <ol className="ag-history">{history.map((entry, index) => <li key={index}>
          <DiagnosticText text={entry.reason || 'No reason recorded'} /><small>{entry.operation || 'Operation not recorded'} · {entry.actor || 'Actor unknown'} · {absoluteTime(entry.at)}</small>
        </li>)}</ol>}
      </section>
      <DiagnosticDisclosure title="Source, ownership and schedule"><dl className="ag-facts">
        <div><dt>Source</dt><dd>{sourceName(goal.source)}</dd></div><div><dt>Owner</dt><dd>{goal.owner || 'Not recorded'}</dd></div>
        <div><dt>Created by</dt><dd>{goal.creator || 'Not recorded'}</dd></div><div><dt>Requested by</dt><dd>{goal.requested_by || 'Not recorded'}</dd></div>
        <div><dt>Review enabled</dt><dd>{goal.review_enabled === null ? 'Unknown' : goal.review_enabled ? 'Yes' : 'No'}</dd></div>
        <div><dt>Scheduled review</dt><dd>{goal.review_at ? absoluteTime(goal.review_at) : 'Not scheduled'}</dd></div>
        <div><dt>Created</dt><dd>{absoluteTime(goal.created_at)}</dd></div>
      </dl><p className="ag-muted">Saved timestamps may follow simulation time. They are not compared with today to infer overdue work. Refresh time is shown separately in real time.</p>
        {goal.metadata.source_reference != null && <SavedData title="Original source reference" value={goal.metadata.source_reference} />}
      </DiagnosticDisclosure>
      {!!references.length && <DiagnosticDisclosure title={`Goal and assessment evidence references (${references.length})`}><ul className="ag-reference-list">{references.map(ref => <li key={ref}>{ref}</li>)}</ul></DiagnosticDisclosure>}
      <SavedData title="Full saved record, evidence & state rules" value={detail} />
    </section>}
    </div>
  </>;
}

function GoalEvidenceContent({ entry, id }: { entry: ReturnType<typeof goalInspection>['evidence'][number]; id: string }) {
  return <article className="ag-evidence" id={id} aria-label="Selected evidence" tabIndex={0}>
    <p className="ag-cited">{entry.label}{entry.cited ? ' · Cited in the recorded assessment' : ' · Not explicitly cited'}</p>
    <h4>{entry.title}</h4>{entry.source && <p className="ag-muted">Source: {entry.source}</p>}
    {entry.category === 'guidance' && <p className="ag-evidence-note">Guidance saved from earlier tool use. This does not establish that the tool was used for this goal.</p>}
    {(entry.derived || entry.partial) && <p className="ag-muted">{entry.derived ? 'Saved summary of the source' : 'Partial saved record'}{entry.partial ? ' · some detail is missing' : ''}</p>}
    {entry.body && <DiagnosticText text={entry.body} limit={1200} />}
    {entry.messages.map((message, i) => <blockquote key={i}><p><strong>{message.author || 'Sender not recorded'}</strong>{message.location && ` · ${message.location}`}</p><DiagnosticText text={message.body} limit={900} />{message.when && <small>{absoluteTime(message.when)}</small>}</blockquote>)}
    {!entry.body && !entry.messages.length && <p className="ag-muted">No readable text was supplied. The saved fields are available below.</p>}
    {entry.status && <p className="ag-muted">{entry.earlier ? 'Earlier record: ' : ''}{entry.status}</p>}
    {entry.when && <p className="ag-muted">{entry.timeLabel}: {absoluteTime(entry.when)}</p>}
    <SavedData title="Saved evidence fields" value={entry.raw} />
  </article>;
}
