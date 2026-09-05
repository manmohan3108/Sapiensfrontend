import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertCircle, Bot, BrainCircuit, CheckCircle2, ChevronRight, CircleDot,
  Clock3, GitBranch, Hand, Loader2, MessageSquareReply, RefreshCw, Search, ShieldAlert,
  Sparkles, Trophy, XCircle,
} from 'lucide-react';
import { sapiensService } from '../../core/services/sapiensService';
import type { AwarenessBeat, AwarenessBeatEvent, AwarenessBeatsResponse, AwarenessHistoryItem, AwarenessResponse } from '../../types/sapiensTypes';
import type { ApiError } from '../../types/apiTypes';

const panel = 'rounded-xl border border-white/[.07] bg-white/[.025]';
const safeKeys = ['summary', 'status', 'decision', 'final_decision', 'reason', 'resolution', 'focus', 'selected_focus', 'focus_state', 'route', 'channel', 'destination', 'source', 'selected', 'winner', 'handle', 'id', 'type', 'kind', 'label', 'score', 'count', 'considered', 'prepared', 'curated', 'delivered', 'response_present', 'success', 'uncertainty'];

function relative(value?: string) {
  if (!value) return '—';
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return '—';
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function absoluteTime(value?: string) {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString();
}

function duration(beat: AwarenessBeat) {
  if (!beat.started_at || !beat.completed_at) return 'In progress';
  const ms = new Date(beat.completed_at).getTime() - new Date(beat.started_at).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'Timing unavailable';
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`;
}

function text(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

function safeFields(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const record = value as Record<string, unknown>;
  return safeKeys.flatMap(key => {
    const rendered = text(record[key]);
    return rendered === null ? [] : [{ key, value: rendered }];
  });
}

function SummaryBlock({ title, value, color = '#a5b4fc' }: { title: string; value: unknown; color?: string }) {
  const direct = text(value); const fields = safeFields(value);
  return <section className={`${panel} p-3`}><p className="text-[9px] uppercase tracking-[.16em]" style={{ color: `${color}99` }}>{title}</p>{direct ? <p className="mt-2 text-[11px] leading-5 text-white/58">{direct}</p> : fields.length ? <dl className="mt-2 grid gap-2 sm:grid-cols-2">{fields.map(field => <div key={field.key}><dt className="text-[8px] uppercase text-white/22">{field.key.replaceAll('_', ' ')}</dt><dd className="mt-0.5 break-words text-[10px] text-white/58">{field.value}</dd></div>)}</dl> : <p className="mt-2 text-[10px] italic text-white/22">No public summary returned.</p>}</section>;
}

const eventDetailKeys = ['summary', 'decision', 'reason', 'outcome', 'feedback', 'focus', 'selected_focus', 'focus_state', 'status', 'capability', 'argument_names', 'uncertainty', 'activity_id', 'action_id', 'response_present', 'route', 'channel'];

function detailFields(detail: AwarenessBeatEvent['detail']) {
  return eventDetailKeys.flatMap(key => {
    const value = detail?.[key];
    if (Array.isArray(value) && value.every(item => typeof item === 'string')) return [{ key, value: value.join(', ') }];
    const rendered = text(value);
    return rendered === null ? [] : [{ key, value: rendered }];
  });
}

function EventIcon({ stage }: { stage: string }) {
  const kind = stage.toLowerCase();
  if (kind.includes('action') || kind.includes('outcome')) return <Activity className="h-3.5 w-3.5" />;
  if (kind.includes('thought') || kind.includes('commit')) return <BrainCircuit className="h-3.5 w-3.5" />;
  if (kind.includes('hold') || kind.includes('defer')) return <Hand className="h-3.5 w-3.5" />;
  if (kind.includes('feedback')) return <MessageSquareReply className="h-3.5 w-3.5" />;
  return <GitBranch className="h-3.5 w-3.5" />;
}

function EventTimeline({ events = [] }: { events?: AwarenessBeatEvent[] }) {
  const ordered = [...events].sort((a, b) => a.sequence - b.sequence);
  if (!ordered.length) return <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-[10px] text-white/25">No ordered events were returned for this beat.</p>;
  return <ol className="space-y-0">{ordered.map((event, index) => {
    const stage = event.stage || 'unknown stage'; const kind = stage.toLowerCase(); const detail = event.detail ?? {}; const status = text(detail.status)?.toLowerCase();
    const failed = Boolean(status?.includes('fail') || status?.includes('error')); const succeeded = Boolean(status?.includes('success') || status === 'completed'); const fields = detailFields(detail);
    return <li key={`${event.sequence}-${stage}-${index}`} className="flex gap-3"><div className="flex w-7 flex-col items-center"><span className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg border ${failed ? 'border-red-400/20 bg-red-400/[.07] text-red-200' : succeeded ? 'border-emerald-400/20 bg-emerald-400/[.07] text-emerald-200' : 'border-cyan-400/15 bg-cyan-400/[.06] text-cyan-200/65'}`}><EventIcon stage={stage} /></span>{index < ordered.length - 1 && <span className="min-h-5 w-px flex-1 bg-white/[.08]" />}</div><article className="min-w-0 flex-1 pb-4"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[8px] text-white/22">#{event.sequence}</span><span className="text-[10px] font-medium text-white/65">{stage.replaceAll('_', ' ').replaceAll('.', ' → ')}</span>{status && <span className={`rounded-full px-2 py-0.5 text-[8px] ${failed ? 'bg-red-400/10 text-red-200' : succeeded ? 'bg-emerald-400/10 text-emerald-200' : 'bg-amber-400/10 text-amber-200'}`}>{status}</span>}<span className="ml-auto text-right text-[8px] text-white/22" title={absoluteTime(event.at)}>{absoluteTime(event.at)} · {relative(event.at)}</span></div>{fields.length > 0 && <dl className="mt-2 grid gap-x-4 gap-y-2 rounded-lg border border-white/[.05] bg-black/10 p-2 sm:grid-cols-2">{fields.map(field => <div key={field.key}><dt className="text-[8px] uppercase tracking-wide text-white/20">{field.key.replaceAll('_', ' ')}</dt><dd className="mt-0.5 break-words text-[9px] leading-4 text-white/48">{field.value}</dd></div>)}</dl>}{(kind.includes('thought') || kind.includes('commit')) && <p className="mt-2 flex items-center gap-1.5 text-[8px] text-violet-200/45"><ShieldAlert className="h-3 w-3" />Internal thought only — external action is shown only when an action/outcome stage exists.</p>}</article></li>;
  })}</ol>;
}

