import { useEffect, useId, useRef, useState } from 'react';
import type { AwarenessRunDetail, AwarenessRunSubject } from '../../types/awarenessRunTypes';
import { sapiensService } from '../../core/services/sapiensService';
import { traceObject, traceText } from '../workspace/awarenessTrace';
import { DiagnosticBadge, DiagnosticDisclosure, DiagnosticText } from './DiagnosticPrimitives';
import { AwarenessActivity } from './AwarenessActivity';
import { AwarenessEvidence } from './AwarenessEvidence';
import { absoluteTime, actionSummary, assessmentLabel, deliveryAudits, deliverySummary, inspectionError, processingLabel, reviewView, runOverview, sameSubject, stepView, subjectLabel } from './awarenessPresentation';

type View = ReturnType<typeof reviewView>;
interface ReaderProps {
  sapienId: string; runId: string; revision: number; view: View; selectedStep: string;
  onView: (view: View, step?: string) => void;
}

function SourceExcerpt({ subject }: { subject: AwarenessRunSubject }) {
  return <>
    <p className="awareness-source-name">{subjectLabel(subject)}</p>
    {subject.recipient?.name && subject.origin_relation !== 'related_subject' && <p className="awareness-caption">To {subject.recipient.name}</p>}
    {subject.event_at && <p className="awareness-caption">Source time: <time dateTime={subject.event_at}>{absoluteTime(subject.event_at)}</time></p>}
    <DiagnosticText text={subject.content || 'The source text was not recorded.'} limit={440}/>
    {subject.content_truncated && <p className="awareness-caption">The saved source text is incomplete.</p>}
    {subject.origin_relation === 'related_subject' && <p className="awareness-caption">These source details refer to earlier work, not the author of this event.</p>}
  </>;
}

export function AwarenessSummary({ data, onActivity }: { data: AwarenessRunDetail; onActivity: (step?: string) => void }) {
  const view = runOverview(data);
  const run = data.run;
  const triggerAvailable = data.trigger.availability !== 'not_applicable' && data.trigger.availability !== 'not_recorded';
  const focusAvailable = !!(data.focus.content || data.focus.source_reference);
  const source = triggerAvailable ? data.trigger : focusAvailable ? data.focus : null;
  const separateFocus = triggerAvailable && focusAvailable && !sameSubject(data.trigger, data.focus);
  const reply = view.reply ? stepView(view.reply) : null;
  const audit = deliveryAudits(data);
  const final = traceObject(data.technical.final);
  const actionGroups = new Map<string, typeof view.actions>();
  view.actions.forEach(step => { const title = stepView(step).title; actionGroups.set(title, [...(actionGroups.get(title) || []), step]); });
  const assessmentTone = run.assessment_state === 'blocked' ? 'danger' : ['waiting', 'unresolved'].includes(run.assessment_state) ? 'warning' : 'neutral';
  return <div className="awareness-summary">
    {view.problem && <section className="awareness-processing-issue" aria-label="Processing issue">
      <h3>{processingLabel(run.processing_state)}</h3>
      <p>This review did not finish normally. Actions recorded before it stopped are still shown below.</p>
      {(traceText(final.reason) || view.reason) && <DiagnosticDisclosure title="Recorded review note"><DiagnosticText text={traceText(final.reason) || view.reason} limit={700}/></DiagnosticDisclosure>}
    </section>}
    {view.noFocus ? <section className="awareness-no-focus"><h3>No focus was chosen</h3>
      <p>Nothing was selected for further attention during this check.</p>
      <DiagnosticText text={data.focus_selection?.reason || 'The reason was not recorded.'}/>
      <p className="awareness-caption">This does not mean that pending work is complete.</p>
    </section> : <div className="awareness-summary-pair">
      <section className="awareness-summary-block"><h3>{triggerAvailable ? 'What started this' : focusAvailable ? 'Selected information' : 'What started this'}</h3>
        {!triggerAvailable && <p className="awareness-caption">{data.trigger.availability === 'not_applicable' ? 'Sapiens started this review without an incoming trigger.' : 'The initiating event was not retained. Any selected information is shown below.'}</p>}
        {source && <SourceExcerpt subject={source}/>}
        {separateFocus && <DiagnosticDisclosure title="Source selected for the focus"><SourceExcerpt subject={data.focus}/></DiagnosticDisclosure>}
      </section>
      <section className="awareness-summary-block awareness-understanding"><h3>What Sapiens understood</h3>
        <DiagnosticText text={view.understanding || 'Its interpretation was not retained.'} limit={560}/>
        <p className="awareness-caption">Sapiens’ saved interpretation of the situation.</p>
      </section>
    </div>}
    {view.incomplete && <p className="awareness-caution">Only part of this review was retained. The available activity and counts may be incomplete.</p>}
    {(!view.noFocus || view.actions.length > 0 || reply) && <div className="awareness-summary-pair awareness-summary-followup">
      <section className="awareness-summary-block"><h3>Response & actions</h3>
        {reply && <div className="awareness-prepared-reply"><h4>{view.replyCount > 1 ? 'Latest prepared reply' : 'Prepared reply'}</h4>
          <DiagnosticText text={reply.response} limit={500}/><p className="awareness-caption">{deliverySummary(data)}</p>
          {view.replyCount > 1 && <button type="button" className="diagnostic-link" onClick={() => onActivity(String(view.reply!.event_index))}>{view.replyCount} reply drafts in Activity</button>}
        </div>}
        {!!audit.length && <div className="awareness-delivery-audit"><h4>Latest linked-message delivery</h4>
          {audit.map((item, index) => <p key={index}>{item.subject ? subjectLabel(item.subject) : 'Linked message'}: <strong>{item.status}</strong></p>)}
          <p className="awareness-caption">This source audit can be newer than the review above.</p>
        </div>}
        {!reply && view.decision && <p className="awareness-decision">{stepView(view.decision).title}</p>}
        <p className="awareness-caption">{actionSummary(run)}</p>
        {!!actionGroups.size && <ul className="awareness-action-highlights">{[...actionGroups.entries()].slice(0, 3).map(([title, steps]) => <li key={title}>
          <button type="button" className="diagnostic-link" onClick={() => onActivity(String(steps[0].event_index))}>{title}{steps.length > 1 ? ` (${steps.length} records)` : ''}</button>
        </li>)}</ul>}
        {!!data.activity.steps.length && <button type="button" className="diagnostic-link" onClick={() => onActivity()}>View all {data.activity.steps.length} steps</button>}
        {!reply && run.delivery.response_present === true && <p className="awareness-caption">A prepared reply is recorded, but its text was not retained in these steps.</p>}
      </section>
      <section className="awareness-summary-block awareness-assessment"><div className="awareness-step-heading"><h3>Sapiens’ assessment</h3><DiagnosticBadge tone={assessmentTone}>{assessmentLabel(run.assessment_state)}</DiagnosticBadge></div>
        {view.remaining && <div className="awareness-remaining"><h4>Still needed</h4><DiagnosticText text={view.remaining} limit={650}/></div>}
        {!view.problem && view.reason && view.reason !== view.understanding && <div className="awareness-assessment-reason"><h4>Recorded reason</h4><DiagnosticText text={view.reason} limit={380}/></div>}
        {!view.remaining && !view.reason && <p className="awareness-caption">No further assessment detail was retained.</p>}
        <p className="awareness-caption">This is Sapiens’ assessment, not independent verification that the work is complete.</p>
      </section>
    </div>}
    {view.noFocus && !view.actions.length && !reply && !!data.activity.steps.length && <button type="button" className="diagnostic-link" onClick={() => onActivity()}>Inspect {data.activity.steps.length} recorded steps</button>}
  </div>;
}

