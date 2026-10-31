import { AnalyseControls } from '../components/analyse/AnalyseControls';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  Activity, AlertCircle, ArrowLeft, ArrowRight, ChevronDown, CircleDot, Copy,
  GitBranch, Loader2, Search, ShieldOff, X,
} from 'lucide-react';
import { useSapiensStore } from '../core/state/sapiensStore';
import { engineBusService } from '../core/services/engineBusService';
import type { EngineBusSignal, EngineBusSignalDetailResponse, EngineBusSignalFilters } from '../types/engineBusTypes';

const accent = '#34d399';
const signalKey = (signal: EngineBusSignal) => JSON.stringify([signal.run_id ?? null, signal.id]);
const runFilter = (runId: string | null): EngineBusSignalFilters => runId ? { scope: 'run', run_id: runId } : { scope: 'normal' };
const fieldClass = 'h-9 w-full rounded-lg border border-white/10 bg-[#101421] px-3 text-xs text-slate-100 outline-none placeholder:text-white/25 focus:border-emerald-400/50';
const presets = { '15m': 15 * 60_000, '1h': 60 * 60_000, '6h': 6 * 60 * 60_000, '24h': 24 * 60 * 60_000 } as const;

function errorText(error: unknown) {
  const value = error as { status?: number; message?: string };
  if (value?.status === 503) return 'Engine Bus monitoring is unavailable. The runtime may not have monitoring enabled.';
  if (value?.status === 400) return 'One or more filters are invalid. Check dates and exact-match values.';
  if (value?.status === 409) return 'This ID belongs to more than one run. Select a run first.';
  if (value?.status === 404) return 'This signal is no longer available for the selected Sapiens.';
  return value?.message || 'Could not load Engine Bus activity.';
}

function dateLabel(value: string | null, full = false) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat(undefined, full
    ? { dateStyle: 'medium', timeStyle: 'medium' }
    : { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date);
}

