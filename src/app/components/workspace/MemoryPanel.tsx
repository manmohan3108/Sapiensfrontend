import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, BrainCircuit, ChevronDown, ChevronRight, Clock3, Filter, Focus, Loader2, RefreshCw, Search, SearchX, Sparkles } from 'lucide-react';
import { engramService } from '../../core/services/engramService';
import { useSapiensStore } from '../../core/state/sapiensStore';
import type { ApiError } from '../../types/apiTypes';
import type { WMEmbeddingFilter, WMEntry, WMOrder, WMQuery, WMResponse, WMSort } from '../../types/engramTypes';

const SORT_OPTIONS: Array<[WMSort, string]> = [['last_used', 'Recently used'], ['activation', 'Activation'], ['recency', 'Recency'], ['frequency', 'WM frequency'], ['worth', 'Unit worth'], ['created_at', 'Created']];
const activationOf = (entry: WMEntry) => Math.min(1, Math.max(0, entry.activation ?? entry.score ?? 0));

function relativeTime(value?: string | number | null): string {
  if (value === undefined || value === null || value === '') return 'Unavailable';
  if (typeof value === 'number') {
    const seconds = Math.max(0, value);
    if (seconds < 60) return `${Math.round(seconds)}s ago`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`;
    return `${Math.round(seconds / 86400)}d ago`;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : relativeTime((Date.now() - date.getTime()) / 1000);
}

function dateTime(value?: string | null): string {
  if (!value) return 'Unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function compactObject(value?: Record<string, unknown> | string | null): string[] {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  return Object.entries(value).slice(0, 8).map(([key, item]) => {
    const rendered = typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item);
    return `${key.replace(/_/g, ' ')}: ${rendered.length > 100 ? `${rendered.slice(0, 100)}…` : rendered}`;
  });
}

function Stat({ label, value, title }: { label: string; value: React.ReactNode; title?: string }) {
  return <div className="min-w-0 rounded-lg border border-white/[.06] bg-white/[.025] px-2 py-1.5" title={title}><div className="truncate text-[8px] uppercase tracking-wider text-white/25">{label}</div><div className="mt-0.5 truncate font-mono text-[10px] text-violet-200/75">{value}</div></div>;
}

function EntryCard({ entry, focusId }: { entry: WMEntry; focusId: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const activation = activationOf(entry);
  const pct = Math.round(activation * 100);
  const isFocus = entry.is_focus ?? entry.id === focusId;
  const details = [...compactObject(entry.timeline), ...compactObject(entry.provenance), ...compactObject(entry.metadata)];
  return <article className={`overflow-hidden rounded-xl border ${isFocus ? 'border-violet-400/35 bg-violet-400/[.08]' : 'border-white/[.07] bg-white/[.025]'}`}>
    <div className="p-3">
      <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded bg-cyan-400/[.08] px-1.5 py-0.5 text-[8px] font-mono text-cyan-200/65">{entry.memory_source || 'unknown source'}</span>
        {entry.memory_type && <span className="rounded bg-emerald-400/[.08] px-1.5 py-0.5 text-[8px] font-mono text-emerald-200/65">{entry.memory_type}</span>}
        {isFocus && <span className="flex items-center gap-1 rounded bg-violet-400/15 px-1.5 py-0.5 text-[8px] text-violet-200"><Focus className="h-2 w-2" />focus</span>}
        {entry.pending && <span className="rounded bg-amber-400/10 px-1.5 py-0.5 text-[8px] text-amber-200/70">pending</span>}
        {entry.has_embedding !== undefined && <span className="text-[8px] text-white/25">embedding {entry.has_embedding ? '✓' : '—'}</span>}
        <span className="ml-auto font-mono text-[8px] text-white/20">#{entry.rank ?? entry.activation_rank ?? '—'}</span>
      </div><p className="mt-2 line-clamp-3 whitespace-pre-wrap break-words text-[11px] leading-relaxed text-white/60">{entry.content || 'Content was not included for this entry.'}</p><p className="mt-1 truncate font-mono text-[8px] text-white/18" title={entry.id}>{entry.id}</p></div><span className="font-mono text-sm tabular-nums text-violet-200">{pct}%</span></div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.06]" role="progressbar" aria-label={`Activation ${pct}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><div className="h-full rounded-full bg-gradient-to-r from-violet-600 via-violet-400 to-cyan-300" style={{ width: `${pct}%` }} /></div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-[8px]"><div><span className="text-white/22">WM frequency</span><div className="font-mono text-white/55">{entry.frequency ?? '—'}</div></div><div><span className="text-white/22">Last used</span><div className="truncate font-mono text-white/55" title={entry.last_used_at}>{relativeTime(entry.last_used_at ?? entry.last_used ?? entry.age_seconds)}</div></div><div><span className="text-white/22">Event</span><div className="truncate font-mono text-white/55" title={entry.event_at}>{dateTime(entry.event_at)}</div></div></div>
      {(entry.worth !== undefined || entry.memory_frequency !== undefined || entry.memory_recency_at) && <div className="mt-2 rounded-lg border border-emerald-400/10 bg-emerald-400/[.035] px-2 py-1.5"><div className="mb-1 text-[8px] uppercase tracking-wider text-emerald-200/35">Durable memory unit signals</div><div className="grid grid-cols-3 gap-1 text-[8px] text-emerald-100/55"><span>Worth <b className="font-mono font-normal">{entry.worth ?? '—'}</b></span><span>Frequency <b className="font-mono font-normal">{entry.memory_frequency ?? '—'}</b></span><span className="truncate" title={entry.memory_recency_at}>Recency <b className="font-mono font-normal">{relativeTime(entry.memory_recency_at)}</b></span></div></div>}
      <div className="mt-2 flex items-center justify-between gap-2"><span className="truncate text-[8px] text-white/22" title={entry.created_at}>Created {relativeTime(entry.created_at)}</span><button onClick={() => setExpanded(value => !value)} className="flex items-center gap-1 rounded px-1.5 py-1 text-[9px] text-white/35 hover:bg-white/5 hover:text-white/65" aria-expanded={expanded}>{expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />} Details</button></div>
    </div>
    {expanded && <div className="border-t border-white/[.05] bg-black/10 px-3 py-2">{details.length ? <div className="space-y-1 text-[9px] leading-relaxed text-white/40">{details.map((line, index) => <div key={`${line}-${index}`} className="break-words">{line}</div>)}</div> : <p className="text-[9px] italic text-white/22">Timeline, provenance, and metadata were not included.</p>}</div>}
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
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [minActivation, setMinActivation] = useState(0);
  const [focusOnly, setFocusOnly] = useState(false);
  const [embedding, setEmbedding] = useState<WMEmbeddingFilter>('all');
  const [sort, setSort] = useState<WMSort>('last_used');
  const [order, setOrder] = useState<WMOrder>('desc');
  const [limit, setLimit] = useState(100);
  const filtered = Boolean(source || minActivation > 0 || focusOnly || embedding !== 'all' || search.trim());
  const query = useMemo<WMQuery>(() => ({ source: source || undefined, sort, order, limit, minActivation, focusOnly: focusOnly || undefined, hasEmbedding: embedding === 'all' ? undefined : embedding === 'with', includeContent: true, includeMetadata: true }), [source, sort, order, limit, minActivation, focusOnly, embedding]);

  const refresh = useCallback(async () => {
    if (!currentSapiens) return;
    const id = ++requestId.current;
    setLoading(true);
    try { const next = await engramService.getWorkingMemory(Number(currentSapiens.id), query); if (id === requestId.current) { setData(next); setError(null); } }
    catch (caught) { if (id === requestId.current) setError((caught as ApiError).message || 'Could not load working memory.'); }
    finally { if (id === requestId.current) setLoading(false); }
  }, [currentSapiens, query]);

  useEffect(() => { setData(null); setError(null); void refresh(); }, [refresh]);
  useEffect(() => { if (previousStatus.current === 'processing' && status !== 'processing') void refresh(); previousStatus.current = status; }, [status, refresh]);

  const entries = (data?.wm?.entries ?? []).filter((entry): entry is WMEntry => Boolean(entry));
  const matchingEntries = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return entries;
    return entries.filter(entry => [entry.content, entry.id, entry.memory_source, entry.memory_type]
      .some(value => String(value ?? '').toLocaleLowerCase().includes(needle)));
  }, [entries, search]);
  const focusId = data?.wm?.focus_id ?? data?.summary?.focus_id ?? null;
  const activations = entries.map(activationOf);
  const summary = data?.summary;
  const pending = summary?.pending_count ?? entries.filter(entry => entry.pending).length;
  const embedded = summary?.embedded_count ?? entries.filter(entry => entry.has_embedding).length;
  const avg = summary?.activation_avg ?? (activations.length ? activations.reduce((a, b) => a + b, 0) / activations.length : 0);
  const min = summary?.activation_min ?? (activations.length ? Math.min(...activations) : 0);
  const max = summary?.activation_max ?? (activations.length ? Math.max(...activations) : 0);
  const filterCounts = data?.filters as { total?: number; total_count?: number; matching_count?: number; returned_count?: number } | undefined;
  const totalCount = summary?.total_count ?? summary?.total_entries ?? summary?.total ?? filterCounts?.total_count ?? filterCounts?.total ?? summary?.entry_count ?? entries.length;
  const returnedCount = summary?.returned_count ?? filterCounts?.returned_count ?? entries.length;
  const sourceCounts = useMemo(() => {
    if (data?.sources && !Array.isArray(data.sources)) return data.sources;
    if (Array.isArray(data?.sources)) return Object.fromEntries(data.sources.map(item => [item.source, item.count]));
    return entries.reduce<Record<string, number>>((counts, entry) => { counts[entry.memory_source] = (counts[entry.memory_source] ?? 0) + 1; return counts; }, {});
  }, [data?.sources, entries]);

  return <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-violet-400/20 bg-[#080c16]/90 shadow-2xl backdrop-blur-2xl">
    <div className="h-[3px] flex-shrink-0 bg-gradient-to-r from-violet-800 via-violet-400 to-cyan-500" />
    <header className="flex flex-shrink-0 items-center gap-3 border-b border-violet-400/10 bg-violet-400/[.05] px-4 py-3"><div className="flex h-8 w-8 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-400/10"><BrainCircuit className="h-4 w-4 text-violet-300" /></div><div className="min-w-0 flex-1"><p className="text-sm text-white/85">Working Memory</p><p className="truncate text-[10px] text-violet-300/45">Active context for the next response</p></div><button onClick={() => setFiltersOpen(value => !value)} className={`rounded-lg p-2 ${filtersOpen || filtered ? 'bg-violet-400/10 text-violet-200' : 'text-white/30 hover:bg-white/5'}`} aria-label="Working memory filters" aria-expanded={filtersOpen}><Filter className="h-3.5 w-3.5" /></button><button onClick={() => void refresh()} disabled={loading} className="rounded-lg p-2 text-white/30 hover:bg-white/5 hover:text-white/60 disabled:opacity-40" aria-label="Refresh working memory"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /></button></header>

    {filtersOpen && <section className="grid flex-shrink-0 grid-cols-2 gap-2 border-b border-white/[.05] bg-black/10 p-3 text-[9px] sm:grid-cols-3" aria-label="Filters">
      <label className="col-span-2 sm:col-span-1"><span className="text-white/28">Source</span><input value={source} onChange={event => setSource(event.target.value)} placeholder="All sources" className="mt-1 w-full rounded-md border border-white/[.08] bg-white/[.04] px-2 py-1.5 text-white/65 outline-none focus:border-violet-400/40" /></label>
      <label><span className="text-white/28">Sort</span><select value={sort} onChange={event => setSort(event.target.value as WMSort)} className="mt-1 w-full rounded-md border border-white/[.08] bg-[#101421] px-2 py-1.5 text-white/65">{SORT_OPTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label><span className="text-white/28">Order</span><select value={order} onChange={event => setOrder(event.target.value as WMOrder)} className="mt-1 w-full rounded-md border border-white/[.08] bg-[#101421] px-2 py-1.5 text-white/65"><option value="desc">Descending</option><option value="asc">Ascending</option></select></label>
      <label><span className="text-white/28">Embedding</span><select value={embedding} onChange={event => setEmbedding(event.target.value as WMEmbeddingFilter)} className="mt-1 w-full rounded-md border border-white/[.08] bg-[#101421] px-2 py-1.5 text-white/65"><option value="all">Any</option><option value="with">With embedding</option><option value="without">Without embedding</option></select></label>
      <label><span className="text-white/28">Limit</span><select value={limit} onChange={event => setLimit(Number(event.target.value))} className="mt-1 w-full rounded-md border border-white/[.08] bg-[#101421] px-2 py-1.5 text-white/65">{[10, 25, 50, 100].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="col-span-2 sm:col-span-1"><span className="flex justify-between text-white/28"><span>Min activation</span><span>{Math.round(minActivation * 100)}%</span></span><input type="range" min="0" max="1" step="0.05" value={minActivation} onChange={event => setMinActivation(Number(event.target.value))} className="mt-2 w-full accent-violet-400" /></label>
      <label className="col-span-2 flex items-center gap-2 text-white/45 sm:col-span-3"><input type="checkbox" checked={focusOnly} onChange={event => setFocusOnly(event.target.checked)} className="accent-violet-500" />Focus only</label>
    </section>}
    {error && <div className="mx-3 mt-3 flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/[.07] px-3 py-2 text-[10px] text-red-300/80"><AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" /><span>{error}{data ? ' Showing the last successful view.' : ''}</span></div>}
    <div className="relative mx-3 mt-3 flex-shrink-0"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/25" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search content, ID, source, or type" className="w-full rounded-lg border border-white/[.08] bg-white/[.035] py-2 pl-8 pr-3 text-[10px] text-white/70 outline-none placeholder:text-white/20 focus:border-violet-400/40" aria-label="Search returned working memory entries" /></div>
    <div className="min-h-0 flex-1 overflow-y-auto p-3">{!data && loading ? <div className="flex h-full items-center justify-center gap-2 text-xs text-white/25"><Loader2 className="h-4 w-4 animate-spin" />Loading working memory…</div> : !data ? <div className="flex h-full items-center justify-center"><button onClick={() => void refresh()} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/45">Try again</button></div> : <div className="space-y-3">
      <section className="grid grid-cols-3 gap-1.5" aria-label="Working memory status"><Stat label="Total" value={totalCount} title="Total entries reported by Working Memory" /><Stat label="Matching" value={matchingEntries.length} title="Entries matching the local text search" /><Stat label="Returned" value={returnedCount} title={`Entries returned by the server (request limit ${limit})`} /><Stat label="Capacity" value={data.capacity?.global ?? '—'} /><Stat label="Focus" value={summary?.focus_count ?? entries.filter(entry => entry.is_focus ?? entry.id === focusId).length} title={focusId ?? undefined} /><Stat label="Pending" value={pending} /><Stat label="Embedded" value={embedded} /><Stat label="Activation" value={`${Math.round(min * 100)}–${Math.round(max * 100)}% · μ${Math.round(avg * 100)}%`} /><Stat label="Version" value={summary?.activation_version ?? '—'} /></section>
      {(totalCount > returnedCount || returnedCount >= limit) && <p className="rounded-lg border border-amber-400/15 bg-amber-400/[.05] px-2.5 py-2 text-[9px] leading-relaxed text-amber-100/55">The server returned {returnedCount} of {totalCount} entries (limit {limit}). Use the server filters to inspect entries outside this result set.</p>}
      {(Object.keys(sourceCounts).length > 0 || data.timeline?.earliest || data.timeline?.latest) && <section className="rounded-xl border border-white/[.06] bg-white/[.02] p-2.5"><div className="flex flex-wrap gap-1.5">{Object.entries(sourceCounts).map(([name, count]) => <span key={name} className="rounded-md border border-cyan-400/10 bg-cyan-400/[.04] px-2 py-1 text-[8px] text-cyan-100/50">{name} <b className="font-mono font-normal text-cyan-200/75">{count}</b></span>)}</div>{(data.timeline?.earliest || data.timeline?.latest) && <div className="mt-2 flex items-center gap-1.5 text-[8px] text-white/25"><Clock3 className="h-2.5 w-2.5" /><span className="truncate" title={`${data.timeline?.earliest ?? ''} — ${data.timeline?.latest ?? ''}`}>{dateTime(data.timeline?.earliest)} → {dateTime(data.timeline?.latest)}</span></div>}</section>}
      {matchingEntries.length === 0 ? <div className="flex min-h-52 flex-col items-center justify-center gap-3 px-5 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[.07] bg-white/[.03]">{filtered ? <SearchX className="h-5 w-5 text-white/15" /> : <Sparkles className="h-5 w-5 text-white/15" />}</div><p className="max-w-56 text-xs leading-relaxed text-white/30">{search.trim() ? `No returned entries match “${search.trim()}”.` : filtered ? 'No entries match the current server filters.' : 'Working memory is empty. Active context will appear here as Sapiens works.'}</p></div> : <section className="space-y-2" aria-label="Working memory entries">{matchingEntries.map(entry => <EntryCard key={entry.id} entry={entry} focusId={focusId} />)}</section>}
    </div>}</div>
  </div>;
}
