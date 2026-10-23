import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertCircle, Bot, BrainCircuit, CheckCircle2, ChevronRight, CircleDot,
  Loader2, RefreshCw, Search,
  Trophy, XCircle,
} from 'lucide-react';
import { sapiensService } from '../../core/services/sapiensService';
import type { AwarenessBeat, AwarenessBeatEvent, AwarenessBeatsResponse, AwarenessHistoryItem, AwarenessResponse } from '../../types/sapiensTypes';
import type { ApiError } from '../../types/apiTypes';
import { AwarenessFlowGraph } from './AwarenessFlowGraph';

const panel = 'rounded-xl border border-white/[.07] bg-white/[.025]';
const sensitiveKey = /(credential|secret|token|password|argument|\bargs?\b|payload|result|prompt|raw_response)/i;

function absoluteTime(value?: string) {
  if (!value) return 'Time unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString(undefined, { timeZoneName: 'short' });
}

const assessmentLabels: Record<string, string> = {
  completed: 'Assessed as complete', waiting: 'Waiting',
  ongoing: 'Still in progress', blocked: 'Blocked', unresolved: 'Unresolved',
};

function UnderstandingStory({ item }: { item: AwarenessHistoryItem }) {
  return <div className="space-y-4">
    <ol className="grid gap-4 xl:grid-cols-3">
      <li className={`${panel} p-4`}>
        <h3 className="text-sm font-medium text-cyan-200">1. What arrived</h3>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/80">{item.subject?.content || 'The original event was not retained with this record.'}</p>
        {item.subject && <p className="mt-3 text-xs text-white/50">Source: {item.subject.source || 'Unknown'} · Event time: {absoluteTime(item.subject.event_at)}</p>}
      </li>
      <li className={`${panel} p-4`}>
        <h3 className="text-sm font-medium text-violet-200">2. What was understood</h3>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/80">{item.understanding || item.focus || 'No understanding was retained.'}</p>
        <p className="mt-3 flex items-center gap-2 text-xs text-white/50"><BrainCircuit className="h-4 w-4 shrink-0"/>Saved interpretation, not independent verification.</p>
      </li>
      <li className={`${panel} p-4`}>
        <h3 className="text-sm font-medium text-emerald-200">3. Where it stands</h3>
        <p className="mt-3 text-sm font-medium text-white/85">{item.state ? assessmentLabels[item.state] || item.state.replaceAll('_', ' ') : 'No assessment recorded'}</p>
        {item.reason && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/75">{item.reason}</p>}
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-amber-100/80"><span className="font-medium">Still needed: </span>{item.remaining || 'No remaining-work description recorded.'}</p>
        <p className="mt-3 text-xs leading-5 text-white/50">This assessment does not by itself confirm an action or message delivery.</p>
      </li>
    </ol>
    <details className={`${panel} p-4`}>
      <summary className="cursor-pointer text-sm text-white/65">Record details</summary>
      <dl className="mt-3 grid gap-3 text-xs text-white/65 sm:grid-cols-2">
        <div><dt>Record ID</dt><dd className="mt-1 break-all font-mono">{item.id}</dd></div>
        <div><dt>Assessment source</dt><dd className="mt-1">{item.source || 'Unknown'}</dd></div>
        <div><dt>Assessment time</dt><dd className="mt-1">{absoluteTime(item.assessed_at)}</dd></div>
        <div><dt>Created time</dt><dd className="mt-1">{absoluteTime(item.created_at)}</dd></div>
        {typeof item.confidence === 'number' && <div><dt>Reported confidence (not a measured accuracy)</dt><dd className="mt-1">{Math.round(item.confidence * 100)}%</dd></div>}
      </dl>
    </details>
  </div>;
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
  return Object.entries(value as Record<string, unknown>).flatMap(([key, item]) => {
    if (sensitiveKey.test(key)) return [];
    const rendered = text(item);
    if (rendered !== null) return [{ key, value: rendered }];
    if (Array.isArray(item) && item.every(entry => ['string', 'number', 'boolean'].includes(typeof entry))) return [{ key, value: item.join(', ') }];
    return [];
  });
}

function SummaryBlock({ title, value, color = '#a5b4fc' }: { title: string; value: unknown; color?: string }) {
  const direct = text(value); const fields = safeFields(value);
  return <section className={`${panel} p-3`}><p className="text-[9px] uppercase tracking-[.16em]" style={{ color: `${color}99` }}>{title}</p>{direct ? <p className="mt-2 text-[11px] leading-5 text-white/58">{direct}</p> : fields.length ? <dl className="mt-2 grid gap-2 sm:grid-cols-2">{fields.map(field => <div key={field.key}><dt className="text-[8px] uppercase text-white/22">{field.key.replaceAll('_', ' ')}</dt><dd className="mt-0.5 break-words text-[10px] text-white/58">{field.value}</dd></div>)}</dl> : <p className="mt-2 text-[10px] italic text-white/22">No public summary returned.</p>}</section>;
}

const eventDetailKeys = ['summary', 'decision', 'reason', 'outcome', 'feedback', 'focus', 'selected_focus', 'focus_state', 'status', 'capability', 'uncertainty', 'activity_id', 'action_id', 'response_present', 'route', 'channel', 'understanding', 'remaining', 'confidence'];

function detailFields(detail: AwarenessBeatEvent['detail']) {
  return eventDetailKeys.flatMap(key => {
    const value = detail?.[key];
    if (Array.isArray(value) && value.every(item => typeof item === 'string')) return [{ key, value: value.join(', ') }];
    const rendered = text(value);
    return rendered === null ? [] : [{ key, value: rendered }];
  });
}

function publicTechnicalDetails(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(publicTechnicalDetails);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !sensitiveKey.test(key))
    .map(([key, item]) => [key, publicTechnicalDetails(item)]));
}

