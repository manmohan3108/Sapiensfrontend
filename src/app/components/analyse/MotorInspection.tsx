import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { motorService, type MotorDetail, type MotorPage, type MotorStatus } from '../../core/services/motorService';
import { AnalyseControls } from './AnalyseControls';
import { DiagnosticBadge, DiagnosticDisclosure } from './DiagnosticPrimitives';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog';
import { useNavigationMemory } from '../navigation/NavigationState';
import { openRecordFromRow } from './recordRowInteraction';
import '../../../styles/analyse-motor.css';

const labels: Record<MotorStatus, string> = { success: 'Tool reported success', error: 'Tool error', uncertain: 'Outcome uncertain', unknown: 'Not recorded' };
const time = (value: string | null) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'long' }) : 'Not recorded';
const scopeLabel = (scope: string | null) => scope === null ? 'Scope not recorded' : scope ? `Simulation ${scope}` : 'Normal / live';
const fields = ['q', 'scope', 'server', 'tool', 'status', 'since', 'until', 'offset'] as const;

function useMotorRead<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
  const [revision, refresh] = useState(0);
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>({ key: '' });
  useEffect(() => {
    const controller = new AbortController();
    setState({ key });
    load(controller.signal).then(data => {
      if (!controller.signal.aborted) setState({ key, data });
    }).catch((error: unknown) => {
      const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : 'Could not load saved Motor activity.';
      if (!controller.signal.aborted) setState({ key, error: message });
    });
    return () => controller.abort();
  }, [key, revision]);
  const current = state.key === key ? state : { key };
  return { ...current, loading: !current.data && !current.error, refresh: () => refresh(value => value + 1) };
}

function Result({ status }: { status: MotorStatus }) {
  return <DiagnosticBadge tone={status === 'error' ? 'danger' : status === 'uncertain' ? 'warning' : 'neutral'}>{labels[status]}</DiagnosticBadge>;
}

function MotorRecord({ sapienId, id, scope }: { sapienId: string; id: string; scope: string | null }) {
  const read = useMotorRead<MotorDetail>(JSON.stringify([sapienId, id, scope]), signal => motorService.detail(sapienId, id, scope, signal));
  if (read.loading) return <p role="status">Loading saved activity…</p>;
  if (read.error || !read.data) return <div role="alert"><p>{read.error}</p><button className="analyse-button" onClick={read.refresh}>Retry</button></div>;
  const item = read.data;
  return <div className="motor-record">
    <h3>{item.server || 'Unknown service'} / {item.tool || 'Unknown tool'}</h3>
    <Result status={item.status} />
    <p className="motor-help">A tool result describes this attempt; it does not prove the overall task was completed.</p>
    <dl><div><dt>Occurred</dt><dd>{time(item.occurred_at)}</dd></div><div><dt>Saved observation time</dt><dd>{time(item.observed_at)}</dd></div><div><dt>Requested by</dt><dd>{item.caller || 'Not recorded'}</dd></div><div><dt>Environment</dt><dd>{scopeLabel(item.scope)}</dd></div></dl>
    {item.caller === 'awareness_engine' && item.execution_id && <Link className="diagnostic-link" to={'/admin/analyse/awareness?' + new URLSearchParams({ awarenessFor: sapienId, awarenessRun: item.execution_id })}>Open originating Awareness run</Link>}
    {item.scope && <Link className="diagnostic-link" to={`/admin/simulations/${encodeURIComponent(item.scope)}/world/overview`}>Open simulation</Link>}
    <h3>Recorded result and inputs</h3>
    <p className="motor-help">Retained, redacted evidence; the provider’s complete response may not have been saved. Times in simulations follow the simulated clock.</p>
    {item.evidence.truncated && <p className="motor-help">This inspection preview is shortened.</p>}
    <pre>{item.evidence.content || 'No result text was retained.'}</pre>
    <DiagnosticDisclosure title="Tool inputs"><pre>{JSON.stringify(item.arguments, null, 2) ?? 'Not recorded'}</pre></DiagnosticDisclosure>
    {item.communication != null && <DiagnosticDisclosure title="Recorded message delivery"><pre>{JSON.stringify(item.communication, null, 2)}</pre></DiagnosticDisclosure>}
    <DiagnosticDisclosure title="Origin and technical references"><p>References identify the recorded source; an execution ID is not necessarily an Awareness run ID. Shortened values are marked.</p><pre>{JSON.stringify({ activity_id: item.id, execution_id: item.execution_id, context: item.context, correlation_id: item.correlation_id, source_ref: item.source_ref }, null, 2)}</pre></DiagnosticDisclosure>
  </div>;
}

