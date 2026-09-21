import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Loader2, RefreshCw } from 'lucide-react';
import { inquiryService } from '../../core/services/inquiryService';
import type { InquiryDetail, InquiryFilters, InquiryKind, InquiryPage } from '../../types/inquiryTypes';
import type { ApiError } from '../../types/apiTypes';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { InquiryRunSelector } from './InquiryRunSelector';

const panel = 'rounded-xl border border-white/[.07] bg-white/[.025]';
const button = 'rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/5 disabled:opacity-40';
const input = 'mt-2 block w-full rounded-lg border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-white/80';
const defaults: InquiryFilters = { limit: 50, state: '', source: '', simulation_run_id: '', channel: '', delivery_state: '' };
const title = (kind: InquiryKind) => kind === 'questioning' ? 'Questioning' : 'Curiosity';
const jobHref = (kind: InquiryKind, id: string, runId: string) => `/admin/analyse/engine-jobs?${new URLSearchParams({ engine_name: kind === 'questioning' ? 'weave_questioning' : 'curiosity_engine', job_id: id, simulation_run_id: runId })}`;
function display(value: unknown): string {
  if (value == null || value === '') return 'Not recorded';
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}
function timestamp(value: string | null | undefined) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : `${date.toLocaleString()} (${date.toISOString()})`;
}
function Field({ label, value }: { label: string; value: unknown }) {
  return <div className="min-w-0"><dt className="text-[11px] text-white/40">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-white/80 [overflow-wrap:anywhere]">{display(value)}</dd></div>;
}
function Stored({ label, value }: { label: string; value: unknown }) {
  return <section className={`${panel} p-4`}><h3 className="text-sm text-cyan-100">{label}</h3><pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-white/70 [overflow-wrap:anywhere]">{display(value)}</pre></section>;
}
function Failure({ status, retry }: { status?: number; retry: () => void }) {
  const message = status === 401 ? 'Session expired. Sign in with an administrator account.'
    : status === 403 ? 'Administrator access required. Server permissions remain authoritative.'
    : status === 404 ? 'Record, Sapien, or endpoint unavailable in this scope. A legacy reference may no longer exist.'
    : status === 400 || status === 422 ? 'Invalid filters or record reference. Check the run ID and filter values.'
    : 'Could not read stored records. The backend may be unavailable.';
  return <div role="alert" className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-xs text-amber-100"><p>{message}</p><button type="button" className={`${button} mt-3`} onClick={retry}>Retry read</button></div>;
}
function Loading() {
  return <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-xs text-white/55"><Loader2 className="h-4 w-4 animate-spin" />Loading stored records…</div>;
}