function EventIcon({ status }: { status?: string }) {
  const state = status?.toLowerCase() ?? '';
  if (/fail|error|blocked/.test(state)) return <XCircle className="h-3.5 w-3.5" />;
  if (/success|complete|resolved|delivered/.test(state)) return <CheckCircle2 className="h-3.5 w-3.5" />;
  return <Activity className="h-3.5 w-3.5" />;
}

function displayEvent(event: AwarenessBeatEvent, index: number) {
  const detail = event.detail ?? {};
  const stageTitle = event.stage?.replaceAll('_', ' ').replaceAll('.', ' → ');
  return {
    title: event.title || stageTitle || 'Awareness event',
    summary: event.summary || text(detail.response) || text(detail.thought) || text(detail.summary) || text(detail.reason) || 'This event was observed, but no public summary was returned.',
    status: event.status || text(detail.status) || text(detail.move) || 'observed',
    consequence: event.consequence || '',
    when: event.occurred_at || event.at,
    step: index + 1,
  };
}

function EventTimeline({ events = [] }: { events?: AwarenessBeatEvent[] }) {
  const ordered = [...events].sort((a, b) => (a.sequence ?? Number.MAX_SAFE_INTEGER) - (b.sequence ?? Number.MAX_SAFE_INTEGER));
  if (!ordered.length) return <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-[10px] text-white/25">No ordered events were returned for this beat.</p>;
  return <ol className="space-y-0">{ordered.map((event, index) => {
    const stage = event.stage || 'compatibility event'; const detail = event.detail ?? {}; const display = displayEvent(event, index); const status = display.status.toLowerCase();
    const failed = Boolean(status?.includes('fail') || status?.includes('error')); const succeeded = Boolean(status?.includes('success') || status === 'completed'); const fields = detailFields(detail);
    const technical = event.technical_details ? publicTechnicalDetails(event.technical_details) : null;
    return <li key={`${event.sequence ?? index}-${display.title}`} className="flex gap-3"><div className="flex w-7 flex-col items-center"><span className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg border ${failed ? 'border-red-400/20 bg-red-400/[.07] text-red-200' : succeeded ? 'border-emerald-400/20 bg-emerald-400/[.07] text-emerald-200' : 'border-cyan-400/15 bg-cyan-400/[.06] text-cyan-200/65'}`}><EventIcon status={status} /></span>{index < ordered.length - 1 && <span className="min-h-5 w-px flex-1 bg-white/[.08]" />}</div><article className="min-w-0 flex-1 pb-4"><div className="flex flex-wrap items-center gap-2"><span className="text-[8px] text-white/22">Step {display.step}</span><span className="text-[10px] font-medium text-white/70">{display.title}</span>{event.actor && <span className="rounded-full bg-indigo-400/[.07] px-2 py-0.5 text-[8px] text-indigo-100/50">{event.actor}</span>}<span className={`rounded-full px-2 py-0.5 text-[8px] ${failed ? 'bg-red-400/10 text-red-200' : succeeded ? 'bg-emerald-400/10 text-emerald-200' : 'bg-amber-400/10 text-amber-200'}`}>{status}</span><span className="ml-auto text-right text-[8px] text-white/22" title={absoluteTime(display.when)}>{absoluteTime(display.when)}</span></div><p className="mt-1 text-[10px] leading-5 text-white/55">{display.summary}</p>{display.consequence && <p className="mt-1 text-[9px] leading-4 text-emerald-100/45"><span className="text-white/25">Consequence: </span>{display.consequence}</p>}{(event.correlation_id || event.reference_id) && <p className="mt-1 font-mono text-[8px] text-white/20">{event.correlation_id && `correlation ${event.correlation_id}`}{event.correlation_id && event.reference_id && ' · '}{event.reference_id && `reference ${event.reference_id}`}</p>} {(fields.length > 0 || technical || event.stage || event.sequence !== undefined) && <details className="mt-2 rounded-lg border border-white/[.05] bg-black/10"><summary className="cursor-pointer px-2 py-1.5 text-[8px] text-white/30">Technical and compatibility details</summary><div className="border-t border-white/[.05] p-2">{fields.length > 0 && <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">{fields.map(field => <div key={field.key}><dt className="text-[8px] uppercase tracking-wide text-white/20">{field.key.replaceAll('_', ' ')}</dt><dd className="mt-0.5 break-words text-[9px] leading-4 text-white/48">{field.value}</dd></div>)}</dl>}{technical && <pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words text-[8px] leading-4 text-white/35">{JSON.stringify(technical, null, 2)}</pre>}<p className="mt-2 text-[8px] text-white/18">Sequence: {event.sequence ?? 'unavailable'} · Compatibility stage: {stage}</p></div></details>}</article></li>;
  })}</ol>;
}

function BeatSummary({ beat }: { beat: AwarenessBeat }) {
  const events = [...(beat.events ?? [])].sort((a, b) => (a.sequence ?? Number.MAX_SAFE_INTEGER) - (b.sequence ?? Number.MAX_SAFE_INTEGER));
  const normalized = events.map(displayEvent);
  const firstSummary = normalized[0]?.summary;
  const consequences = events.map(event => event.consequence).filter((value): value is string => Boolean(value));
  const unfinished = normalized.filter(event => /pending|failed|error|blocked|held|deferred|unfinished|uncertain|in.progress/i.test(event.status));
  const fallbackWhatHappened = firstSummary || 'Not available for this historical beat.';
  const fallbackChanged = consequences.length ? consequences.join(' · ') : 'Not available for this historical beat.';
  const fallbackUnfinished = unfinished.length ? unfinished.map(event => event.title || event.summary || event.status).filter(Boolean).join(' · ') : 'Not available for this historical beat.';
  const happened = beat.conclusion?.summary || fallbackWhatHappened;
  const changed = beat.conclusion ? (beat.conclusion.changed ? fallbackChanged : 'The beat reported no state change.') : fallbackChanged;
  const remains = beat.conclusion?.unfinished || fallbackUnfinished;
  return <section className={`${panel} p-4`}><div className="mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300/65"/><h4 className="text-[11px] font-medium text-white/65">Cycle summary</h4>{beat.conclusion && <span className="rounded-full bg-emerald-400/[.07] px-2 py-0.5 text-[8px] text-emerald-100/45">Backend-derived</span>}</div><dl className="grid gap-3 lg:grid-cols-3"><div className="rounded-lg border border-cyan-400/10 bg-cyan-400/[.035] p-3"><dt className="text-[9px] font-medium text-cyan-100/55">What happened?</dt><dd className="mt-1 text-[10px] leading-5 text-white/58">{happened}</dd></div><div className="rounded-lg border border-emerald-400/10 bg-emerald-400/[.035] p-3"><dt className="text-[9px] font-medium text-emerald-100/55">What changed?</dt><dd className="mt-1 text-[10px] leading-5 text-white/58">{changed}</dd></div><div className="rounded-lg border border-amber-400/10 bg-amber-400/[.035] p-3"><dt className="text-[9px] font-medium text-amber-100/55">What remains unfinished?</dt><dd className="mt-1 text-[10px] leading-5 text-white/58">{remains}</dd></div></dl>{beat.events_truncated && <p className="mt-3 text-[8px] text-amber-200/55">The event list was truncated by the backend; this conclusion may cover events not shown below.</p>}</section>;
}

function AssessmentSummary({ beat }: { beat: AwarenessBeat }) {
  const assessment = beat.assessment;
  if (!assessment) return null;
  const evidence = assessment.evidence_refs ?? [];
  return <section className={`${panel} border-emerald-400/10 p-4`}><div className="flex flex-wrap items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300/65"/><h4 className="text-[11px] font-medium text-white/70">Outcome assessment</h4>{typeof assessment.assessed === 'boolean' && <span className="rounded-full bg-white/[.05] px-2 py-0.5 text-[8px] text-white/45">{assessment.assessed ? 'Assessed' : 'Not assessed'}</span>}{assessment.state && <span className="rounded-full bg-emerald-400/[.08] px-2 py-0.5 text-[8px] capitalize text-emerald-100/60">{assessment.state}</span>}{typeof assessment.confidence === 'number' && <span className="rounded-full bg-white/[.05] px-2 py-0.5 text-[8px] text-white/45">{Math.round(assessment.confidence * 100)}% confidence</span>}</div>{assessment.reason && <p className="mt-3 text-[10px] leading-5 text-white/58"><span className="text-white/28">Reason: </span>{assessment.reason}</p>}{assessment.remaining && <p className="mt-2 text-[10px] leading-5 text-amber-100/60"><span className="text-white/28">Remaining: </span>{assessment.remaining}</p>}{assessment.review_at && <p className="mt-2 text-[9px] text-white/30">Review {absoluteTime(assessment.review_at)}</p>}{evidence.length > 0 && <details className="mt-3 rounded-lg border border-white/[.06] bg-black/10"><summary className="cursor-pointer px-3 py-2 text-[9px] text-white/35">Evidence references ({evidence.length})</summary><div className="border-t border-white/[.05] p-3 font-mono text-[8px] leading-4 text-white/35">{evidence.map(reference => <div key={reference} className="break-all">{reference}</div>)}</div></details>}</section>;
}

function CandidateFlow({ beat }: { beat: AwarenessBeat }) {
  const summary = beat.candidate_summary; if (!summary) return <SummaryBlock title="Candidate selection" value={null} />;
  const sourceCounts = summary.source_counts || summary.sources || {}; const candidates = summary.bounded_candidates || summary.candidates || [];
  const attention = beat.attention ?? [];
  const winnerText = text(beat.winner) || safeFields(beat.winner).map(item => `${item.key}: ${item.value}`).join(' · ') || 'No winner summary returned';
  return <section className={`${panel} p-3`}><div className="flex flex-wrap items-center gap-2"><span className="text-[9px] uppercase tracking-[.16em] text-amber-200/55">Candidate → winner</span>{summary.truncated || summary.was_truncated ? <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[8px] text-amber-200">Candidate list truncated</span> : null}</div><div className="mt-3 flex flex-wrap items-center gap-2"><span className="rounded-lg border border-white/[.07] bg-white/[.03] px-3 py-2 text-[10px] text-white/48"><b className="font-mono font-normal text-white/75">{summary.collected ?? '—'}</b> collected</span><ChevronRight className="h-3 w-3 text-white/20" /><span className="rounded-lg border border-amber-400/15 bg-amber-400/[.05] px-3 py-2 text-[10px] text-amber-100/55"><b className="font-mono font-normal text-amber-100/80">{summary.held ?? 0}</b> held</span><ChevronRight className="h-3 w-3 text-white/20" /><span className="min-w-0 rounded-lg border border-emerald-400/15 bg-emerald-400/[.05] px-3 py-2 text-[10px] text-emerald-100/65"><Trophy className="mr-1 inline h-3 w-3" />{winnerText}</span></div>{Object.keys(sourceCounts).length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{Object.entries(sourceCounts).map(([name, count]) => <span key={name} className="rounded-md bg-cyan-400/[.05] px-2 py-1 text-[8px] text-cyan-100/50">{name} <b className="font-mono font-normal text-cyan-200/80">{count}</b></span>)}</div>}{candidates.length > 0 && <div className="mt-3 text-[9px] text-white/28">{candidates.length} bounded candidate summary{candidates.length === 1 ? '' : 'ies'} returned; raw arguments and results are intentionally hidden.</div>}{attention.length > 0 ? <div className="mt-4 overflow-hidden rounded-xl border border-violet-400/10"><div className="border-b border-white/[.05] bg-violet-400/[.04] px-3 py-2"><p className="text-[9px] font-medium text-violet-100/60">Autonomous attention adjustment</p><p className="mt-0.5 text-[8px] text-white/25">Adjusted priority is the controller’s post-habituation ranking value, not the source engine’s salience.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-[9px]"><thead className="bg-black/10 text-white/25"><tr><th className="px-3 py-2 font-normal">Source</th><th className="px-3 py-2 font-normal">Handle</th><th className="px-3 py-2 text-right font-normal">Raw source salience</th><th className="px-3 py-2 text-right font-normal">Attention factor</th><th className="px-3 py-2 text-right font-normal">Adjusted priority</th><th className="px-3 py-2 text-right font-normal">Recent attentions</th></tr></thead><tbody>{attention.map((row, index) => { const habituated = row.attention_factor < 1 || row.adjusted_priority < row.raw_salience; return <tr key={`${row.source}-${row.handle}-${index}`} className="border-t border-white/[.04] text-white/48"><td className="px-3 py-2.5">{row.source}</td><td className="max-w-48 truncate px-3 py-2.5 font-mono" title={row.handle}>{row.handle}</td><td className="px-3 py-2.5 text-right font-mono">{row.raw_salience}</td><td className={`px-3 py-2.5 text-right font-mono ${habituated ? 'text-amber-200/75' : ''}`}>{row.attention_factor}</td><td className="px-3 py-2.5 text-right font-mono text-violet-200/75">{row.adjusted_priority}</td><td className="px-3 py-2.5 text-right font-mono">{row.recent_attentions}</td></tr>; })}</tbody></table></div></div> : beat.mode === 'reactive' ? <p className="mt-4 rounded-lg border border-cyan-400/10 bg-cyan-400/[.035] px-3 py-2 text-[9px] text-cyan-100/40">Reactive user focus bypasses autonomous habituation; no attention adjustment rows are expected.</p> : null}</section>;
}

function BeatDetails({ beat, latest = false }: { beat: AwarenessBeat; latest?: boolean }) {
  const [graphOpen, setGraphOpen] = useState(false);
  const deliveryFields = safeFields(beat.delivery); const deliveryStatus = deliveryFields.find(field => field.key === 'status')?.value;
  const focusFormation = beat.focus_formation ?? beat.events?.find(event => /focus.*form|form.*focus/i.test(event.stage ?? ''))?.detail;
  return <div className="space-y-3">
    <section className={`${panel} p-4`}><div className="flex flex-wrap items-start gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl border ${beat.mode === 'autonomous' ? 'border-violet-400/20 bg-violet-400/[.08] text-violet-200' : 'border-cyan-400/20 bg-cyan-400/[.08] text-cyan-200'}`}>{beat.mode === 'autonomous' ? <Bot className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}</span><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium text-white/75">{latest ? 'Latest processing cycle' : 'Processing cycle'}</h3><span className="rounded-full bg-white/[.05] px-2 py-0.5 text-[8px] capitalize text-white/45">{beat.mode || 'mode unavailable'}</span></div><p className="mt-1 text-[10px] text-white/30">Triggered by {beat.trigger_source || 'unknown source'} · {absoluteTime(beat.started_at)} · Stored time interval: {duration(beat)}</p>{beat.occurrence_id && <p className="mt-1 text-[8px] text-white/22">Occurrence <span className="font-mono text-white/35">{beat.occurrence_id}</span> · continuing beats may share this ID</p>}</div><span className="ml-auto font-mono text-[8px] text-white/20">{beat._id}</span></div></section>
    <BeatSummary beat={beat}/>
    <details className={`${panel} p-4`} onToggle={event => setGraphOpen(event.currentTarget.open)}><summary className="cursor-pointer text-sm text-white/65">Explore the technical flow graph</summary>{graphOpen && <div className="mt-4"><AwarenessFlowGraph beat={beat}/></div>}</details>
    <details className={`${panel} p-4`}><summary className="cursor-pointer text-sm text-white/65">Decisions and observed results ({beat.events?.length ?? 0})</summary><div className="mt-4"><EventTimeline events={beat.events}/></div></details>
    <details className={`${panel} p-4`}><summary className="cursor-pointer text-sm text-white/65">Why this information received attention</summary><div className="mt-4"><CandidateFlow beat={beat}/></div></details>
    <details className={`${panel} p-3`}><summary className="cursor-pointer text-[10px] text-white/40">Supporting diagnostic summaries</summary><div className="mt-3 grid gap-3 md:grid-cols-3"><SummaryBlock title="Preparation" value={beat.preparation} color="#67e8f9"/><SummaryBlock title="Focus formation" value={focusFormation} color="#86efac"/><SummaryBlock title="Curated context" value={beat.curation} color="#c4b5fd"/><AssessmentSummary beat={beat}/><SummaryBlock title="Generated response / final resolution" value={beat.final} color="#86efac"/><SummaryBlock title="Delivery route" value={beat.delivery} color={deliveryStatus?.includes('fail') ? '#fca5a5' : '#7dd3fc'}/></div></details>
  </div>;
}

function RelatedCycle({ sapienId, thoughtId }: { sapienId: string; thoughtId: string }) {
  const [data, setData] = useState<AwarenessBeatsResponse | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null); setError('');
    void sapiensService.getAwarenessBeats(sapienId, 20, thoughtId).then(result => {
      if (active) setData(result);
    }).catch(caught => {
      if (active) setError((caught as ApiError).status === 403 ? 'An administrator account is needed to inspect this cycle.' : 'Could not load the related cycle.');
    });
    return () => { active = false; };
  }, [sapienId, thoughtId, attempt]);
  // An older API may ignore the filter and return unrelated recent cycles.
  const exact = data?.thought_id === thoughtId && data.match_status === 'exact';
  const beat = exact ? data?.current_beat : null;
  const final = beat?.final;
  const processing = final && typeof final === 'object' ? text(final.status) : null;
  return <section className={`${panel} p-4`} aria-label="Related processing cycle">
    <h3 className="text-sm font-medium text-white/85">What happened next</h3>
    {error ? <p role="alert" className="mt-3 text-sm text-red-200">{error} <button className="underline" onClick={() => setAttempt(value => value + 1)}>Retry</button></p>
      : !data ? <p role="status" className="mt-3 text-sm text-white/60">Loading the matching processing cycle…</p>
      : !beat ? <p className="mt-3 text-sm text-white/60">{data.match_status === 'ambiguous' ? 'Multiple cycles reference this record; none has been selected automatically.' : 'No exact connection is available. The trace may be missing, shortened, or from an older version.'}</p>
      : <div className="mt-3 space-y-4">
        <p className="text-sm text-white/75">Processing: {processing?.replaceAll('_', ' ') || 'Status not recorded'} · Task: {beat.assessment?.state ? assessmentLabels[beat.assessment.state] || beat.assessment.state : 'Assessment unavailable'}</p>
        <p className="text-xs text-white/50">Matched by the saved record ID. Processing completion does not establish task completion or message delivery.</p>
        <BeatSummary beat={beat}/>
        <details className={`${panel} p-3`}><summary className="cursor-pointer text-sm text-white/75">Decisions and observed results</summary><div className="mt-4"><EventTimeline events={beat.events}/></div></details>
        <details className={`${panel} p-3`}><summary className="cursor-pointer text-sm text-white/75">Technical cycle details</summary><div className="mt-4"><BeatDetails beat={beat}/></div></details>
      </div>}
  </section>;
}

