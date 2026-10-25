import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, MessageSquare, Lightbulb, CircleHelp, RefreshCw } from 'lucide-react';
import { sapiensService } from '../../core/services/sapiensService';
import { useSapiensStore } from '../../core/state/sapiensStore';
import type { ApiError } from '../../types/apiTypes';
import type { AwarenessHistoryItem, AwarenessResponse } from '../../types/sapiensTypes';
import { UnderstandingEvidence } from './UnderstandingEvidence';
import { RecordText, recordDate, sourceName, useReaderNavigation } from './ContextReader';

export function AwarenessPanel({ active = true }: { active?: boolean }) {
  const activeRef = useRef(active);
  activeRef.current = active;
  const wasActive = useRef(active);
  const currentSapiens = useSapiensStore((state) => state.currentSapiens);
  const status = useSapiensStore((state) => state.status);
  const previousStatus = useRef(status);
  const requestId = useRef(0);
  const [data, setData] = useState<AwarenessResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [traceRevision, setTraceRevision] = useState(0);
  const [selected, setSelected] = useState<AwarenessHistoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentSapiens || !activeRef.current) return;
    const id = ++requestId.current;
    setLoading(true);
    try {
      const next = await sapiensService.getAwareness(currentSapiens.id, 10);
      if (id === requestId.current) {
        setData(next);
        setError(null);
      }
    } catch (caught) {
      if (id === requestId.current) setError((caught as ApiError).message || 'Could not refresh awareness.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [currentSapiens]);

  useEffect(() => {
    setData(null);
    setSelected(null);
    setError(null);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (previousStatus.current === 'processing' && status !== 'processing') void refresh();
    previousStatus.current = status;
  }, [status, refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => { if (active && !wasActive.current) void refresh(); wasActive.current = active; }, [active, refresh]);

  const readerRef = useReaderNavigation(selected);
  const current = data?.current;
  const record = selected ?? current;
  const previous = (data?.history ?? []).filter(entry => !current || entry.id !== current.id);
  const name = currentSapiens?.name ?? 'Sapiens';
  return <div ref={readerRef} className="workspace-awareness context-reader">
    <header className="context-reader-heading">
      <div><h2 data-reader-heading tabIndex={-1}>What {name} understands</h2><p>The input, supporting context and recorded activity behind this understanding.</p></div>
      <button className="workspace-icon-button" aria-label="Refresh understanding" disabled={loading} onClick={() => { setTraceRevision(value => value + 1); void refresh(); }}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></button>
    </header>
    {error && <div role="alert" className="context-notice">{error}{data ? ' The previous view is still shown.' : ''}<button onClick={() => void refresh()}>Retry</button></div>}
    <div className="context-reader-body">
      {!data && loading ? <p className="context-empty" role="status">Loading recorded understanding…</p> : !record ? <div className="context-empty"><Lightbulb size={28} /><h3>{error ? 'Understanding unavailable' : 'No understanding recorded yet'}</h3><p>{error ? 'Try refreshing this view.' : 'As your Sapien encounters information, its recorded understanding will appear here.'}</p></div> : <>
        {selected && <button data-reader-back className="context-back" onClick={() => setSelected(null)}><ArrowLeft size={15} />Latest understanding</button>}
        <div className="context-record-caption"><span>{selected ? 'Earlier record' : 'Latest record'}</span><time>{recordDate(record.assessed_at || record.created_at)}</time></div>
        <div className="context-understanding-path" key={record.id ?? record.created_at}>
          <section className="context-path-step">
            <span className="context-step-icon"><MessageSquare size={16} /></span>
            <div>
              <h3>{record.subject ? 'Original input · ' + sourceName(record.subject.source) : 'Original input'}</h3>
              {record.subject?.content ? <RecordText text={record.subject.content} lines={3} /> : <p className="context-footnote">The original input was not retained with this record.</p>}
              {record.subject?.event_at && <p className="context-footnote">{recordDate(record.subject.event_at)}</p>}
              {record.subject && <p className="understanding-source-note">Sender and conversation link not supplied.</p>}
            </div>
          </section>
          {currentSapiens && record.id && <UnderstandingEvidence key={currentSapiens.id + ':' + record.id} sapienId={currentSapiens.id} thoughtId={record.id} active={active} refreshRevision={traceRevision} />}
          <section className="context-path-step is-main"><span className="context-step-icon"><Lightbulb size={16} /></span><div><h3>Resulting understanding</h3><RecordText text={record.understanding || record.focus || 'No interpretation supplied.'} /></div></section>
          {record.remaining && <section className="context-path-step"><span className="context-step-icon"><CircleHelp size={16} /></span><div><h3>What is still unresolved</h3><RecordText text={record.remaining} lines={3} /></div></section>}
        </div>
        <details className="context-technical"><summary>About this record</summary><p>Context is a retained snapshot, not proof every item was used. Interpretations and tool reports do not confirm that the overall task is complete.</p><dl><dt>Source</dt><dd>{sourceName(record.source)}</dd><dt>Assessment state</dt><dd>{record.state || 'Not supplied'}</dd><dt>Self-reported confidence</dt><dd>{typeof record.confidence === 'number' ? Math.round(record.confidence * 100) + '%' : 'Not supplied'}</dd></dl>{record.reason && <RecordText text={record.reason} />}</details>
        {!selected && (current?.also_on_mind?.length ?? 0) > 0 && <details className="context-technical"><summary>Other recorded context ({current?.also_on_mind?.length})</summary>{current?.also_on_mind?.map((item,i) => <div className="context-related" key={i}><RecordText text={item.content} /><p className="context-footnote">{sourceName(item.source)}</p></div>)}</details>}
      </>}
        {!selected && previous.length > 0 && <section className="context-history"><h3>Earlier updates</h3><p className="context-footnote">Open an update to see its context.</p>{previous.map((entry,i) => <button className="context-list-row" key={entry.id ?? i} onClick={() => setSelected(entry)}><div><span className="context-row-excerpt">{entry.subject?.content || entry.understanding || entry.focus || 'Recorded update'}</span><small>{recordDate(entry.assessed_at || entry.created_at)}</small></div><ArrowRight size={16} /></button>)}</section>}
    </div>
  </div>;
}