function firstDetailValue(events: AwarenessBeatEvent[], keys: string[], stageNeedle?: string) {
  for (const event of [...events].sort((a, b) => a.sequence - b.sequence)) {
    if (stageNeedle && !event.stage.toLowerCase().includes(stageNeedle)) continue;
    for (const key of keys) {
      const value = text(event.detail?.[key]);
      if (value !== null) return value;
    }
  }
  return null;
}

function BeatSummary({ beat }: { beat: AwarenessBeat }) {
  const events = beat.events ?? [];
  const actionAttempts = events.filter(event => { const stage = event.stage.toLowerCase(); return (stage.includes('action') || stage.includes('tool')) && !stage.includes('outcome') && !stage.includes('result'); });
  const actionOutcomes = events.filter(event => { const stage = event.stage.toLowerCase(); return stage.includes('outcome') || stage.includes('result'); });
  const successful = actionOutcomes.filter(event => { const state = `${text(event.detail?.status) ?? ''} ${text(event.detail?.outcome) ?? ''}`.toLowerCase(); return state.includes('success') || state.includes('completed'); }).length;
  const failed = actionOutcomes.filter(event => { const state = `${text(event.detail?.status) ?? ''} ${text(event.detail?.outcome) ?? ''}`.toLowerCase(); return state.includes('fail') || state.includes('error'); }).length;
  const holds = events.filter(event => /hold|defer/i.test(event.stage)).length;
  const feedback = events.filter(event => /feedback/i.test(event.stage)).length;
  const thoughtCommitted = events.some(event => /thought.*commit|commit.*thought/i.test(event.stage));
  const responsePresence = firstDetailValue(events, ['response_present'], 'response');
  const selectedFocus = firstDetailValue(events, ['selected_focus', 'focus'], 'focus') || safeFields(beat.winner).find(field => ['selected_focus', 'focus', 'label', 'summary', 'handle'].includes(field.key))?.value || text(beat.winner);
  const finalFields = safeFields(beat.final); const finalState = finalFields.find(field => ['final_decision', 'decision', 'focus_state', 'focus', 'resolution', 'status'].includes(field.key))?.value;
  const deliveryFields = safeFields(beat.delivery); const route = deliveryFields.find(field => ['route', 'channel', 'destination'].includes(field.key))?.value;
  const metrics = [
    ['Trigger / mode', `${beat.trigger_source || 'unknown'} · ${beat.mode || 'unknown'}`],
    ['Selected focus', selectedFocus || 'Not returned'],
    ['Final decision / state', finalState || 'Not returned'],
    ['Action attempts', String(actionAttempts.length)],
    ['Succeeded / failed', `${successful} / ${failed}`],
    ['Hold / Feedback', `${holds} / ${feedback}`],
    ['Thought commit', thoughtCommitted ? 'Present' : 'Not present'],
    ['Response present', responsePresence ?? 'Not reported'],
    ['Delivery route', route || 'Not returned'],
  ];
  return <section className={`${panel} p-4`}><div className="mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300/65"/><h4 className="text-[11px] font-medium text-white/65">Beat summary</h4></div><dl className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([label, value]) => <div key={label} className="rounded-lg border border-white/[.05] bg-black/10 px-3 py-2"><dt className="text-[8px] uppercase tracking-wide text-white/22">{label}</dt><dd className="mt-1 break-words text-[10px] text-white/58">{value}</dd></div>)}</dl>{thoughtCommitted && actionAttempts.length === 0 && actionOutcomes.length === 0 && <p className="mt-3 flex items-center gap-1.5 text-[8px] text-amber-200/55"><ShieldAlert className="h-3 w-3"/>A thought was committed, but no action event was recorded; this summary does not claim an external action occurred.</p>}</section>;
}