export function AwarenessRunContent({ data, view, selectedStep, onView }: { data: AwarenessRunDetail } & Pick<ReaderProps, 'view' | 'selectedStep' | 'onView'>) {
  const id = useId();
  const activityButton = useRef<HTMLButtonElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => { body.current?.scrollTo({ top: 0 }); }, [view, selectedStep]);
  const route = traceText(traceObject(data.delivery.communication).reply_route_ref);
  return <div className="awareness-run-reader">
    <header className="awareness-review-header">
      <div className="awareness-review-meta"><strong>{subjectLabel(data.trigger)}</strong><time dateTime={data.run.started_at || undefined}>Review started {absoluteTime(data.run.started_at)}</time></div>
      <p className="awareness-caption">{processingLabel(data.run.processing_state)}{route.startsWith('simulation:') ? ' · Reply route belongs to a simulation' : ''}</p>
      <div role="group" aria-label="Review detail view" className="awareness-reader-views">
        {([['summary', 'Summary'], ['activity', `Activity (${data.activity.steps.length})`], ['sources', 'Sources & details']] as const).map(([value, label]) =>
          <button key={value} ref={value === 'activity' ? activityButton : undefined} type="button" aria-pressed={view === value} aria-controls={id + '-view'} onClick={() => onView(value)}>{label}</button>)}
      </div>
    </header>
    <div ref={body} id={id + '-view'} className="awareness-review-body" tabIndex={0} role="region" aria-label={view === 'sources' ? 'Sources and details' : view === 'activity' ? 'Recorded activity' : 'Review summary'}>
      {view === 'summary' && <AwarenessSummary data={data} onActivity={step => { onView('activity', step); activityButton.current?.focus(); }}/>}
      {view === 'activity' && <AwarenessActivity data={data} selected={selectedStep} onSelect={step => onView('activity', step)}/>}
      {view === 'sources' && <AwarenessEvidence data={data}/>}
    </div>
  </div>;
}

export function AwarenessRunReader({ sapienId, runId, revision, ...controls }: ReaderProps) {
  const [data, setData] = useState<AwarenessRunDetail | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setData(null); setError('');
    void sapiensService.getAwarenessRun(sapienId, runId, controller.signal).then(result => {
      if (!active) return;
      if (Number(result.sapien_id) !== Number(sapienId) || result.run.id !== runId) throw new Error('Mismatched review');
      setData(result);
    }).catch(caught => { if (active) setError(inspectionError(caught, true)); });
    return () => { active = false; controller.abort(); };
  }, [sapienId, runId, revision, attempt]);
  if (error) return <div role="alert" className="awareness-error">{error} <button type="button" className="diagnostic-link" onClick={() => setAttempt(value => value + 1)}>Retry details</button></div>;
  if (!data || data.run.id !== runId || Number(data.sapien_id) !== Number(sapienId)) return <p role="status" className="awareness-empty">Loading the selected review…</p>;
  return <AwarenessRunContent data={data} {...controls}/>;
}
