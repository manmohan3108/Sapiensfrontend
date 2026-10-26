import { AnalyseControls } from './AnalyseControls';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { toolLearningService as service } from '../../core/services/toolLearningService';
import type { LearningEvidence, LearningPage, ToolLesson, ToolProfile } from '../../types/toolLearningTypes';
import type { ApiError } from '../../types/apiTypes';
import '../../../styles/analyse-tool-learning.css';

const panel = 'rounded-xl border border-white/10 bg-white/[.025] p-4';
const control = 'rounded-lg border border-white/15 bg-[#0b1220] px-3 py-2 text-xs text-white/80 disabled:opacity-40';
const time = (value?: string | null) => value ? new Date(value).toLocaleString() : 'Not recorded';
const scopeName = (scope: string) => scope || 'Normal / live';

// Only explicit aliases get a product name; custom server IDs remain intact.
function serviceName(server: string) {
  const names: Record<string, string> = { teams: 'Microsoft Teams', microsoft_teams: 'Microsoft Teams', ms_teams: 'Microsoft Teams', jira: 'Jira', slack: 'Slack', github: 'GitHub' };
  return names[server.toLowerCase().replace(/[ -]/g, '_')] || server || 'Service not recorded';
}

function toolName(tool: string) {
  const spaced = tool.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_./:-]+/g, ' ').trim();
  return spaced ? spaced[0].toUpperCase() + spaced.slice(1) : 'Tool not recorded';
}

function LessonPreview({ profile }: { profile: ToolProfile }) {
  const first = profile.lessons?.find(lesson => typeof lesson === 'string' ? lesson.trim() : lesson.guidance?.trim());
  const text = typeof first === 'string' ? first : first?.guidance;
  return <span className="analyse-learning-preview">{text ? <><small>Saved lesson{typeof first === 'string' || first?._truncated ? ' · preview' : ''}</small><span>{text}</span></> : profile.lesson_count > 0 ? <span>View {profile.lesson_count} saved {profile.lesson_count === 1 ? 'lesson' : 'lessons'} →</span> : <span>No learned guidance yet</span>}</span>;
}

// Each caller supplies a key covering all request inputs. Ignore late responses
// and hide old data immediately when the key changes (including Sapien switches).
function useRead<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ key: string; attempt: number; data?: T; error?: ApiError }>();
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    load(controller.signal).then(data => { if (active) setState({ key, attempt, data }); })
      .catch((error: ApiError) => { if (active) setState({ key, attempt, error }); });
    return () => { active = false; controller.abort(); };
    // The key, not the render-created loader, defines the request identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);
  const current = state?.key === key && state.attempt === attempt ? state : undefined;
  return { data: current?.data, error: current?.error, loading: !current, version: attempt, retry: () => setAttempt(n => n + 1) };
}

function ServiceSelector({ sapienId, version, selected, visibleServices, onSelect }: {
  sapienId: string; version: number; selected: string | null; visibleServices: string[]; onSelect: (server: string | null) => void;
}) {
  const read = useRead(`${sapienId}/services/${version}`, signal => service.services(sapienId, signal));
  // Keep known choices usable while scanning, but never present them as a
  // complete catalogue until the all-pages request has finished successfully.
  const servers = [...new Set([...(read.data || []), ...visibleServices, ...(selected === null ? [] : [selected])])]
    .sort((a, b) => serviceName(a).localeCompare(serviceName(b)) || a.localeCompare(b));
  return <section className="analyse-service-selector" aria-label="Filter by service">
    <div className="analyse-service-options" role="group" aria-label="Services">
      <button type="button" aria-pressed={selected === null} onClick={() => onSelect(null)}>All services</button>
      {servers.map(server => <button type="button" key={server} aria-pressed={selected === server} onClick={() => onSelect(server)}>{serviceName(server)}{servers.some(other => other !== server && serviceName(other) === serviceName(server)) && <small>{server}</small>}</button>)}
    </div>
    {read.loading && <p role="status">Finding services across all saved records…</p>}
    {read.error && <p role="alert">Could not load the full service list. Only known services are shown. <button type="button" onClick={read.retry}>Retry service list</button></p>}
    {read.data && <p>Services from all saved records. Search and scope still filter the results below.</p>}
  </section>;
}

