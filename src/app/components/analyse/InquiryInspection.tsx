import { AnalyseControls } from './AnalyseControls';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { ChevronRight, Loader2 } from 'lucide-react';
import { inquiryService } from '../../core/services/inquiryService';
import type { InquiryDetail, InquiryFilters, InquiryKind, InquiryPage } from '../../types/inquiryTypes';
import type { ApiError } from '../../types/apiTypes';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { InquiryContext } from './InquiryContext';
import { QuestioningDetail } from './QuestioningDetail';
import { absoluteTime } from './awarenessPresentation';
import { questionQuery, questionSourceLabel, questionStateLabel, updateQuestionQuery } from './questioningPresentation';
import { hasSelectedRecordText, openRecordFromRow } from './recordRowInteraction';
import { useNavigationMemory } from '../navigation/NavigationState';
import '../../../styles/analyse-questioning.css';
import '../../../styles/analyse-records.css';

const panel = 'rounded-xl border border-white/[.07] bg-white/[.025]';
const button = 'rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/5 disabled:opacity-40';
const input = 'mt-2 block w-full rounded-lg border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-white/80';
const defaults: InquiryFilters = { limit: 50, state: '', source: '', channel: '', delivery_state: '' };
const title = (kind: InquiryKind) => kind === 'questioning' ? 'Questioning' : 'Curiosity';
const jobHref = (kind: InquiryKind, id: string) => `/admin/analyse/engine-jobs?${new URLSearchParams({ engine_name: kind === 'questioning' ? 'weave_questioning' : 'curiosity_engine', job_id: id })}`;
function display(value: unknown): string {
  if (value == null || value === '') return 'Not recorded';
  return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}
function timestamp(value: string | null | undefined) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { timeZoneName: 'short' });
}
function Field({ label, value }: { label: string; value: unknown }) {
  return <div className="min-w-0"><dt className="text-[11px] text-white/40">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-white/80 [overflow-wrap:anywhere]">{display(value)}</dd></div>;
}
function Stored({ label, value }: { label: string; value: unknown }) {
  return <section className={`${panel} p-4`}><h3 className="text-sm text-cyan-100">{label}</h3><div className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-words text-base leading-7 text-white/85 [overflow-wrap:anywhere]">{display(value)}</div></section>;
}
function Failure({ status, retry }: { status?: number; retry: () => void }) {
  const message = status === 401 ? 'Your session expired. Sign in again.'
    : status === 403 ? 'Your account needs analysis and simulation access to inspect these records.'
    : status === 404 ? 'Record, Sapien, or endpoint unavailable for this Sapien. A legacy reference may no longer exist.'
    : status === 400 || status === 422 ? 'Invalid filters or record reference. Check the record ID and filter values.'
    : 'Could not read stored records. The backend may be unavailable.';
  return <div role="alert" className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-4 text-xs text-amber-100"><p>{message}</p><button type="button" className={`${button} mt-3`} onClick={retry}>Retry read</button></div>;
}
function Loading() {
  return <div role="status" className="flex min-h-40 items-center justify-center gap-2 text-xs text-white/55"><Loader2 className="h-4 w-4 animate-spin" />Loading stored records…</div>;
}