function shortId(value: string | null) { return value ? (value.length > 13 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value) : '—'; }
function validIso(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

const statusStyle: Record<string, { color: string; bg: string }> = {
  completed: { color: '#6ee7b7', bg: 'rgba(52,211,153,.1)' }, delivered: { color: '#6ee7b7', bg: 'rgba(52,211,153,.1)' },
  pending: { color: '#fcd34d', bg: 'rgba(251,191,36,.1)' }, delivering: { color: '#67e8f9', bg: 'rgba(34,211,238,.1)' },
  failed: { color: '#fca5a5', bg: 'rgba(248,113,113,.1)' }, timed_out: { color: '#fdba74', bg: 'rgba(251,146,60,.1)' },
  expired: { color: '#c4b5fd', bg: 'rgba(167,139,250,.1)' },
};

function Status({ value }: { value: string }) {
  const style = statusStyle[value] ?? { color: '#cbd5e1', bg: 'rgba(148,163,184,.1)' };
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium" style={{ color: style.color, background: style.bg, border: `1px solid ${style.color}30` }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: style.color }} />{value.replaceAll('_', ' ')}</span>;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  return <button aria-label={`Copy ${label}`} title={`Copy ${label}`} onClick={() => void navigator.clipboard.writeText(value)} className="rounded p-1 text-white/25 hover:bg-white/5 hover:text-white/70"><Copy className="h-3 w-3" /></button>;
}

function Meta({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return <div><dt className="text-[10px] uppercase tracking-wider text-white/28">{label}</dt><dd className={`mt-1 break-words text-xs text-white/68 ${mono ? 'font-mono' : ''}`}>{value}</dd></div>;
}

export function EngineBusPage({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useNavigate();
  const currentSapiens = useSapiensStore(state => state.currentSapiens);
  const [params, setParams] = useSearchParams();
  const [signals, setSignals] = useState<EngineBusSignal[]>([]);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState('');
  const [selectedData, setSelected] = useState<EngineBusSignalDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [flow, setFlow] = useState<EngineBusSignal[] | null>(null);
  const [flowLoading, setFlowLoading] = useState(false);
  const [draftId, setDraftId] = useState('');
  const detailRef = useRef<HTMLElement>(null);
  const detailOpener = useRef<HTMLElement | null>(null);
  const detailRequest = useRef(0);
  const flowRequest = useRef(0);
  const listRequest = useRef(0);
  const pageSince = useRef<string | undefined>(undefined);
  const [loadedScope, setLoadedScope] = useState('');
  const [detailScope, setDetailScope] = useState('');
  const requestScope = JSON.stringify([currentSapiens?.id, params.toString()]);
  const activeScope = useRef(requestScope);
  activeScope.current = requestScope;
  const selected = detailScope === requestScope ? selectedData : null;
  useEffect(() => { if (selected || detailError || detailLoading) detailRef.current?.focus({ preventScroll: false }); }, [selected?.signal.id, detailError, detailLoading]);
  const closeDetail = () => { detailRequest.current++; flowRequest.current++; setSelected(null); setFlow(null); setDetailError(''); setDetailLoading(false); setFlowLoading(false); requestAnimationFrame(() => detailOpener.current?.isConnected && detailOpener.current.focus()); };

  const sapienId = currentSapiens?.id;
  const preset = params.get('range') || 'all';
  const scope = params.get('busScope') || (params.get('busRun') ? 'run' : 'all');
  const runId = params.get('busRun') || '';
  const customFrom = params.get('from') || '';
  const customTo = params.get('to') || '';


  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  const serverFilters = useMemo<EngineBusSignalFilters>(() => ({
    scope: scope as EngineBusSignalFilters['scope'],
    run_id: scope === 'run' ? runId : undefined,
    time_field: 'published_at',
    name: params.get('name') || undefined,
    producer: params.get('producer') || undefined,
    target: params.get('target') || undefined,
    status: params.get('status') || undefined,
    correlation_id: params.get('correlation') || undefined,
    limit: 50,
    before: preset === 'custom' ? validIso(customTo) : undefined,
  }), [params, preset, customTo, scope, runId]);

  const load = useCallback(async (older = false) => {
    if (!sapienId) return;
    const request = ++listRequest.current;
    const isCurrent = () => request === listRequest.current && activeScope.current === requestScope;
    if (scope === 'run' && !runId.trim()) {
      setSignals([]); setNextBefore(null); setError(''); setLoading(false); setLoadingOlder(false);
      return;
    }
    older ? setLoadingOlder(true) : setLoading(true);
    setError('');
    if (!older) {
      setLoadedScope(requestScope);
      pageSince.current = preset === 'custom' ? validIso(customFrom)
        : preset === 'all' ? undefined
        : new Date(Date.now() - (presets[preset as keyof typeof presets] ?? presets['1h'])).toISOString();
    }
    try {
      const response = await engineBusService.list(sapienId, { ...serverFilters, since: pageSince.current, before: older ? nextBefore ?? undefined : serverFilters.before });
      if (!isCurrent()) return;
      setSignals(current => older ? [...current, ...response.signals.filter(item => !current.some(existing => signalKey(existing) === signalKey(item)))] : response.signals);
      setLoadedScope(requestScope);
      setNextBefore(response.next_before);
    } catch (err) { if (isCurrent()) { setError(errorText(err)); if (!older) setSignals([]); } }
    finally { if (isCurrent()) { setLoading(false); setLoadingOlder(false); } }
  }, [sapienId, serverFilters, nextBefore, requestScope, scope, runId, preset, customFrom]);

  useEffect(() => { if (!currentSapiens) navigate('/'); }, [currentSapiens, navigate]);
  useEffect(() => {
    setSignals([]); setNextBefore(null); setSelected(null); setFlow(null);
    setDetailError(''); setDetailLoading(false); setFlowLoading(false);
    detailRequest.current++; flowRequest.current++;
    void load(false);
    return () => { listRequest.current++; detailRequest.current++; flowRequest.current++; };
  }, [requestScope]); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleSignals = loadedScope === requestScope ? signals : [];
  const visibleError = loadedScope === requestScope ? error : '';
  const showDetail = detailScope === requestScope && Boolean(selected || detailLoading || detailError);

  const openSignal = async (signalId: string, signalRun?: string | null) => {
    if (!sapienId) return;
    const request = ++detailRequest.current;
    const isCurrent = () => request === detailRequest.current && activeScope.current === requestScope;
    setDetailScope(requestScope);
    flowRequest.current++;
    if (!detailRef.current?.contains(document.activeElement)) detailOpener.current = document.activeElement as HTMLElement;
    setDetailLoading(true); setDetailError(''); setFlow(null); setFlowLoading(false);
    try { const detail = await engineBusService.detail(sapienId, signalId, signalRun === undefined ? { scope: serverFilters.scope, run_id: serverFilters.run_id } : runFilter(signalRun)); if (isCurrent()) setSelected(detail); }
    catch (err) { if (isCurrent()) { setSelected(null); setDetailError(errorText(err)); } }
    finally { if (isCurrent()) setDetailLoading(false); }
  };

  const openFlow = async (correlationId: string) => {
    if (!sapienId) return;
    const request = ++flowRequest.current;
    const isCurrent = () => request === flowRequest.current && activeScope.current === requestScope;
    setFlowLoading(true); setDetailError('');
    try { const result = await engineBusService.correlation(sapienId, correlationId, 200, undefined, runFilter(selected?.signal.run_id ?? null)); if (isCurrent()) setFlow(result.signals); }
    catch (err) { if (isCurrent()) setDetailError(errorText(err)); }
    finally { if (isCurrent()) setFlowLoading(false); }
  };

  if (!currentSapiens) return null;
  return <div className={embedded ? "h-full min-h-0 overflow-y-auto text-white" : "min-h-screen text-white"} style={{ background: '#060a15' }}>
    <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 10% 0%, rgba(52,211,153,.12), transparent 34%), radial-gradient(circle at 90% 70%, rgba(6,182,212,.08), transparent 38%), radial-gradient(rgba(148,163,184,.13) 1px, transparent 1px)', backgroundSize: 'auto, auto, 32px 32px' }} />
    {!embedded && <header className="sticky top-0 z-30 border-b border-white/[.07] bg-[#060a15]/90 backdrop-blur-xl"><div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} /><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 ring-1 ring-emerald-400/25"><Activity className="h-4 w-4 text-emerald-300" /></div><div><h1 className="text-sm font-semibold">Engine Bus monitor</h1><p className="text-[11px] text-white/35">{currentSapiens.name} · Sapien ID {currentSapiens.id} · cognitive signal flow</p></div></div><Link to="/workspace" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-white/45 hover:bg-white/5 hover:text-white/75"><ArrowLeft className="h-3.5 w-3.5" />Workspace</Link></div></header>}

    <main className={`relative mx-auto max-w-[1500px] ${embedded ? 'p-3' : 'px-4 py-5 sm:px-6'}`}>
      <AnalyseControls primary={<>
          <label><span className="mb-1 block text-[10px] text-white/35">Runtime</span><select className={fieldClass} value={scope} onChange={e => updateParam('busScope', e.target.value)}><option value="all">All runtimes</option><option value="normal">Normal runtime</option><option value="run">Specific run</option></select></label>
          {scope === 'run' && <label><span className="mb-1 block text-[10px] text-white/35">Run ID</span><input className={fieldClass} value={runId} onChange={e => updateParam('busRun', e.target.value)} placeholder="run-…" autoComplete="off" spellCheck={false} /></label>}
          <label><span className="mb-1 block text-[10px] text-white/35">Time range (real time)</span><select className={fieldClass} value={preset} onChange={e => updateParam('range', e.target.value)}><option value="all">All saved history</option><option value="15m">Last 15 minutes</option><option value="1h">Last hour</option><option value="6h">Last 6 hours</option><option value="24h">Last 24 hours</option><option value="custom">Custom range</option></select></label>          <label><span className="mb-1 block text-[10px] text-white/35">Publication status</span><select className={fieldClass} value={params.get('status') || ''} onChange={e => updateParam('status', e.target.value)}><option value="">All statuses</option><option value="pending">Pending</option><option value="completed">Completed</option><option value="expired">Expired</option></select></label>        {preset === 'custom' && <div className="mt-3 grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-[10px] text-white/35">From (real time)</span><input type="datetime-local" className={fieldClass} value={customFrom} onChange={e => updateParam('from', e.target.value)} /></label><label><span className="mb-1 block text-[10px] text-white/35">To (real time)</span><input type="datetime-local" className={fieldClass} value={customTo} onChange={e => updateParam('to', e.target.value)} /></label></div>}</>} filters={['name', 'producer', 'target', 'correlation'].filter(key => params.get(key)).map(key => ({ label: key + ': ' + params.get(key), onRemove: () => updateParam(key, '') }))} summary={"Newest first · real publication time"} onRefresh={() => void load(false)} busy={loading}>
        <p className="text-sm text-white/50">Includes saved simulation and normal-runtime signals. Filters use real publication time; details retain the event’s own time. Older simulations using in-memory transport have no saved Bus history.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label><span className="mb-1 block text-[10px] text-white/35">Signal name</span><input className={fieldClass} value={params.get('name') || ''} onChange={e => updateParam('name', e.target.value)} placeholder="awareness.attend" /></label>
          <label><span className="mb-1 block text-[10px] text-white/35">Producer</span><input className={fieldClass} value={params.get('producer') || ''} onChange={e => updateParam('producer', e.target.value)} placeholder="conversation_engine" /></label>
          <label><span className="mb-1 block text-[10px] text-white/35">Target</span><input className={fieldClass} value={params.get('target') || ''} onChange={e => updateParam('target', e.target.value)} placeholder="awareness_engine" /></label>

          <label><span className="mb-1 block text-[10px] text-white/35">Correlation ID</span><input className={fieldClass} value={params.get('correlation') || ''} onChange={e => updateParam('correlation', e.target.value)} placeholder="Exact flow ID" /></label>

        </div>

      </AnalyseControls>

      <div className={`engine-bus-layout ${showDetail ? 'has-detail' : ''}`}>
        <section className="overflow-hidden rounded-2xl border border-white/[.08] bg-[#0a111f]/88">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[.07] px-4 py-3"><div><h2 className="text-xs font-medium text-white/75">Signal timeline</h2><p className="mt-0.5 text-[10px] text-white/28">Newest first · {visibleSignals.length} shown</p></div><details className="analyse-record-lookup"><summary>Open a signal by ID</summary><form onSubmit={e => { e.preventDefault(); if (draftId.trim()) void openSignal(draftId.trim()); }} className="flex gap-2"><label className="relative"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-white/25" /><input value={draftId} onChange={e => setDraftId(e.target.value)} className={`${fieldClass} w-56 pl-8`} placeholder="Open exact signal ID" aria-label="Signal ID" /></label><button className="rounded-lg border border-white/10 px-3 text-xs text-white/55 hover:bg-white/5">Open</button></form></details></div>
          {loading && !visibleSignals.length ? <div className="flex min-h-[240px] items-center justify-center gap-2 text-xs text-white/35"><Loader2 className="h-4 w-4 animate-spin text-emerald-300" />Loading signal flow…</div>
          : visibleError && !visibleSignals.length ? <div className="mx-auto flex min-h-[240px] max-w-md flex-col items-center justify-center px-6 text-center"><AlertCircle className="h-7 w-7 text-red-300" /><h3 className="mt-3 text-sm">Couldn’t load activity</h3><p className="mt-1 text-xs leading-5 text-white/40">{visibleError}</p><button onClick={() => void load(false)} className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-xs hover:bg-white/5">Try again</button></div>
          : !visibleSignals.length ? <div className="flex min-h-[240px] flex-col items-center justify-center px-6 text-center"><CircleDot className="h-7 w-7 text-white/20" /><h3 className="mt-3 text-sm text-white/65">{scope === 'run' && !runId.trim() ? 'Choose a run' : 'No saved signals in this view'}</h3><p className="mt-1 max-w-md text-xs leading-5 text-white/32">{scope === 'run' && !runId.trim() ? 'Enter the run ID shown in Simulation World.' : 'Try All saved history or clear filters. Simulations that used in-memory Bus storage cannot show historical signals here.'}</p></div>
          : <div>{visibleError && <div className="m-3 rounded-lg border border-red-400/20 bg-red-400/[.06] px-3 py-2 text-xs text-red-200">{visibleError}</div>}{visibleSignals.map((signal, index) => <button key={signalKey(signal)} onClick={() => void openSignal(signal.id, signal.run_id ?? null)} className="group grid w-full grid-cols-[72px_20px_minmax(0,1fr)] gap-2 px-4 py-3 text-left hover:bg-white/[.035] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400/60 sm:grid-cols-[86px_24px_minmax(0,1fr)_auto]" style={{ borderBottom: '1px solid rgba(255,255,255,.055)' }}>
            <time className="pt-0.5 text-[10px] font-mono text-white/30" dateTime={signal.published_at || undefined} title={dateLabel(signal.published_at, true)}>{dateLabel(signal.published_at)}</time><div className="relative flex justify-center"><span className="mt-1.5 h-2 w-2 rounded-full bg-emerald-300 ring-4 ring-emerald-400/10" />{index < visibleSignals.length - 1 && <span className="absolute bottom-[-13px] top-4 w-px bg-white/10" />}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="truncate text-xs font-medium text-white/82">{signal.name}</span><Status value={signal.status} /></div><div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] text-white/32"><span>{signal.producer}</span><ArrowRight className="h-3 w-3" /><span>{signal.target || 'broadcast'}</span><span title={signal.run_id || 'Normal runtime'}>{signal.run_id ? shortId(signal.run_id) : 'Normal runtime'}</span>{signal.correlation_id && <><GitBranch className="ml-2 h-3 w-3 text-cyan-300/50" /><span className="font-mono">{shortId(signal.correlation_id)}</span></>}</div></div><div className="hidden self-center font-mono text-[10px] text-white/20 sm:block">{shortId(signal.id)}</div>
          </button>)}<div className="flex justify-center p-4">{nextBefore ? <button onClick={() => void load(true)} disabled={loadingOlder} className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs text-white/50 hover:bg-white/5 disabled:opacity-50">{loadingOlder ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ChevronDown className="h-3.5 w-3.5" />}Load older</button> : <span className="text-[10px] text-white/25">No older page available</span>}</div></div>}
        </section>

        {showDetail && <aside ref={detailRef} tabIndex={-1} aria-label="Signal detail" className="engine-bus-detail rounded-2xl border border-white/[.08] bg-[#0a111f]/92 xl:sticky xl:top-20 xl:h-[calc(100vh-6.5rem)] xl:overflow-y-auto"><button type="button" className="analyse-detail-back" onClick={closeDetail}>← Back to signals</button>
          {detailLoading ? <div className="flex min-h-[180px] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-emerald-300" /></div>
          : detailError && !selected ? <div className="p-6 text-center"><AlertCircle className="mx-auto h-6 w-6 text-red-300" /><p className="mt-3 text-xs leading-5 text-white/45">{detailError}</p><button type="button" className="analyse-button mt-3" onClick={closeDetail}>Close details</button></div>
          : selected && <div><div className="sticky top-0 z-10 border-b border-white/[.07] bg-[#0a111f]/95 p-4 backdrop-blur"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-sm font-semibold">{selected.signal.name}</h2><Status value={selected.signal.status} /></div><p className="mt-2 text-sm">{selected.signal.producer} → {selected.signal.target || 'Broadcast / unspecified'}</p><p className="mt-1 text-xs text-white/50">Occurred {dateLabel(selected.signal.occurred_at, true)}</p><div className="mt-1 flex items-center text-[10px] font-mono text-white/30">{selected.signal.id}<CopyButton value={selected.signal.id} label="signal ID" /></div></div><button onClick={closeDetail} aria-label="Close detail" className="rounded p-1 text-white/30 hover:bg-white/5"><X className="h-4 w-4" /></button></div></div>
            <div className="space-y-5 p-4">
              <div className="rounded-xl border border-indigo-300/10 bg-indigo-300/[.04] p-3"><div className="flex gap-2"><ShieldOff className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300/60" /><p className="text-[11px] leading-5 text-white/38">Payload and response content are intentionally unavailable in monitoring. {selected.signal.payload_scrubbed_at ? `This payload was scrubbed ${dateLabel(selected.signal.payload_scrubbed_at, true)}.` : 'Only safe envelope metadata is exposed.'}</p></div></div>
              <section><div className="mb-3 flex items-center justify-between"><h3 className="text-[10px] font-medium uppercase tracking-widest text-white/35">Deliveries</h3><span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/35">{selected.deliveries.length}</span></div>{selected.deliveries.length ? <div className="space-y-2">{selected.deliveries.map(delivery => <article key={delivery.id} className="rounded-xl border border-white/[.07] bg-white/[.025] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-medium text-white/70">{delivery.subscriber}</span><Status value={delivery.status} /></div><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/32"><span>{delivery.mode.replaceAll('_', ' ')}</span><span>{delivery.attempts} attempt{delivery.attempts === 1 ? '' : 's'}</span>{delivery.has_error && <span className="text-red-300">Error recorded</span>}{delivery.claim_until && <span>Claim until {dateLabel(delivery.claim_until, true)}</span>}</div></article>)}</div> : <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-white/30">No delivery records for this signal.</p>}</section>
              <details><summary className="mb-3 text-[10px] font-medium uppercase tracking-widest text-white/35">Signal metadata</summary><dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2"><Meta label="Producer" value={selected.signal.producer} /><Meta label="Target" value={selected.signal.target || 'Broadcast / unspecified'} /><Meta label="Runtime / run" value={selected.signal.run_id || 'Normal runtime'} /><Meta label="Event time (simulated during simulation)" value={dateLabel(selected.signal.occurred_at, true)} /><Meta label="Published (real time)" value={dateLabel(selected.signal.published_at, true)} /><Meta label="Expires" value={dateLabel(selected.signal.expires_at, true)} /><Meta label="Updated" value={dateLabel(selected.signal.updated_at, true)} /><Meta label="Causation ID" mono value={selected.signal.causation_id ? <button className="text-left text-cyan-300 hover:underline" onClick={() => void openSignal(selected.signal.causation_id!, selected.signal.run_id ?? null)}>{shortId(selected.signal.causation_id)}</button> : 'Root / unavailable'} /><Meta label="Correlation ID" mono value={selected.signal.correlation_id ? <span className="inline-flex items-center"><button className="text-left text-cyan-300 hover:underline" onClick={() => void openFlow(selected.signal.correlation_id!)}>{shortId(selected.signal.correlation_id)}</button><CopyButton value={selected.signal.correlation_id} label="correlation ID" /></span> : 'Not grouped'} /></dl></details>
              {selected.signal.correlation_id && <section><div className="mb-3 flex items-center justify-between"><h3 className="text-[10px] font-medium uppercase tracking-widest text-white/35">Correlation flow</h3><button onClick={() => void openFlow(selected.signal.correlation_id!)} className="text-[10px] text-cyan-300/70 hover:text-cyan-200">{flow ? 'Refresh flow' : 'Show full flow'}</button></div>{flowLoading ? <Loader2 className="mx-auto h-4 w-4 animate-spin text-cyan-300" /> : flow && <div className="space-y-1">{flow.map((item, index) => <button key={signalKey(item)} onClick={() => void openSignal(item.id, item.run_id ?? null)} className={`flex w-full items-start gap-2 rounded-lg p-2 text-left hover:bg-white/5 ${item.id === selected.signal.id ? 'bg-emerald-400/[.07] ring-1 ring-emerald-400/20' : ''}`}><div className="flex flex-col items-center"><span className="mt-1 h-2 w-2 rounded-full bg-cyan-300/70" />{index < flow.length - 1 && <span className="mt-1 h-7 w-px bg-white/10" />}</div><div className="min-w-0"><div className="truncate text-[11px] text-white/65">{item.name}</div><div className="mt-0.5 text-[9px] text-white/28">{dateLabel(item.occurred_at)} · {item.producer}</div></div></button>)}</div>}</section>}
            </div>
          </div>}
        </aside>}
      </div>
    </main>
  </div>;
}
