import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Activity, AlertTriangle, ArrowLeft, Beaker, ChevronDown, Clock3, Loader2, Pause, Play, Plus, RefreshCw, Square, Trash2, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { ThemeToggle } from '../components/ThemeToggle';
import { simulationService } from '../core/services/simulationService';
import { HttpError } from '../core/auth/authSession';
import { sapiensService } from '../core/services/sapiensService';
import type { SimulationCreateRequest, SimulationEvent, SimulationResult, SimulationRun, SimulationStatus } from '../types/simulationTypes';
import type { Sapiens } from '../types/sapiensTypes';

const terminal = new Set<SimulationStatus>(['completed', 'stopped', 'limit_reached', 'failed']);
const inactive = new Set<SimulationStatus>(['created', 'completed', 'stopped', 'limit_reached', 'failed']);
const initialWorld = JSON.stringify({ people: [{ person_id: 'developer', name: 'Developer' }, { person_id: 'ranu', name: 'Ranu' }], issues: [] }, null, 2);
const initialEvents = JSON.stringify([{ event_id: 'blocked', at: '2026-09-15T09:01:00Z', event: { type: 'send_message', sender_id: 'developer', recipient_id: 'ranu', text: 'I need clarification before continuing.' } }], null, 2);
const initialExpectations = JSON.stringify([], null, 2);