function QuestionReviews({ data }: { data: InquiryPage }) {
  const processing = data.processing;
  if (!processing) return null;
  return <details className={`${panel} p-4`}><summary className="cursor-pointer text-sm text-white/70">Background question reviews</summary>
    <p className="mt-3 text-xs leading-5 text-white/50">Requests collect hourly. A review may produce no questions. Counts are jobs across saved runs, not unique requests or LLM calls. Continuations contain remaining work from an earlier job.</p>
    {!processing.available ? <p className="mt-3 text-amber-200">Review records are temporarily unavailable.</p> : <>
      <p className="mt-3 text-sm text-white/70">Queued: {processing.counts?.pending ?? 'Not recorded'} · Recorded as running: {processing.counts?.running ?? 'Not recorded'} · Completed: {processing.counts?.completed ?? 'Not recorded'} · Failed: {processing.counts?.failed ?? 'Not recorded'}</p>
      {processing.recent_jobs?.map(job => <details key={job.id} className="mt-3 rounded-lg border border-white/10 p-3"><summary className="cursor-pointer text-sm text-white/75">{job.status} · {job.results.length} saved results{job.parent_job_id ? ' · continuation' : ''}</summary>
        <p className="mt-2 text-xs text-white/50">Eligible from {timestamp(job.eligible_at)} (cognitive time, not guaranteed start). {job.run_id ? `Simulation: ${job.run_id}` : 'Normal runtime'} · {job.retries} retries</p>
        {job.results.map((result, index) => <div key={index} className="mt-3 border-l-2 border-cyan-300/20 pl-3"><p className="whitespace-pre-wrap text-sm text-white/75">{result.subject || 'Original subject unavailable'}</p><p className="mt-2 text-sm text-cyan-200">{result.questions.length ? `${result.questions.length} questions generated` : 'No questions in this result'} · {result.status || 'Status unknown'}</p><p className="mt-1 text-sm text-white/60">{result.reason || 'No reason retained.'}</p>{result.questions.map((q, i) => <p key={i} className="mt-2 text-sm text-white/80">{q}</p>)}</div>)}
        {!job.results.length && <p className="mt-2 text-xs text-white/50">No saved result available; this does not establish that no questions were needed.</p>}
        <Link className="mt-3 inline-block text-xs text-cyan-200 underline" to={jobHref('questioning', job.id)}>Inspect job</Link>
      </details>)}
    </>}
  </details>;
}

function RecordDetail({ sapienId, kind, id, onQuestion }: { sapienId: string; kind: InquiryKind; id: string; onQuestion: (id: string) => void }) {
  const [data, setData] = useState<InquiryDetail | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setData(null); setError(null);
    inquiryService.detail(sapienId, kind, id).then(result => {
      if (!active) return;
      // Run IDs are attribution only; the selected Sapien is the read boundary.
      if (String(result.sapien_id) !== sapienId || result.item.id !== id) {
        setError({ message: 'Scope mismatch' }); return;
      }
      setData(result);
    }).catch((caught: ApiError) => { if (active) setError({ message: 'Read failed', status: caught?.status }); });
    return () => { active = false; };
  }, [sapienId, kind, id, revision]);
  const item = data?.item;
  if (kind === 'questioning') return <>
    {!data && !error && <Loading />}
    {error && <Failure status={error.status} retry={() => setRevision(value => value + 1)} />}
    {data && item && <><div className="question-detail-refresh"><button className="analyse-button" type="button" onClick={() => { setData(null); setError(null); setRevision(value => value + 1); }}>Refresh detail</button></div><QuestioningDetail item={item} asOf={data.as_of} /></>}
  </>;
  return <div className="space-y-4">
    <p className="text-xs text-white/50">{title(kind)} · Sapien {sapienId}</p>
    <button className={button} type="button" onClick={() => { setData(null); setError(null); setRevision(value => value + 1); }}>Refresh detail</button>
    {!data && !error && <Loading />}
    {error && <Failure status={error.status} retry={() => setRevision(value => value + 1)} />}
    {data && item && <>
      <p className="text-[11px] text-white/45">Read as of {timestamp(data.as_of)} (real audit time).</p>
      <Stored label="Original question" value={item.original_question} />
      {kind === 'curiosity' && <Stored label="Recommended phrasing" value={item.question} />}
      <p className="text-sm text-cyan-200">{item.state === 'answered' ? 'Assessed answered' : item.state === 'stale' ? 'Closed without an established answer' : item.state === 'open' ? 'Open question' : 'Status not recorded'}</p>
      <InquiryContext context={item.context} outcome={item.outcome} />
      <p className="text-xs leading-5 text-white/50">A generated question is not proof it was sent. An assessed answer is the Sapien’s recorded understanding, not independent verification.</p>
      <details className={`${panel} p-4`}><summary className="cursor-pointer text-sm text-white/60">Full context, outcome & technical details</summary><div className="mt-4 space-y-4">
      <section className={`${panel} p-4`}><dl className="grid gap-4 sm:grid-cols-2">
        <Field label="Assessment state" value={item.state === 'answered' ? 'Assessed answered' : item.state} />
        <Field label="Source" value={item.source} /><Field label="Source handle" value={item.source_handle} />
        <Field label="Simulation run attribution" value={item.simulation_run_id} />
        {kind === 'curiosity' && <>
          <Field label="Channel" value={item.channel} /><Field label="Stored selection reason" value={item.selection_reason} />
          <Field label="Attention / review state" value={item.delivery_state} /><Field label="Review version" value={item.review_version} />
          <Field label="Gap key (not a record reference)" value={item.gap_key} /><Field label="Blocking" value={item.blocking} />
        </>}
        {(['created_at', 'updated_at', 'occurred_at', 'expires_at', 'closed_at', 'review_at', 'resolved_at', 'asked_at', 'usage_observed_at'] as const).filter(field => field in item).map(field => <Field key={field} label={field} value={timestamp(item[field])} />)}
        <Field label="Request ID" value={item.request_id} /><Field label="Workflow ID" value={item.workflow_id} />
      </dl></section>
      <section className={`${panel} space-y-3 p-4 text-xs text-white/60`}>
        <div>Stored job: {item.job_id ? <Link className="break-all text-cyan-200 underline" to={jobHref(kind, item.job_id)}>{item.job_id}</Link> : 'Unavailable — no explicit job ID retained'}</div>
        {kind === 'curiosity' && <div>Questioning reference: {item.question_record_id ? <button type="button" className="break-all text-cyan-200 underline" onClick={() => onQuestion(item.question_record_id!)}>{item.question_record_id}</button> : 'Unavailable — no explicit question record ID retained'}</div>}
      </section>

      <p className="text-xs leading-5 text-white/45">Generated questions, selected probes, attention requests, reviews, and assessed answers are separate stages. An attention request or asked_at timestamp does not establish recipient delivery. Stored assessments are not independently verified truth. These are the latest retained facts, not a complete event history. Stale means closed without establishing an answer; job completion proves processing, not resolution.</p>
      <p className="text-xs leading-5 text-white/45">Event, review, and expiry dates use cognitive time and may be simulated. They are not compared with the browser clock or real read time to infer expiry. Missing or cleared context is not a fetch error.</p>
      <Stored label="Source context" value={item.context} />
      <Stored label="Assessed answer / evidence (stored outcome)" value={item.outcome} />
      {kind === 'curiosity' && <><Stored label="Stored attention" value={item.attention} /><Stored label="Observed usage outcome" value={item.usage_outcome} /></>}
      </div></details>
    </>}
  </div>;
}