function CandidateFlow({ beat }: { beat: AwarenessBeat }) {
  const summary = beat.candidate_summary; if (!summary) return <SummaryBlock title="Candidate selection" value={null} />;
  const sourceCounts = summary.source_counts || summary.sources || {}; const candidates = summary.bounded_candidates || summary.candidates || [];
  const attention = beat.attention ?? [];
  const winnerText = text(beat.winner) || safeFields(beat.winner).map(item => `${item.key}: ${item.value}`).join(' · ') || 'No winner summary returned';
  return <section className={`${panel} p-3`}><div className="flex flex-wrap items-center gap-2"><span className="text-[9px] uppercase tracking-[.16em] text-amber-200/55">Candidate → winner</span>{summary.truncated || summary.was_truncated ? <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[8px] text-amber-200">Candidate list truncated</span> : null}</div><div className="mt-3 flex flex-wrap items-center gap-2"><span className="rounded-lg border border-white/[.07] bg-white/[.03] px-3 py-2 text-[10px] text-white/48"><b className="font-mono font-normal text-white/75">{summary.collected ?? '—'}</b> collected</span><ChevronRight className="h-3 w-3 text-white/20" /><span className="rounded-lg border border-amber-400/15 bg-amber-400/[.05] px-3 py-2 text-[10px] text-amber-100/55"><b className="font-mono font-normal text-amber-100/80">{summary.held ?? 0}</b> held</span><ChevronRight className="h-3 w-3 text-white/20" /><span className="min-w-0 rounded-lg border border-emerald-400/15 bg-emerald-400/[.05] px-3 py-2 text-[10px] text-emerald-100/65"><Trophy className="mr-1 inline h-3 w-3" />{winnerText}</span></div>{Object.keys(sourceCounts).length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{Object.entries(sourceCounts).map(([name, count]) => <span key={name} className="rounded-md bg-cyan-400/[.05] px-2 py-1 text-[8px] text-cyan-100/50">{name} <b className="font-mono font-normal text-cyan-200/80">{count}</b></span>)}</div>}{candidates.length > 0 && <div className="mt-3 text-[9px] text-white/28">{candidates.length} bounded candidate summary{candidates.length === 1 ? '' : 'ies'} returned; raw arguments and results are intentionally hidden.</div>}{attention.length > 0 ? <div className="mt-4 overflow-hidden rounded-xl border border-violet-400/10"><div className="border-b border-white/[.05] bg-violet-400/[.04] px-3 py-2"><p className="text-[9px] font-medium text-violet-100/60">Autonomous attention adjustment</p><p className="mt-0.5 text-[8px] text-white/25">Adjusted priority is the controller’s post-habituation ranking value, not the source engine’s salience.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-[9px]"><thead className="bg-black/10 text-white/25"><tr><th className="px-3 py-2 font-normal">Source</th><th className="px-3 py-2 font-normal">Handle</th><th className="px-3 py-2 text-right font-normal">Raw source salience</th><th className="px-3 py-2 text-right font-normal">Attention factor</th><th className="px-3 py-2 text-right font-normal">Adjusted priority</th><th className="px-3 py-2 text-right font-normal">Recent attentions</th></tr></thead><tbody>{attention.map((row, index) => { const habituated = row.attention_factor < 1 || row.adjusted_priority < row.raw_salience; return <tr key={`${row.source}-${row.handle}-${index}`} className="border-t border-white/[.04] text-white/48"><td className="px-3 py-2.5">{row.source}</td><td className="max-w-48 truncate px-3 py-2.5 font-mono" title={row.handle}>{row.handle}</td><td className="px-3 py-2.5 text-right font-mono">{row.raw_salience}</td><td className={`px-3 py-2.5 text-right font-mono ${habituated ? 'text-amber-200/75' : ''}`}>{row.attention_factor}</td><td className="px-3 py-2.5 text-right font-mono text-violet-200/75">{row.adjusted_priority}</td><td className="px-3 py-2.5 text-right font-mono">{row.recent_attentions}</td></tr>; })}</tbody></table></div></div> : beat.mode === 'reactive' ? <p className="mt-4 rounded-lg border border-cyan-400/10 bg-cyan-400/[.035] px-3 py-2 text-[9px] text-cyan-100/40">Reactive user focus bypasses autonomous habituation; no attention adjustment rows are expected.</p> : null}</section>;
}

