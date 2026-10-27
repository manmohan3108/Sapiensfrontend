import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { AnalyseControls } from './AnalyseControls';
import { DiagnosticDisclosure } from './DiagnosticPrimitives';
import { useRememberedState } from '../navigation/NavigationState';
import { sourceName } from '../workspace/ContextReader';
import { engramService } from '../../core/services/engramService';
import type { WMEntry, WMResponse, WMTagsMatch } from '../../types/engramTypes';
import { activationBuckets, activationLabel, matchesMemory, memoryDate, memoryKind, memoryOrigin, memoryTimes } from './workingMemoryPresentation';
import '../../../styles/analyse-working-memory.css';

function RecordedTime({ value }: { value?: string }) {
  return value ? <time dateTime={value} title={value}>{memoryDate(value)}</time> : <span>Not recorded</span>;
}
function OriginLine({ entry }: { entry: WMEntry }) {
  const origin = memoryOrigin(entry);
  const parts = [origin.person, origin.service, origin.place].filter(Boolean);
  return <span className="awm-origin">{parts.length ? parts.join(' · ') : 'Origin not supplied'}{origin.simulation && <span className="awm-tag">Simulation</span>}</span>;
}

function MemoryDetails({ entry, focused, openEngram }: { entry: WMEntry; focused: boolean; openEngram: () => void }) {
  const origin = memoryOrigin(entry), times = memoryTimes(entry);
  return <>
    <div className="awm-reader-heading"><div><Dialog.Title className="awm-title">{memoryKind(entry)}</Dialog.Title><Dialog.Description>Content and recorded origin of this memory.</Dialog.Description></div><Dialog.Close className="analyse-button" aria-label="Close memory entry"><X size={18} aria-hidden="true" /></Dialog.Close></div>
    <OriginLine entry={entry} />
    <p className="awm-content">{entry.content || 'Content was not supplied for this memory reference.'}</p>
    {!!entry.tags?.length && <div className="awm-tags" aria-label="Memory tags">{entry.tags.map(tag => <span key={tag} className="awm-tag">{tag}</span>)}</div>}
    <section className="awm-section"><h3>Origin</h3><dl className="awm-facts">
      <dt>Person</dt><dd>{origin.person || 'Not supplied'}</dd><dt>Service</dt><dd>{origin.service || 'Not supplied'}</dd>
      {origin.place && <><dt>Issue or conversation</dt><dd>{origin.place}</dd></>}
      {origin.channel && <><dt>Channel</dt><dd>{origin.channel}</dd></>}{origin.thread && <><dt>Thread</dt><dd>{origin.thread}</dd></>}
      {origin.simulation && <><dt>Environment</dt><dd>Simulation record</dd></>}
    </dl></section>
    <section className="awm-section"><h3>Activation and time</h3><p className="awm-help">Activation is the recorded retrieval strength, not confidence or proof that this memory was used.</p>
      {focused && <p className="awm-focus">Marked as Working Memory focus in this snapshot. This is not necessarily Sapiens’ current thought.</p>}
      <dl className="awm-facts"><dt>Recorded activation</dt><dd>{activationLabel(entry)}</dd><dt>Times activated</dt><dd>{entry.frequency ?? 'Not recorded'}</dd>
        <dt>Last activated</dt><dd><RecordedTime value={times.activated} /></dd><dt>Created</dt><dd><RecordedTime value={times.created} />{!entry.created_at && times.created && <small>From record metadata</small>}</dd>
        {times.event && <><dt>Event time</dt><dd><RecordedTime value={times.event} /></dd></>}
      </dl><p className="awm-help">Recorded timestamps are shown in your timezone. Simulation records may use a different clock.</p>
    </section>
    {!!entry.references?.length && <section className="awm-section"><h3>Related references</h3><ul>{entry.references.map(ref => <li key={ref}>{ref}</li>)}</ul></section>}
    {entry.memory_source === 'memory_unit' && <button type="button" className="analyse-button" onClick={openEngram}>Open stored memory in Engram <ArrowUpRight size={16} aria-hidden="true" /></button>}
    <DiagnosticDisclosure title="Technical record"><p className="awm-help">Original fields, including any additional provenance, timing and embedding details.</p><pre>{JSON.stringify(entry, null, 2)}</pre></DiagnosticDisclosure>
  </>;
}

