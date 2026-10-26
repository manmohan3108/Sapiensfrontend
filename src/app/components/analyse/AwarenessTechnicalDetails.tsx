import { useState } from 'react';
import { Bot, CheckCircle2, ChevronRight, CircleDot, Trophy } from 'lucide-react';
import type { AwarenessBeat } from '../../types/sapiensTypes';
import { AwarenessFlowGraph } from './AwarenessFlowGraph';
import { absoluteTime } from './awarenessPresentation';
const panel = 'rounded-xl border border-white/[.07] bg-white/[.025]';
const sensitiveKey = /(credential|secret|token|password|argument|\bargs?\b|payload|result|prompt|raw_response)/i;
function duration(beat: AwarenessBeat) {
  if (!beat.started_at || !beat.completed_at) return 'Timing unavailable';
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

function SummaryBlock({ title, value }: { title: string; value: unknown }) {
  const direct = text(value); const fields = safeFields(value);
  return <section className={`${panel} p-3`}><p className="text-[9px] uppercase tracking-[.16em]" style={{ color: 'var(--an-muted)' }}>{title}</p>{direct ? <p className="mt-2 text-[11px] leading-5 text-white/58">{direct}</p> : fields.length ? <dl className="mt-2 grid gap-2 sm:grid-cols-2">{fields.map(field => <div key={field.key}><dt className="text-[8px] uppercase text-white/22">{field.key.replaceAll('_', ' ')}</dt><dd className="mt-0.5 break-words text-[10px] text-white/58">{field.value}</dd></div>)}</dl> : <p className="mt-2 text-[10px] italic text-white/22">No public summary returned.</p>}</section>;
}

function AssessmentSummary({ beat }: { beat: AwarenessBeat }) {
  const assessment = beat.assessment;
  if (!assessment) return null;
  const evidence = assessment.evidence_refs ?? [];
  return <section className={`${panel} border-emerald-400/10 p-4`}><div className="flex flex-wrap items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300/65"/><h4 className="text-[11px] font-medium text-white/70">Outcome assessment</h4>{typeof assessment.assessed === 'boolean' && <span className="rounded-full bg-white/[.05] px-2 py-0.5 text-[8px] text-white/45">{assessment.assessed ? 'Assessed' : 'Not assessed'}</span>}{assessment.state && <span className="rounded-full bg-emerald-400/[.08] px-2 py-0.5 text-[8px] capitalize text-emerald-100/60">{assessment.state}</span>}{typeof assessment.confidence === 'number' && <span className="rounded-full bg-white/[.05] px-2 py-0.5 text-[8px] text-white/45">{Math.round(assessment.confidence * 100)}% confidence</span>}</div>{assessment.reason && <p className="mt-3 text-[10px] leading-5 text-white/58"><span className="text-white/28">Reason: </span>{assessment.reason}</p>}{assessment.remaining && <p className="mt-2 text-[10px] leading-5 text-amber-100/60"><span className="text-white/28">Remaining: </span>{assessment.remaining}</p>}{assessment.review_at && <p className="mt-2 text-[9px] text-white/30">Review {absoluteTime(assessment.review_at)}</p>}{evidence.length > 0 && <details className="mt-3 rounded-lg border border-white/[.06] bg-black/10"><summary className="cursor-pointer px-3 py-2 text-[9px] text-white/35">Evidence references ({evidence.length})</summary><div className="border-t border-white/[.05] p-3 font-mono text-[8px] leading-4 text-white/35">{evidence.map(reference => <div key={reference} className="break-all">{reference}</div>)}</div></details>}</section>;
}

function CandidateFlow({ beat }: { beat: AwarenessBeat }) {
  const summary = beat.candidate_summary; if (!summary) return <SummaryBlock title="Focus selection" value={null} />;
  const sourceCounts = summary.source_counts || summary.sources || {}; const candidates = summary.bounded_candidates || summary.candidates || [];
  const attention = beat.attention ?? [];
  const winnerText = text(beat.winner) || safeFields(beat.winner).map(item => `${item.key}: ${item.value}`).join(' · ') || 'No winner summary returned';
  return <section className={`${panel} p-3`}><div className="flex flex-wrap items-center gap-2"><span className="text-[9px] uppercase tracking-[.16em] text-amber-200/55">Possible topics → selected focus</span>{summary.truncated || summary.was_truncated ? <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[8px] text-amber-200">Topic list shortened</span> : null}</div><div className="mt-3 flex flex-wrap items-center gap-2"><span className="rounded-lg border border-white/[.07] bg-white/[.03] px-3 py-2 text-[10px] text-white/48"><b className="font-mono font-normal text-white/75">{summary.collected ?? '—'}</b> collected</span><ChevronRight className="h-3 w-3 text-white/20" /><span className="rounded-lg border border-amber-400/15 bg-amber-400/[.05] px-3 py-2 text-[10px] text-amber-100/55"><b className="font-mono font-normal text-amber-100/80">{summary.held ?? 0}</b> held</span><ChevronRight className="h-3 w-3 text-white/20" /><span className="min-w-0 rounded-lg border border-emerald-400/15 bg-emerald-400/[.05] px-3 py-2 text-[10px] text-emerald-100/65"><Trophy className="mr-1 inline h-3 w-3" />{winnerText}</span></div>{Object.keys(sourceCounts).length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{Object.entries(sourceCounts).map(([name, count]) => <span key={name} className="rounded-md bg-cyan-400/[.05] px-2 py-1 text-[8px] text-cyan-100/50">{name} <b className="font-mono font-normal text-cyan-200/80">{count}</b></span>)}</div>}{candidates.length > 0 && <div className="mt-3 text-[9px] text-white/28">{candidates.length} bounded candidate {candidates.length === 1 ? 'summary' : 'summaries'} returned; raw arguments and results are intentionally hidden.</div>}{attention.length > 0 ? <div className="mt-4 overflow-hidden rounded-xl border border-violet-400/10"><div className="border-b border-white/[.05] bg-violet-400/[.04] px-3 py-2"><p className="text-[9px] font-medium text-violet-100/60">Autonomous attention adjustment</p><p className="mt-0.5 text-[8px] text-white/25">Compare the original priority with the adjusted priority after recent attention is taken into account.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-[9px]"><thead className="bg-black/10 text-white/25"><tr><th className="px-3 py-2 font-normal">Source</th><th className="px-3 py-2 font-normal">Handle</th><th className="px-3 py-2 text-right font-normal">Raw source salience</th><th className="px-3 py-2 text-right font-normal">Attention factor</th><th className="px-3 py-2 text-right font-normal">Adjusted priority</th><th className="px-3 py-2 text-right font-normal">Recent attentions</th></tr></thead><tbody>{attention.map((row, index) => { const habituated = row.attention_factor < 1 || row.adjusted_priority < row.raw_salience; return <tr key={`${row.source}-${row.handle}-${index}`} className="border-t border-white/[.04] text-white/48"><td className="px-3 py-2.5">{row.source}</td><td className="max-w-48 truncate px-3 py-2.5 font-mono" title={row.handle}>{row.handle}</td><td className="px-3 py-2.5 text-right font-mono">{row.raw_salience}</td><td className={`px-3 py-2.5 text-right font-mono ${habituated ? 'text-amber-200/75' : ''}`}>{row.attention_factor}</td><td className="px-3 py-2.5 text-right font-mono text-violet-200/75">{row.adjusted_priority}</td><td className="px-3 py-2.5 text-right font-mono">{row.recent_attentions}</td></tr>; })}</tbody></table></div></div> : beat.mode === 'reactive' ? <p className="mt-4 rounded-lg border border-cyan-400/10 bg-cyan-400/[.035] px-3 py-2 text-[9px] text-cyan-100/40">This run responded directly to an input, so no self-directed attention adjustments are shown.</p> : null}</section>;
}

export function AwarenessTechnicalDetails({ beat }: { beat: AwarenessBeat }) {
  const [graphOpen, setGraphOpen] = useState(false);

  const focusFormation = beat.focus_formation ?? beat.events?.find(event => /focus.*form|form.*focus/i.test(event.stage ?? ''))?.detail;
  return <div className="space-y-3">
    <section className={`${panel} p-4`}><div className="flex flex-wrap items-start gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl border ${beat.mode === 'autonomous' ? 'border-violet-400/20 bg-violet-400/[.08] text-violet-200' : 'border-cyan-400/20 bg-cyan-400/[.08] text-cyan-200'}`}>{beat.mode === 'autonomous' ? <Bot className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}</span><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium text-white/75">Processing cycle</h3><span className="rounded-full bg-white/[.05] px-2 py-0.5 text-[8px] capitalize text-white/45">{beat.mode || 'mode unavailable'}</span></div><p className="mt-1 text-[10px] text-white/30">Triggered by {beat.trigger_source || 'unknown source'} · {absoluteTime(beat.started_at)} · Stored time interval: {duration(beat)}</p>{beat.occurrence_id && <p className="mt-1 text-[8px] text-white/22">Occurrence <span className="font-mono text-white/35">{beat.occurrence_id}</span> · continuing beats may share this ID</p>}</div><span className="ml-auto font-mono text-[8px] text-white/20">{beat._id}</span></div></section>

    <details className={`${panel} p-4`} onToggle={event => setGraphOpen(event.currentTarget.open)}><summary className="cursor-pointer text-sm text-white/65">Explore the technical flow graph</summary>{graphOpen && <div className="mt-4"><AwarenessFlowGraph beat={beat}/></div>}</details>
    <details className={`${panel} p-4`}><summary className="cursor-pointer text-sm text-white/65">Why this information received attention</summary><div className="mt-4"><CandidateFlow beat={beat}/></div></details>
    <details className={`${panel} p-3`}><summary className="cursor-pointer text-[10px] text-white/40">Supporting diagnostic summaries</summary><div className="mt-3 grid gap-3 md:grid-cols-3"><SummaryBlock title="Preparation" value={beat.preparation}/><SummaryBlock title="Focus formation" value={focusFormation}/><SummaryBlock title="Selected context" value={beat.curation}/><AssessmentSummary beat={beat}/><SummaryBlock title="Generated response / final resolution" value={beat.final}/><SummaryBlock title="Delivery route" value={beat.delivery}/></div></details>
  </div>;
}