function BeatDetails({ beat, latest = false }: { beat: AwarenessBeat; latest?: boolean }) {
  const deliveryFields = safeFields(beat.delivery); const deliveryStatus = deliveryFields.find(field => field.key === 'status')?.value;
  const focusFormation = beat.events?.find(event => /focus.*form|form.*focus/i.test(event.stage))?.detail;
  return <div className="space-y-3"><section className={`${panel} p-4`}><div className="flex flex-wrap items-start gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl border ${beat.mode === 'autonomous' ? 'border-violet-400/20 bg-violet-400/[.08] text-violet-200' : 'border-cyan-400/20 bg-cyan-400/[.08] text-cyan-200'}`}>{beat.mode === 'autonomous' ? <Bot className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}</span><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium text-white/75">{latest ? 'Latest awareness beat' : 'Awareness beat'}</h3><span className="rounded-full bg-white/[.05] px-2 py-0.5 text-[8px] capitalize text-white/45">{beat.mode || 'mode unavailable'}</span></div><p className="mt-1 text-[10px] text-white/30">Triggered by {beat.trigger_source || 'unknown source'} · {absoluteTime(beat.started_at)} ({relative(beat.started_at)}) · {duration(beat)}</p>{beat.occurrence_id && <p className="mt-1 text-[8px] text-white/22">Occurrence <span className="font-mono text-white/35">{beat.occurrence_id}</span> · continuing beats may share this ID</p>}</div><span className="ml-auto font-mono text-[8px] text-white/20">{beat._id}</span></div></section><BeatSummary beat={beat}/><CandidateFlow beat={beat}/><div className="grid gap-3 md:grid-cols-3"><SummaryBlock title="Preparation" value={beat.preparation} color="#67e8f9"/><SummaryBlock title="Focus formation" value={focusFormation} color="#86efac"/><SummaryBlock title="Curation" value={beat.curation} color="#c4b5fd"/></div><section className={`${panel} p-4`}><p className="mb-4 text-[9px] uppercase tracking-[.16em] text-white/35">Ordered event flow</p><EventTimeline events={beat.events}/></section><div className="grid gap-3 md:grid-cols-2"><SummaryBlock title="Final resolution" value={beat.final} color="#86efac"/><SummaryBlock title="Delivery route" value={beat.delivery} color={deliveryStatus?.includes('fail') ? '#fca5a5' : '#7dd3fc'}/></div></div>;
}