function SnapshotDetails({ data, shown }: { data: WMResponse; shown: number }) {
  const entries = data.wm.entries, summary = data.summary, buckets = activationBuckets(entries);
  const max = Math.max(1, ...buckets.map(bucket => bucket.count));
  const sources = data.sources ?? [];
  return <>
    <div className="awm-reader-heading"><div><Dialog.Title className="awm-title">Snapshot analysis</Dialog.Title><Dialog.Description>Counts and activation levels in the returned snapshot.</Dialog.Description></div><Dialog.Close className="analyse-button" aria-label="Close snapshot analysis"><X size={18} aria-hidden="true" /></Dialog.Close></div>
    <dl className="awm-summary"><div><dt>In full snapshot</dt><dd>{summary?.entries_used ?? 'Not supplied'}</dd></div><div><dt>Match server filters</dt><dd>{summary?.entries_matching ?? 'Not supplied'}</dd></div><div><dt>Returned / shown</dt><dd>{entries.length} / {shown}</dd></div></dl>
    <section className="awm-section"><h3>Activation distribution</h3><p className="awm-help">Counts use the returned records, before local search. Unrecorded or out-of-range activation values are excluded.</p><ol className="awm-histogram">{buckets.map(bucket => <li key={bucket.label}><span>{bucket.label}</span><span className="awm-bar-track" aria-hidden="true"><span style={{ width: `${bucket.count / max * 100}%` }} /></span><span>{bucket.count}</span></li>)}</ol></section>
    <section className="awm-section"><h3>Memory sources</h3><p className="awm-help">Full snapshot catalog, before server filters.</p>{sources.length ? <dl className="awm-facts">{sources.map(source => <div className="awm-fact-row" key={source.source}><dt>{sourceName(source.source)}</dt><dd>{source.entries}</dd></div>)}</dl> : <p>No source catalog was supplied.</p>}</section>
    <DiagnosticDisclosure title="Snapshot details and limits"><dl className="awm-facts"><dt>Capacity</dt><dd>{summary?.entries_capacity ?? data.capacity?.global ?? 'Not supplied'}</dd><dt>Average activation (full snapshot)</dt><dd>{typeof summary?.average_activation === 'number' ? activationLabel({ activation: summary.average_activation } as WMEntry) : 'Not recorded'}</dd><dt>Cached embeddings</dt><dd>{summary?.embedded ?? 'Not supplied'}</dd></dl><p className="awm-help">This read-only snapshot does not reinforce memories. It does not show which memories a model used, why an entry was removed, or activation history. Recorded activation can change between snapshots.</p></DiagnosticDisclosure>
  </>;
}