function Status({ loading, error, retry }: { loading: boolean; error?: ApiError; retry: () => void }) {
  if (loading) return <p role="status" className="p-6 text-sm text-white/55">Loading saved records…</p>;
  if (!error) return null;
  return <div role="alert" className={`${panel} text-sm text-amber-200`}>
    <p>{error.status === 403 ? 'Administrator access is required.' : error.status === 404 ? 'This saved record is no longer available.' : error.status === 503 ? 'Stored-data inspection is unavailable. This does not mean there are no lessons.' : error.message || 'Could not load records.'}</p>
    <button className={`${control} mt-3`} onClick={retry}>Retry</button>
  </div>;
}

function Raw({ value }: { value: unknown }) {
  return <details className="mt-3 text-xs text-white/45"><summary className="cursor-pointer">Technical details (redacted preview)</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(value, null, 2)}</pre></details>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-white/40">{label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-white/80">{children || 'Not recorded'}</dd></div>;
}

function StoredFields({ value }: { value: unknown }) {
  if (value == null) return <span>Not recorded</span>;
  if (typeof value !== 'object') return <span className="whitespace-pre-wrap break-words">{String(value)}</span>;
  return <dl className="space-y-2 border-l border-white/10 pl-3">{Object.entries(value).map(([key, entry]) => <div key={key}><dt className="text-xs text-white/40">{Array.isArray(value) ? `Item ${Number(key) + 1}` : key.replaceAll('_', ' ')}</dt><dd className="text-sm text-white/70"><StoredFields value={entry} /></dd></div>)}</dl>;
}

function Lessons({ lessons = [], onEvidence }: { lessons?: (ToolLesson | string)[]; onEvidence?: (id: string) => void }) {
  if (!lessons.length) return <p className={panel}>No learned guidance stored for this version. Tool documentation alone is not a lesson.</p>;
  return <ol className="analyse-learned-lessons">{lessons.map((lesson, index) => <li key={index}>
    <span className="analyse-lesson-number">{index + 1}</span>
    <div className="min-w-0">
      <p className="analyse-lesson-guidance">{typeof lesson === 'string' ? lesson : lesson.guidance || 'Guidance text not included in this record.'}</p>
      {typeof lesson === 'string' ? <p className="analyse-inline-note">Saved preview</p> : <>
        {lesson.conditions && <p className="analyse-lesson-context"><strong>When:</strong> {lesson.conditions}</p>}
        {lesson.uncertainty && <p className="analyse-lesson-context"><strong>Limits:</strong> {lesson.uncertainty}</p>}
        {lesson._truncated && <p className="analyse-inline-note">This lesson preview is truncated.</p>}
        <div className="analyse-lesson-references">
          {onEvidence && lesson.evidence_ids?.map((id, i) => id === '[truncated]' ? <span key={i}>More references omitted from preview</span> : <button className={control} key={`${id}-${i}`} onClick={() => onEvidence(id)}>View evidence {i + 1}</button>)}
          {typeof lesson.confidence === 'number' && <details><summary>Reported confidence</summary><p>{lesson.confidence.toFixed(2)} · Model-reported, not measured success.</p></details>}
        </div>
      </>}
    </div>
  </li>)}</ol>;
}