export function AwarenessDiagnostics({ sapienId }: { sapienId: string }) {
  const [data, setData] = useState<AwarenessResponse | null>(null); const [beatData, setBeatData] = useState<AwarenessBeatsResponse | null>(null); const [loading, setLoading] = useState(true); const [beatsLoading, setBeatsLoading] = useState(false); const [staffSessionReady, setStaffSessionReady] = useState(false); const [error, setError] = useState(''); const [beatsError, setBeatsError] = useState(''); const [search, setSearch] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    const awarenessRequest = sapiensService.getAwareness(sapienId, 20).then(setData).catch(caught => setError((caught as ApiError).message || 'Could not load awareness.')).finally(() => setLoading(false));
    await awarenessRequest;
  }, [sapienId]);
  const loadStaffBeats = useCallback(async () => {
    setStaffSessionReady(true); setBeatsLoading(true); setBeatsError('');
    try { setBeatData(await sapiensService.getAwarenessBeats(sapienId, 20, true)); }
    catch (caught) { const apiError = caught as ApiError; setBeatsError(apiError.status === 403 ? 'Your app account does not have permission to view beat diagnostics. Ask an administrator to review the backend permission policy.' : apiError.message || 'Could not load awareness beat diagnostics.'); }
    finally { setBeatsLoading(false); }
  }, [sapienId]);
  useEffect(() => { void refresh(); }, [refresh]);
  const beats = beatData?.beats ?? []; const currentBeat = beatData?.current_beat ?? beats[0] ?? null; const history = data?.history ?? [];
  const filteredHistory = useMemo(() => history.filter(item => item.focus.toLowerCase().includes(search.toLowerCase())), [history, search]);
  if (loading && !data) return <div className="flex min-h-80 items-center justify-center gap-2 text-xs text-white/30"><Loader2 className="h-4 w-4 animate-spin" />Loading awareness diagnostics…</div>;
  return <div className="space-y-4">{error && <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[.07] px-4 py-3 text-xs text-red-200/75"><AlertCircle className="h-4 w-4"/><span className="flex-1">{error}</span><button onClick={() => void refresh()} className="rounded-lg border border-red-300/20 px-3 py-1.5">Retry</button></div>}{!beatData && <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[.07] px-4 py-3 text-xs text-amber-100/70"><ShieldAlert className="h-4 w-4"/><span className="min-w-56 flex-1">Load beat diagnostics using your authenticated app-admin session.</span><button onClick={() => void loadStaffBeats()} disabled={beatsLoading} className="rounded-lg bg-amber-300/15 px-3 py-2 text-amber-50 disabled:opacity-50">{beatsLoading ? 'Loading diagnostics…' : staffSessionReady ? 'Retry diagnostics' : 'Load diagnostics'}</button></div>}{beatsError && <div className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/[.07] px-4 py-3 text-xs text-red-100/70"><AlertCircle className="h-4 w-4"/><span className="flex-1">{beatsError}</span></div>}
    <section className="grid gap-3 lg:grid-cols-2"><div className={`${panel} p-4`}><p className="text-[9px] uppercase tracking-[.16em] text-cyan-300/45">Latest committed thought</p>{data?.current ? <><p className="mt-2 text-sm leading-6 text-white/72">{data.current.focus}</p><p className="mt-2 text-[9px] text-white/25">From {data.current.source} · {relative(data.current.created_at)}</p><p className="mt-3 flex items-center gap-1.5 text-[8px] text-violet-200/45"><BrainCircuit className="h-3 w-3"/>Internal awareness state; this does not verify an external action.</p></> : <p className="mt-3 text-xs text-white/25">No committed thought returned.</p>}</div><div className={`${panel} p-4`}><p className="text-[9px] uppercase tracking-[.16em] text-emerald-300/45">Latest beat</p>{currentBeat ? <><p className="mt-2 text-sm text-white/72">{currentBeat.mode} · {currentBeat.trigger_source || 'unknown trigger'}</p><p className="mt-2 text-[9px] text-white/25">{duration(currentBeat)} · {currentBeat.events?.length ?? 0} events · {currentBeat.completed_at ? 'completed' : 'in progress'}</p></> : <p className="mt-3 text-xs text-white/25">Beat diagnostics are unavailable on this response.</p>}</div></section>
    {currentBeat ? <BeatDetails beat={currentBeat} latest/> : staffSessionReady && !beatsLoading && !beatsError ? <div className={`${panel} p-5 text-center`}><ShieldAlert className="mx-auto h-6 w-6 text-white/18"/><p className="mt-3 text-xs text-white/35">No awareness beat diagnostics were returned.</p><p className="mt-1 text-[10px] text-white/22">Committed thought history remains available below.</p></div> : null}
    {beats.length > 1 && <section className={`${panel} p-4`}><h3 className="text-xs text-white/60">Historical beats</h3><div className="mt-3 space-y-2">{beats.filter(beat => beat._id !== currentBeat?._id).map(beat => <details key={beat._id} className="rounded-xl border border-white/[.06] bg-black/10"><summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-3"><Clock3 className="h-3.5 w-3.5 text-white/25"/><span className="text-[10px] capitalize text-white/55">{beat.mode}</span><span className="text-[9px] text-white/28">{beat.trigger_source || 'unknown trigger'} · {relative(beat.started_at)} · {duration(beat)}</span><ChevronRight className="ml-auto h-3 w-3 text-white/20"/></summary><div className="border-t border-white/[.05] p-3"><BeatDetails beat={beat}/></div></details>)}</div></section>}
    <section className={`${panel} overflow-hidden`}><div className="flex items-center gap-2 border-b border-white/[.06] p-3"><Search className="h-3.5 w-3.5 text-white/25"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search committed thought history" className="min-w-0 flex-1 bg-transparent text-[10px] text-white/60 outline-none"/><button onClick={() => void refresh()} className="rounded p-2 text-white/30"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}/></button></div><div className="max-h-64 overflow-y-auto">{filteredHistory.map((item: AwarenessHistoryItem) => <article key={item.id} className="border-b border-white/[.04] px-4 py-3 last:border-0"><p className="text-[10px] leading-5 text-white/52">{item.focus}</p><p className="mt-1 text-[8px] text-white/22">{item.source} · {relative(item.created_at)}</p></article>)}{!filteredHistory.length && <p className="p-6 text-center text-[10px] text-white/25">No committed thoughts match this search.</p>}</div></section>
  </div>;
}
