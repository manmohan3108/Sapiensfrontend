import { useEffect, useState } from 'react';
import { AlertCircle, Eye, Loader2, RefreshCw } from 'lucide-react';
import { feedbackService } from '../../core/services/feedbackService';
import { FEEDBACK_STATES } from '../../types/feedbackTypes';
import type { FeedbackReference, FeedbackResponse, FeedbackState } from '../../types/feedbackTypes';
import type { ApiError } from '../../types/apiTypes';

const panel = 'rounded-xl border border-white/[.07] bg-white/[.025]';
const colors: Record<FeedbackState, string> = {
  unrelated: '#94a3b8', ambiguous: '#fcd34d', interpreted: '#67e8f9', superseded: '#c4b5fd',
};

function timestamp(value: string | null | undefined) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function Reference({ label, value }: { label: string; value: FeedbackReference }) {
  return <div className="min-w-0 rounded-lg border border-white/[.07] bg-black/10 p-3">
    <h4 className="text-[10px] uppercase tracking-wider text-cyan-200/60">{label} reference</h4>
    <dl className="mt-2 space-y-2 text-xs">
      <div><dt className="text-white/35">ID</dt><dd className="break-all font-mono text-white/65">{value?.id || 'Not recorded'}</dd></div>
      <div><dt className="text-white/35">Source</dt><dd className="break-words text-white/65">{value?.source || 'Not recorded'}</dd></div>
      <div><dt className="text-white/35">Occurred at</dt><dd className="text-white/65">{timestamp(value?.occurred_at)}</dd></div>
    </dl>
  </div>;
}

export function FeedbackInspection({ sapienId }: { sapienId: string }) {
  const [states, setStates] = useState<FeedbackState[]>([]);
  const [limit, setLimit] = useState(50);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(null); setData(null);
    feedbackService.list(sapienId, states, limit).then(result => {
      if (active) setData(result);
    }).catch((caught: unknown) => {
      if (active) setError({
        message: (caught as ApiError)?.message || 'Could not load feedback findings.',
        status: (caught as ApiError)?.status,
      });
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sapienId, states, limit, revision]);

  return <div className="space-y-4">
    <section className={`${panel} p-4`}>
      <div className="flex flex-wrap items-center gap-2">
        <Eye className="h-4 w-4 text-cyan-200" />
        <h2 className="text-sm text-white/80">Feedback findings</h2>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/5 px-2 py-0.5 text-[10px] text-cyan-100/65">Read-only</span>
        {(data || error?.status === 503) && <span className="text-xs text-white/45">Mode: {data?.mode ?? 'off'}</span>}
      </div>
      <p className="mt-2 max-w-3xl text-xs leading-5 text-white/45">Inspect interpreted FeedbackFinding records linking experiences and activities. These are not SignalFeedback usage reports and do not indicate that learning or a behavior change occurred.</p>
    </section>

    <section className={`${panel} p-4`} aria-label="Feedback filters">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <fieldset><legend className="mb-2 text-xs text-white/50">States (none selected means all)</legend>
          <div className="flex flex-wrap gap-2">{FEEDBACK_STATES.map(state => <label key={state} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65">
            <input type="checkbox" checked={states.includes(state)} onChange={event => setStates(current => event.target.checked ? [...current, state] : current.filter(item => item !== state))} className="accent-cyan-300" />{state}
          </label>)}</div>
        </fieldset>
        <div className="flex items-end gap-2">
          <label className="text-xs text-white/50"><span className="mb-2 block">Result limit</span><select value={limit} onChange={event => setLimit(Number(event.target.value))} className="rounded-lg border border-white/10 bg-[#0b1220] px-3 py-2 text-white/70">{[10, 25, 50, 100].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <button type="button" onClick={() => setRevision(value => value + 1)} disabled={loading} className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 disabled:opacity-40"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh</button>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-white/35">Bounded returned subset, sorted within that subset by the backend. This is not a complete history or a guarantee of the globally newest findings.</p>
    </section>

    {loading && <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-xs text-white/45"><Loader2 className="h-4 w-4 animate-spin" />Loading feedback findings…</div>}
    {error && <div role="alert" className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-xs">
      <div className="flex items-center gap-2 text-amber-100"><AlertCircle className="h-4 w-4" /><h3>{error.status === 503 ? 'Feedback engine unavailable · mode off' : error.status === 400 ? 'Invalid feedback filters' : 'Could not load feedback'}</h3></div>
      <p className="mt-2 break-words text-white/50">{error.message}</p>
      <p className="mt-2 text-white/40">{error.status === 503 ? 'Ask an administrator to check engine availability, then retry.' : error.status === 400 ? 'Clear the state filters and retry.' : 'Check your connection or retry the request.'}</p>
      <button type="button" onClick={() => { if (error.status === 400) setStates([]); setRevision(value => value + 1); }} className="mt-3 rounded-lg border border-white/15 px-3 py-2 text-white/70">{error.status === 400 ? 'Clear filters and retry' : 'Retry'}</button>
    </div>}
    {data && <section aria-label="Returned feedback findings" className="space-y-3">
      <p role="status" className="text-xs text-white/45">{data.count} findings returned · Sapiens {data.sapien_id}</p>
      {!data.findings.length && <div className={`${panel} p-10 text-center text-xs text-white/45`}>No findings returned for these filters.</div>}
      {data.findings.map(finding => <article key={finding._id} className={`${panel} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full border px-2 py-1 text-[11px]" style={{ color: colors[finding.state] ?? '#94a3b8', borderColor: `${colors[finding.state] ?? '#94a3b8'}40` }}>{finding.state}</span>
          <span className="text-xs text-white/45">Confidence: {Number.isFinite(finding.confidence) ? finding.confidence : 'Not recorded'}</span>
        </div>
        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/75">{finding.meaning || 'No meaning recorded.'}</p>
        <details className="mt-4 border-t border-white/[.07] pt-3">
          <summary className="cursor-pointer text-xs text-cyan-100/65">Inspect references and timestamps</summary>
          <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
            <div><dt className="text-white/35">Finding ID</dt><dd className="break-all font-mono text-white/65">{finding._id}</dd></div>
            <div><dt className="text-white/35">Sapiens ID</dt><dd className="text-white/65">{finding.sapien_id}</dd></div>
            {(['created_at', 'updated_at', 'last_surfaced_at', 'acknowledged_at'] as const).map(field => <div key={field}><dt className="capitalize text-white/35">{field.replaceAll('_', ' ')}</dt><dd className="text-white/65">{timestamp(finding[field])}</dd></div>)}
          </dl>
          <div className="mt-4 grid gap-3 md:grid-cols-2"><Reference label="Experience" value={finding.experience} /><Reference label="Activity" value={finding.activity} /></div>
        </details>
      </article>)}
    </section>}
  </div>;
}