function Evidence({ items, selected }: { items: LearningEvidence[]; selected?: string }) {
  const [search, setSearch] = useState('');
  const visible = items.filter(item => (!selected || item.id === selected) && `${item.content ?? ''} ${item.provenance?.caller ?? ''} ${item.provenance?.tool ?? ''} ${item.id}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-3">
    <label className="block text-xs text-white/50">Search loaded evidence<input className={`${control} mt-1 block w-full`} value={search} onChange={event => setSearch(event.target.value)} placeholder="Text, caller, tool or evidence ID" /></label>
    <p className="text-xs text-white/45">Bounded, redacted saved observations; not a new tool execution or the complete provider log.</p>
    {!visible.length && <p className={panel}>No matching evidence in this saved preview.</p>}
    {visible.map(item => <article key={item.id} className={`${panel} space-y-3`}>
      <h4 className="text-sm text-cyan-200">{item.provenance?.server || 'Unknown server'} / {item.provenance?.tool || 'Unknown tool'}</h4>
      {!item.available ? <p className="text-amber-200">Evidence unavailable or outside this scope.</p> : <>
        <p className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-white/80">{item.content || 'No stored text.'}</p>
        {item.truncated && <p className="text-xs text-amber-200">Evidence text is truncated.</p>}
      </>}
      <dl className="grid gap-3 sm:grid-cols-2"><Field label="Caller">{item.provenance?.caller}</Field><Field label="Source">{item.provenance?.source}</Field><Field label="Occurred">{time(item.provenance?.occurred_at)}</Field><Field label="Observed">{time(item.observed_at)}</Field><Field label="Execution">{item.provenance?.execution_id}</Field><Field label="Recorded result">{item.provenance?.is_uncertain === true ? 'Outcome uncertain' : item.provenance?.is_error === true ? 'Tool error' : item.provenance?.is_error === false ? 'No tool error recorded (not proof of task success)' : 'Unknown'}</Field></dl>
      {item.metadata?.arguments != null && <details><summary className="cursor-pointer text-xs text-cyan-200">Recorded tool inputs</summary><div className="mt-2 max-h-80 overflow-auto"><StoredFields value={item.metadata.arguments} /></div></details>}
      <Raw value={item} />
    </article>)}
  </div>;
}

function Paging({ page, onPage }: { page: LearningPage<unknown>; onPage: (offset: number) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs text-white/55">
    <span>{page.items.length ? `${page.offset + 1}–${page.offset + page.items.length}` : '0 shown'} of {page.total} matching records</span>
    <div className="flex gap-2"><button className={control} disabled={page.offset === 0} onClick={() => onPage(Math.max(0, page.offset - page.limit))}>Previous</button><button className={control} disabled={page.next_offset == null} onClick={() => { if (page.next_offset != null) onPage(page.next_offset); }}>Next</button></div>
  </div>;
}

function History({ sapienId, profileId, currentLessons }: { sapienId: string; profileId: string; currentLessons?: (ToolLesson | string)[] }) {
  const [offset, setOffset] = useState(0);
  const [publication, setPublication] = useState('');
  const [selected, setSelected] = useState('');
  const query = new URLSearchParams({ limit: '20', offset: String(offset) });
  if (publication) query.set('publication', publication);
  const read = useRead(`${sapienId}/${profileId}/revisions?${query}`, () => service.revisions(sapienId, profileId, query.toString()));
  return <div className="space-y-3">
    <label className="text-xs text-white/60">Publication <select className={control} value={publication} onChange={event => { setPublication(event.target.value); setOffset(0); }}><option value="">All versions</option><option value="current">Current</option><option value="published">Previously published</option><option value="unpublished_candidate">Unpublished candidates</option><option value="legacy">Legacy / unknown publication</option></select></label>
    <p className="text-xs text-white/45">Candidates may never have been served. Legacy records do not establish publication.</p>
    <Status {...read} />
    {read.data && <><Paging page={read.data} onPage={setOffset} />{!read.data.items.length && <p className={panel}>No revisions match.</p>}{read.data.items.map(row => <button key={row.id} className={`${panel} mb-2 block w-full text-left ${selected === row.id ? 'ring-1 ring-cyan-300' : ''}`} onClick={() => setSelected(row.id)}><span className="text-sm text-cyan-200">Revision {row.revision} · {row.publication.replaceAll('_', ' ')}</span><span className="mt-1 block text-xs text-white/50">{time(row.updated_at)} · Open lessons and evidence</span></button>)}</>}
    {selected && <Revision key={selected} sapienId={sapienId} profileId={profileId} revisionId={selected} currentLessons={currentLessons} />}
  </div>;
}

function Revision({ sapienId, profileId, revisionId, currentLessons }: { sapienId: string; profileId: string; revisionId: string; currentLessons?: (ToolLesson | string)[] }) {
  const [compare, setCompare] = useState(false);
  const read = useRead(`${sapienId}/${profileId}/${revisionId}`, () => service.revision(sapienId, profileId, revisionId));
  return <section className="space-y-3"><Status {...read} />{read.data && <>
    <h4 className="text-sm text-cyan-200">Selected revision {read.data.revision.revision} · {read.data.revision.publication.replaceAll('_', ' ')}</h4>
    <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={compare} onChange={event => setCompare(event.target.checked)} />Compare with loaded current lessons</label>
    <div className={`grid gap-3 ${compare ? '2xl:grid-cols-2' : ''}`}><div className="min-w-0"><h5 className="mb-2 text-xs text-white/50">Selected version</h5><Lessons lessons={read.data.revision.lessons} /></div>{compare && <div className="min-w-0"><h5 className="mb-2 text-xs text-white/50">Current profile snapshot</h5><Lessons lessons={currentLessons} /></div>}</div>
    <h5 className="text-xs text-cyan-200">Selected version’s evidence</h5>
    <Evidence items={read.data.evidence} />
    <Raw value={read.data.revision} />
  </>}</section>;
}

function Usage({ sapienId, profileId }: { sapienId: string; profileId: string }) {
  const [offset, setOffset] = useState(0);
  const [queryText, setQueryText] = useState('');
  const query = new URLSearchParams({ limit: '20', offset: String(offset) });
  if (queryText) query.set('q', queryText);
  const read = useRead(`${sapienId}/${profileId}/usage?${query}`, () => service.usage(sapienId, profileId, query.toString()));
  return <div className="space-y-3">
    <p className="text-xs text-amber-100/75">Usage reports consideration/application—not successful execution. Missing usage does not mean rejection.</p>
    <form onSubmit={event => { event.preventDefault(); setQueryText(String(new FormData(event.currentTarget).get('q') || '').trim()); setOffset(0); }} className="flex gap-2"><input name="q" aria-label="Search usage consumers and reasons" maxLength={160} className={`${control} min-w-0 flex-1`} placeholder="Search consumer or reason" /><button className={control}>Search</button></form>
    <Status {...read} />{read.data && <><Paging page={read.data} onPage={setOffset} />{!read.data.items.length && <p className={panel}>No reported usage matches.</p>}{read.data.items.map(row => <article className={panel} key={row.id}>
      <h4 className="text-sm text-cyan-200">{row.consumer || 'Unknown consumer'} · {row.outcome || 'Unknown outcome'}</h4><p className="my-2 text-xs text-white/45">{time(row.occurred_at)}</p><p className="whitespace-pre-wrap text-sm text-white/75">{row.reason || 'No overall reason recorded.'}</p>
      {row.items?.map((item, i) => typeof item === 'string' ? <p key={i} className="text-xs text-amber-200">Usage preview: {item}</p> : <dl key={i} className="mt-3 border-t border-white/10 pt-3"><Field label={`Lesson reference · ${item.outcome || 'Unknown'}`}>{item.item_id}</Field><Field label="Reason">{item.reason}</Field></dl>)}<Raw value={row} />
    </article>)}</>}
  </div>;
}

function Detail({ sapienId, profileId, close }: { sapienId: string; profileId: string; close: () => void }) {
  const reader = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => { reader.current?.focus(); }, []);
  const [tab, setTab] = useState('lessons');
  const [evidence, setEvidence] = useState('');
  const read = useRead(`${sapienId}/${profileId}`, () => service.detail(sapienId, profileId));
  return <section ref={reader} tabIndex={-1} className="analyse-learning-reader" aria-label="Selected tool learning">
    <div className="analyse-learning-reader-actions"><button className={control} onClick={close}>← Back to tools</button><button className={control} onClick={read.retry} disabled={read.loading}>Refresh detail</button></div>
    <Status {...read} />{read.data && <>
      <header className="analyse-learning-identity"><p>{serviceName(read.data.profile.server)}</p><h2>{toolName(read.data.profile.tool)}</h2><div>Exact tool: <code translate="no">{read.data.profile.tool}</code></div></header>
      <p className="analyse-learning-record-meta">{scopeName(read.data.profile.scope)} · {read.data.profile.lesson_count} {read.data.profile.lesson_count === 1 ? 'saved lesson' : 'saved lessons'}</p>
      <div role="group" aria-label="Detail views" className="analyse-learning-views">{(['lessons', 'evidence', 'revisions', 'usage'] as const).map(value => <button type="button" key={value} aria-pressed={tab === value} onClick={() => { setTab(value); setEvidence(''); }}>{({ lessons: 'What it learned', evidence: 'Evidence', revisions: 'Earlier versions', usage: 'Use of guidance' })[value]}</button>)}</div>
      <div ref={content} tabIndex={-1} className="analyse-learning-view-content" aria-label="Saved learning details">
      {tab === 'lessons' && (read.data.profile.lesson_count > 0 && !read.data.profile.lessons?.length ? <p className={panel}>This profile records {read.data.profile.lesson_count} lessons, but their text is not included in this response. Check earlier versions for saved guidance.</p> : <Lessons lessons={read.data.profile.lessons} onEvidence={id => { setEvidence(id); setTab('evidence'); requestAnimationFrame(() => content.current?.focus()); }} />)}
      {tab === 'evidence' && <>{evidence && <button className={control} onClick={() => setEvidence('')}>Show all loaded evidence</button>}<Evidence items={read.data.evidence} selected={evidence} /></>}
      {tab === 'revisions' && <History sapienId={sapienId} profileId={profileId} currentLessons={read.data.profile.lessons} />}
      {tab === 'usage' && <Usage sapienId={sapienId} profileId={profileId} />}
      </div>
      {read.data.profile.description && <details className="analyse-tool-documentation"><summary>Tool documentation</summary><p>{read.data.profile.description}</p></details>}
      <p className="analyse-learning-record-meta">Server: <code translate="no">{read.data.profile.server}</code> · Revision {read.data.profile.revision} · Updated {time(read.data.profile.updated_at)}</p>
      <Raw value={read.data.profile} />
    </>}
  </section>;
}

export function ToolLearningInspection({ sapienId }: { sapienId: string }) {
  const opener = useRef<HTMLButtonElement | null>(null);
  const list = useRef<HTMLElement>(null);
  const [params, setParams] = useSearchParams();
  const [formError, setFormError] = useState('');
  const query = new URLSearchParams();
  for (const name of ['q', 'scope', 'server', 'tool', 'has_lessons', 'sort', 'direction', 'since', 'until', 'offset']) {
    if (params.has(name)) query.set(name, params.get(name)!);
  }
  query.set('limit', '25');
  const read = useRead(`${sapienId}?${query}`, () => service.profiles(sapienId, query.toString()));
  const selected = params.get('profile') || '';
  function update(name: string, value: string | null) {
    setParams(current => { const next = new URLSearchParams(current); if (value === null) next.delete(name); else next.set(name, value); return next; });
  }
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    if (params.has('server')) next.set('server', params.get('server')!);
    for (const key of ['q', 'tool', 'has_lessons', 'sort', 'direction']) {
      const value = String(form.get(key) || '').trim(); if (value) next.set(key, value);
    }
    const scope = String(form.get('scopeChoice'));
    if (scope === 'live') next.set('scope', '');
    if (scope === 'run') {
      const run = String(form.get('run') || '').trim();
      if (!run) {
        setFormError('Enter the simulation run ID, or select another scope.'); return;
      }
      next.set('scope', run);
    }
    for (const key of ['since', 'until']) { const value = String(form.get(key) || ''); if (value) next.set(key, new Date(value).toISOString()); }
    if (next.has('since') && next.has('until') && next.get('since')! > next.get('until')!) { setFormError('The start time must not be after the end time.'); return; }
    setParams(next);
  }
  const groups = new Map<string, NonNullable<typeof read.data>['items']>();
  for (const row of read.data?.items || []) {
    const key = row.server;
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  const localDate = (value: string | null) => { if (!value) return ''; const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
  const hasFilters = ['q', 'scope', 'server', 'tool', 'has_lessons', 'since', 'until'].some(key => params.has(key));
  const sortLabel = ({ updated_at: 'Updated', documented_at: 'Documented', server: 'Service / server', tool: 'Tool' } as Record<string, string>)[params.get('sort') || 'updated_at'] || 'Updated';
  return <div className="analyse-tool-learning space-y-4 text-white/75">
    <div className="analyse-learning-intro"><p className="analyse-page-purpose">See what Sapiens learned from each service and the tools within it.</p><Link to="/admin/analyse/engine-jobs?engine_name=tool_learning_engine">Learning jobs & failures</Link></div>
    <ServiceSelector sapienId={sapienId} version={read.version} selected={params.get('server')} visibleServices={[...groups.keys()]} onSelect={server => setParams(current => { const next = new URLSearchParams(current); if (server === null) next.delete('server'); else next.set('server', server); next.delete('offset'); next.delete('profile'); return next; })} />
<form key={params.toString()} onSubmit={apply} className="space-y-3" aria-label="Tool learning filters">
    <AnalyseControls filters={['tool', 'has_lessons', 'since', 'until'].filter(key => params.has(key)).map(key => ({ label: key.replaceAll('_', ' ') + ': ' + params.get(key), onRemove: () => setParams(current => { const next = new URLSearchParams(current); next.delete(key); next.delete('offset'); next.delete('profile'); return next; }) }))} primary={<>        <label className="text-xs">Search lessons/tools<input name="q" maxLength={160} defaultValue={params.get('q') || ''} className={`${control} mt-1 w-full`} placeholder="Guidance, conditions or tool name" /></label>        <label className="text-xs">Scope<select name="scopeChoice" defaultValue={!params.has('scope') ? 'all' : params.get('scope') ? 'run' : 'live'} className={`${control} mt-1 w-full`}><option value="all">All saved scopes</option><option value="live">Normal / live</option><option value="run">Specific simulation run</option></select></label>
        <label className="text-xs analyse-run-filter">Run ID (for specific run)<input name="run" maxLength={256} defaultValue={params.get('scope') || ''} className={`${control} mt-1 w-full`} placeholder="run-…" /></label><button className={control}>Apply filters</button><button type="button" className={control} onClick={() => setParams(new URLSearchParams())}>Clear</button></>} summary={`${params.has('scope') ? scopeName(params.get('scope') || '') : 'All saved scopes'} · ${sortLabel}, ${params.get('direction') === 'asc' ? 'ascending' : 'descending'}`} onRefresh={read.retry} busy={read.loading}>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">

        <label className="text-xs">Tool (exact)<input name="tool" maxLength={256} defaultValue={params.get('tool') || ''} className={`${control} mt-1 w-full`} /></label>
        <label className="text-xs">Learning<select name="has_lessons" defaultValue={params.get('has_lessons') || ''} className={`${control} mt-1 w-full`}><option value="">All profiles</option><option value="true">Has lessons</option><option value="false">No lessons yet</option></select></label>

        {(['since', 'until'] as const).map(key => <label key={key} className="text-xs">Updated {key} (local time)<input type="datetime-local" name={key} defaultValue={localDate(params.get(key))} className={`${control} mt-1 w-full`} /></label>)}
      </div>
      <div className="flex flex-wrap items-center gap-2"><label className="text-xs">Sort <select name="sort" defaultValue={params.get('sort') || 'updated_at'} className={control}><option value="updated_at">Updated</option><option value="documented_at">Documented</option><option value="server">Server</option><option value="tool">Tool</option></select></label><label className="text-xs">Order <select name="direction" defaultValue={params.get('direction') || 'desc'} className={control}><option value="desc">Descending</option><option value="asc">Ascending</option></select></label></div>
    </AnalyseControls>{formError && <p role="alert" className="mt-2 text-sm text-amber-200">{formError}</p>}</form>
    <Status {...read} />
    <div className={`analyse-tool-layout ${selected ? 'has-detail' : ''}`}>
      <section ref={list} tabIndex={-1} className="min-w-0" aria-label="Tool profiles">{read.data && <>
        <Paging page={read.data} onPage={offset => update('offset', String(offset))} />
        {!read.data.items.length && <div className="analyse-learning-empty"><h2>{read.data.total > 0 ? 'No tools on this page' : hasFilters ? 'No tools match these filters' : 'No saved tool learning yet'}</h2><p>{read.data.total > 0 ? 'Use Previous or refresh to return to available records.' : hasFilters ? 'Try a different search or clear the filters.' : 'Tools and their lessons will appear here when learning records are saved.'}</p>{hasFilters && <button className={control} onClick={() => setParams(new URLSearchParams())}>Clear filters</button>}</div>}
        {[...groups].map(([group, rows]) => <section key={group} className="analyse-learning-service"><h2 className="analyse-learning-group">{serviceName(group)}<small>{rows.length} {rows.length === 1 ? 'record' : 'records'} on this page</small></h2><div className="analyse-tool-rows">{rows.map(row => <button type="button" key={row.id} aria-pressed={selected === row.id} className="analyse-tool-row analyse-learning-row" onClick={event => { opener.current = event.currentTarget; update('profile', row.id); }}><span className="analyse-learning-tool"><strong>{toolName(row.tool)}</strong><small>{scopeName(row.scope)}</small></span><LessonPreview profile={row} /><span className="analyse-learning-count">{row.lesson_count} {row.lesson_count === 1 ? 'lesson' : 'lessons'}<small>{selected === row.id ? 'Selected' : 'Read lessons →'}</small></span></button>)}</div></section>)}
      </>}</section>
      {selected && <Detail key={`${sapienId}/${selected}`} sapienId={sapienId} profileId={selected} close={() => { update('profile', null); requestAnimationFrame(() => { if (opener.current?.isConnected) opener.current.focus(); else list.current?.focus(); }); }} />}
    </div>
    {read.data && <details className="analyse-learning-snapshot"><summary>About these records</summary><p>Current configured mode: {read.data.configured_mode}. Snapshot read {time(read.data.as_of)}. This mode describes the current configuration, not historical runs. Live writes can shift results between pages.</p></details>}
  </div>;
}