export function AwarenessDiagnostics({ sapienId }: { sapienId: string }) {
  const requestVersion = useRef(0);
  const [data, setData] = useState<AwarenessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true); setError('');
    try {
      const result = await sapiensService.getAwareness(sapienId, 20);
      if (version === requestVersion.current) { setData(result); setRevision(value => value + 1); }
    } catch (caught) {
      if (version === requestVersion.current) setError((caught as ApiError).message || 'Could not load saved understanding.');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [sapienId]);
  useEffect(() => {
    setData(null); setSelectedId(null); setSearch('');
    void refresh();
    return () => { requestVersion.current += 1; };
  }, [refresh]);
  const history = useMemo(() => {
    const items = data?.history ?? [];
    return data?.current ? [data.current, ...items.filter(item => item.id !== data.current?.id)] : items;
  }, [data]);
  const selected = history.find(item => item.id === selectedId) ?? history[0];
  const filteredHistory = useMemo(() => history.filter(item =>
    [item.understanding, item.focus, item.subject?.content, item.state, item.remaining].some(value => value?.toLowerCase().includes(search.toLowerCase()))
  ), [history, search]);


  if (loading && !data) return <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-white/60"><Loader2 className="h-4 w-4 animate-spin"/>Loading saved understanding…</div>;
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-lg font-medium text-white/90">How understanding develops</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-white/60">Follow an event from its original words to the understanding saved by this Sapien, and see what remains unresolved.</p>
        <p className="mt-2 text-xs leading-5 text-white/45">Showing up to 20 recent records. Times include your timezone; simulation times may be ahead of today. Source text may already be shortened in storage.</p>
      </div>
      <button onClick={() => void refresh()} disabled={loading} className="flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-sm text-white/75 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}/>Refresh</button>
    </header>
    {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-400/20 p-4 text-sm text-red-200"><AlertCircle className="h-4 w-4"/>{error}<button onClick={() => void refresh()} className="ml-auto underline">Retry</button></div>}
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
      <section className={`${panel} overflow-hidden`} aria-label="Recent understanding">
        <div className="border-b border-white/10 p-4"><h3 className="text-sm font-medium text-white/80">Recent understanding</h3>
          <label className="mt-3 flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2"><Search className="h-4 w-4 shrink-0 text-white/50"/><input aria-label="Search recent understanding" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search events or understanding" className="min-w-0 w-full bg-transparent text-sm text-white/80 outline-none"/></label>
        </div>
        <div className="max-h-[640px] overflow-y-auto">{filteredHistory.map(item => <button key={item.id} onClick={() => setSelectedId(item.id)} aria-pressed={selected?.id === item.id} className={`block w-full border-b border-white/[.07] p-4 text-left last:border-0 ${selected?.id === item.id ? 'bg-cyan-400/10 ring-1 ring-inset ring-cyan-300/30' : 'hover:bg-white/[.04]'}`}>
          <span className="block text-xs text-white/55">{absoluteTime(item.assessed_at || item.created_at)}</span>
          <span className="mt-2 block line-clamp-3 text-sm leading-6 text-white/80">{item.understanding || item.focus || 'No saved understanding'}</span>
          <span className="mt-2 block text-xs text-cyan-200/75">{item.state ? assessmentLabels[item.state] || item.state.replaceAll('_', ' ') : 'Assessment unavailable'}</span>
        </button>)}{!filteredHistory.length && <p className="p-4 text-sm text-white/55">{history.length ? 'No records match your search.' : 'No saved understanding is available yet.'}</p>}</div>
      </section>
      <section className="min-w-0 space-y-3" aria-label="Selected understanding">
        {selected ? <><p className="text-xs text-white/55">Selected record · {absoluteTime(selected.assessed_at || selected.created_at)}</p><UnderstandingStory item={selected}/><RelatedCycle key={`${sapienId}:${selected.id}:${revision}`} sapienId={sapienId} thoughtId={selected.id}/></> : <p className={`${panel} p-6 text-sm text-white/55`}>An event and its saved understanding will appear here when available.</p>}
      </section>
    </div>
  </div>;
}
