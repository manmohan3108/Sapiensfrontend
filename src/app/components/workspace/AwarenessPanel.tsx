import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Lightbulb, RefreshCw } from 'lucide-react';
import { sapiensService } from '../../core/services/sapiensService';
import { useSapiensStore } from '../../core/state/sapiensStore';
import type { AwarenessHistoryItem, AwarenessResponse } from '../../types/sapiensTypes';
import { RecordText, recordDate, sourceName, useListReaderNavigation } from './ContextReader';

const recordKey = (record: AwarenessHistoryItem) => record.id || record.created_at;

export function AwarenessPanel({ active = true }: { active?: boolean }) {
  const activeRef = useRef(active);
  activeRef.current = active;
  const wasActive = useRef(active);
  const sapienId = useSapiensStore(state => state.currentSapiens?.id);
  const status = useSapiensStore(state => state.status);
  const previousStatus = useRef(status);
  const requestId = useRef(0);
  const [data, setData] = useState<AwarenessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AwarenessHistoryItem | null>(null);
  const [error, setError] = useState(false);
  const { container, list, remember } = useListReaderNavigation(selected ? recordKey(selected) : null, Number(sapienId));

  const refresh = useCallback(async () => {
    if (!sapienId || !activeRef.current || document.visibilityState !== 'visible') return;
    const request = ++requestId.current;
    setLoading(true);
    try {
      const next = await sapiensService.getAwareness(sapienId, 10);
      if (request !== requestId.current) return;
      if (Number(next.sapien_id) !== Number(sapienId)) throw new Error('Sapien mismatch');
      setData(next); setError(false);
      setSelected(previous => {
        if (!previous) return null;
        if (next.current && recordKey(next.current) === recordKey(previous)) return next.current;
        return next.history.find(record => recordKey(record) === recordKey(previous)) ?? previous;
      });
    } catch {
      if (request === requestId.current) setError(true);
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [sapienId]);

  useEffect(() => {
    setData(null); setSelected(null); setError(false);
    void refresh();
    return () => { requestId.current++; };
  }, [refresh]);
  useEffect(() => {
    if (previousStatus.current === 'processing' && status !== 'processing') void refresh();
    previousStatus.current = status;
  }, [status, refresh]);
  useEffect(() => {
    const interval = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(interval);
  }, [refresh]);
  useEffect(() => {
    if (active && !wasActive.current) void refresh();
    wasActive.current = active;
  }, [active, refresh]);

  const current = data?.current;
  const records = current
    ? [current, ...(data?.history ?? []).filter(item => recordKey(item) !== recordKey(current))]
    : data?.history ?? [];

  return <div ref={container} className="workspace-awareness context-reader">
    <header className="context-reader-heading">
      <div><h2 data-reader-heading tabIndex={-1}>Understanding</h2><p>How your Sapien interpreted recent information, and what remains unclear.</p></div>
      <button type="button" className="workspace-icon-button" aria-label="Refresh understanding" disabled={loading} onClick={() => void refresh()}><RefreshCw size={16} aria-hidden="true" className={loading ? 'animate-spin' : ''} /></button>
    </header>
    {error && <p role="alert" className="context-notice">Couldn’t refresh understanding.{data ? ' The previous records are still shown.' : ''}<button type="button" onClick={() => void refresh()}>Retry</button></p>}
    <div ref={list} className="context-reader-body">
      {selected ? <>
        <button type="button" data-reader-back className="context-back" onClick={() => setSelected(null)}><ArrowLeft size={16} aria-hidden="true" />Back to updates</button>
        <div className="context-record-caption"><span>{sourceName(selected.source)}</span><time>{recordDate(selected.assessed_at || selected.created_at)}</time></div>
        <section className="workspace-reading-section"><h3>Your Sapien’s interpretation</h3><RecordText text={selected.understanding || selected.focus || 'No interpretation was recorded.'} lines={8} /></section>
        {selected.remaining && <section className="workspace-reading-section"><h3>Still unresolved</h3><RecordText text={selected.remaining} /></section>}
        <section className="workspace-reading-section">
          <h3>What prompted this</h3>
          {selected.subject?.content ? <><p className="context-footnote">{sourceName(selected.subject.source)}{selected.subject.event_at ? ' · ' + recordDate(selected.subject.event_at) : ''}</p><RecordText text={selected.subject.content} /></> : <p className="context-footnote">The original input is not available in this record.</p>}
        </section>
        {selected.reason && <details className="workspace-reading-more"><summary>Why it reached this understanding</summary><RecordText text={selected.reason} /></details>}
        <p className="context-footnote">This is an interpretation, not confirmation that an action was completed.</p>
        {current && recordKey(selected) === recordKey(current) && !!current.also_on_mind?.length && <details className="workspace-reading-more"><summary>Also on its mind</summary>
          {current.also_on_mind.map((item, index) => <div className="context-related" key={index}><RecordText text={item.content} /><p className="context-footnote">{sourceName(item.source)}</p></div>)}
        </details>}
      </> : loading && !data ? <p className="context-empty" role="status">Loading understanding…</p> : records.length === 0 ? <div className="context-empty"><Lightbulb size={28} aria-hidden="true" /><h3>{error ? 'Understanding unavailable' : 'No updates yet'}</h3><p>{error ? 'Try refreshing this view.' : 'Your Sapien’s understanding will appear here as it encounters information.'}</p></div> : <>
        <p className="context-footnote">Recent recorded updates. Open one to see its original input.</p>
        {records.map(record => <button type="button" data-record-id={recordKey(record)} className="context-list-row" key={recordKey(record)}
          onClick={() => { remember(recordKey(record)); setSelected(record); }}>
          <div><span className="context-row-excerpt">{record.understanding || record.focus || 'Recorded update'}</span><small>{sourceName(record.source)} · {recordDate(record.assessed_at || record.created_at)}</small></div><ArrowRight size={16} aria-hidden="true" />
        </button>)}
      </>}
    </div>
  </div>;
}