/** Analyse-only reader. No changes to the workspace component or shared API. */
export function WorkingMemoryAnalysis({ sapienId, openEngram }: { sapienId: number; openEngram: () => void }) {
  const requestId = useRef(0), entryOpener = useRef<HTMLElement | null>(null), snapshotOpener = useRef<HTMLButtonElement>(null);
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [state, setState] = useState<{ key: string; data?: WMResponse; loading: boolean; error?: string }>();
  const [search, setSearch] = useRememberedState(`working-memory:${sapienId}:search`, '');
  const [source, setSource] = useRememberedState(`working-memory:${sapienId}:source`, '');
  const [tags, setTags] = useRememberedState<string[]>(`working-memory:${sapienId}:tags`, []);
  const [tagsMatch, setTagsMatch] = useRememberedState<WMTagsMatch>(`working-memory:${sapienId}:tagsMatch`, 'all');
  const [references, setReferences] = useRememberedState<string[]>(`working-memory:${sapienId}:references`, []);
  const [sort, setSort] = useRememberedState<'activation' | 'recent'>(`working-memory:${sapienId}:sort`, 'activation');
  const [selected, setSelected] = useState<WMEntry | null>(null);
  const key = JSON.stringify([sapienId, source, tags, tagsMatch, references, sort]);
  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setState(previous => ({ key, data: previous?.key === key ? previous.data : undefined, loading: true }));
    try {
      const data = await engramService.getWorkingMemory(sapienId, { source: source || undefined, tags, tagsMatch, references, sort: sort === 'recent' ? 'last_used' : 'activation', order: 'desc', limit: 100, includeContent: true, includeMetadata: true });
      if (id === requestId.current) setState({ key, data, loading: false });
    } catch (error) {
      if (id === requestId.current) setState(previous => ({ key, data: previous?.key === key ? previous.data : undefined, loading: false, error: (error as Error).message || 'Could not load Working Memory.' }));
    }
  }, [key, sapienId, source, tags, tagsMatch, references, sort]);
  useEffect(() => { setSelected(null); setSnapshotOpen(false); void refresh(); return () => { ++requestId.current; }; }, [refresh]);
  const current = state?.key === key ? state : undefined, data = current?.data, loading = current?.loading ?? true;
  const entries = data?.wm.entries ?? [], focusId = data?.wm.focus_id ?? data?.summary?.focus_id;
  const filtered = useMemo(() => entries.filter(entry => matchesMemory(entry, search)), [entries, search]);
  const filteredOnServer = !!source || tags.length > 0 || references.length > 0;
  const toggle = (value: string, values: string[], set: (next: string[]) => void) => set(values.includes(value) ? values.filter(item => item !== value) : [...values, value]);
  const reset = () => { setSearch(''); setSource(''); setTags([]); setReferences([]); setTagsMatch('all'); setSort('activation'); };
  return <div className="analyse-working-memory">
    <p className="analyse-page-purpose">See the information available for Sapiens to retrieve, and where it came from.</p>
    <AnalyseControls primary={<div className="awm-controls"><label className="awm-search"><Search size={16} aria-hidden="true" /><input name="memorySearch" autoComplete="off" value={search} onChange={event => setSearch(event.target.value)} aria-label="Search returned memory records" placeholder="Search memories, people, Jira or Teams…" /></label><select aria-label="Sort memory records" value={sort} onChange={event => setSort(event.target.value as typeof sort)}><option value="activation">Highest activation</option><option value="recent">Most recently activated</option></select></div>}
      filters={[...(source ? [{ label: 'Source: ' + sourceName(source), onRemove: () => setSource('') }] : []), ...tags.map(tag => ({ label: 'Tag: ' + tag, onRemove: () => setTags(tags.filter(value => value !== tag)) })), ...references.map(ref => ({ label: 'Reference: ' + ref, onRemove: () => setReferences(references.filter(value => value !== ref)) }))]}
      summary="Search covers up to 100 returned records. Other filters apply on the server." onRefresh={() => void refresh()} busy={loading}>
      <div className="awm-filter-body"><label>Memory source<select value={source} onChange={event => setSource(event.target.value)}><option value="">All sources</option>{source && !data?.sources?.some(item => item.source === source) && <option value={source}>{sourceName(source)}</option>}{data?.sources?.map(item => <option key={item.source} value={item.source}>{sourceName(item.source)} ({item.entries})</option>)}</select></label>
        {!!data?.tags?.length && <fieldset><legend>Tags</legend><select aria-label="Tag matching" value={tagsMatch} onChange={event => setTagsMatch(event.target.value as WMTagsMatch)}><option value="all">Match all selected tags</option><option value="any">Match any selected tag</option></select><div className="awm-tags">{data.tags.map(item => <button type="button" aria-pressed={tags.includes(item.value)} key={item.value} onClick={() => toggle(item.value, tags, setTags)}>{item.value} ({item.count})</button>)}</div></fieldset>}
        {!!data?.references?.length && <fieldset><legend>References — all selected must match</legend><div className="awm-tags">{data.references.map(item => <button type="button" aria-pressed={references.includes(item.value)} key={item.value} onClick={() => toggle(item.value, references, setReferences)}>{item.value} ({item.count})</button>)}</div></fieldset>}
        {data && data.tags === undefined && data.references === undefined && <p className="awm-help">Tag and reference filters were not supplied by the server.</p>}<button type="button" className="analyse-button" onClick={reset}>Reset filters</button>
      </div>
    </AnalyseControls>
    {current?.error && <div className="awm-error" role="alert"><span>{current.error}{data && ' Showing the previous snapshot.'}</span><button type="button" className="analyse-button" disabled={loading} onClick={() => void refresh()}>Retry</button></div>}
    <div className="awm-list-heading"><p role="status">{loading && !data ? 'Loading Working Memory…' : data ? `${filtered.length} shown from ${entries.length} returned records${loading ? ' · Refreshing…' : ''}` : 'Snapshot unavailable'}</p><button ref={snapshotOpener} type="button" className="analyse-button" disabled={!data} onClick={() => setSnapshotOpen(true)}>Snapshot analysis</button></div>
    <p className="awm-help">Activation is recorded retrieval strength, not confidence. “Focus” marks the snapshot’s selected memory, not necessarily Sapiens’ current thought.</p>
    {data && <><div className="awm-column-headings" aria-hidden="true"><span>Recorded memory</span><span>Origin</span><span>Activation</span><span>Last activated</span></div><ul className="awm-list" aria-label="Working Memory records">{filtered.map(entry => {
      const focused = entry.is_focus || entry.id === focusId;
      return <li key={`${entry.memory_source}:${entry.id}`}><button type="button" className="awm-row" onClick={event => { entryOpener.current = event.currentTarget; setSelected(entry); }} aria-haspopup="dialog">
        <span className="awm-row-content"><span className="awm-kind">{memoryKind(entry)}{focused && <span className="awm-focus-label">Focus</span>}</span><span className="awm-excerpt">{entry.content || 'Content not supplied. Open the memory reference.'}</span><span className="awm-row-tags">{entry.tags?.slice(0, 2).join(' · ')}{(entry.tags?.length ?? 0) > 2 && ` · +${entry.tags!.length - 2} tags`}</span></span>
        <OriginLine entry={entry} /><span className="awm-activation"><span className="awm-mobile-label">Activation </span>{activationLabel(entry)}</span><span className="awm-time"><span className="awm-mobile-label">Last activated </span><RecordedTime value={memoryTimes(entry).activated} /></span>
      </button></li>;
    })}</ul>{!filtered.length && <div className="awm-empty"><h2>{entries.length ? 'No matching memories' : filteredOnServer ? 'No memories match these filters' : 'No Working Memory records returned'}</h2><p>{entries.length ? 'Try a person, service or phrase from a memory.' : filteredOnServer ? 'Clear the filters to see the available snapshot.' : 'There is no saved context to inspect in this snapshot. You can refresh to check again.'}</p>{(search || filteredOnServer) && <button type="button" className="analyse-button" onClick={reset}>Clear search and filters</button>}</div>}</>}
    <Dialog.Root open={snapshotOpen && !!data} onOpenChange={setSnapshotOpen}><Dialog.Portal><Dialog.Overlay className="awm-overlay" /><Dialog.Content className="awm-dialog awm-snapshot" onCloseAutoFocus={event => { event.preventDefault(); snapshotOpener.current?.focus(); }}>{data && <SnapshotDetails data={data} shown={filtered.length} />}</Dialog.Content></Dialog.Portal></Dialog.Root>
    <Dialog.Root open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><Dialog.Portal><Dialog.Overlay className="awm-overlay" /><Dialog.Content className="awm-dialog awm-reader" onCloseAutoFocus={event => { event.preventDefault(); if (entryOpener.current?.isConnected) entryOpener.current.focus(); else snapshotOpener.current?.focus(); }}>{selected && <MemoryDetails entry={selected} focused={!!(selected.is_focus || selected.id === focusId)} openEngram={openEngram} />}</Dialog.Content></Dialog.Portal></Dialog.Root>
  </div>;
}