function RecordDetail({ sapienId, kind, id, runId, onQuestion }: { sapienId: string; kind: InquiryKind; id: string; runId: string; onQuestion: (id: string) => void }) {
  const [data, setData] = useState<InquiryDetail | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null); setError(null);
    inquiryService.detail(sapienId, kind, id, runId).then(result => {
      if (!active) return;
      // Do not render a response from another Sapien or simulation scope.
      if (String(result.sapien_id) !== sapienId || (result.simulation_run_id ?? '') !== runId || (result.item.simulation_run_id ?? '') !== runId) {
        setError({ message: 'Scope mismatch' }); return;
      }
      setData(result);
    }).catch((caught: ApiError) => { if (active) setError({ message: 'Read failed', status: caught?.status }); });
    return () => { active = false; };
  }, [sapienId, kind, id, runId, revision]);
  const item = data?.item;
  return <div className="space-y-4">
    <p className="break-all text-xs text-white/50">{title(kind)} record {id} · {runId ? `Simulation ${runId}` : 'Normal'}</p>
    <button className={button} type="button" onClick={() => { setData(null); setError(null); setRevision(value => value + 1); }}>Refresh detail</button>
    {!data && !error && <Loading />}
    {error && <Failure status={error.status} retry={() => setRevision(value => value + 1)} />}
    {data && item && <>
      <p className="text-[11px] text-white/45">Read as of {timestamp(data.as_of)} (real audit time).</p>
      <Stored label={kind === 'curiosity' ? 'Original question' : 'Generated question'} value={kind === 'curiosity' ? item.original_question : item.question} />
      {kind === 'curiosity' && <Stored label="Recommended phrasing" value={item.question} />}
      <section className={`${panel} p-4`}><dl className="grid gap-4 sm:grid-cols-2">
        <Field label="Assessment state" value={item.state === 'answered' ? 'Assessed answered' : item.state} />
        <Field label="Source" value={item.source} /><Field label="Source handle" value={item.source_handle} />
        <Field label="Simulation run" value={item.simulation_run_id || 'Normal'} />
        {kind === 'curiosity' && <>
          <Field label="Channel" value={item.channel} /><Field label="Stored selection reason" value={item.selection_reason} />
          <Field label="Attention / review state" value={item.delivery_state} /><Field label="Review version" value={item.review_version} />
          <Field label="Gap key (not a record reference)" value={item.gap_key} /><Field label="Blocking" value={item.blocking} />
        </>}
        {(['created_at', 'updated_at', 'occurred_at', 'expires_at', 'closed_at', 'review_at', 'resolved_at', 'asked_at', 'usage_observed_at'] as const).filter(field => field in item).map(field => <Field key={field} label={field} value={timestamp(item[field])} />)}
        <Field label="Request ID" value={item.request_id} /><Field label="Workflow ID" value={item.workflow_id} />
      </dl></section>
      <section className={`${panel} space-y-3 p-4 text-xs text-white/60`}>
        <div>Stored job: {item.job_id ? <Link className="break-all text-cyan-200 underline" to={jobHref(kind, item.job_id, runId)}>{item.job_id}</Link> : 'Unavailable — no explicit job ID retained'}</div>
        {kind === 'curiosity' && <div>Questioning reference: {item.question_record_id ? <button type="button" className="break-all text-cyan-200 underline" onClick={() => onQuestion(item.question_record_id!)}>{item.question_record_id}</button> : 'Unavailable — no explicit question record ID retained'}</div>}
      </section>
      <Stored label="Source context" value={item.context} />
      <Stored label="Assessed answer / evidence (stored outcome)" value={item.outcome} />
      {kind === 'curiosity' && <><Stored label="Stored attention" value={item.attention} /><Stored label="Observed usage outcome" value={item.usage_outcome} /></>}
      <p className="text-xs leading-5 text-white/45">Generated questions, selected probes, attention requests, reviews, and assessed answers are separate stages. An attention request or asked_at timestamp does not establish recipient delivery. Stored assessments are not independently verified truth. These are the latest retained facts, not a complete event history. Stale means closed without establishing an answer; job completion proves processing, not resolution.</p>
      <p className="text-xs leading-5 text-white/45">Event, review, and expiry dates use cognitive time and may be simulated. They are not compared with the browser clock or real read time to infer expiry. Missing or cleared context is not a fetch error.</p>
    </>}
  </div>;
}

export function InquiryInspection({ sapienId, kind }: { sapienId: string; kind: InquiryKind }) {
  const [params] = useSearchParams();
  return <InquiryList key={`${sapienId}:${kind}:${params.toString()}`} sapienId={sapienId} kind={kind} />;
}

