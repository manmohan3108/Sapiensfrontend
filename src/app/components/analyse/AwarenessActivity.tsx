import { useEffect, useId, useRef } from 'react';
import type { AwarenessRunDetail, AwarenessRunStep } from '../../types/awarenessRunTypes';
import { traceObject, traceText } from '../workspace/awarenessTrace';
import { DiagnosticBadge, DiagnosticDisclosure, DiagnosticText } from './DiagnosticPrimitives';
import { hasOmission, SavedValue } from './AwarenessEvidence';
import { absoluteTime, safeEvidence, stepView } from './awarenessPresentation';

function StepDetail({ step, position, inferredLoops }: { step: AwarenessRunStep; position: number; inferredLoops?: boolean }) {
  const view = stepView(step);
  const action = step.action_detail;
  const isAction = (step.kind || step.evidence?.kind || step.evidence?.stage) === 'action' || !!action;
  const detail = traceObject(step.evidence?.detail || step.evidence?.technical_details);
  const proposals = Array.isArray(detail.actions) ? detail.actions.map(traceObject) : detail.action ? [traceObject(detail.action)] : [];
  return <>
    <header className="awareness-step-head"><p className="awareness-caption">Step {position}{view.when && <> · <time dateTime={view.when}>{absoluteTime(view.when)}</time></>}</p>
      <h4>{view.title}</h4><DiagnosticBadge tone={view.tone}>{view.status}</DiagnosticBadge>
    </header>
    {view.response ? <><h5>Prepared reply</h5><DiagnosticText text={view.response} limit={900}/><p className="awareness-caption">Preparing this text does not confirm delivery. See the Summary for recorded delivery information.</p></>
      : !isAction && <DiagnosticText text={view.summary || 'No explanation was retained for this step.'} limit={700}/>}
    {view.reason && ![view.summary, view.response].includes(view.reason) && <><h5>Recorded reason</h5><DiagnosticText text={view.reason} limit={700}/></>}
    {view.consequence && ![view.summary, view.response, view.reason].includes(view.consequence) && <><h5>What followed</h5><DiagnosticText text={view.consequence} limit={700}/></>}
    {traceText(detail.focus) && <><h5>Focus at this step</h5><DiagnosticText text={traceText(detail.focus)}/></>}
    {!!proposals.length && <><h5>Proposed tools</h5><p className="awareness-caption">A proposal is not an executed action. Later steps show any recorded results.</p>
      <ul className="awareness-proposals">{proposals.map((item, index) => <li key={index}>{traceText(item.capability) || 'Tool not recorded'}</li>)}</ul>
      {detail.actions_truncated === true && <p className="awareness-caution">Only part of the proposed batch was retained.</p>}
    </>}
    {isAction && (action?.match_status === 'exact' ? <>
      <h5>{action.result_kind === 'activity_record' ? 'Saved tool activity' : 'Returned result'}</h5>
      {typeof action.result === 'string' ? <DiagnosticText text={action.result || '(Empty text returned)'} limit={1000}/> : <SavedValue value={action.result}/>}
      {(action.result_detail_truncated || hasOmission(action.result)) && <p className="awareness-caution">The saved result was shortened. The missing text is not available here.</p>}
      {action.result_kind === 'activity_record' && <p className="awareness-caption">This is the retained activity record, which may include a shortened result.</p>}
      <p className="awareness-caption">Tool: {[action.server, action.tool].filter(Boolean).join(' / ') || 'Not recorded'}{action.observed_at && <> · Result recorded {absoluteTime(action.observed_at)}</>}</p>
      <DiagnosticDisclosure title="Request sent to the tool"><SavedValue value={action.arguments}/></DiagnosticDisclosure>
    </> : <>
      {view.summary && <DiagnosticText text={view.summary}/>}
      <p className="awareness-caption">{action?.match_status === 'ambiguous' ? 'Conflicting records match this action. No result has been attached.' : 'The exact request and result are unavailable. No substitute is shown.'}</p>
    </>)}
    <DiagnosticDisclosure title="Technical evidence for this step">
      <p className="awareness-caption">{step.phase ? 'Phase: ' + step.phase.replaceAll('_', ' ') + '. ' : ''}{step.round != null ? 'Loop: ' + step.round + (inferredLoops ? ' (inferred from an older trace).' : '.') : 'No loop number recorded.'}</p>
      {view.summary && <DiagnosticText text={view.summary}/>}
      <SavedValue value={safeEvidence(step.evidence)}/>
    </DiagnosticDisclosure>
  </>;
}

export function AwarenessActivity({ data, selected, onSelect }: { data: AwarenessRunDetail; selected: string; onSelect: (eventIndex: string) => void }) {
  const id = useId();
  const detailRef = useRef<HTMLElement>(null);
  const indexRef = useRef<HTMLOListElement>(null);
  const steps = data.activity.steps;
  const match = steps.findIndex(step => String(step.event_index) === selected);
  const position = Math.max(0, match);
  const step = steps[position];
  useEffect(() => {
    indexRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: 'nearest' });
  }, [selected]);
  if (!step) return <p className="awareness-empty">No step-by-step activity was retained for this review.</p>;
  return <section className="awareness-activity-reader" aria-label="Recorded activity">
    <div className="awareness-activity-intro"><h3>Activity <span>{steps.length} recorded steps</span></h3>
      <p className="awareness-caption">Read the saved sequence. A proposal, its review and the tool result are separate steps.</p></div>
    {selected && match === -1 && <p role="status" className="awareness-caption">The linked step is unavailable. Showing the first retained step.</p>}
    {(data.activity.truncated || data.run.actions.trace_truncated) && <p className="awareness-caution">Only part of this review was retained. Steps and counts may be incomplete.</p>}
    <div className="awareness-activity-mobile"><label htmlFor={id + '-picker'}>Choose a step</label>
      <select id={id + '-picker'} name="awarenessStep" value={step.event_index} onChange={event => onSelect(event.target.value)}>
        {steps.map((item, index) => <option key={item.event_index} value={item.event_index}>{index + 1}. {stepView(item).title}</option>)}
      </select>
    </div>
    <div className="awareness-activity-columns">
      <ol ref={indexRef} className="awareness-step-index" aria-label="Steps in saved order">{steps.map((item, index) => {
        const view = stepView(item);
        return <li key={item.event_index}><button type="button" aria-current={position === index ? 'step' : undefined} aria-controls={id + '-detail'} onClick={event => {
          onSelect(String(item.event_index));
          if (event.detail === 0) detailRef.current?.focus();
        }}>
          <span className="awareness-step-number">{index + 1}</span><span><strong>{view.title}</strong><DiagnosticBadge tone={view.tone}>{view.status}</DiagnosticBadge></span>
        </button></li>;
      })}</ol>
      <section ref={detailRef} id={id + '-detail'} tabIndex={0} aria-label={`Step ${position + 1}: ${stepView(step).title}`} className="awareness-active-step">
        <div className="awareness-step-navigation"><button type="button" className="analyse-button" disabled={position === 0} onClick={() => onSelect(String(steps[position - 1].event_index))}>Previous step</button>
          <span className="awareness-caption" role="status">{position + 1} of {steps.length}</span>
          <button type="button" className="analyse-button" disabled={position === steps.length - 1} onClick={() => onSelect(String(steps[position + 1].event_index))}>Next step</button></div>
        <StepDetail key={step.event_index} step={step} position={position + 1} inferredLoops={data.activity.rounds_inferred}/>
      </section>
    </div>
  </section>;
}