function message(error: unknown) {
  if (error instanceof HttpError) {
    if (error.status === 401) return 'Your session expired. Sign in again.';
    if (error.status === 403) return 'Admin permission is required for Simulation Lab.';
    if (error.status === 404) return `${error.message}. The run may have expired or landed on a different worker.`;
    if (error.status === 409) return `Conflict: ${error.message}`;
    return error.message;
  }
  if (error instanceof DOMException && error.name === 'AbortError') return '';
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function stamp(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function statusTone(status: SimulationStatus) {
  if (status === 'completed') return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300';
  if (status === 'failed' || status === 'limit_reached') return 'bg-red-500/15 text-red-600 dark:text-red-300';
  if (status === 'running' || status === 'starting') return 'bg-blue-500/15 text-blue-600 dark:text-blue-300';
  if (status === 'paused') return 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
  return 'bg-muted text-muted-foreground';
}

export function SimulationLabPage() {
  const [params] = useSearchParams();
  const sapienId = params.get('sapienId');
  const [targetMode, setTargetMode] = useState<'existing' | 'fresh'>('existing');
  const [sapiens, setSapiens] = useState<Sapiens[]>([]);
  const [sapiensLoading, setSapiensLoading] = useState(true);
  const [sapiensError, setSapiensError] = useState('');
  const [selectedSapienId, setSelectedSapienId] = useState(sapienId ?? '');
  const [freshName, setFreshName] = useState('New test Sapiens');
  const [freshRole, setFreshRole] = useState('Project collaborator');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [scenarioBrief, setScenarioBrief] = useState('A developer is blocked and asks for clarification before continuing the project.');
  const [successGoal, setSuccessGoal] = useState('The blocker is acknowledged and the developer receives a useful response.');
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState<SimulationRun | null>(null);
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [workerId, setWorkerId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [speedEdit, setSpeedEdit] = useState('60');
  const cursor = useRef(0);
  const failures = useRef(0);
  const [runId, setRunId] = useState(`simulation-${new Date().toISOString().slice(0, 10)}`);
  const [scenarioId, setScenarioId] = useState('blocker');
  const [scenarioVersion, setScenarioVersion] = useState('1');
  const [startAt, setStartAt] = useState('2026-09-15T09:00:00Z');
  const [endAt, setEndAt] = useState('2026-09-15T09:30:00Z');
  const [speed, setSpeed] = useState('60');
  const [maxWall, setMaxWall] = useState('300');
  const [maxRecords, setMaxRecords] = useState('10000');
  const [worldJson, setWorldJson] = useState(initialWorld);
  const [eventsJson, setEventsJson] = useState(initialEvents);
  const [expectationsJson, setExpectationsJson] = useState(initialExpectations);

  const selected = detail?.run_id === selectedId ? detail : runs.find(run => run.run_id === selectedId) ?? null;

  const refreshList = useCallback(async (signal?: AbortSignal) => {
    const value = await simulationService.list(signal);
    setRuns(value.runs);
    setWorkerId(value.worker_id);
    setSelectedId(current => current || value.runs[0]?.run_id || '');
    setError('');
  }, []);

  const drainEvents = useCallback(async (runIdValue: string, signal?: AbortSignal) => {
    let after = cursor.current;
    for (let pageCount = 0; pageCount < 20; pageCount += 1) {
      const page = await simulationService.events(runIdValue, after, signal);
      if (page.events.length) {
        setEvents(current => {
          const merged = new Map(current.map(item => [`${item.run_id}:${item.sequence}`, item]));
          page.events.forEach(item => merged.set(`${item.run_id}:${item.sequence}`, item));
          return [...merged.values()].sort((a, b) => a.sequence - b.sequence);
        });
      }
      after = page.next_after;
      cursor.current = after;
      if (!page.has_more) return;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    refreshList(controller.signal).catch(value => setError(message(value))).finally(() => setLoading(false));
    return () => controller.abort();
  }, [refreshList]);

  useEffect(() => {
    let active = true;
    setSapiensLoading(true);
    sapiensService.listSapiens().then(list => {
      if (!active) return;
      setSapiens(list);
      setSelectedSapienId(current => current || list[0]?.id || '');
      setSapiensError('');
    }).catch(value => { if (active) setSapiensError(message(value)); })
      .finally(() => { if (active) setSapiensLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const minutes = Number(durationMinutes);
    const start = new Date(startAt);
    if (Number.isFinite(minutes) && minutes > 0 && !Number.isNaN(start.getTime())) setEndAt(new Date(start.getTime() + minutes * 60_000).toISOString());
  }, [durationMinutes, startAt]);

  useEffect(() => {
    cursor.current = 0;
    setEvents([]);
    setResult(null);
    setDetail(null);
    setError('');
    failures.current = 0;
    if (!selectedId) return;
    const controller = new AbortController();
    let timer = 0;
    let closed = false;
    const poll = async () => {
      try {
        const next = await simulationService.get(selectedId, controller.signal);
        if (closed) return;
        setDetail(next);
        setSpeedEdit(String(next.speed));
        setRuns(current => current.map(item => item.run_id === next.run_id ? next : item));
        await drainEvents(selectedId, controller.signal);
        if (terminal.has(next.status)) {
          try { setResult(await simulationService.result(selectedId, controller.signal)); }
          catch (value) { if (!(value instanceof DOMException && value.name === 'AbortError')) setError(message(value)); }
          return;
        }
        failures.current = 0;
        timer = window.setTimeout(poll, 1500);
      } catch (value) {
        if (closed || (value instanceof DOMException && value.name === 'AbortError')) return;
        failures.current += 1;
        setError(message(value));
        timer = window.setTimeout(poll, Math.min(15_000, 1500 * (2 ** failures.current)));
      }
    };
    void poll();
    return () => { closed = true; controller.abort(); window.clearTimeout(timer); };
  }, [selectedId, drainEvents]);

  const createPayload = (): SimulationCreateRequest => {
    const numeric = { speed: Number(speed), wall: Number(maxWall), records: Number(maxRecords) };
    if (!runId.trim()) throw new Error('Run ID is required.');
    if (!Number.isFinite(numeric.speed) || numeric.speed <= 0 || numeric.speed > 1_000_000) throw new Error('Speed must be greater than 0 and at most 1,000,000.');
    if (!Number.isFinite(numeric.wall) || numeric.wall <= 0 || numeric.wall > 3600) throw new Error('Wall-time limit must be greater than 0 and at most 3,600 seconds.');
    if (!Number.isInteger(numeric.records) || numeric.records < 1 || numeric.records > 100_000) throw new Error('Evidence limit must be an integer from 1 to 100,000.');
    const start = new Date(startAt); const end = new Date(endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || !/(Z|[+-]\d\d:\d\d)$/.test(startAt) || !/(Z|[+-]\d\d:\d\d)$/.test(endAt)) throw new Error('Start and end must be valid ISO-8601 timestamps with timezones.');
    if (end <= start) throw new Error('Simulation end must follow its start.');
    let world: unknown, scheduled: unknown, expectations: unknown;
    try { world = JSON.parse(worldJson); } catch { throw new Error('Initial world is not valid JSON.'); }
    try { scheduled = JSON.parse(eventsJson); } catch { throw new Error('Scheduled events are not valid JSON.'); }
    try { expectations = JSON.parse(expectationsJson); } catch { throw new Error('Expectations are not valid JSON.'); }
    if (!world || Array.isArray(world) || typeof world !== 'object') throw new Error('Initial world must be a JSON object.');
    if (!Array.isArray(scheduled)) throw new Error('Scheduled events must be a JSON array.');
    if (!Array.isArray(expectations)) throw new Error('Expectations must be a JSON array.');
    if (!scenarioId.trim() || !scenarioVersion.trim()) throw new Error('Scenario ID and version are required.');
    return { config: { run_id: runId.trim(), speed: numeric.speed, max_wall_seconds: numeric.wall, max_records: numeric.records }, scenario: { scenario_id: scenarioId.trim(), version: scenarioVersion.trim(), start_at: startAt, end_at: endAt, initial_world: world, events: scheduled }, expectations };
  };

  const create = async (andStart: boolean) => {
    setBusy(andStart ? 'create-start' : 'create'); setError('');
    try {
      const created = await simulationService.create(createPayload());
      const next = andStart ? await simulationService.control(created.run_id, 'start') : created;
      await refreshList(); setSelectedId(next.run_id); setDetail(next);
      toast.success(andStart ? 'Run created and start requested' : 'Run created');
    } catch (value) { setError(message(value)); }
    finally { setBusy(''); }
  };

  const control = async (action: 'start' | 'pause' | 'resume' | 'stop') => {
    if (!selected) return;
    setBusy(action); setError('');
    try { setDetail(await simulationService.control(selected.run_id, action)); }
    catch (value) { setError(message(value)); }
    finally { setBusy(''); }
  };

  const changeSpeed = async () => {
    if (!selected) return;
    const value = Number(speedEdit);
    if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) { setError('Speed must be greater than 0 and at most 1,000,000.'); return; }
    setBusy('speed'); setError('');
    try { setDetail(await simulationService.setSpeed(selected.run_id, value)); }
    catch (reason) { setError(message(reason)); }
    finally { setBusy(''); }
  };

  const remove = async (run: SimulationRun) => {
    if (!inactive.has(run.status) || !window.confirm(`Delete retained run “${run.run_id}”? This cannot be undone.`)) return;
    setBusy(`delete:${run.run_id}`); setError('');
    try { await simulationService.remove(run.run_id); if (selectedId === run.run_id) setSelectedId(''); await refreshList(); }
    catch (value) { setError(message(value)); }
    finally { setBusy(''); }
  };

  const evidenceById = useMemo(() => {
    const links = new Map<string, number>();
    events.forEach(item => { links.set(`${item.run_id}:${item.sequence}`, item.sequence); if (item.operation_id) links.set(item.operation_id, item.sequence); });
    return links;
  }, [events]);

  return <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3"><Link to="/admin" className="rounded-lg p-2 hover:bg-muted" aria-label="Back to admin home"><ArrowLeft className="size-4" /></Link><span className="grid size-9 place-items-center rounded-xl bg-violet-600 text-white"><Beaker className="size-5" /></span><div><h1 className="font-semibold">Simulation Lab</h1><p className="text-xs text-muted-foreground">Explore how a Sapiens responds to a scenario</p></div></div>
        <div className="flex items-center gap-2"><ThemeToggle /><Button variant="outline" size="sm" onClick={() => void refreshList().catch(value => setError(message(value)))}><RefreshCw className="mr-2 size-4" />Refresh</Button></div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/[.06] px-4 py-2.5 text-xs text-muted-foreground">Sapiens execution is being connected to the simulation engine. You can configure a simulation now; starting it will become available with that integration.</div>

      <section className="space-y-5" aria-labelledby="setup-heading">
        <div><p className="text-sm font-medium text-violet-600">Set up a simulation</p><h2 id="setup-heading" className="mt-1 text-2xl font-semibold tracking-tight">Who would you like to simulate?</h2><p className="mt-1 text-sm text-muted-foreground">Choose a Sapiens, give it a situation to navigate, and set how much simulated time should pass.</p></div>
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2"><CardHeader><CardTitle className="text-base">1. Choose a Sapiens</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2"><button onClick={() => setTargetMode('existing')} className={`rounded-xl border p-4 text-left transition ${targetMode === 'existing' ? 'border-violet-500 bg-violet-500/[.07]' : 'hover:bg-muted/50'}`}><Users className="mb-2 size-5 text-violet-500" /><strong className="block text-sm">Existing Sapiens</strong><span className="mt-1 block text-xs text-muted-foreground">Use an isolated copy of its experience</span></button><button onClick={() => setTargetMode('fresh')} className={`rounded-xl border p-4 text-left transition ${targetMode === 'fresh' ? 'border-violet-500 bg-violet-500/[.07]' : 'hover:bg-muted/50'}`}><UserPlus className="mb-2 size-5 text-violet-500" /><strong className="block text-sm">Fresh Sapiens</strong><span className="mt-1 block text-xs text-muted-foreground">Start without prior memories</span></button></div>
            {targetMode === 'existing' ? <div>{sapiensLoading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading Sapiens…</p> : sapiensError ? <p className="text-sm text-red-600">{sapiensError}</p> : sapiens.length ? <div className="grid max-h-64 gap-2 overflow-auto sm:grid-cols-2">{sapiens.map(item => <button key={item.id} onClick={() => setSelectedSapienId(item.id)} className={`rounded-xl border p-3 text-left ${selectedSapienId === item.id ? 'border-violet-500 bg-violet-500/[.07]' : 'hover:bg-muted/50'}`}><span className="block truncate text-sm font-medium">{item.name}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{item.role || 'No descriptive role'}</span></button>)}</div> : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No Sapiens are available. You can still configure a fresh-Sapiens simulation.</p>}</div> : <div className="grid gap-3 sm:grid-cols-2"><Field label="Name"><Input value={freshName} onChange={event => setFreshName(event.target.value)} /></Field><Field label="Role in the scenario"><Input value={freshRole} onChange={event => setFreshRole(event.target.value)} /></Field></div>}
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">2. Choose a scenario</CardTitle></CardHeader><CardContent className="space-y-3"><div className="rounded-xl border border-violet-500 bg-violet-500/[.07] p-4"><Badge variant="secondary">Example</Badge><strong className="mt-3 block">Resolve a project blocker</strong></div><Field label="Situation"><Textarea className="min-h-20" value={scenarioBrief} onChange={event => setScenarioBrief(event.target.value)} /></Field><Field label="What a good outcome looks like"><Textarea className="min-h-20" value={successGoal} onChange={event => setSuccessGoal(event.target.value)} /></Field><p className="text-xs text-muted-foreground">This is an editable setup for the bundled example. Its supported event payload can be inspected in Developer preview.</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle className="text-base">3. Set the pace</CardTitle></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-3"><Field label="Starts"><Input type="datetime-local" value={startAt.replace('Z', '').slice(0, 16)} onChange={event => setStartAt(`${event.target.value}:00Z`)} /></Field><Field label="Simulated duration"><select value={durationMinutes} onChange={event => setDurationMinutes(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">1 hour</option><option value="240">4 hours</option><option value="1440">1 day</option></select></Field><Field label="Simulation speed"><select value={speed} onChange={event => setSpeed(event.target.value)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="1">Real time</option><option value="10">10× faster</option><option value="60">60× faster</option><option value="600">600× faster</option></select></Field></div><div className="mt-5 flex flex-wrap items-center gap-3"><Button disabled title="Connecting Sapiens to simulations is not available yet"><Play className="mr-2 size-4" />Start simulation</Button><span className="text-sm text-muted-foreground">Connecting Sapiens to simulations is not available yet.</span></div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Progress and results</CardTitle></CardHeader><CardContent><div className="grid place-items-center rounded-xl border border-dashed py-10 text-center"><Activity className="mb-3 size-7 text-muted-foreground/50" /><p className="font-medium">Your simulation results will appear here</p><p className="mt-1 max-w-md text-sm text-muted-foreground">Once execution is connected, this area will show the simulation timeline, key decisions, and expectation outcomes.</p></div></CardContent></Card>
      </section>
      <details className="rounded-xl border bg-muted/20 p-4"><summary className="cursor-pointer font-medium">Developer preview <span className="ml-2 text-sm font-normal text-muted-foreground">Run the standalone example environment without a Sapiens</span></summary><div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><Badge variant="outline">Worker {workerId ?? '—'}</Badge><span>Process-local diagnostic tools and raw scenario controls</span></div>
      {error && <div role="alert" className="mt-4 flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>{error}</span></div>}
      <div className="mt-4 grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit"><CardHeader className="pb-3"><CardTitle className="flex items-center justify-between text-base">Retained runs <Badge variant="secondary">{runs.length}/8</Badge></CardTitle><p className="text-xs leading-5 text-muted-foreground">Process memory only; terminal runs expire after about one hour and all runs disappear on worker restart.</p></CardHeader><CardContent className="space-y-2">
          {loading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Loading runs…</p>}
          {!loading && !runs.length && <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">No retained runs on this worker.</p>}
          {runs.map(run => <div key={run.run_id} className={`rounded-lg border p-3 ${selectedId === run.run_id ? 'border-violet-500 bg-violet-500/5' : 'border-border'}`}><button className="w-full text-left" onClick={() => setSelectedId(run.run_id)}><span className="block truncate text-sm font-medium">{run.run_id}</span><span className="mt-2 flex items-center justify-between"><Badge className={statusTone(run.status)}>{run.status}</Badge><span className="text-xs text-muted-foreground">{run.speed}×</span></span></button>{inactive.has(run.status) && <Button variant="ghost" size="sm" className="mt-2 w-full text-muted-foreground hover:text-red-600" disabled={busy === `delete:${run.run_id}`} onClick={() => void remove(run)}><Trash2 className="mr-2 size-3.5" />Delete inactive run</Button>}</div>)}
        </CardContent></Card>

        <div className="space-y-5">
          <Card><CardHeader><CardTitle className="text-base">Create environment run</CardTitle><p className="text-sm text-muted-foreground">Create and start are distinct lifecycle actions. Strict server validation remains authoritative.</p></CardHeader><CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Field label="Run ID"><Input value={runId} onChange={e => setRunId(e.target.value)} /></Field><Field label="Speed"><Input type="number" min="0.000001" max="1000000" value={speed} onChange={e => setSpeed(e.target.value)} /></Field><Field label="Wall limit (seconds)"><Input type="number" min="1" max="3600" value={maxWall} onChange={e => setMaxWall(e.target.value)} /></Field><Field label="Evidence limit"><Input type="number" min="1" max="100000" value={maxRecords} onChange={e => setMaxRecords(e.target.value)} /></Field><div className="rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground"><Clock3 className="mb-1 size-4" />Accelerated time does not accelerate real computation. Paused runs still consume wall time.</div></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Scenario ID"><Input value={scenarioId} onChange={e => setScenarioId(e.target.value)} /></Field><Field label="Scenario version"><Input value={scenarioVersion} onChange={e => setScenarioVersion(e.target.value)} /></Field><Field label="Simulation start (ISO-8601 + timezone)"><Input value={startAt} onChange={e => setStartAt(e.target.value)} /></Field><Field label="Simulation end (ISO-8601 + timezone)"><Input value={endAt} onChange={e => setEndAt(e.target.value)} /></Field></div>
            <details className="rounded-lg border p-4"><summary className="cursor-pointer text-sm font-medium">Advanced scenario JSON <ChevronDown className="ml-1 inline size-4" /></summary><div className="mt-4 grid gap-4"><JsonField label="Initial world" value={worldJson} onChange={setWorldJson} /><JsonField label="Scheduled events" value={eventsJson} onChange={setEventsJson} /><JsonField label="Expectations" value={expectationsJson} onChange={setExpectationsJson} /><p className="text-xs leading-5 text-muted-foreground">Input type tags: send_message, set_issue_status, set_knowledge, set_availability; issue_reached, message_received, rejection_limit. Unknown fields, wrong types, non-finite numbers, and timezone-naive dates are rejected.</p></div></details>
            <div className="flex flex-wrap gap-2"><Button disabled={!!busy} onClick={() => void create(false)}><Plus className="mr-2 size-4" />{busy === 'create' ? 'Creating…' : 'Create'}</Button><Button variant="secondary" disabled={!!busy} onClick={() => void create(true)}><Play className="mr-2 size-4" />{busy === 'create-start' ? 'Creating and starting…' : 'Create and start'}</Button></div>
          </CardContent></Card>

          {selected ? <>
            <Card><CardHeader><CardTitle className="flex flex-wrap items-center gap-3 text-base"><span className="break-all">{selected.run_id}</span><Badge className={statusTone(selected.status)}>{selected.status}</Badge></CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Simulated time" value={stamp(selected.simulated_time)} /><Stat label="Speed" value={`${selected.speed}×`} /><Stat label="Pending scenario events" value={selected.pending_scenario_events ?? 'Not initialized'} /><Stat label="Pending replies" value={selected.pending_replies ?? 'Not initialized'} /></div>{selected.detail && <p className="rounded-lg bg-muted/50 p-3 text-sm">{selected.detail}</p>}<div className="flex flex-wrap gap-2"><Button size="sm" disabled={!!busy || selected.status !== 'created'} onClick={() => void control('start')}><Play className="mr-2 size-4" />Start</Button><Button size="sm" variant="outline" disabled={!!busy || selected.status !== 'running'} onClick={() => void control('pause')}><Pause className="mr-2 size-4" />Pause</Button><Button size="sm" variant="outline" disabled={!!busy || selected.status !== 'paused'} onClick={() => void control('resume')}><Play className="mr-2 size-4" />Resume</Button><Button size="sm" variant="outline" disabled={!!busy || !['starting','running','paused','stopping'].includes(selected.status)} onClick={() => void control('stop')}><Square className="mr-2 size-4" />Stop</Button><div className="flex gap-2"><Input className="h-9 w-28" type="number" min="0.000001" max="1000000" aria-label="New speed" value={speedEdit} onChange={e => setSpeedEdit(e.target.value)} /><Button size="sm" variant="outline" disabled={!!busy || terminal.has(selected.status)} onClick={() => void changeSpeed()}>Set speed</Button></div></div></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center justify-between text-base"><span className="flex items-center gap-2"><Activity className="size-4" />Evidence timeline</span><Badge variant="secondary">{events.length}</Badge></CardTitle></CardHeader><CardContent><div className="space-y-2">{!events.length && <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">No evidence observed yet.</p>}{events.map(event => <details key={`${event.run_id}:${event.sequence}`} id={`evidence-${event.sequence}`} className="rounded-lg border p-3"><summary className="cursor-pointer"><span className="flex flex-wrap items-center gap-2 text-sm"><Badge variant="outline">#{event.sequence}</Badge><strong>{event.source}</strong><span className="text-muted-foreground">sim {stamp(event.occurred_at)}</span><span className="text-muted-foreground">observed {stamp(event.observed_at)}</span></span></summary><div className="mt-3 space-y-2 text-xs text-muted-foreground"><p>Operation: {event.operation_id ?? '—'} · Scheduled: {stamp(event.scheduled_at)}</p><pre className="max-h-72 overflow-auto rounded bg-muted p-3 text-foreground">{JSON.stringify(event.payload, null, 2)}</pre></div></details>)}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Evaluation result</CardTitle></CardHeader><CardContent>{!terminal.has(selected.status) && <p className="text-sm text-muted-foreground">Results become available after the run reaches a terminal state.</p>}{terminal.has(selected.status) && !result && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Draining final evidence and result…</p>}{result && <div className="space-y-3"><div className="flex flex-wrap gap-3 text-sm"><Badge className={statusTone(result.status)}>{result.status}</Badge><span>Pass rate: <strong>{result.pass_rate === null ? 'Not scored' : `${Math.round(result.pass_rate * 100)}%`}</strong></span></div>{result.pass_rate === null && <p className="text-sm text-muted-foreground">No score is not zero and does not indicate success; expectations may be absent or lack evidence.</p>}{!result.report.metrics.length && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No expectations were configured.</p>}{result.report.metrics.map(metric => <div key={metric.expectation_id} className="rounded-lg border p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><strong>{metric.expectation_id}</strong><Badge className={metric.verdict === 'pass' ? statusTone('completed') : metric.verdict === 'fail' ? statusTone('failed') : statusTone('paused')}>{metric.verdict.replace('_', ' ')}</Badge></div><p className="mt-2 text-muted-foreground">{metric.explanation}</p>{metric.evidence_ids.length > 0 && <p className="mt-2 text-xs">Evidence: {metric.evidence_ids.map((id, index) => <span key={id}>{index > 0 && ', '}<a className="text-violet-600 hover:underline" href={evidenceById.has(id) ? `#evidence-${evidenceById.get(id)}` : undefined}>{id}</a></span>)}</p>}</div>)}</div>}</CardContent></Card>
          </> : <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Select a retained run or create a new one to inspect it.</CardContent></Card>}
        </div>
      </div></details>
    </main>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function JsonField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <Field label={label}><Textarea className="min-h-36 font-mono text-xs" spellCheck={false} value={value} onChange={event => onChange(event.target.value)} /></Field>; }
function Stat({ label, value }: { label: string; value: React.ReactNode }) { return <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-medium">{value}</p></div>; }