function InquiryList({ sapienId, kind }: { sapienId: string; kind: InquiryKind }) {
  const [params, setParams] = useSearchParams();
  const initialRun = params.get('simulation_run_id') || '';
  const [filters, setFilters] = useState<InquiryFilters>({ ...defaults, simulation_run_id: initialRun });
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<InquiryPage | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [selected, setSelected] = useState<{ kind: InquiryKind; id: string } | null>(() => params.get('record_id') ? { kind, id: params.get('record_id')! } : null);
  const requestVersion = useRef(0);
  const valid = Number.isInteger(filters.limit) && filters.limit >= 1 && filters.limit <= 200
    && filters.source.length <= 256 && filters.source === filters.source.trim()
    && filters.simulation_run_id.length <= 128 && filters.simulation_run_id === filters.simulation_run_id.trim();
  const resetContent = () => { requestVersion.current += 1; setData(null); setError(null); setSelected(null); };
  function change(next: Partial<InquiryFilters>) { resetContent(); setFilters(current => ({ ...current, ...next })); }
  function selectRun(runId: string) {
    if (runId === filters.simulation_run_id) return;
    resetContent();
    const next = new URLSearchParams(params);
    next.set('simulation_run_id', runId); // Empty is an explicit Normal scope.
    next.delete('record_id');
    setParams(next);
  }
  useEffect(() => {
    let active = true;
    const version = requestVersion.current;
    if (!valid) return;
    inquiryService.list(sapienId, kind, filters).then(result => {
      if (!active || version !== requestVersion.current) return;
      if (String(result.sapien_id) !== sapienId || (result.simulation_run_id ?? '') !== filters.simulation_run_id || result.items.some(item => (item.simulation_run_id ?? '') !== filters.simulation_run_id)) {
        setError({ message: 'Scope mismatch' }); return;
      }
      setData(result);
    }).catch((caught: ApiError) => { if (active && version === requestVersion.current) setError({ message: 'Read failed', status: caught?.status }); });
    return () => { active = false; };
  }, [sapienId, kind, filters, valid, revision]);
  function refresh() { resetContent(); setRevision(value => value + 1); }
  return <div className="space-y-4">
    <section className={`${panel} p-4`}><h2 className="text-sm text-white/80">{title(kind)} <span className="ml-2 rounded-full border border-cyan-300/20 px-2 py-0.5 text-[10px] text-cyan-100/70">Admin · Read-only</span></h2>
      <p className="mt-2 text-xs leading-5 text-white/50">Inspect stored {kind === 'questioning' ? 'generated questions' : 'selected probes'} for Sapien {sapienId}. These reads never run engines. Results and summaries describe a bounded subset, ordered by creation time only within that subset.</p>
    </section>
    <InquiryRunSelector sapienId={sapienId} runId={filters.simulation_run_id} onChange={selectRun} />
    <section className={`${panel} p-4`}><div className="flex flex-wrap items-end gap-3">
      <label className="text-xs text-white/50">State<select className={input} value={filters.state} onChange={event => change({ state: event.target.value as InquiryFilters['state'] })}><option value="">All states</option><option value="open">Open</option><option value="answered">Assessed answered</option><option value="stale">Stale</option></select></label>
      <label className="text-xs text-white/50">Source (exact match)<input className={input} maxLength={256} value={filters.source} onChange={event => change({ source: event.target.value })} placeholder="All sources" /></label>
      {kind === 'curiosity' && <>
        <label className="text-xs text-white/50">Channel<select className={input} value={filters.channel} onChange={event => change({ channel: event.target.value as InquiryFilters['channel'] })}><option value="">All channels</option>{['user', 'source', 'experiment'].map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs text-white/50">Attention / review state<select className={input} value={filters.delivery_state} onChange={event => change({ delivery_state: event.target.value as InquiryFilters['delivery_state'] })}><option value="">All states</option><option value="proposed">Proposed</option><option value="attention_requested">Attention requested</option><option value="reviewed">Reviewed</option></select></label>
      </>}
      <label className="text-xs text-white/50">Subset limit<input className={input} type="number" min={1} max={200} step={1} value={filters.limit || ''} onChange={event => change({ limit: Number(event.target.value) })} /></label>
      <button type="button" className={`${button} flex items-center gap-2`} disabled={!valid} onClick={refresh}><RefreshCw className="h-3 w-3" />Refresh</button>
      <button type="button" className={button} onClick={() => change({ ...defaults, simulation_run_id: filters.simulation_run_id })}>Reset filters</button>
    </div><p className="mt-3 text-[11px] text-white/40">Filters apply immediately. Normal excludes simulation runs; a simulation view reads only the exact run ID. No cross-run totals are shown.</p></section>
    {!valid && <p role="status" className="p-4 text-xs text-amber-100">Use a limit from 1 to 200, a source up to 256 characters without surrounding spaces, and an exact run ID up to 128 characters for simulation scope.</p>}
    {valid && !data && !error && <Loading />}
    {error && <Failure status={error.status} retry={refresh} />}
    {data && <>
      <section className={`${panel} space-y-3 p-4`}><h3 className="text-sm text-white/80">{data.count} records in returned subset</h3>
        <p className="text-xs text-white/50">Scope: {data.simulation_run_id || 'Normal'} · Limit: {data.limit} · Read as of {timestamp(data.as_of)} (real time)</p>
        <p className="text-xs leading-5 text-white/45">{data.has_more ? 'Additional matching records exist outside this subset.' : 'No additional matches reported by this bounded read.'} This is not a global total or a guarantee of the globally newest records.</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(data.summary).map(([group, counts]) => <div key={group} className="rounded-lg border border-white/[.07] p-3"><h4 className="text-xs text-cyan-100/80">{group.replaceAll('_', ' ')} · subset only</h4><dl className="mt-2 space-y-1 text-xs text-white/60">{Object.entries(counts ?? {}).map(([label, count]) => <div key={label} className="flex justify-between gap-3"><dt className="break-all">{label === 'answered' ? 'Assessed answered' : label.replaceAll('_', ' ')}</dt><dd>{count}</dd></div>)}{!Object.keys(counts ?? {}).length && <div>No counts</div>}</dl></div>)}</div>
      </section>
      <section className={`${panel} overflow-hidden`}><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><caption className="p-3 text-left text-white/50">Creation time descending within the returned subset · open a record for full context</caption><thead className="bg-[#0b101c] text-white/40"><tr>{['Question', 'Source', 'Assessment', ...(kind === 'curiosity' ? ['Attention / review'] : []), 'Created', 'Job'].map(label => <th key={label} className="px-3 py-2 font-normal">{label}</th>)}</tr></thead>
        <tbody>{data.items.map(item => <tr key={item.id} className="border-t border-white/[.06] text-white/70"><td className="max-w-md px-3 py-3"><button type="button" className="whitespace-pre-wrap break-words text-left text-cyan-200 underline" onClick={() => setSelected({ kind, id: item.id })}>{item.question || item.id}</button><p className="mt-1 break-all text-[10px] text-white/35">{item.id}</p></td><td className="max-w-48 break-words px-3 py-3">{display(item.source)}</td><td className="px-3 py-3">{item.state === 'answered' ? 'Assessed answered' : display(item.state)}</td>{kind === 'curiosity' && <td className="px-3 py-3">{display(item.delivery_state)}</td>}<td className="px-3 py-3">{timestamp(item.created_at)}</td><td className="px-3 py-3">{item.job_id ? <Link className="text-cyan-200 underline" to={jobHref(kind, item.job_id, filters.simulation_run_id)}>Inspect job</Link> : 'Unavailable'}</td></tr>)}</tbody></table></div>
        {!data.items.length && <p className="p-8 text-center text-xs leading-5 text-white/50">No stored records returned for this scope and these filters. This does not establish that the engine is disabled.</p>}
      </section>
    </>}
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto border-white/10 bg-[#09101c] text-white"><DialogTitle>{selected ? title(selected.kind) : title(kind)} details</DialogTitle><DialogDescription className="text-xs text-white/45">Sensitive stored content · read-only administrator inspection</DialogDescription>
      {selected && valid && <RecordDetail key={`${selected.kind}:${selected.id}:${filters.simulation_run_id}`} sapienId={sapienId} kind={selected.kind} id={selected.id} runId={filters.simulation_run_id} onQuestion={id => setSelected({ kind: 'questioning', id })} />}
    </DialogContent></Dialog>
  </div>;
}
