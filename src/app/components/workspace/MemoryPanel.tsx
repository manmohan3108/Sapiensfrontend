import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BrainCircuit, RefreshCw, Search } from 'lucide-react';
import { engramService } from '../../core/services/engramService';
import { useSapiensStore } from '../../core/state/sapiensStore';
import type { WMEntry, WMResponse } from '../../types/engramTypes';
import { RecordText, sourceName, recordDate, useListReaderNavigation } from './ContextReader';

const entryKey = (entry: WMEntry) => JSON.stringify([entry.memory_source, entry.id]);

export function MemoryPanel({ active = true }: { active?: boolean }) {
  const activeRef = useRef(active);
  activeRef.current = active;
  const wasActive = useRef(active);
  const sapienId = useSapiensStore(state => state.currentSapiens?.id);
  const status = useSapiensStore(state => state.status);
  const previousStatus = useRef(status);
  const requestId = useRef(0);
  const [data, setData] = useState<WMResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('');
  const [selected, setSelected] = useState<WMEntry | null>(null);
  const { container, list, remember } = useListReaderNavigation(selected ? entryKey(selected) : null, Number(sapienId));

  const refresh = useCallback(async () => {
    if (!sapienId || !activeRef.current || document.visibilityState !== 'visible') return;
    const request = ++requestId.current;
    setLoading(true);
    try {
      const next = await engramService.getWorkingMemory(Number(sapienId), {
        sort: 'last_used', order: 'desc', limit: 100, includeContent: true, includeMetadata: true,
      });
      if (request !== requestId.current) return;
      if (Number(next.sapien_id) !== Number(sapienId)) throw new Error('Sapien mismatch');
      setData(next); setError(false);
      setSelected(previous => previous
        ? next.wm.entries.find(entry => entryKey(entry) === entryKey(previous)) ?? previous
        : null);
    } catch {
      if (request === requestId.current) setError(true);
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [sapienId]);

  useEffect(() => {
    setData(null); setSelected(null); setSearch(''); setTopic(''); setError(false);
    void refresh();
    const onVisibility = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { requestId.current++; document.removeEventListener('visibilitychange', onVisibility); };
  }, [refresh]);
  useEffect(() => {
    if (previousStatus.current === 'processing' && status !== 'processing') void refresh();
    previousStatus.current = status;
  }, [status, refresh]);
  useEffect(() => {
    if (active && !wasActive.current) void refresh();
    wasActive.current = active;
  }, [active, refresh]);

  const entries = data?.wm?.entries ?? [];
  const topics = [...new Set(entries.flatMap(entry => entry.tags ?? []))].sort();
  const visible = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return entries.filter(entry => (!topic || entry.tags?.includes(topic))
      && (!needle || [entry.content, sourceName(entry.memory_source), ...(entry.tags ?? [])]
        .some(value => value?.toLocaleLowerCase().includes(needle))));
  }, [entries, search, topic]);

  return <div ref={container} className="workspace-memory context-reader">
    <header className="context-reader-heading">
      <div><h2 data-reader-heading tabIndex={-1}>Current context</h2><p>Information your Sapien can draw on now. This is a recent snapshot, not all its memories.</p></div>
      <button type="button" className="workspace-icon-button" disabled={loading} onClick={() => void refresh()} aria-label="Refresh current context"><RefreshCw size={16} aria-hidden="true" className={loading ? 'animate-spin' : ''} /></button>
    </header>
    {error && <p role="alert" className="context-notice">Couldn’t refresh context.{data ? ' The previous snapshot is still shown.' : ''}<button type="button" onClick={() => void refresh()}>Retry</button></p>}
    <div ref={list} className="context-reader-body">
      {selected ? <>
        <button type="button" data-reader-back className="context-back" onClick={() => setSelected(null)}><ArrowLeft size={16} aria-hidden="true" />Back to context</button>
        <div className="context-record-caption"><span>{sourceName(selected.memory_source)}</span></div>
        {!entries.some(entry => entryKey(entry) === entryKey(selected)) && <p className="context-footnote">This item is from an earlier snapshot and is no longer in the current list.</p>}
        <RecordText key={entryKey(selected)} text={selected.content || 'The text for this item is not available.'} lines={10} />
        {selected.tags?.length ? <p className="context-footnote">{selected.tags.join(' · ')}</p> : null}
        <dl className="workspace-record-dates">
          {selected.event_at && <><dt>Original event</dt><dd>{recordDate(selected.event_at)}</dd></>}
          {selected.last_used_at && <><dt>Last brought to mind</dt><dd>{recordDate(selected.last_used_at)}</dd></>}
        </dl>
        <p className="context-footnote">Shown as recorded; this may include an interpretation rather than a confirmed fact.</p>
      </> : <>
        <label className="workspace-search workspace-context-search"><Search size={16} aria-hidden="true" /><input aria-label="Search loaded context" autoComplete="off" name="context-search" type="search" placeholder="Search this context…" value={search} onChange={event => setSearch(event.target.value)} /></label>
        {topics.length > 0 && <label className="context-topic-filter">Topic<select value={topic} onChange={event => setTopic(event.target.value)}><option value="">All topics</option>{topics.map(value => <option key={value}>{value}</option>)}</select></label>}
        {data && <p className="context-footnote">{visible.length} of {entries.length} recent items shown. Search covers this list.</p>}
        {loading && !data ? <p className="context-empty" role="status">Loading context…</p> : !data ? <div className="context-empty"><BrainCircuit size={26} aria-hidden="true" /><h3>Context unavailable</h3><p>Try refreshing this view.</p></div> : !visible.length ? <div className="context-empty">
          <BrainCircuit size={26} aria-hidden="true" /><h3>{search || topic ? 'No matching context' : 'No current context yet'}</h3>
          <p>{search || topic ? 'Try another word or topic.' : 'Information will appear here as your Sapien brings it to mind.'}</p>
          {(search || topic) && <button type="button" onClick={() => { setSearch(''); setTopic(''); }}>Clear filters</button>}
        </div> : visible.map(entry => <button type="button" data-record-id={entryKey(entry)} key={entryKey(entry)} className="context-list-row"
          onClick={() => { remember(entryKey(entry)); setSelected(entry); }}>
          <div><span className="context-row-excerpt">{entry.content || 'Text unavailable'}</span><small>{sourceName(entry.memory_source)}{entry.last_used_at ? ' · ' + recordDate(entry.last_used_at) : ''}</small></div><ArrowRight size={16} aria-hidden="true" />
        </button>)}
        {entries.length === 100 && <p className="context-footnote">Showing up to 100 recent items.</p>}
      </>}
    </div>
  </div>;
}
