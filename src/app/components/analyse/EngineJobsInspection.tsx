import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, ArrowLeft, Copy, Loader2, RefreshCw } from 'lucide-react';
import { engineJobsService } from '../../core/services/engineJobsService';
import type { ApiError } from '../../types/apiTypes';
import type { EngineJobDetailResponse, EngineJobFilters, EngineJobPage, EngineJobStatus } from '../../types/engineJobTypes';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';

const panel = 'rounded-xl border border-white/[.07] bg-white/[.025]';
const button = 'rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/5 disabled:opacity-40';
const input = 'mt-2 block w-full rounded-lg border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-white/80';
const statuses: EngineJobStatus[] = ['pending', 'running', 'completed', 'failed'];
const defaults: EngineJobFilters = { days: 7, engine_name: '', status: '', limit: 50 };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(value: unknown): string {
  if (value === undefined || value === null) return 'Not recorded';
  if (typeof value === 'string') return value || '(empty string)';
  return JSON.stringify(value, null, 2);
}

function timestamp(value: string | null | undefined) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : `${date.toLocaleString()} (${date.toISOString()})`;
}

function duration(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return 'Not recorded';
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} seconds`;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-[11px] text-white/40">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-xs text-white/80 [overflow-wrap:anywhere]">{children}</dd></div>;
}

function Identifier({ value, onOpen }: { value: unknown; onOpen?: (id: string) => void }) {
  const [copyState, setCopyState] = useState('');
  const id = typeof value === 'string' || typeof value === 'number' ? String(value) : null;
  if (!id) return <span>{text(value)}</span>;
  return <span className="flex flex-wrap items-center gap-2">
    <code className="min-w-0 select-text break-all">{id}</code>
    {onOpen && uuid.test(id) && <button type="button" className="text-cyan-200 underline" onClick={() => onOpen(id)}>Inspect parent job</button>}
    <button type="button" aria-label="Copy identifier" className="inline-flex items-center gap-1 text-white/50 hover:text-white" onClick={async () => {
      try { await navigator.clipboard.writeText(id); setCopyState('Copied'); }
      catch { setCopyState('Copy unavailable; select the identifier to copy.'); }
    }}><Copy className="h-3 w-3" />Copy</button>
    <span role="status" className="text-[10px] text-white/50">{copyState}</span>
  </span>;
}

function Raw({ label, value, note }: { label: string; value: unknown; note?: string }) {
  return <details className={`${panel} p-3`}>
    <summary className="cursor-pointer text-xs text-cyan-100/80">{label}</summary>
    {note && <p className="mt-2 text-xs leading-5 text-white/45">{note}</p>}
    <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-white/70 [overflow-wrap:anywhere]">{value === undefined ? 'Not recorded' : JSON.stringify(value, null, 2)}</pre>
  </details>;
}

function Loading({ detail = false }: { detail?: boolean }) {
  return <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-xs text-white/55"><Loader2 className="h-4 w-4 animate-spin" />Loading {detail ? 'stored job details' : 'engine jobs'}…</div>;
}

function Failure({ error, detail = false, retry }: { error: ApiError; detail?: boolean; retry: () => void }) {
  const status = error.status;
  const title = status === 403 ? 'Administrator access required' : status === 401 ? 'Session expired' : status === 404 ? (detail ? 'Job not found' : 'Sapiens or endpoint not found') : status === 400 ? 'Invalid filters or cursor' : 'Engine job analysis unavailable';
  const explanation = status === 403 ? 'Only active administrators can inspect engine jobs. Server permissions remain authoritative.'
    : status === 401 ? 'Sign in again with an active administrator account.'
    : status === 404 ? (detail ? 'This job is missing or belongs to another Sapien. The backend endpoint may also be unavailable.' : 'The selected Sapien may be missing, or this backend may not provide the analysis endpoint.')
    : status === 400 ? 'Apply valid filters or restart from the first page to discard the cursor.'
    : 'The backend could not be reached or could not read job storage. Retry when it is available.';
  return <div role="alert" className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-xs">
    <h3 className="text-amber-100">{title}</h3><p className="mt-2 leading-5 text-white/60">{explanation}</p>
    <button type="button" onClick={retry} className={`${button} mt-3`}>Retry read</button>
  </div>;
}

// IDs are presented exactly as stored. No record type or destination is inferred
// from a generic reference_id; current record inspectors have no ID-based route.
function storedIdentifiers(value: unknown, path = 'payload'): Array<{ path: string; value: unknown }> {
  if (Array.isArray(value)) return value.flatMap((item, index) => storedIdentifiers(item, `${path}[${index}]`));
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, item]) => {
    const name = `${path}.${key}`;
    if (/(^id$|_ids?$)/i.test(key)) {
      return Array.isArray(item) ? item.map((id, index) => ({ path: `${name}[${index}]`, value: id })) : [{ path: name, value: item }];
    }
    return storedIdentifiers(item, name);
  });
}

function Detail({ sapienId, jobId, onOpen }: { sapienId: string; jobId: string; onOpen: (id: string) => void }) {
  const [data, setData] = useState<EngineJobDetailResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setData(null); setError(null);
    engineJobsService.detail(sapienId, jobId).then(result => { if (active) setData(result); })
      .catch((caught: ApiError) => { if (active) setError({ message: 'Could not load job', status: caught?.status }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sapienId, jobId, revision]);
  const job = data?.job;
  const identifiers = job ? storedIdentifiers(job.payload) : [];
  const origin = job?.origin && typeof job.origin === 'object' && !Array.isArray(job.origin) ? job.origin as Record<string, unknown> : {};
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-3"><span className="text-xs text-white/50">Sapien {sapienId}</span><button type="button" disabled={loading} className={button} onClick={() => setRevision(value => value + 1)}>Refresh detail</button></div>
    <div className="text-xs text-white/70"><Identifier value={jobId} /></div>
    {loading && <Loading detail />}
    {error && <Failure error={error} detail retry={() => setRevision(value => value + 1)} />}
    {!loading && job && data && <>
      <p className="text-[11px] leading-5 text-white/45">Read as of {timestamp(data.as_of)}. Stored facts only; this read does not execute or change the job.</p>
      <section className={`${panel} p-4`}><h3 className="mb-3 text-sm text-cyan-100">Origin and stored action</h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <Fact label="Engine">{job.engine_name}</Fact><Fact label="Stored action">{text(job.action)}</Fact>
          <Fact label="Source">{text(origin.source)}</Fact><Fact label="Trigger">{text(origin.trigger)}</Fact>
          <Fact label="Created by">{text(origin.created_by)}</Fact><Fact label="Origin reference"><Identifier value={origin.reference_id} /></Fact>
          <Fact label="Workflow ID"><Identifier value={job.workflow_id} /></Fact><Fact label="Payload parent job"><Identifier value={job.parent_job_id} onOpen={onOpen} /></Fact>
          <Fact label="Origin parent job"><Identifier value={origin.parent_job_id} onOpen={onOpen} /></Fact>
        </dl>
      </section>
      <section className={`${panel} p-4`}><h3 className="mb-3 text-sm text-cyan-100">Status, failures and scheduling</h3>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Fact label="Status">{job.status}</Fact><Fact label="Eligibility at read time">{job.eligibility}</Fact><Fact label="Stored failure count (retries)">{job.retries}</Fact>
          <Fact label="Retry budget (max_retries)">{job.max_retries}</Fact><Fact label="Cooldown">{duration(job.cooldown_seconds)}</Fact><Fact label="Error value recorded">{job.has_error ? 'Yes' : 'No'}</Fact>
          {(['retryable', 'will_retry', 'timed_out'] as const).map(flag => <Fact key={flag} label={`Recorded error flag: ${flag}`}>{text(job.error_flags?.[flag])}</Fact>)}
        </dl>
        <p className="mt-3 text-xs leading-5 text-white/50">Retries counts stored failures, not executions or a complete attempt history. Error flags are stored facts, not a guarantee of future execution. Eligibility is calculated by the backend at the read time.</p>
        <p className="mt-2 text-xs leading-5 text-white/50">Pending jobs are due or delayed; running jobs are leased or lease_expired. Missing scheduling or lease timestamps yield unknown. Terminal jobs are not queued for scheduling.</p>
        {job.eligibility === 'lease_expired' && <p className="mt-3 text-xs text-amber-200">An expired lease does not prove that execution stopped.</p>}
      </section>
      <section className={`${panel} p-4`}><h3 className="mb-3 text-sm text-cyan-100">Timing and lease</h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          {(['created_at', 'updated_at', 'available_at', 'run_started_at', 'lease_until'] as const).map(field => <Fact key={field} label={field}>{timestamp(job[field])}</Fact>)}
          <Fact label="Age at read time">{duration(job.age_seconds)}</Fact><Fact label="Current running elapsed time">{job.status === 'running' ? duration(job.running_seconds) : 'Not applicable (not running)'}</Fact>
        </dl>
        <p className="mt-3 text-xs leading-5 text-white/50">Updated time is not a completion timestamp. Historical duration is not recorded here. Lease ownership tokens are never exposed.</p>
      </section>
      <section className={`${panel} p-4`}><h3 className="mb-2 text-sm text-cyan-100">Identifiers in the stored payload</h3>
        <p className="mb-3 text-xs leading-5 text-white/45">Producer-recorded references may no longer exist. Record and workflow IDs have no direct inspection route in this frontend; copy them for lookup. No target records are inferred.</p>
        <dl className="grid gap-4 sm:grid-cols-2">{identifiers.map(item => <Fact key={item.path} label={item.path}><Identifier value={item.value} onOpen={item.path.endsWith('.parent_job_id') ? onOpen : undefined} /></Fact>)}</dl>
        {!identifiers.length && <p className="text-xs text-white/50">No ID fields recorded in the payload. Inspect the full payload below for other stored values.</p>}
      </section>
      <Raw label="Full stored payload" value={job.payload} />
      <Raw label="Full stored origin" value={job.origin} />
      <Raw label="Recorded error" value={job.error} note="Stored error content, including messages or tracebacks when available. Null means no error value was recorded." />
      <Raw label="Legacy progress" value={job.progress} note="Progress is an inert legacy field and can be empty. It is not an execution result." />
      <Raw label="Complete returned job facts" value={job} note="The model has no separate execution-result or attempt-history field. No missing outcomes or attempts are reconstructed." />
    </>}
  </div>;
}

// The keyed inner view discards filters, cursors and sensitive in-memory content
// immediately when the selected Sapien changes.
export function EngineJobsInspection({ sapienId }: { sapienId: string }) {
  return <JobList key={sapienId} sapienId={sapienId} />;
}

function JobList({ sapienId }: { sapienId: string }) {
  const [draft, setDraft] = useState(defaults);
  const [request, setRequest] = useState<{ filters: EngineJobFilters; cursors: Array<string | null>; revision: number }>({ filters: defaults, cursors: [null], revision: 0 });
  const [data, setData] = useState<EngineJobPage | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobTrail, setJobTrail] = useState<string[]>([]);
  const selected = jobTrail[jobTrail.length - 1];
  useEffect(() => {
    let active = true;
    setLoading(true); setData(null); setError(null);
    engineJobsService.list(sapienId, request.filters, request.cursors[request.cursors.length - 1])
      .then(result => { if (active) setData(result); })
      .catch((caught: ApiError) => { if (active) setError({ message: 'Could not load jobs', status: caught?.status }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [sapienId, request]);
  function restart() { setRequest(current => ({ ...current, cursors: [null], revision: current.revision + 1 })); }

  return <div className="space-y-4">
    <section className={`${panel} p-4`}>
      <div className="flex items-center gap-2"><Activity className="h-4 w-4 text-cyan-200" /><h2 className="text-sm text-white/80">Engine jobs</h2><span className="rounded-full border border-cyan-300/20 px-2 py-0.5 text-[10px] text-cyan-100/70">Admin · Read-only</span></div>
      <p className="mt-2 text-xs leading-5 text-white/50">Inspect persisted engine work for Sapien {sapienId}. Summaries cover the entire filtered creation-time window, not just this page or the all-time queue.</p>
    </section>
    <form className={`${panel} p-4`} onSubmit={event => {
      event.preventDefault();
      if (!Number.isInteger(draft.days) || draft.days < 1 || draft.days > 90 || !Number.isInteger(draft.limit) || draft.limit < 1 || draft.limit > 200) return;
      setRequest(current => ({ filters: { ...draft }, cursors: [null], revision: current.revision + 1 }));
    }}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-white/50">Creation window (days)<input type="number" required min={1} max={90} step={1} value={draft.days || ''} onChange={event => setDraft(current => ({ ...current, days: Number(event.target.value) }))} className={input} /></label>
        <label className="min-w-48 flex-1 text-xs text-white/50">Engine name (exact match)<input maxLength={100} value={draft.engine_name} onChange={event => setDraft(current => ({ ...current, engine_name: event.target.value }))} placeholder="All engines" className={input} /></label>
        <label className="text-xs text-white/50">Status<select value={draft.status} onChange={event => setDraft(current => ({ ...current, status: event.target.value as EngineJobFilters['status'] }))} className={input}><option value="">All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
        <label className="text-xs text-white/50">Page limit<input type="number" required min={1} max={200} step={1} value={draft.limit || ''} onChange={event => setDraft(current => ({ ...current, limit: Number(event.target.value) }))} className={input} /></label>
        <button type="submit" className={button}>Apply filters</button>
        <button type="button" onClick={() => { setDraft(defaults); setRequest(current => ({ filters: defaults, cursors: [null], revision: current.revision + 1 })); }} className={button}>Reset</button>
        <button type="button" onClick={restart} disabled={loading} className={`${button} flex items-center gap-2`}><RefreshCw className="h-3 w-3" />Refresh window</button>
      </div>
      <p className="mt-3 text-[11px] text-white/40">Apply filters to start a new window. Pagination keeps the applied filters and signed cursor; Refresh window starts again at page 1.</p>
    </form>
    {loading && <Loading />}
    {error && <Failure error={error} retry={() => setRequest(current => ({ ...current, revision: current.revision + 1 }))} />}
    {!loading && data && <>
      <section className={`${panel} space-y-3 p-4`}>
        <h3 className="text-sm text-white/80">{data.total.toLocaleString()} jobs in the filtered window</h3>
        <p className="text-xs text-white/50">Applied: {data.filters.days} days · Engine: {data.filters.engine_name || 'all'} · Status: {data.filters.status || 'all'} · Limit: {data.limit}</p>
        <p className="text-[11px] leading-5 text-white/40">Created from {timestamp(data.since)} through {timestamp(data.until)} (inclusive). Read as of {timestamp(data.as_of)}.</p>
        <p className="text-[11px] leading-5 text-white/40">Live reads, not a transactional snapshot: statuses can change between pages or between summary and list queries. Later pages preserve the original creation window.</p>
        <div className="overflow-x-auto"><table className="w-full min-w-[660px] text-left text-xs"><caption className="sr-only">Engine and status totals across the entire filtered window</caption><thead className="text-white/40"><tr>{['Engine', 'Status', 'Jobs', 'Due', 'Delayed', 'Expired leases', 'With failures'].map(label => <th key={label} className="px-3 py-2 font-normal">{label}</th>)}</tr></thead>
          <tbody>{data.summary.map(row => <tr key={`${row.engine_name}:${row.status}`} className="border-t border-white/[.06] text-white/70"><td className="max-w-64 break-words px-3 py-2">{row.engine_name}</td><td className="px-3 py-2">{row.status}</td>{[row.count, row.due, row.delayed, row.expired_leases, row.retried].map((value, index) => <td key={index} className="px-3 py-2 tabular-nums">{value}</td>)}</tr>)}</tbody>
        </table></div>
        {!data.summary.length && <p className="text-xs text-white/50">No jobs match this creation window and these filters.</p>}
        <p className="text-[11px] text-white/40">“With failures” means retries &gt; 0; it does not prove another execution occurred. Expired leases do not prove execution stopped.</p>
      </section>
      <section className={`${panel} overflow-hidden`}>
        <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-xs"><caption className="p-3 text-left text-white/50">Page {request.cursors.length} · {data.jobs.length} returned jobs · newest creation time first. List metadata can be truncated; open details for full stored values.</caption>
          <thead className="bg-[#0b101c] text-white/40"><tr>{['Job / engine', 'Stored action / source', 'Status / eligibility', 'Failures / budget', 'Created', 'Error'].map(label => <th key={label} className="px-3 py-2 font-normal">{label}</th>)}</tr></thead>
          <tbody>{data.jobs.map(job => <tr key={job.id} className="border-t border-white/[.05] text-white/70 hover:bg-white/[.025]">
            <td className="max-w-64 px-3 py-3"><button type="button" onClick={() => setJobTrail([job.id])} className="break-all text-left font-mono text-cyan-200 underline underline-offset-2">{job.id}</button><p className="mt-1 break-words">{job.engine_name}</p></td>
            <td className="max-w-64 break-words px-3 py-3"><p>{text(job.action)}</p><p className="mt-1 text-white/40">{text(job.origin && typeof job.origin === 'object' ? (job.origin as Record<string, unknown>).source : null)}</p></td>
            <td className="px-3 py-3"><p>{job.status}</p><p className={`mt-1 ${job.eligibility === 'lease_expired' ? 'text-amber-200' : 'text-white/40'}`}>{job.eligibility}</p></td>
            <td className="px-3 py-3 tabular-nums">{job.retries} / {job.max_retries}</td><td className="max-w-52 px-3 py-3 text-[11px]">{timestamp(job.created_at)}</td><td className="px-3 py-3">{job.has_error ? 'Recorded' : 'None recorded'}</td>
          </tr>)}</tbody>
        </table></div>
        {!data.jobs.length && <p className="p-8 text-center text-xs text-white/50">No jobs on this page. Refresh the window to read current records.</p>}
        <div className="flex flex-wrap items-center gap-2 border-t border-white/[.07] p-3">
          <button type="button" disabled={request.cursors.length === 1} className={button} onClick={restart}>Restart window at page 1</button>
          <button type="button" disabled={!data.next_cursor} className={button} onClick={() => { const cursor = data.next_cursor; if (cursor) setRequest(current => ({ ...current, cursors: [...current.cursors, cursor] })); }}>Next page</button>
          {!data.next_cursor && <span className="text-[11px] text-white/40">End of results</span>}
        </div>
      </section>
    </>}
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setJobTrail([]); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto border-white/10 bg-[#09101c] text-white">
        <DialogTitle className="pr-8">Engine job details</DialogTitle>
        <DialogDescription className="text-xs text-white/45">Sensitive stored content · read-only administrator inspection</DialogDescription>
        {jobTrail.length > 1 && <button type="button" className={`${button} flex w-fit items-center gap-2`} onClick={() => setJobTrail(current => current.slice(0, -1))}><ArrowLeft className="h-3 w-3" />Back to previous job</button>}
        {selected && <Detail key={selected} sapienId={sapienId} jobId={selected} onOpen={id => { if (id !== selected) setJobTrail(current => [...current, id]); }} />}
      </DialogContent>
    </Dialog>
  </div>;
}