export function InquiryInspection({ sapienId, kind }: { sapienId: string; kind: InquiryKind }) {
  const [params] = useSearchParams();
  return <InquiryList key={`${sapienId}:${kind}:${kind === 'curiosity' ? params.get('record_id') || '' : ''}`} sapienId={sapienId} kind={kind} />;
}

function InquiryList({ sapienId, kind }: { sapienId: string; kind: InquiryKind }) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigation = useNavigationMemory();
  const [localFilters, setFilters] = useState<InquiryFilters>(defaults);
  const [localOffset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [savedData, setData] = useState<InquiryPage | null>(null);
  const [savedError, setError] = useState<ApiError | null>(null);
  const [localSelected, setSelected] = useState<{ kind: InquiryKind; id: string } | null>(() => params.get('record_id') ? { kind, id: params.get('record_id')! } : null);
  const [dataKey, setDataKey] = useState('');
  const isQuestioning = kind === 'questioning';
  const query = questionQuery(params, sapienId);
  const filters = isQuestioning ? query.filters : localFilters;
  const offset = isQuestioning ? query.offset : localOffset;
  const selected = isQuestioning ? query.selectedId ? { kind, id: query.selectedId } : null : localSelected;
  const requestKey = JSON.stringify([sapienId, kind, filters, offset, revision]);
  const data = dataKey === requestKey ? savedData : null;
  const error = dataKey === requestKey ? savedError : null;
  const requestVersion = useRef(0);
  const opener = useRef<HTMLButtonElement | null>(null);
  const listRoot = useRef<HTMLDivElement>(null);
  const valid = Number.isInteger(filters.limit) && filters.limit >= 1 && filters.limit <= 200
    && filters.source.length <= 256 && filters.source === filters.source.trim();
  const resetContent = () => { requestVersion.current += 1; setData(null); setError(null); setSelected(null); };
  const updateQuestion = (patch: Parameters<typeof updateQuestionQuery>[2], replace = false) => setParams(current => {
    const next = updateQuestionQuery(current, sapienId, patch);
    if ('selectedId' in patch && !('filters' in patch || 'offset' in patch)) {
      const container = listRoot.current?.closest<HTMLElement>('[data-nav-scroll]');
      if (container) navigation.scroll.set(`${sapienId}:${location.pathname}?${next}:${container.dataset.navScroll}`, container.scrollTop);
    }
    return next;
  }, { replace, preventScrollReset: true });
  function chooseRecord(value: { kind: InquiryKind; id: string } | null, button?: HTMLButtonElement, replace = false) {
    if (button) opener.current = button;
    if (isQuestioning) updateQuestion({ selectedId: value?.id || null }, replace);
    else setSelected(value);
  }
  function change(next: Partial<InquiryFilters>) {
    resetContent();
    if (isQuestioning) updateQuestion({ filters: { ...filters, ...next }, offset: 0, selectedId: null });
    else { setOffset(0); setFilters(current => ({ ...current, ...next })); }
  }
  function movePage(next: number) {
    resetContent();
    if (isQuestioning) updateQuestion({ offset: next, selectedId: null }); else setOffset(next);
  }
  useEffect(() => {
    let active = true;
    const version = requestVersion.current;
    if (!valid) return;
    inquiryService.list(sapienId, kind, filters, offset).then(result => {
      if (!active || version !== requestVersion.current) return;
      if (String(result.sapien_id) !== sapienId) {
        setDataKey(requestKey); setError({ message: 'Scope mismatch' }); return;
      }
      setDataKey(requestKey); setError(null); setData(result);
    }).catch((caught: ApiError) => { if (active && version === requestVersion.current) { setDataKey(requestKey); setError({ message: 'Read failed', status: caught?.status }); } });
    return () => { active = false; };
    // Every request input is represented by this key; opening a reader must not refetch the table.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);
  function refresh() { resetContent(); setRevision(value => value + 1); }
  const selectedIndex = data?.items.findIndex(item => item.id === selected?.id) ?? -1;
  return <div className={`space-y-4${isQuestioning ? ' questioning-page' : ''}`} ref={listRoot} tabIndex={-1}>
    <p className="analyse-page-purpose">{isQuestioning ? 'See the questions Sapiens raised, what prompted them, and the answers it recorded.' : 'Review the information gaps Sapiens identified and how they were assessed.'} <span className="analyse-inline-note">Read-only inspection.</span></p>
    <AnalyseControls primary={<label className="text-xs text-white/50">State<select className={input} value={filters.state} onChange={event => change({ state: event.target.value as InquiryFilters['state'] })}><option value="">All states</option><option value="open">Open</option><option value="answered">{isQuestioning ? 'Answer recorded' : 'Assessed answered'}</option><option value="stale">{isQuestioning ? 'Closed without an answer' : 'Stale'}</option></select></label>} filters={[
      ...(filters.source ? [{ label: 'Source: ' + filters.source, onRemove: () => change({ source: '' }) }] : []),
      ...(kind === 'curiosity' && filters.channel ? [{ label: 'Channel: ' + filters.channel, onRemove: () => change({ channel: '' }) }] : []),
      ...(kind === 'curiosity' && filters.delivery_state ? [{ label: 'Review: ' + filters.delivery_state, onRemove: () => change({ delivery_state: '' }) }] : [])
    ]} summary={`Normal and simulation records · ${filters.limit} per page`} onRefresh={refresh} busy={!valid || (!data && !error)}><div className="flex flex-wrap items-end gap-3">

      <label className="text-xs text-white/50">Source (exact match)<input className={input} maxLength={256} value={filters.source} onChange={event => change({ source: event.target.value })} placeholder="All sources" /></label>
      {kind === 'curiosity' && <>
        <label className="text-xs text-white/50">Channel<select className={input} value={filters.channel} onChange={event => change({ channel: event.target.value as InquiryFilters['channel'] })}><option value="">All channels</option>{['user', 'source', 'experiment'].map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs text-white/50">Attention / review state<select className={input} value={filters.delivery_state} onChange={event => change({ delivery_state: event.target.value as InquiryFilters['delivery_state'] })}><option value="">All states</option><option value="proposed">Proposed</option><option value="attention_requested">Attention requested</option><option value="reviewed">Reviewed</option></select></label>
      </>}
      <label className="text-xs text-white/50">Page size<input className={input} type="number" min={1} max={200} step={1} value={filters.limit || ''} onChange={event => change({ limit: Number(event.target.value) })} /></label>
      <button type="button" className={button} onClick={() => change(defaults)}>Reset filters</button>
    </div><p className="mt-3 text-[11px] text-white/40">Filters apply immediately to records for the selected Sapien, including normal and simulation records. Counts describe the returned subset only.</p></AnalyseControls>
    {!valid && <p role="status" className="p-4 text-xs text-amber-100">Use a limit from 1 to 200 and a source up to 256 characters without surrounding spaces.</p>}
    {valid && !data && !error && <Loading />}
    {error && <Failure status={error.status} retry={refresh} />}
    {data && <>

      {isQuestioning && <p className="question-scroll-hint">Scroll across for source, state, time and job. Open any row to read the question.</p>}
      <section className={isQuestioning ? undefined : `${panel} overflow-hidden`}><div className={isQuestioning ? 'question-table-wrap' : 'overflow-x-auto'} role={isQuestioning ? 'region' : undefined} aria-label={isQuestioning ? 'Question records' : undefined} tabIndex={isQuestioning ? 0 : undefined}><table className="w-full min-w-[720px] text-left text-sm"><caption className="p-3 text-left text-white/50">{data.count} on this page{data.total !== undefined ? ` · ${data.total} matching` : ''} · {data.ordering === 'created_at_desc' ? 'Newest first' : 'Legacy bounded selection'} · {isQuestioning ? 'Open a row to view details' : 'Select a question for context and outcome'}</caption><thead className="bg-[#0b101c] text-white/40"><tr>{['Question', 'Source', 'Assessment', ...(kind === 'curiosity' ? ['Attention / review'] : []), 'Created', 'Job'].map(label => <th scope="col" key={label} className="px-3 py-2 font-normal">{label}</th>)}</tr></thead>
        <tbody>{data.items.map(item => <tr key={item.id} className={`border-t border-white/[.06] text-white/70${isQuestioning ? ' analyse-record-row' : ''}`} data-selected={isQuestioning && selected?.id === item.id || undefined} onClick={isQuestioning ? openRecordFromRow : undefined}>
          <td className="max-w-md px-4 py-4"><button type="button" className={isQuestioning ? 'analyse-record-open' : 'analyse-table-excerpt break-words text-left text-sm text-cyan-100 hover:underline'} data-record-open={isQuestioning || undefined} aria-haspopup="dialog" onClick={event => { if (event.detail === 0 || !hasSelectedRecordText(event.currentTarget)) chooseRecord({ kind, id: item.id }, event.currentTarget); }}><span className={isQuestioning ? 'question-table-text' : undefined}>{item.question || 'Question text unavailable'}</span>{isQuestioning && <span className="analyse-record-cue">View details<ChevronRight size={16} aria-hidden="true" /></span>}</button></td>
          <td className="max-w-48 break-words px-3 py-3">{isQuestioning ? questionSourceLabel(item.source) : item.source?.replaceAll('_', ' ') || 'Not recorded'}</td>
          <td className="px-3 py-3">{isQuestioning ? questionStateLabel(item.state) : item.state === 'answered' ? 'Assessed answered' : item.state === 'open' ? 'Open' : item.state === 'stale' ? 'Closed, unanswered' : 'Unknown'}</td>
          {kind === 'curiosity' && <td className="px-3 py-3">{display(item.delivery_state)}</td>}
          <td className="px-3 py-3">{isQuestioning ? absoluteTime(item.created_at) : timestamp(item.created_at)}<span className="block text-xs text-white/40">{item.simulation_run_id ? 'Simulation time' : 'Event time'}</span></td>
          <td className="px-3 py-3">{item.job_id ? <Link className="text-cyan-200 underline" to={jobHref(kind, item.job_id)}>Inspect job</Link> : 'Unavailable'}</td>
        </tr>)}</tbody></table></div>
        {!data.items.length && (isQuestioning ? <div className="p-5"><p>{offset ? 'No questions on this page.' : filters.state || filters.source ? 'No questions match these filters.' : 'No saved questions yet.'}</p><p className="question-help">{filters.state || filters.source || offset ? 'Return to the first page with all states and sources.' : 'Questions appear here when Sapiens records them. Refresh to check again.'}</p>{!!(filters.state || filters.source || offset) && <button type="button" className="analyse-button mt-3" onClick={() => change(defaults)}>Show all questions</button>}</div> : <p className="p-8 text-center text-xs leading-5 text-white/50">No stored records returned for this Sapien and these filters. This does not establish that the engine is disabled.</p>)}
      </section>
    </>}
    {data && <div className="analyse-secondary-reports"><p className="analyse-inline-note">Read at {isQuestioning ? absoluteTime(data.as_of) : timestamp(data.as_of)} (real time)</p>        <details><summary className="cursor-pointer text-xs text-white/50">Page breakdown</summary>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Object.entries(data.summary).map(([group, counts]) => <div key={group} className="rounded-lg border border-white/[.07] p-3"><h4 className="text-xs text-cyan-100/80">{group.replaceAll('_', ' ')} · subset only</h4><dl className="mt-2 space-y-1 text-xs text-white/60">{Object.entries(counts ?? {}).map(([label, count]) => <div key={label} className="flex justify-between gap-3"><dt className="break-all">{label === 'answered' ? 'Assessed answered' : label.replaceAll('_', ' ')}</dt><dd>{count}</dd></div>)}{!Object.keys(counts ?? {}).length && <div>No counts</div>}</dl></div>)}</div>
        </details>{kind === 'questioning' && <QuestionReviews data={data} />}</div>}
    {data && (data.total !== undefined || data.has_more || offset > 0) && <nav aria-label="Question pages" className="flex items-center justify-between"><button type="button" className={button} disabled={offset === 0} onClick={() => movePage(Math.max(0, offset - filters.limit))}>Previous</button><span className="text-xs text-white/50">Page {Math.floor(offset / filters.limit) + 1}</span><button type="button" className={button} disabled={!data.has_more} onClick={() => movePage(offset + filters.limit)}>Next</button></nav>}
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) chooseRecord(null, undefined, true); }}><DialogContent className={isQuestioning ? 'question-dialog' : 'max-h-[90dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto border-white/10 bg-[#09101c] text-white'} onCloseAutoFocus={event => { if (isQuestioning) { event.preventDefault(); (opener.current?.isConnected ? opener.current : listRoot.current)?.focus({ preventScroll: true }); } }}>
      <header className={isQuestioning ? 'question-dialog-header' : undefined}><DialogTitle>{selected ? title(selected.kind) : title(kind)} details</DialogTitle><DialogDescription className="text-xs text-white/45">{isQuestioning ? `Sapien ${sapienId} · Saved question and evidence` : 'Sensitive stored content · read-only inspection'}</DialogDescription>
        {isQuestioning && <nav className="question-reader-nav" aria-label="Question details navigation"><button type="button" className="analyse-button" onClick={() => chooseRecord(null, undefined, true)}>Back to questions</button><span>{selectedIndex >= 0 && data ? `${selectedIndex + 1} of ${data.items.length} on this page` : 'Opened from a saved reference'}</span><button type="button" className="analyse-button" disabled={selectedIndex <= 0} onClick={() => { if (data && selectedIndex > 0) chooseRecord({ kind, id:data.items[selectedIndex - 1].id }, undefined, true); }}>Previous question</button><button type="button" className="analyse-button" disabled={!data || selectedIndex < 0 || selectedIndex >= data.items.length - 1} onClick={() => { if (data && selectedIndex >= 0 && selectedIndex < data.items.length - 1) chooseRecord({ kind, id:data.items[selectedIndex + 1].id }, undefined, true); }}>Next question</button></nav>}
      </header>
      <div className={isQuestioning ? 'question-dialog-body' : undefined} key={`${sapienId}:${selected?.kind}:${selected?.id}`}>
        {selected && valid && <RecordDetail key={`${sapienId}:${selected.kind}:${selected.id}`} sapienId={sapienId} kind={selected.kind} id={selected.id} onQuestion={id => chooseRecord({ kind: 'questioning', id })} />}
      </div>
    </DialogContent></Dialog>
  </div>;
}
