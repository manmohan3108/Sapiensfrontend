import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BrainCircuit, ChevronDown, ChevronRight, Filter, Focus, Info, Loader2, RefreshCw, Search, SearchX, Sparkles } from 'lucide-react';
import { engramService } from '../../core/services/engramService';
import { useSapiensStore } from '../../core/state/sapiensStore';
import type { ApiError } from '../../types/apiTypes';
import type { WMEmbeddingFilter, WMEntry, WMOrder, WMQuery, WMResponse, WMSort, WMTagsMatch } from '../../types/engramTypes';

const SORT_OPTIONS: Array<[WMSort, string]> = [['last_used', 'Recently activated'], ['activation', 'Strongest activation'], ['recency', 'Recency score'], ['frequency', 'Activation count'], ['worth', 'Memory-unit worth'], ['created_at', 'Created time']];
const activationOf = (entry: WMEntry) => Math.min(1, Math.max(0, Number(entry.activation ?? entry.score ?? 0)));

function ageLabel(seconds?: number): string {
  if (seconds === undefined || !Number.isFinite(seconds)) return 'Age unknown';
  if (seconds < 60) return `${Math.round(seconds)}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
  return `${Math.round(seconds / 86400)}d ago`;
}

function absoluteTime(value?: string | null): string {
  if (!value) return 'Unknown';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function readablePairs(value?: Record<string, unknown> | string | null): Array<[string, string]> {
  if (!value) return [];
  if (typeof value === 'string') return [['value', value]];
  return Object.entries(value).map(([key, item]) => [key.replace(/_/g, ' '), typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)]);
}

function Stat({ label, value, title }: { label: string; value: React.ReactNode; title?: string }) {
  return <div className="min-w-0 rounded-lg border border-sp-line bg-sp-ink/[.025] px-2 py-1.5" title={title}><div className="truncate text-[8px] uppercase tracking-wider text-sp-muted">{label}</div><div className="mt-0.5 truncate font-mono text-[10px] text-sp-accent">{value}</div></div>;
}

function EntryCard({ entry, focusId }: { entry: WMEntry; focusId: string | null }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const activation = activationOf(entry);
  const pct = Math.round(activation * 100);
  const isFocus = entry.is_focus ?? entry.id === focusId;
  const tags = entry.tags ?? [];
  const references = entry.references ?? [];
  const provenance = readablePairs(entry.provenance);
  return <article className={`overflow-hidden rounded-xl border ${isFocus ? 'border-sp-accent/35 bg-sp-accent/[.08]' : 'border-sp-line bg-sp-ink/[.025]'}`}>
    <div className="p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded bg-sp-accent/[.08] px-1.5 py-0.5 text-[8px] font-mono text-sp-accent">{entry.memory_source || 'unknown source'}</span>
        {entry.memory_type && <span className="rounded bg-emerald-400/[.08] px-1.5 py-0.5 text-[8px] font-mono text-sp-success">{entry.memory_type}</span>}
        {isFocus && <span className="flex items-center gap-1 rounded bg-sp-accent/15 px-1.5 py-0.5 text-[8px] text-sp-accent" title="Highest-activation Working Memory entry; unrelated to Awareness focus"><Focus className="h-2 w-2" />WM focus</span>}
        <span className="ml-auto font-mono text-[8px] text-sp-muted">rank {entry.rank ?? '—'} · activation rank {entry.activation_rank ?? '—'}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-sp-ink">{entry.content || 'Content could not be resolved for this entry.'}</p>
      {tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{tags.map(tag => <span key={tag} className="rounded-full border border-sp-accent/15 bg-sp-accent/[.07] px-2 py-0.5 text-[8px] text-sp-accent">#{tag}</span>)}</div>}

      <div className="mt-3 flex items-end gap-2"><div className="min-w-0 flex-1"><div className="mb-1 flex items-center justify-between text-[8px]"><span className="text-sp-muted">Current activation</span><span className="font-mono text-sp-accent">{pct}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-sp-ink/[.06]" role="progressbar" aria-label={`Current activation ${pct}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><div className="h-full rounded-full bg-gradient-to-r from-sp-accent via-sp-accent to-sp-accent" style={{ width: `${pct}%` }} /></div></div><div className="text-right"><div className="text-[8px] text-sp-muted">Last activation</div><div className="font-mono text-[9px] text-sp-muted" title={absoluteTime(entry.last_used_at)}>{ageLabel(entry.age_seconds)}</div></div></div>
      <div className="mt-2 grid grid-cols-2 gap-1 text-[8px]"><div className="rounded bg-sp-ink/[.02] px-2 py-1"><span className="text-sp-muted">Activation count</span><div className="font-mono text-sp-muted">{entry.frequency ?? 'Unknown'}</div></div><div className="rounded bg-sp-ink/[.02] px-2 py-1"><span className="text-sp-muted">Last activation time</span><div className="truncate font-mono text-sp-muted" title={entry.last_used_at}>{absoluteTime(entry.last_used_at)}</div></div></div>

      {(entry.worth !== undefined || entry.memory_frequency !== undefined || entry.memory_recency_at) && <div className="mt-2 rounded-lg border border-emerald-400/10 bg-emerald-400/[.035] px-2 py-1.5"><div className="mb-1 text-[8px] uppercase tracking-wider text-sp-success">Durable memory-unit signals</div><div className="grid grid-cols-3 gap-1 text-[8px] text-sp-success"><span>Worth <b className="font-mono font-normal">{entry.worth ?? '—'}</b></span><span>Frequency <b className="font-mono font-normal">{entry.memory_frequency ?? '—'}</b></span><span className="truncate" title={entry.memory_recency_at}>Recency <b className="font-mono font-normal">{absoluteTime(entry.memory_recency_at)}</b></span></div></div>}

      <button onClick={() => setDetailsOpen(value => !value)} className="mt-2 flex w-full items-center justify-between rounded px-1.5 py-1 text-[9px] text-sp-muted hover:bg-sp-ink/5 hover:text-sp-ink" aria-expanded={detailsOpen}><span>Context and timestamps</span>{detailsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}</button>
    </div>
    {detailsOpen && <div className="space-y-2 border-t border-sp-line bg-sp-ink/5 px-3 py-2 text-[9px]">
      {references.length > 0 && <div><p className="mb-1 text-[8px] uppercase tracking-wider text-sp-muted">References</p><div className="flex flex-wrap gap-1">{references.map(reference => <span key={reference} className="rounded border border-sp-accent/15 px-1.5 py-0.5 text-sp-accent">{reference}</span>)}</div></div>}
      {provenance.length > 0 && <div><p className="mb-1 text-[8px] uppercase tracking-wider text-sp-muted">Provenance</p><dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-sp-muted">{provenance.map(([key, value]) => <><dt key={`${key}-key`} className="text-sp-muted">{key}</dt><dd key={`${key}-value`} className="break-words">{value}</dd></>)}</dl></div>}
      <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-sp-muted"><dt className="text-sp-muted">Event time</dt><dd>{absoluteTime(entry.event_at)}</dd><dt className="text-sp-muted">Created time</dt><dd>{absoluteTime(entry.created_at)}</dd><dt className="text-sp-muted">Last activation</dt><dd>{absoluteTime(entry.last_used_at)} ({ageLabel(entry.age_seconds)})</dd><dt className="text-sp-muted">Memory-unit recency</dt><dd>{absoluteTime(entry.memory_recency_at)}</dd></dl>
      <button onClick={() => setAdvancedOpen(value => !value)} className="flex items-center gap-1 text-[8px] text-sp-muted">{advancedOpen ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}Advanced diagnostics</button>
      {advancedOpen && <div className="space-y-2 rounded-lg border border-sp-line bg-sp-ink/5 p-2 text-[8px] text-sp-muted"><p className="break-all"><span className="text-sp-muted">ID:</span> {entry.id}</p><p><span className="text-sp-muted">Embedding cached:</span> {entry.has_embedding ? 'yes' : 'no'}</p><p><span className="text-sp-muted">Legacy pending field:</span> {entry.pending ? 'true' : 'false'} (compatibility only)</p>{entry.metadata && <><p className="text-sp-muted">Original metadata</p><pre className="max-h-36 overflow-auto whitespace-pre-wrap break-words">{JSON.stringify(entry.metadata, null, 2)}</pre></>}</div>}
    </div>}
  </article>;
}

export function MemoryPanel() {
  const currentSapiens = useSapiensStore(state => state.currentSapiens);
  const status = useSapiensStore(state => state.status);
  const previousStatus = useRef(status);
  const requestId = useRef(0);
  const [data, setData] = useState<WMResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagsMatch, setTagsMatch] = useState<WMTagsMatch>('all');
  const [references, setReferences] = useState<string[]>([]);
  const [minActivation, setMinActivation] = useState(0);
  const [focusOnly, setFocusOnly] = useState(false);
  const [embedding, setEmbedding] = useState<WMEmbeddingFilter>('all');
  const [sort, setSort] = useState<WMSort>('last_used');
  const [order, setOrder] = useState<WMOrder>('desc');
  const [limit, setLimit] = useState(100);
  const filtered = Boolean(source || tags.length || references.length || minActivation > 0 || focusOnly || embedding !== 'all' || search.trim());
  const query = useMemo<WMQuery>(() => ({ source: source || undefined, tags, tagsMatch, references, sort, order, limit, minActivation, focusOnly: focusOnly || undefined, hasEmbedding: embedding === 'all' ? undefined : embedding === 'with', includeContent: true, includeMetadata: true }), [source, tags, tagsMatch, references, sort, order, limit, minActivation, focusOnly, embedding]);

  const refresh = useCallback(async () => {
    if (!currentSapiens) return;
    const id = ++requestId.current;
    setLoading(true);
    try { const next = await engramService.getWorkingMemory(Number(currentSapiens.id), query); if (id === requestId.current) { setData(next); setError(null); } }
    catch (caught) { if (id === requestId.current) setError((caught as ApiError).message || 'Could not load Working Memory.'); }
    finally { if (id === requestId.current) setLoading(false); }
  }, [currentSapiens, query]);

  useEffect(() => { setData(null); setError(null); void refresh(); }, [refresh]);
  useEffect(() => { if (previousStatus.current === 'processing' && status !== 'processing') void refresh(); previousStatus.current = status; }, [status, refresh]);

  const entries = (data?.wm?.entries ?? []).filter((entry): entry is WMEntry => Boolean(entry));
  const matchingEntries = useMemo(() => { const needle = search.trim().toLocaleLowerCase(); return needle ? entries.filter(entry => [entry.content, entry.id, entry.memory_source, entry.memory_type, ...(entry.tags ?? []), ...(entry.references ?? [])].some(value => String(value ?? '').toLocaleLowerCase().includes(needle))) : entries; }, [entries, search]);
  const summary = data?.summary;
  const focusId = data?.wm?.focus_id ?? summary?.focus_id ?? null;
  const capacity = summary?.entries_capacity ?? data?.capacity?.global;
  const usage = capacity ? Math.min(100, Math.round(((summary?.entries_used ?? entries.length) / capacity) * 100)) : 0;
  const supportsLabels = data?.tags !== undefined || data?.references !== undefined || data?.filters?.tags !== undefined;
  const toggle = (value: string, current: string[], set: (values: string[]) => void) => set(current.includes(value) ? current.filter(item => item !== value) : [...current, value]);

  return <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-sp-accent/20 bg-[#080c16]/90 shadow-2xl backdrop-blur-2xl">
    <div className="h-[3px] flex-shrink-0 bg-gradient-to-r from-sp-accent via-sp-accent to-sp-accent" />
    <header className="flex flex-shrink-0 items-center gap-3 border-b border-sp-accent/10 bg-sp-accent/[.05] px-4 py-3"><div className="flex h-8 w-8 items-center justify-center rounded-xl border border-sp-accent/25 bg-sp-accent/10"><BrainCircuit className="h-4 w-4 text-sp-accent" /></div><div className="min-w-0 flex-1"><p className="text-sm text-sp-ink">Working Memory</p><p className="truncate text-[10px] text-sp-accent">Retained entries available for retrieval</p></div><button onClick={() => setFiltersOpen(value => !value)} className={`rounded-lg p-2 ${filtersOpen || filtered ? 'bg-sp-accent/10 text-sp-accent' : 'text-sp-muted hover:bg-sp-ink/5'}`} aria-label="Working Memory filters" aria-expanded={filtersOpen}><Filter className="h-3.5 w-3.5" /></button><button onClick={() => void refresh()} disabled={loading} className="rounded-lg p-2 text-sp-muted hover:bg-sp-ink/5 hover:text-sp-muted disabled:opacity-40" aria-label="Refresh Working Memory snapshot"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /></button></header>

    {filtersOpen && <section className="flex-shrink-0 space-y-2 border-b border-sp-line bg-sp-ink/5 p-3 text-[9px]" aria-label="Filters">
      <div className="grid grid-cols-2 gap-2"><label><span className="text-sp-muted">Source</span><select value={source} onChange={event => setSource(event.target.value)} className="mt-1 w-full rounded-md border border-sp-line bg-sp-panel px-2 py-1.5 text-sp-ink"><option value="">All sources</option>{(data?.sources ?? []).map(item => <option key={item.source} value={item.source}>{item.source} ({item.entries})</option>)}</select></label><label><span className="text-sp-muted">Sort</span><select value={sort} onChange={event => setSort(event.target.value as WMSort)} className="mt-1 w-full rounded-md border border-sp-line bg-sp-panel px-2 py-1.5 text-sp-ink">{SORT_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
      {(data?.tags?.length ?? 0) > 0 && <div><div className="flex items-center justify-between"><span className="text-sp-muted">Tags</span><select value={tagsMatch} onChange={event => setTagsMatch(event.target.value as WMTagsMatch)} className="rounded border border-sp-line bg-sp-panel px-1 py-0.5 text-[8px] text-sp-muted"><option value="all">Match all</option><option value="any">Match any</option></select></div><div className="mt-1 flex max-h-16 flex-wrap gap-1 overflow-y-auto">{data?.tags?.map(item => <button key={item.value} onClick={() => toggle(item.value, tags, setTags)} className={`rounded-full border px-2 py-0.5 ${tags.includes(item.value) ? 'border-sp-accent/35 bg-sp-accent/15 text-sp-accent' : 'border-sp-line text-sp-muted'}`}>#{item.value} · {item.count}</button>)}</div></div>}
      <button onClick={() => setAdvancedFiltersOpen(value => !value)} className="flex items-center gap-1 text-[8px] text-sp-muted">{advancedFiltersOpen ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}Advanced filters</button>
      {advancedFiltersOpen && <div className="space-y-2 rounded-lg border border-sp-line p-2"><div className="grid grid-cols-2 gap-2"><label><span className="text-sp-muted">Embedding</span><select value={embedding} onChange={event => setEmbedding(event.target.value as WMEmbeddingFilter)} className="mt-1 w-full rounded-md border border-sp-line bg-sp-panel px-2 py-1.5 text-sp-ink"><option value="all">Any</option><option value="with">Cached</option><option value="without">Not cached</option></select></label><label><span className="text-sp-muted">Order</span><select value={order} onChange={event => setOrder(event.target.value as WMOrder)} className="mt-1 w-full rounded-md border border-sp-line bg-sp-panel px-2 py-1.5 text-sp-ink"><option value="desc">Descending</option><option value="asc">Ascending</option></select></label></div><label><span className="flex justify-between text-sp-muted"><span>Minimum activation</span><span>{Math.round(minActivation * 100)}%</span></span><input type="range" min="0" max="1" step="0.05" value={minActivation} onChange={event => setMinActivation(Number(event.target.value))} className="mt-1 w-full accent-violet-400" /></label><div className="flex items-center justify-between"><label className="flex items-center gap-2 text-sp-muted"><input type="checkbox" checked={focusOnly} onChange={event => setFocusOnly(event.target.checked)} className="accent-violet-500" />WM focus only</label><label className="flex items-center gap-1 text-sp-muted">Limit <select value={limit} onChange={event => setLimit(Number(event.target.value))} className="rounded border border-sp-line bg-sp-panel px-1 py-0.5 text-sp-muted">{[10, 25, 50, 100].map(value => <option key={value}>{value}</option>)}</select></label></div>{(data?.references?.length ?? 0) > 0 && <div><span className="text-sp-muted">References (all selected must match)</span><div className="mt-1 flex max-h-20 flex-wrap gap-1 overflow-y-auto">{data?.references?.map(item => <button key={item.value} onClick={() => toggle(item.value, references, setReferences)} className={`rounded border px-1.5 py-0.5 ${references.includes(item.value) ? 'border-sp-accent/35 bg-sp-accent/10 text-sp-accent' : 'border-sp-line text-sp-muted'}`}>{item.value} · {item.count}</button>)}</div></div>}</div>}
      {!supportsLabels && <p className="rounded border border-amber-300/10 bg-amber-300/[.04] px-2 py-1.5 text-sp-warning">This backend did not return tag/reference catalogs, so server label filtering is unavailable.</p>}
    </section>}

    {error && <div className="mx-3 mt-3 flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/[.07] px-3 py-2 text-[10px] text-sp-danger"><AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" /><span>{error}{data ? ' Showing the last successful snapshot.' : ''}</span></div>}
    <div className="relative mx-3 mt-3 flex-shrink-0"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-sp-muted" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search returned excerpts, IDs, tags…" className="w-full rounded-lg border border-sp-line bg-sp-ink/[.035] py-2 pl-8 pr-3 text-[10px] text-sp-ink outline-none placeholder:text-sp-muted focus:border-sp-accent/40" aria-label="Search returned Working Memory entries" /></div>
    <div className="min-h-0 flex-1 overflow-y-auto p-3">{!data && loading ? <div className="flex h-full items-center justify-center gap-2 text-xs text-sp-muted"><Loader2 className="h-4 w-4 animate-spin" />Loading Working Memory…</div> : !data ? <div className="flex h-full items-center justify-center"><button onClick={() => void refresh()} className="rounded-lg border border-sp-line px-3 py-2 text-xs text-sp-muted">Retry</button></div> : <div className="space-y-3">
      <section className="rounded-xl border border-sp-line bg-sp-ink/[.02] p-2.5"><div className="grid grid-cols-4 gap-1.5"><Stat label="Used" value={summary?.entries_used ?? '—'} title="Entries in the full Working Memory snapshot" /><Stat label="Server match" value={summary?.entries_matching ?? '—'} title="Entries matching server filters before the limit" /><Stat label="Returned" value={summary?.entries_returned ?? entries.length} /><Stat label="Local match" value={matchingEntries.length} title="Returned excerpts matching this browser search" /></div>{capacity != null && <div className="mt-2"><div className="mb-1 flex justify-between text-[8px] text-sp-muted"><span>Global capacity</span><span>{summary?.entries_used ?? 0} / {capacity} · {usage}%</span></div><div className="h-1 overflow-hidden rounded-full bg-sp-ink/[.06]"><div className="h-full rounded-full bg-sp-accent" style={{ width: `${usage}%` }} /></div></div>}<div className="mt-2 grid grid-cols-3 gap-1.5"><Stat label="Average strength" value={`${Math.round((summary?.average_activation ?? 0) * 100)}%`} /><Stat label="Strongest" value={`${Math.round((summary?.max_activation ?? 0) * 100)}%`} /><Stat label="Embeddings" value={summary?.embedded ?? '—'} title="Entries with a cached embedding" /></div></section>
      <p className="flex gap-1.5 rounded-lg border border-sp-accent/10 bg-sp-accent/[.035] px-2.5 py-2 text-[9px] leading-relaxed text-sp-accent"><Info className="mt-0.5 h-3 w-3 flex-shrink-0" />Activation is current Working Memory strength: it rises when activated and decays over time. It is not confidence or factual truth. “WM focus” is simply the highest-activation entry, not Awareness’s current thought. This snapshot cannot prove what an LLM used or why an entry disappeared.</p>
      {(data.sources?.length ?? 0) > 0 && <section><p className="mb-1 text-[8px] uppercase tracking-wider text-sp-muted">Full snapshot by source</p><div className="flex flex-wrap gap-1.5">{data.sources?.map(item => <span key={item.source} className="rounded-md border border-sp-accent/10 bg-sp-accent/[.04] px-2 py-1 text-[8px] text-sp-accent">{item.source} <b className="font-mono font-normal text-sp-accent">{item.entries}</b>{item.focus ? ' · WM focus' : ''}</span>)}</div>{(data.timeline?.oldest_last_used_at || data.timeline?.newest_last_used_at) && <p className="mt-2 text-[8px] text-sp-muted">Last-activation range: {absoluteTime(data.timeline.oldest_last_used_at)} → {absoluteTime(data.timeline.newest_last_used_at)}</p>}</section>}
      {matchingEntries.length === 0 ? <div className="flex min-h-52 flex-col items-center justify-center gap-3 px-5 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sp-line bg-sp-ink/[.03]">{filtered ? <SearchX className="h-5 w-5 text-sp-muted" /> : <Sparkles className="h-5 w-5 text-sp-muted" />}</div><p className="max-w-60 text-xs leading-relaxed text-sp-muted">{search.trim() ? `No returned excerpt matches “${search.trim()}”. Clear the browser search or adjust server filters.` : filtered ? 'No entries match the current server filters.' : 'Working Memory is empty.'}</p></div> : <section className="space-y-2" aria-label="Working Memory entries">{matchingEntries.map(entry => <EntryCard key={`${entry.memory_source}:${entry.id}`} entry={entry} focusId={focusId} />)}</section>}
    </div>}</div>
  </div>;
}