export function MotorInspection({ sapienId }: { sapienId: string }) {
  return <MotorView key={sapienId} sapienId={sapienId} />;
}

function MotorView({ sapienId }: { sapienId: string }) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigation = useNavigationMemory();
  const container = useRef<HTMLDivElement>(null);
  const own = params.get('motorFor') === sapienId;
  const query = new URLSearchParams({ limit: '25' });
  if (own) for (const field of fields) { const value = params.get(`motor_${field}`); if (value !== null) query.set(field, value); }
  const selected = own ? params.get('motorRecord') : null;
  const scope = query.has('scope') ? query.get('scope') : null;
  const queryText = query.toString();
  const read = useMotorRead<MotorPage>(`${sapienId}?${queryText}`, signal => motorService.list(sapienId, queryText, signal));
  const opener = useRef<HTMLButtonElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [formError, setFormError] = useState('');
  const update = (values: Record<string, string | null>) => setParams(current => {
    const next = new URLSearchParams(current);
    if (next.get('motorFor') !== sapienId) { for (const field of fields) next.delete(`motor_${field}`); next.delete('motorRecord'); }
    next.set('motorFor', sapienId);
    for (const [key, value] of Object.entries(values)) { if (value === null) next.delete(key); else next.set(key, value); }
    if ('motorRecord' in values && Object.keys(values).length === 1) {
      const scroll = container.current?.closest<HTMLElement>('[data-nav-scroll]');
      if (scroll) navigation.scroll.set(sapienId + ':' + location.pathname + '?' + next + ':' + scroll.dataset.navScroll, scroll.scrollTop);
    }
    return next;
  }, { preventScrollReset: true });
  const clear = () => { setFormError(''); update(Object.fromEntries([...fields.map(field => [`motor_${field}`, null]), ['motorRecord', null]])); };
  const apply = (form: FormData) => {
    const values: Record<string, string | null> = { motor_offset: null, motorRecord: null };
    for (const field of ['q', 'server', 'tool', 'status', 'since', 'until']) values[`motor_${field}`] = String(form.get(field) || '').trim() || null;
    const choice = form.get('environment');
    const run = String(form.get('run') || '').trim();
    if (choice === 'simulation' && !run) { setFormError('Enter a simulation run ID.'); return; }
    values.motor_scope = choice === 'simulation' ? run : choice === 'live' ? '' : null;
    setFormError(''); update(values);
  };
  return <div ref={container} className="motor-page">
    <p>See which tools the Sapien used and what each attempt returned. Open an action for its inputs, result and origin.</p>
    <form key={`${sapienId}:${queryText}`} onSubmit={event => { event.preventDefault(); apply(new FormData(event.currentTarget)); }}>
      <AnalyseControls summary={`${scope === null ? 'All saved scopes' : scopeLabel(scope)} · Newest event first · 25 per page`} busy={read.loading} onRefresh={read.refresh} primary={<>
        <label>Search saved activity<input name="q" maxLength={160} defaultValue={query.get('q') || ''} placeholder="Tool, caller or recorded text…" /></label>
        <label>Result<select name="status" defaultValue={query.get('status') || ''}><option value="">All results</option>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button className="analyse-button" type="submit">Apply filters</button><button className="analyse-button" type="button" onClick={clear}>Clear</button>
      </>}>
        <label>Environment<select name="environment" defaultValue={scope === null ? 'all' : scope ? 'simulation' : 'live'}><option value="all">All saved scopes</option><option value="live">Normal / live</option><option value="simulation">Specific simulation</option></select></label>
        <label>Simulation run ID<input name="run" maxLength={160} defaultValue={scope || ''} placeholder="run-…" /></label>
        <label>Exact service<input name="server" maxLength={160} defaultValue={query.get('server') || ''} placeholder="teams" /></label>
        <label>Exact tool<input name="tool" maxLength={160} defaultValue={query.get('tool') || ''} /></label>
        <label>Occurred from (ISO with timezone)<input name="since" defaultValue={query.get('since') || ''} placeholder="2026-11-01T00:00:00Z" /></label>
        <label>Occurred until (ISO with timezone)<input name="until" defaultValue={query.get('until') || ''} placeholder="2026-11-30T23:59:59Z" /></label>
      </AnalyseControls>
      {formError && <p role="alert">{formError}</p>}
    </form>
    <p className="motor-help">Search covers stored result/input text, service, tool and caller across matching saved records. Missing history cannot be reconstructed here.</p>
    {read.loading && <p role="status">Loading saved activity…</p>}
    {read.error && <div role="alert"><p>{read.error}</p><button className="analyse-button" onClick={read.refresh}>Retry</button></div>}
    {read.data && <section aria-label="Motor activity">
      <h2 ref={heading} tabIndex={-1}>Tool attempts</h2><p role="status">{read.data.items.length} on this page · {read.data.total} matching saved records</p>
      <div className="motor-table-wrap" tabIndex={0} role="region" aria-label="Tool attempts; scroll horizontally on small screens"><table><thead><tr>{['Time', 'Service / action', 'Result', 'Origin'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>
        {read.data.items.map(item => <tr key={item.id} data-selected={item.id === selected} onClick={openRecordFromRow}>
          <td>{time(item.occurred_at)}</td><td><button type="button" data-record-open className="motor-open" onClick={event => { opener.current = event.currentTarget; update({ motorRecord: item.id }); }}>{item.tool || 'Unknown tool'}<small>{item.server || 'Unknown service'}</small></button></td>
          <td><Result status={item.status} /></td><td>{item.caller || 'Caller not recorded'}<small>{item.scope === null ? 'Scope not recorded' : item.scope ? 'Simulation' : 'Normal / live'}</small></td>
        </tr>)}
      </tbody></table></div>
      {!read.data.items.length && <p>No saved activity matches this view. Clear the filters or check another Sapien.</p>}
      <nav className="motor-pagination" aria-label="Motor activity pages"><button className="analyse-button" disabled={read.data.offset === 0} onClick={() => update({ motor_offset: String(Math.max(0, read.data!.offset - 25)), motorRecord: null })}>Previous page</button><span>Page {Math.floor(read.data.offset / 25) + 1}</span><button className="analyse-button" disabled={read.data.next_offset === null} onClick={() => update({ motor_offset: String(read.data!.next_offset), motorRecord: null })}>Next page</button></nav>
    </section>}
    <Dialog open={!!selected} onOpenChange={open => { if (!open) update({ motorRecord: null }); }}>
      <DialogContent className="motor-dialog" onCloseAutoFocus={event => { event.preventDefault(); (opener.current?.isConnected ? opener.current : heading.current)?.focus({ preventScroll: true }); }}>
        <DialogTitle>Tool attempt</DialogTitle><DialogDescription>Sapien {sapienId} · Saved Motor activity</DialogDescription>
        {selected && <MotorRecord key={`${sapienId}:${selected}:${scope}`} sapienId={sapienId} id={selected} scope={scope} />}
      </DialogContent>
    </Dialog>
  </div>;
}
