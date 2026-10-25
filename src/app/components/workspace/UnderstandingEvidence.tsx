import { useEffect, useState } from 'react';
import { BookOpen, Workflow } from 'lucide-react';
import { sapiensService } from '../../core/services/sapiensService';
import type { AwarenessBeat, AwarenessBeatEvent } from '../../types/sapiensTypes';
import type { ApiError } from '../../types/apiTypes';
import { RecordText, recordDate, sourceName } from './ContextReader';
import { activityView, matchedTrace, traceActivity, traceContext, traceObject, traceText } from './awarenessTrace';

function ActivityRow({ event }: { event: AwarenessBeatEvent }) {
  const view = activityView(event);
  return <li className="understanding-activity-row">
    <div><strong>{view.title}</strong><span>{view.status}</span></div>
    {view.summary && <RecordText text={view.summary} lines={2} />}
    {(view.when || view.capability) && <details><summary>Source &amp; time</summary>{view.capability && <p className="context-footnote">Tool: {view.capability}</p>}{view.when && <time className="context-footnote">{recordDate(view.when)}</time>}</details>}
  </li>;
}

function TraceEvidence({ beat }: { beat: AwarenessBeat }) {
  const context = traceContext(beat);
  const activity = traceActivity(beat);
  const delivery = traceObject(beat.delivery);
  const final = traceObject(beat.final);
  const replyPrepared = activity.lastDecision && activityView(activity.lastDecision).move === 'speak';
  return <>
    <section className="context-path-step">
      <span className="context-step-icon"><BookOpen size={16} /></span>
      <div><h3>Context available in this run</h3>
        {context.length ? <>
          <div className="understanding-context-item"><RecordText text={context[0].content || 'Context text was not retained.'} lines={3} /><p className="context-footnote">{sourceName(context[0].source)}</p></div>
          {context.length > 1 && <details className="understanding-more"><summary>{context.length - 1} more context {context.length === 2 ? 'item' : 'items'}</summary>{context.slice(1).map((item, i) => <div className="understanding-context-item" key={i}><RecordText text={item.content || 'Context text was not retained.'} lines={3} /><p className="context-footnote">{sourceName(item.source)}</p></div>)}</details>}
          
        </> : <p className="context-footnote">No supporting context was retained in this snapshot.</p>}
        {beat.mode === 'autonomous' && <p className="context-footnote">This run began with self-directed attention.</p>}
      </div>
    </section>
    <section className="context-path-step">
      <span className="context-step-icon"><Workflow size={16} /></span>
      <div><h3>Recorded actions &amp; decisions</h3>
        {activity.incomplete && <p className="understanding-trace-note">This trace is incomplete; some steps were not retained.</p>}
        {activity.actions.length ? <>
          <ol className="understanding-activity">{activity.actions.slice(0, 3).map((event, i) => <ActivityRow key={i} event={event} />)}</ol>
          {activity.actions.length > 3 && <details className="understanding-more"><summary>{activity.actions.length - 3} more recorded actions</summary><ol className="understanding-activity" start={4}>{activity.actions.slice(3).map((event, i) => <ActivityRow key={i} event={event} />)}</ol></details>}
        </> : <p className="context-footnote">{final.actions_used === 0 ? 'The run reports no tool actions.' : 'No tool-action events were retained in this trace.'}</p>}
        {activity.lastDecision && <div className="understanding-decision"><p className="context-footnote">Last recorded decision</p><ol className="understanding-activity"><ActivityRow event={activity.lastDecision} /></ol></div>}
        {(replyPrepared || delivery.response_present === true) && <p className="understanding-trace-note">{delivery.route === 'returned_to_caller' ? 'Reply returned to the calling app. This does not confirm delivery to a person.' : 'A prepared reply does not by itself confirm delivery to a person.'}</p>}
        
        {activity.other.length > 0 && <details className="understanding-more"><summary>Other recorded steps ({activity.other.length})</summary><ol className="understanding-activity">{activity.other.map((event, i) => <ActivityRow key={i} event={event} />)}</ol></details>}
        {traceText(delivery.route) && <details className="understanding-more"><summary>Delivery record</summary><p className="context-footnote">Route: {traceText(delivery.route).replaceAll('_', ' ')}{traceText(delivery.status) ? ` · ${traceText(delivery.status)}` : ''}</p></details>}
      </div>
    </section>
  </>;
}

/** This component is keyed by Sapien and thought ID so evidence cannot leak between selections. */
export function UnderstandingEvidence({ sapienId, thoughtId, active, refreshRevision = 0 }: { sapienId: string; thoughtId: string; active: boolean; refreshRevision?: number }) {
  const [beat, setBeat] = useState<AwarenessBeat | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!active || denied) return;
    let current = true;
    setLoading(true);
    setMessage('');
    void sapiensService.getAwarenessBeats(sapienId, 20, thoughtId).then(data => {
      if (!current) return;
      const exact = matchedTrace(data, sapienId, thoughtId);
      setBeat(exact);
      if (!exact) setMessage(data.match_status === 'ambiguous'
        ? 'More than one run matches this record. No actions have been attached automatically.'
        : 'No exactly linked run is available. Supporting context and actions cannot be shown for this record.');
    }).catch(error => {
      if (!current) return;
      setBeat(null);
      const forbidden = (error as ApiError).status === 403;
      setDenied(forbidden);
      setLoading(false);
      setMessage(forbidden ? 'Your account cannot access the supporting trace. The saved understanding remains available.'
        : 'Supporting context and actions could not be loaded.');
    }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [sapienId, thoughtId, active, attempt, denied, refreshRevision]);

  if (loading && !beat) return <p role="status" className="understanding-trace-note">Loading linked context and actions…</p>;
  if (!beat) return <div className="understanding-trace-note" role="status"><p>{message}</p>{!denied && <button onClick={() => setAttempt(value => value + 1)}>Retry linked record</button>}</div>;
  return <TraceEvidence beat={beat} />;
}
