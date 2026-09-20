import { Children, cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AlertTriangle, ArrowLeft, Beaker, CircleHelp, Download, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { ThemeToggle } from '../components/ThemeToggle';
import { HttpError } from '../core/auth/authSession';
import { simulationService } from '../core/services/simulationService';
import { sapiensService } from '../core/services/sapiensService';
import type { CaseCatalog, CaseCreateRequest, DebugGuide, EventPage, ParticipantOutcome, SimulationEvent, SimulationResult, SimulationRun, SimulationStatus } from '../types/simulationTypes';
import type { Sapiens } from '../types/sapiensTypes';

const terminal = new Set<SimulationStatus>(['completed', 'blocked', 'stopped', 'limit_reached', 'failed']);
const stamp = (value?: string | Date | null) => value ? (value instanceof Date ? value : new Date(value)).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' IST' : '—';
const simulatedStamp = (value: Date) => value.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }) + ' IST';
const countdown = (value?: string | null) => { if (!value) return '—'; const seconds = Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 1000)); const hours = Math.floor(seconds / 3600), minutes = Math.floor((seconds % 3600) / 60), remainder = seconds % 60; return hours ? `${hours}h ${minutes}m ${remainder}s` : `${minutes}m ${remainder}s`; };
function LiveCountdown({ value, startedAt }: { value?: string | null; startedAt?: string | null }) { const [, tick] = useState(0); useEffect(() => { if (!value || startedAt) return; const timer = window.setInterval(() => tick(current => current + 1), 1000); return () => window.clearInterval(timer); }, [value, startedAt]); return startedAt ? <>Started {stamp(startedAt)}</> : <>{countdown(value)}</>; }
function LiveWallBudget({ remaining, counting }: { remaining: number; counting: boolean }) { const [seconds, setSeconds] = useState(() => Math.max(0, Math.ceil(remaining))); useEffect(() => { setSeconds(Math.max(0, Math.ceil(remaining))); if (!counting) return; const timer = window.setInterval(() => setSeconds(current => Math.max(0, current - 1)), 1000); return () => window.clearInterval(timer); }, [remaining, counting]); return <>{seconds}s</>; }
function LiveSimulatedTime({ value, endAt, speed, advancing }: { value: string; endAt: string; speed: number; advancing: boolean }) { const anchor = useRef({ value, endAt, speed, advancing, receivedAt: Date.now() }); const current = anchor.current; if (current.value !== value || current.endAt !== endAt || current.speed !== speed || current.advancing !== advancing) anchor.current = { value, endAt, speed, advancing, receivedAt: Date.now() }; const [, tick] = useState(0); useEffect(() => { if (!advancing) return; const timer = window.setInterval(() => tick(count => count + 1), 1000); return () => window.clearInterval(timer); }, [advancing]); const snapshot = anchor.current; const base = new Date(snapshot.value).getTime(); const projected = snapshot.advancing ? base + (Date.now() - snapshot.receivedAt) * snapshot.speed : base; return <>{simulatedStamp(new Date(Math.min(projected, new Date(snapshot.endAt).getTime())))}</>; }
const statusLabel = (status: SimulationStatus) => ({ starting: 'Preparing', scheduled: 'Ready', running: 'Running', paused: 'Paused', stopping: 'Stopping', completed: 'Completed', blocked: 'Blocked', stopped: 'Stopped', limit_reached: 'Limit reached', failed: 'Failed', created: 'Created', recovery_required: 'Recovery needs review' }[status]);
const pollDelay = (status: SimulationStatus) => status === 'scheduled' || status === 'paused' ? 30_000 : status === 'starting' || status === 'stopping' ? 10_000 : 15_000;
const message = (error: unknown) => error instanceof HttpError ? `${error.status === 404 ? 'Run or evidence not found in live runtime or saved history: ' : error.status === 409 ? 'Run changed; refresh and try again: ' : error.status === 403 ? 'Admin access required: ' : error.status === 401 ? 'Session expired: ' : ''}${error.message}` : error instanceof Error ? error.message : 'Request failed';
const json = (value: unknown) => JSON.stringify(value, null, 2);
const newId = () => crypto.randomUUID();
function saveJson(name: string, value: unknown) { const url = URL.createObjectURL(new Blob([json(value)], { type: 'application/json' })); const link = document.createElement('a'); link.href = url; link.download = name; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000); }
function merge(current: SimulationEvent[], incoming: SimulationEvent[]) { if (!incoming.length) return current; const map = new Map(current.map(item => [item.record_id, item])); incoming.forEach(item => map.set(item.record_id, item)); return [...map.values()].sort((a, b) => a.sequence - b.sequence); }
const helpFor = (label: string) => label.startsWith('Wall-time') ? 'The maximum real elapsed execution time this run may use. The standard default is six real hours, but the catalog value shown here is authoritative and may be lower. Preparation and scheduled waiting use no budget. Pauses after execution starts still count, and resuming never resets it.' : label.startsWith('Evidence') ? 'The maximum number of recorded events, including messages, tool activity, and diagnostics. It is not a token limit. Reaching it ends the run with limit_reached.' : label.includes('speed') ? 'How quickly simulated time advances relative to real time after execution starts. It does not make LLM or provider calls compute faster.' : null;
function InfoHelp({ text, label = 'More information' }: { text: string; label?: string }) { return <details className="group relative inline-flex"><summary aria-label={label} className="list-none rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-violet-500 [&::-webkit-details-marker]:hidden"><CircleHelp className="size-3.5" /></summary><span role="tooltip" className="absolute left-0 top-5 z-30 hidden w-72 rounded-md bg-slate-950 p-2 text-xs font-normal leading-5 text-white shadow-xl group-open:block group-hover:block group-focus-within:block">{text}</span></details>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { const id = useId(); const help = helpFor(label); const items = Children.toArray(children); const first = items[0]; const control = isValidElement<{ id?: string }>(first) ? cloneElement(first, { id: first.props.id ?? id }) : first; return <div className="flex flex-col items-stretch gap-1.5"><span className="flex items-center gap-1.5"><Label htmlFor={id}>{label}</Label>{help && <InfoHelp text={help} label={`About ${label}`} />}</span>{control}{items.slice(1)}</div>; }
function EventFeed({ title, events }: { title: string; events: SimulationEvent[] }) { return <div><h4 className="mb-2 text-sm font-semibold">{title} <span className="text-muted-foreground">({events.length})</span></h4>{!events.length && <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">Nothing yet.</p>}<div className="max-h-96 space-y-2 overflow-auto">{events.map(event => <details key={event.record_id} id={`evidence-${event.sequence}`} className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer"><span className="font-medium">{String(event.payload.type ?? event.source)}</span><span className="ml-2 text-xs text-muted-foreground">#{event.sequence} · Simulated {stamp(event.occurred_at)}</span>{typeof event.payload.text === 'string' && <span className="mt-1 block whitespace-pre-wrap">{event.payload.text}</span>}{event.payload.type === 'BehaviorDecision' && <span className="mt-1 block text-xs">Expected: {String(event.payload.expected)} · Actual: {String(event.payload.actual)} · {String(event.payload.disposition)}</span>}</summary><p className="mt-2 text-xs text-muted-foreground">Observed in real time {stamp(event.observed_at)} · Scheduled simulated time {stamp(event.scheduled_at)}</p><pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">{json(event.payload)}</pre></details>)}</div></div>; }

export function SimulationLabPage() {
  const [params] = useSearchParams();
  const shortcutId = params.get('sapienId');
  const [catalog, setCatalog] = useState<CaseCatalog | null>(null);
  const [allSapiens, setAllSapiens] = useState<Sapiens[]>([]);
  const [sapiens, setSapiens] = useState<Sapiens[]>([]);
  const [sapiensLoading, setSapiensLoading] = useState(true);
  const [sapiensError, setSapiensError] = useState('');
  const [selectedSapienId, setSelectedSapienId] = useState(shortcutId ?? '');
  const [caseIndex, setCaseIndex] = useState(0);
  const [runs, setRuns] = useState<SimulationRun[]>([]);
  const [historyLimit, setHistoryLimit] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [resultUnavailable, setResultUnavailable] = useState(false);
  const [guide, setGuide] = useState<DebugGuide | null>(null);
  const guideLoaded = useRef(false);
  const [messages, setMessages] = useState<SimulationEvent[]>([]);
  const [tools, setTools] = useState<SimulationEvent[]>([]);
  const [diagnostics, setDiagnostics] = useState<SimulationEvent[]>([]);
  const [evidence, setEvidence] = useState<SimulationEvent[]>([]);
  const cursors = useRef({ messages: 0, tools: 0, diagnostics: 0, evidence: 0 });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [participantName, setParticipantName] = useState('Scrum Master');
  const [participantId, setParticipantId] = useState('scrum-master');
  const [speed, setSpeed] = useState('');
  const [wall, setWall] = useState('');
  const [records, setRecords] = useState('');
  const [newSpeed, setNewSpeed] = useState('');
  const [actionKind, setActionKind] = useState<'message' | 'post'>('message');
  const [target, setTarget] = useState('priya');
  // The authored Sentinel Desk catalog uses delivery, not a generic project channel.
  useEffect(() => { if (actionKind === 'post' && target === 'project') setTarget('delivery'); }, [actionKind, target]);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [toolName, setToolName] = useState('jira_get_issue');
  const [issueKey, setIssueKey] = useState('SD-1');
  const [transitionId, setTransitionId] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [lastOutcome, setLastOutcome] = useState<ParticipantOutcome | null>(null);
  const [pendingAction, setPendingAction] = useState<Record<string, unknown> | null>(null);
  const pendingCreate = useRef<CaseCreateRequest | null>(null);
  const acknowledgedDeletes = useRef(new Set<string>());

  const selectedCase = catalog?.cases[caseIndex];
  const refresh = useCallback(async (signal?: AbortSignal, clearError = true) => {
    const [cases, list] = await Promise.all([simulationService.cases(signal), simulationService.list(signal)]);
    setCatalog(cases); setRuns(list.runs); setHistoryLimit(list.history_limit); setSelectedId(id => id && list.runs.some(item => item.run_id === id) ? id : list.runs[0]?.run_id ?? '');
    setWall(value => value && Number(value) > cases.limits.max_wall_seconds ? String(cases.limits.max_wall_seconds) : value);
    setRecords(value => value && Number(value) > cases.limits.max_records ? String(cases.limits.max_records) : value);
    if (clearError) setError('');
  }, []);
  useEffect(() => { const controller = new AbortController(); refresh(controller.signal).catch(error => { if (!controller.signal.aborted) setError(message(error)); }); return () => controller.abort(); }, [refresh]);
  const loadSapiens = useCallback(async () => {
    setSapiensLoading(true);
    try {
      const items = await sapiensService.listSapiens(); setAllSapiens(items);
      // Disabled Sapiens are intentionally absent from this selector. Missing metadata
      // remains visible but unavailable so older deployments fail closed with context.
      const choices = items.filter(item => item.simulationEnabled === true || item.simulationEnabled === undefined);
      setSapiens(choices);
      setSapiensError(items.length > 0 && choices.length === 0 ? 'No simulation-enabled Sapiens are available. Enable one in Django admin, then refresh.' : '');
      setSelectedSapienId(current => current && choices.some(item => item.id === current && item.simulationEnabled === true && item.simulationAvailable === true) ? current : '');
    } catch (problem) { setSapiens([]); setSapiensError(message(problem)); }
    finally { setSapiensLoading(false); }
  }, []);
  useEffect(() => { void loadSapiens(); }, [loadSapiens]);

  const drain = useCallback(async (id: string, kind: keyof typeof cursors.current, signal?: AbortSignal) => {
    let after = cursors.current[kind];
    for (let pageNumber = 0; pageNumber < 30; pageNumber++) {
      const page: EventPage = kind === 'messages' || kind === 'tools' ? await simulationService.participant(id, kind, after, signal) : await simulationService.events(id, after, kind === 'diagnostics' ? 'diagnostics' : undefined, signal);
      if (kind === 'messages') setMessages(current => merge(current, page.events));
      if (kind === 'tools') setTools(current => merge(current, page.events));
      if (kind === 'diagnostics') setDiagnostics(current => merge(current, page.events));
      if (kind === 'evidence') setEvidence(current => merge(current, page.events));
      after = page.next_after; cursors.current[kind] = after;
      if (!page.has_more) return;
    }
  }, []);
  useEffect(() => {
    cursors.current = { messages: 0, tools: 0, diagnostics: 0, evidence: 0 };
    guideLoaded.current = false;
    setMessages([]); setTools([]); setDiagnostics([]); setEvidence([]); setResult(null); setResultUnavailable(false); setGuide(null); setRun(null); setLastOutcome(null); setPendingAction(null);
    if (!selectedId) return;
    const controller = new AbortController(); let timer = 0; let failed = 0;
    const poll = async () => {
      try {
        const next = await simulationService.get(selectedId, controller.signal); if (controller.signal.aborted) return;
        if (next.delete_requested) acknowledgedDeletes.current.add(next.run_id);
        setRun(next); setRuns(current => current.map(item => item.run_id === next.run_id ? next : item));
        const activityAvailable = next.status !== 'created' && next.status !== 'starting' && next.status !== 'scheduled';
        if (activityAvailable && next.participant_mode !== 'environment_only') {
          await Promise.all([drain(selectedId, 'messages', controller.signal), drain(selectedId, 'tools', controller.signal), drain(selectedId, 'diagnostics', controller.signal)]);
          if (!guideLoaded.current) { setGuide(await simulationService.debug(selectedId, controller.signal)); guideLoaded.current = true; }
        }
        if (activityAvailable) await drain(selectedId, 'evidence', controller.signal);
        if (next.status === 'recovery_required') return;
        if (terminal.has(next.status)) {
          try {
            const response = await simulationService.result(selectedId, controller.signal);
            if ('report' in response) { setResult(response); if (!next.delete_requested || next.cleanup_required) return; }
          } catch (problem) {
            if (problem instanceof HttpError && problem.status === 409 && next.archived) { setResultUnavailable(true); return; }
            throw problem;
          }
        }
        failed = 0; timer = window.setTimeout(poll, pollDelay(next.status));
      } catch (problem) {
        if (controller.signal.aborted) return;
        if (problem instanceof HttpError && problem.status === 404 && acknowledgedDeletes.current.has(selectedId)) {
          acknowledgedDeletes.current.delete(selectedId); setError(''); setRun(null); setRuns(current => current.filter(item => item.run_id !== selectedId)); setSelectedId('');
          await Promise.all([refresh(undefined, false).catch(() => undefined), loadSapiens().catch(() => undefined)]); return;
        }
        setError(message(problem));
        if (problem instanceof HttpError && problem.status === 404) return;
        failed++; timer = window.setTimeout(poll, Math.min(300_000, 60_000 * 2 ** Math.min(failed - 1, 3)));
      }
    };
    void poll(); return () => { controller.abort(); window.clearTimeout(timer); };
  }, [selectedId, drain]);

  async function mutate(label: string, operation: () => Promise<SimulationRun | void>) {
    if (busy) return; setBusy(label); setError('');
    try { const next = await operation(); if (next) setRun(next); await refresh(); }
    catch (problem) {
      const detail = `${label === 'resume' ? 'Resume failed' : label === 'pause' ? 'Pause failed' : label === 'stop' ? 'Stop failed' : label === 'speed' ? 'Speed change failed' : 'Operation failed'}: ${message(problem)}`;
      if (problem instanceof HttpError && problem.status === 409) await Promise.all([refresh(undefined, false).catch(() => undefined), loadSapiens()]);
      setError(detail);
    }
    finally { setBusy(''); }
  }
  async function create() {
    if (!selectedCase || busy) return;
    let request = pendingCreate.current;
    if (!request) {
      const speedNumber = speed.trim() ? Number(speed) : undefined, wallNumber = wall.trim() ? Number(wall) : undefined, recordNumber = records.trim() ? Number(records) : undefined;
      const selectedSapien = sapiens.find(item => item.id === selectedSapienId);
      if (!selectedSapien || selectedSapien.simulationEnabled !== true || selectedSapien.simulationAvailable !== true) { setError('Select a server-confirmed eligible Sapiens. Eligibility may have changed; refresh the Sapiens list.'); return; }
      if (!participantId.match(/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/) || !participantName.trim()) { setError('Provide a valid simulated participant ID and name.'); return; }
      if ((speedNumber !== undefined && (!(speedNumber > 0) || speedNumber > (catalog?.limits.max_speed ?? 0))) || (wallNumber !== undefined && (!(wallNumber > 0) || wallNumber > (catalog?.limits.max_wall_seconds ?? 0))) || (recordNumber !== undefined && (!Number.isInteger(recordNumber) || recordNumber < 1 || recordNumber > (catalog?.limits.max_records ?? 0)))) { setError('Speed, wall-time and evidence overrides must be within the server-advertised bounds.'); return; }
      request = { case: { case_id: selectedCase.case_id, version: selectedCase.version, start_at: selectedCase.suggested_start_at, participant_id: participantId, participant_name: participantName.trim() }, config: { run_id: `run-${newId()}`, ...(speedNumber !== undefined && speedNumber !== catalog?.defaults.speed ? { speed: speedNumber } : {}), ...(wallNumber !== undefined && wallNumber !== catalog?.defaults.max_wall_seconds ? { max_wall_seconds: wallNumber } : {}), ...(recordNumber !== undefined && recordNumber !== catalog?.defaults.max_records ? { max_records: recordNumber } : {}) }, sapien_id: Number(selectedSapien.id) };
    }
    pendingCreate.current = request; setBusy('schedule'); setError('');
    try {
      const created = await simulationService.create(request);
      pendingCreate.current = null; setSelectedId(created.run_id); setRun(created);
      await refresh();
    } catch (problem) {
      const detail = `Schedule simulation failed: ${message(problem)}`;
      if (problem instanceof HttpError && problem.status === 409) await Promise.all([refresh(undefined, false).catch(() => undefined), loadSapiens()]);
      else await refresh(undefined, false).catch(() => undefined);
      setError(`${detail} Retry Schedule simulation to reuse the same run ID, or select the run from Retained runs if it appears there.`);
    } finally { setBusy(''); }
  }
  async function control(action: 'pause' | 'resume' | 'stop') { if (run) await mutate(action, () => simulationService.control(run.run_id, action)); }
  async function remove() {
    if (!run || busy || !window.confirm(run.archived ? `Permanently delete saved run ${run.run_id} and its archived evidence? This does not remove cognitive memories.` : `Delete run ${run.run_id}? Before execution this cancels preparation or waiting, drains cleanup, then permanently removes its saved run history and evidence. Cognitive memories are not removed.`)) return;
    const id = run.run_id; setBusy('delete'); setError('');
    try {
      const response = await simulationService.remove(id);
      if (response) { acknowledgedDeletes.current.add(id); setRun(response); setRuns(current => current.map(item => item.run_id === id ? response : item)); }
      else { setSelectedId(''); setRun(null); await Promise.all([refresh(undefined, false), loadSapiens()]); }
    } catch (problem) {
      if (problem instanceof HttpError && problem.status === 409) setError('Execution began before cancellation won the race. Stop and drain the run before deleting it.');
      else setError(`Delete failed: ${message(problem)}`);
    } finally { setBusy(''); }
  }
  async function submitAction(payload: Record<string, unknown>) {
    if (!run || busy || !run.participant_actions_available) return;
    const withId = { ...payload, operation_id: `manual:${newId()}` }; setPendingAction(withId); await sendAction(withId);
  }
  async function sendAction(payload: Record<string, unknown>) {
    if (!run) return; setBusy('action'); setError('');
    try { const response = await simulationService.act(run.run_id, payload); setLastOutcome(response); setPendingAction(null); if (response.outcome.success === false || response.outcome.is_error) setError(`Action rejected: ${response.outcome.reason ?? response.outcome.content ?? 'See result below.'}`); await Promise.all([drain(run.run_id, 'messages'), drain(run.run_id, 'tools')]); }
    catch (problem) { setError(`${message(problem)} The action may have completed; retry the exact same action ID only if needed.`); }
    finally { setBusy(''); }
  }
  async function download() {
    if (!run) return; setBusy('download'); setError('');
    try { let after = 0; let all: SimulationEvent[] = []; for (let i = 0; i < 1000; i++) { const page = await simulationService.events(run.run_id, after); all = merge(all, page.events); after = page.next_after; if (!page.has_more) break; if (i === 999) throw new Error('Export page limit reached.'); } saveJson(`${run.run_id}-evidence.json`, { run, evidence: all, result, note: 'Local export of evidence served from the live runtime or persisted database history.' }); }
    catch (problem) { setError(message(problem)); } finally { setBusy(''); }
  }
  const allowed = (name: string) => !!run?.allowed_controls.includes(name);
  const sapienForRun = (item: SimulationRun) => item.sapien_id == null ? null : allSapiens.find(sapien => Number(sapien.id) === item.sapien_id);
  const participantPhase = run?.participant?.phase ? ({ idle: 'Waiting to attach', reserving: 'Reserving Sapiens', draining: 'Finishing normal work', starting: 'Starting cognitive engines', running: 'Running', stopping: 'Draining outstanding work', stopped: 'Stopped', failed: 'Attachment failed' }[run.participant.phase] ?? run.participant.phase.replaceAll('_', ' ')) : null;
  const speedOverrideValid = Number.isFinite(Number(newSpeed)) && Number(newSpeed) > 0 && Number(newSpeed) <= (catalog?.limits.max_speed ?? 0);
  const toolArguments = () => {
    if (toolName === 'jira_get_metadata') return { resource: 'edit_fields', issue_key: issueKey };
    if (toolName === 'jira_transition_issue') return { issue_key: issueKey, transition_id: transitionId };
    if (toolName === 'jira_update_issue') return { issue_key: issueKey, fields: { ...(summary ? { summary } : {}), ...(description ? { description } : {}) } };
    return { issue_key: issueKey };
  };
  return <div className="min-h-screen bg-background text-foreground"><header className="border-b"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4"><div className="flex items-center gap-3"><Link to="/admin" aria-label="Admin home"><ArrowLeft className="size-5" /></Link><Beaker className="size-6 text-violet-500" /><div><h1 className="font-semibold">Simulation Lab</h1><p className="text-xs text-muted-foreground">Authored cases · simulated workplace</p></div></div><div className="flex gap-2"><ThemeToggle /><Button variant="outline" size="sm" onClick={() => void Promise.all([refresh(), loadSapiens()]).catch(problem => setError(message(problem)))}><RefreshCw className="mr-2 size-4" />Refresh</Button></div></div></header>
    <main className="mx-auto max-w-7xl space-y-5 px-4 py-6"><div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm"><strong>Real-memory safety notice:</strong> Jira and Teams are simulated, but the selected Sapiens uses and modifies its real cognitive memories. Nothing is cloned or reset, and the Sapiens remains inactive after shutdown. A dedicated test Sapiens is recommended, but not required.</div>{error && <div role="alert" className="flex gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300"><AlertTriangle className="size-4 shrink-0" />{error}</div>}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"><Card><CardHeader><CardTitle>1. Select a Sapiens</CardTitle></CardHeader><CardContent className="space-y-4">{!catalog && <p className="text-sm text-muted-foreground">Loading case defaults and server limits…</p>}{catalog && !catalog.cases.length && <p>No authored cases are available.</p>}{selectedCase && <><div className="rounded-lg bg-muted/50 p-3"><p className="font-medium">{selectedCase.title}</p><p className="text-sm text-muted-foreground">{selectedCase.description}</p></div><div className="space-y-2"><Label>Eligible Sapiens</Label>{sapiensLoading && <p className="text-sm text-muted-foreground">Loading eligibility…</p>}{sapiensError && <p className="text-sm text-red-600">{sapiensError}</p>}{!sapiensLoading && !sapiensError && !sapiens.length && <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No simulation-enabled Sapiens are available. Create one normally or enable an existing one in Django admin.</p>}{!sapiensLoading && sapiens.length > 0 && sapiens.every(item => item.simulationEnabled === undefined || item.simulationAvailable === undefined) && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">Eligibility metadata is missing from the Sapiens list response. Selection is disabled until the deployment is updated.</p>}<div role="radiogroup" aria-label="Eligible Sapiens" className="grid max-h-64 gap-2 overflow-auto sm:grid-cols-2">{sapiens.map(item => { const available = item.simulationEnabled === true && item.simulationAvailable === true; const reason = item.simulationUnavailableReason || (item.simulationAvailable === false ? 'Currently reserved or otherwise unavailable.' : 'Eligibility metadata is unavailable.'); return <button type="button" role="radio" aria-checked={selectedSapienId === item.id} key={item.id} disabled={!available} onClick={() => setSelectedSapienId(item.id)} className={`rounded-lg border p-3 text-left disabled:cursor-not-allowed disabled:opacity-55 ${selectedSapienId === item.id ? 'border-violet-500 bg-violet-500/5' : ''}`}><span className="font-medium">{item.name}</span><span className="block text-xs text-muted-foreground">ID {item.id} · {item.role || 'No role'} · {available ? 'Ready' : reason}</span></button>; })}</div><p className="text-xs text-muted-foreground">Existing and newly created Sapiens use the same rules. This page cannot change eligibility.</p></div><details className="rounded-lg border p-3"><summary className="cursor-pointer text-sm font-medium">Advanced settings</summary><div className="mt-3 grid gap-3 sm:grid-cols-2"><Field label="Authored case"><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={caseIndex} onChange={e => setCaseIndex(Number(e.target.value))}>{catalog?.cases.map((item, index) => <option key={`${item.case_id}:${item.version}`} value={index}>{item.title} v{item.version}</option>)}</select></Field><Field label="Case participant identity"><Input value={participantId} onChange={e => setParticipantId(e.target.value)} /></Field><Field label="Participant display name"><Input value={participantName} onChange={e => setParticipantName(e.target.value)} /></Field><div className="flex flex-col items-stretch gap-1.5"><span className="flex items-center gap-1.5"><Label>Preview simulated project start</Label><InfoHelp label="About the preview start" text="A preview of the fictional project clock in IST. Scheduling recalculates and fixes the next real whole-hour appointment; it does not wait for this preview value." /></span><output className="rounded-md border bg-muted/50 px-3 py-2 text-sm">{stamp(selectedCase.suggested_start_at)}</output></div><Field label="Initial speed override"><Input type="number" min="0.01" max={catalog?.limits.max_speed} value={speed} placeholder={`Default: ${catalog?.defaults.speed ?? "—"}×`} onChange={e => setSpeed(e.target.value)} /></Field><Field label={`Wall-time override (≤ ${catalog?.limits.max_wall_seconds}s)`}><Input type="number" value={wall} placeholder={`Default: ${catalog?.defaults.max_wall_seconds ?? "—"}s`} onChange={e => setWall(e.target.value)} /></Field><Field label={`Evidence override (≤ ${catalog?.limits.max_records})`}><Input type="number" value={records} placeholder={`Default: ${catalog?.defaults.max_records ?? "—"}`} onChange={e => setRecords(e.target.value)} /></Field></div><p className="mt-2 text-xs text-muted-foreground">The case identity is separate from the production Sapiens ID. Leave an override blank to use the server default: {catalog?.defaults.speed ?? "—"}× speed, {catalog?.defaults.max_wall_seconds ?? "—"} wall seconds ({catalog ? `${catalog.defaults.max_wall_seconds / 3600} real hours` : "—"}), and {catalog?.defaults.max_records ?? "—"} evidence records. Clock speed does not accelerate inference.</p></details><div className="flex items-center gap-3"><Button disabled={!!busy || !selectedSapienId} onClick={() => void create()}>{busy === 'schedule' ? 'Scheduling…' : pendingCreate.current ? 'Retry schedule' : 'Schedule simulation'}</Button><span className="text-xs text-muted-foreground">Preparation starts now. Execution begins automatically at the next real whole hour in IST. Preparation and waiting use no wall budget.</span></div></>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Retained runs</CardTitle></CardHeader><CardContent className="space-y-2">{!runs.length && <p className="text-sm text-muted-foreground">No live runs or saved history.</p>}{runs.map(item => { const bound = sapienForRun(item); const identity = item.participant_mode === 'sapien' ? `${bound?.name ?? 'Sapiens'} (ID ${item.sapien_id})` : item.participant_mode === 'manual' ? `Manual participant: ${item.participant_id}` : 'Environment-only run'; return <button key={item.run_id} aria-pressed={selectedId === item.run_id} onClick={() => setSelectedId(item.run_id)} className={`w-full rounded-lg border p-3 text-left text-sm ${selectedId === item.run_id ? 'border-violet-500 bg-violet-500/5' : ''}`}><span className="block truncate font-medium">{identity}</span><span className="block truncate text-xs text-muted-foreground">{item.case_id}</span><span className="mt-1 flex items-center justify-between"><span className="flex gap-1"><Badge variant="secondary">{statusLabel(item.status)}</Badge>{item.archived && <Badge variant="outline">Saved history</Badge>}</span><span className="text-xs text-muted-foreground">{item.run_id.slice(0, 12)}…</span></span></button>; })}<details className="text-xs text-muted-foreground"><summary>Storage and worker diagnostics</summary><p>Worker {catalog?.worker_id ?? '—'} · {catalog?.storage ?? 'unknown'} · up to {catalog?.limits.max_active ?? '—'} live active runs plus the latest {historyLimit ?? '—'} saved-history entries returned by the API. Persisted history does not expire automatically. Live controls remain single-worker; saved history is not a recoverable runtime and automatic continuation is unavailable. Deployment requires the simulation history database migration before this storage mode is usable.</p></details></CardContent></Card></div>
      {run && <><Card><CardHeader><CardTitle className="flex flex-wrap items-center gap-2">Run console <Badge variant="secondary">{statusLabel(run.status)}</Badge>{run.archived && <Badge variant="outline">Saved history</Badge>}{!run.runtime_available && <Badge variant="outline">No live runtime</Badge>}<Badge variant="outline">{run.participant_mode === 'sapien' ? 'Sapiens AI' : run.participant_mode === 'manual' ? 'Manual operator' : 'Environment only'}</Badge></CardTitle><p className="text-sm text-muted-foreground">{run.participant_mode === 'sapien' ? `${sapienForRun(run)?.name ?? 'Sapiens'} (ID ${run.sapien_id})` : run.participant_mode === 'manual' ? `Manual participant ${run.participant_id}` : 'No bound participant'}</p></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><p><span className="text-muted-foreground">Real execution appointment</span><br />{stamp(run.scheduled_start_at)}</p><p><span className="text-muted-foreground">Real countdown</span><br /><LiveCountdown value={run.scheduled_start_at} startedAt={run.execution_started_at} /></p><p><span className="inline-flex items-center gap-1 text-muted-foreground">{run.status === 'starting' || run.status === 'scheduled' ? 'Frozen simulated clock' : 'Simulated time'} <InfoHelp label="About simulated time" text="The fictional case clock, shown in IST. It remains frozen during preparation and scheduled waiting, then advances according to the speed setting once execution starts." /></span><br /><LiveSimulatedTime value={run.simulated_time} endAt={run.end_at} speed={run.speed} advancing={run.status === 'running' && !run.paused && run.runtime_available} /></p><p><span className="text-muted-foreground">Window ends</span><br />{stamp(run.end_at)}</p><p><span className="inline-flex items-center gap-1 text-muted-foreground">Wall budget left <InfoHelp label="About remaining wall budget" text="Execution-only real time remaining before limit_reached. Preparation and scheduled waiting use zero budget. Pauses after execution starts count, and Resume never resets the timer." /></span><br /><LiveWallBudget remaining={run.wall_remaining_seconds} counting={!!run.execution_started_at && !terminal.has(run.status)} /></p><p><span className="inline-flex items-center gap-1 text-muted-foreground">Pending world work <InfoHelp label="About pending world work" text="Scheduled case rules, reactions, and participant work waiting for the simulated clock or processing to progress." /></span><br />{run.pending_world_work ?? '—'}</p></div>{run.start_blocked_reason && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">Preparation unavailable: {run.start_blocked_reason}</p>}{run.status === 'recovery_required' && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm"><strong>Recovery needs review.</strong><p className="mt-1 text-xs">Saved history is available, but there is no live runtime on this worker. Automatic continuation is not implemented; this state alone does not prove a process or Sapiens died.</p></div>}{run.cleanup_required && run.status !== 'recovery_required' && <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm"><strong>Cleanup needs review; Sapiens reservation retained.</strong><p className="mt-1 text-xs">The run is intentionally retained without expiry or controls so failure diagnostics remain available.</p></div>}{run.delete_requested && terminal.has(run.status) && !run.cleanup_required && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">Cancellation cleanup did not remove this run. It remains available for diagnostic review.</p>}{run.detail && <p className="text-sm">{run.detail}</p>}{run.participant && <div className="grid gap-2 rounded-lg bg-muted/50 p-3 text-xs sm:grid-cols-3"><p>Runtime status: <strong className="capitalize">{participantPhase}</strong></p><p>Thinking cycles / incoming turns: {run.participant.cycles} / {run.participant.incoming_turns}</p><p>Messages waiting: {run.participant.pending_messages}</p><p>Last simulated tick: {stamp(run.participant.last_tick_at)}</p><p>Last cycle: {run.participant.last_cycle_wall_seconds ?? '—'}s wall / {run.participant.last_cycle_simulated_seconds ?? '—'}s simulated</p><p>Failure: {run.participant.failure_type ?? 'None reported'}</p></div>}{run.status === 'starting' && <p className="text-xs text-blue-700 dark:text-blue-300">Preparation is running now: the Sapiens is reserved, admitted normal work is drained, and cognitive engines are attached. The simulated clock, AI execution, and case events remain blocked until the real appointment.</p>}{run.status === 'scheduled' && <p className="text-xs text-blue-700 dark:text-blue-300">Ready and reserved. Execution starts automatically at the scheduled real time; Stop or Delete can cancel it while waiting. The wall budget has not started yet. An app-server restart loses the live runtime; saved history remains, but automatic continuation is not implemented.</p>}{run.status === 'running' && <p className="text-xs text-emerald-700 dark:text-emerald-300">Execution started automatically. The simulated clock, AI, and case events are now advancing; preparation delays did not skip simulated events.</p>}{run.status === 'paused' && <p className="text-xs text-amber-700 dark:text-amber-300">The simulated clock and new scheduled work wait while paused. An LLM or provider call already in progress may still finish. Paused time still uses the wall budget.</p>}{run.status === 'stopping' && <p className="text-xs text-muted-foreground">Stopping rejects new actions and drains outstanding provider work; it is not an instant cancellation.</p>}{terminal.has(run.status) && !run.cleanup_required && <p className="text-xs text-muted-foreground">Finished attempts cannot restart. The bound Sapiens remains inactive; create a new run for another attempt.</p>}<div className="flex flex-wrap gap-2">{allowed('resume') && <Button disabled={!!busy} onClick={() => void control('resume')}>Resume simulation</Button>}{allowed('pause') && <Button variant="outline" disabled={!!busy} onClick={() => void control('pause')}>Pause simulation</Button>}{allowed('stop') && <Button variant="outline" disabled={!!busy} onClick={() => void control('stop')}>{run.status === 'scheduled' ? 'Cancel scheduled run' : 'Stop and drain'}</Button>}{allowed('speed') && <><Input className="w-36" type="number" aria-label="New simulation speed" placeholder="New speed" value={newSpeed} onChange={e => setNewSpeed(e.target.value)} /><Button variant="outline" disabled={!!busy || !speedOverrideValid} onClick={() => void mutate('speed', () => simulationService.setSpeed(run.run_id, Number(newSpeed)))}>Set speed</Button></>}{(busy === 'delete' || (run.delete_requested && !terminal.has(run.status))) ? <Button variant="destructive" disabled>Cancelling…</Button> : allowed('delete') && <Button variant="destructive" disabled={!!busy} onClick={() => void remove()}>Delete run</Button>}</div><p className="flex items-center gap-1 text-xs text-muted-foreground">Actual current speed: {run.speed}×; original configured speed: {run.config.speed}×. Clock speed does not accelerate inference. <InfoHelp label="About simulation speed" text="A 2× speed advances the case clock twice as fast as real time. It does not make language-model or provider calls compute faster." /></p>{run.participant_mode === 'sapien' && <div className="grid gap-5 border-t pt-4 lg:grid-cols-2"><EventFeed title="Live messages" events={messages} /><EventFeed title="Live tool activity" events={tools} /></div>}</CardContent></Card>
      {run.participant_mode === 'manual' && <Card><CardHeader><CardTitle>Participant console</CardTitle><p className="text-sm text-muted-foreground">You act only as {run.participant_id}. Messages and Jira tools are simulated; no real Teams or Jira account is touched.</p></CardHeader><CardContent className="space-y-5"><div className="grid gap-5 lg:grid-cols-2"><EventFeed title="Messages" events={messages} /><EventFeed title="Your tool activity" events={tools} /></div><div className="grid gap-5 border-t pt-5 lg:grid-cols-2"><div className="space-y-3"><h3 className="font-medium">Send a message</h3><div className="flex gap-2"><Button size="sm" variant={actionKind === 'message' ? 'default' : 'outline'} onClick={() => { setActionKind('message'); setTarget('priya'); }}>Direct</Button><Button size="sm" variant={actionKind === 'post' ? 'default' : 'outline'} onClick={() => { setActionKind('post'); setTarget('project'); }}>Channel post</Button></div><Field label={actionKind === 'post' ? 'Channel ID' : 'Recipient ID'}><Input value={target} onChange={e => setTarget(e.target.value)} /></Field><Field label="Message"><Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Type a message or an explicit employee command" /></Field><Field label="Reply to message ID (optional)"><Input value={replyTo} onChange={e => setReplyTo(e.target.value)} /></Field><Button disabled={!!busy || !run.participant_actions_available || !target.trim() || !body.trim()} onClick={() => void submitAction({ action: actionKind, target: target.trim(), text: body, ...(replyTo.trim() ? { in_reply_to: replyTo.trim() } : {}) })}>Send</Button><p className="text-xs text-muted-foreground">Employee free text is not interpreted by an LLM. Explicit commands are listed in Admin debug.</p></div><div className="space-y-3"><h3 className="font-medium">Simulated Jira</h3><Field label="Tool"><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={toolName} onChange={e => setToolName(e.target.value)}>{['jira_get_issue','jira_list_transitions','jira_transition_issue','jira_update_issue','jira_get_metadata'].map(name => <option key={name}>{name}</option>)}</select></Field><Field label="Issue key"><Input value={issueKey} onChange={e => setIssueKey(e.target.value)} /></Field>{toolName === 'jira_transition_issue' && <Field label="Transition ID (from list_transitions)"><Input value={transitionId} onChange={e => setTransitionId(e.target.value)} /></Field>}{toolName === 'jira_update_issue' && <><Field label="Summary"><Input value={summary} onChange={e => setSummary(e.target.value)} /></Field><Field label="Description"><Textarea value={description} onChange={e => setDescription(e.target.value)} /></Field></>}<Button disabled={!!busy || !run.participant_actions_available || !issueKey.trim() || (toolName === 'jira_transition_issue' && !transitionId.trim())} onClick={() => void submitAction({ action: 'tool', connection: 'jira', tool: toolName, arguments: toolArguments() })}>Call tool</Button><p className="text-xs text-muted-foreground">Tool reads are explicit participant actions and may count toward grading. No automatic Jira reads.</p></div></div>{pendingAction && <Button variant="outline" disabled={!!busy} onClick={() => void sendAction(pendingAction)}>Retry exact action ID</Button>}{lastOutcome && <div className="rounded-lg border p-3 text-sm"><p>Last action: {lastOutcome.outcome.success === false || lastOutcome.outcome.is_error ? 'Rejected' : 'Completed'} · {lastOutcome.operation_id}</p><pre className="mt-2 overflow-auto rounded bg-muted p-2 text-xs">{json(lastOutcome.outcome)}</pre></div>}</CardContent></Card>}
      <Card><CardHeader><CardTitle>Result</CardTitle></CardHeader><CardContent className="space-y-3">
        {!result ? <p className="text-sm text-muted-foreground">{run.status === 'recovery_required' ? 'Saved evidence is available, but this unfinished run has no final report and cannot resume automatically.' : resultUnavailable ? 'Saved evidence is available, but no final report was archived for this run.' : terminal.has(run.status) ? 'Final evidence and report are loading…' : 'The report appears when the run finishes.'}</p> : <><p className="text-sm">{result.detail} · Pass rate: {result.pass_rate === null ? 'Not gradeable' : `${Math.round(result.pass_rate * 100)}%`}</p><p className="text-xs text-muted-foreground">Participation checks measure authored-case participation, not full Scrum quality. Employees use explicit commands rather than general natural-language understanding.{run.participant_mode === 'sapien' ? run.participant && (run.participant.cycles > 0 || run.participant.incoming_turns > 0 || run.participant.last_tick_at) ? ' Runtime diagnostics confirm participant activity.' : ' The run selected a Sapiens, but available diagnostics do not prove attachment or execution completed.' : ' This was a manual participant run.'}</p>{result.report.metrics.map(metric => <div key={metric.expectation_id} className="rounded-lg border p-3 text-sm"><strong>{metric.expectation_id}</strong> · {metric.verdict}<p>{metric.explanation}</p><p className="text-xs">Evidence: {metric.evidence_ids.map(id => { const sequence = Number(id.slice(id.lastIndexOf(':') + 1)); return <button key={id} className="mr-2 text-violet-600 underline" onClick={() => void simulationService.event(run.run_id, sequence).then(event => { setEvidence(current => merge(current, [event])); document.getElementById(`evidence-${sequence}`)?.scrollIntoView(); }).catch(problem => setError(message(problem)))}>{id}</button>; })}</p></div>)}<Button size="sm" variant="outline" onClick={() => saveJson(`${run.run_id}-report.json`, result)}>Download report</Button></>}
        <Button size="sm" variant="outline" disabled={!!busy} onClick={() => void download()}><Download className="mr-2 size-4" />Download all evidence</Button><p className="text-xs text-muted-foreground">Downloads are local copies. Run history, evidence, and final reports are saved in the database until explicitly deleted. Live runtime state is still process-local, and automatic recovery is not implemented.</p>
      </CardContent></Card>
      <details className="rounded-xl border p-4"><summary className="cursor-pointer font-semibold">Admin debug <span className="text-xs font-normal text-muted-foreground">Private authored guide, diagnostics and all evidence</span></summary><div className="mt-4 space-y-5"><p className="text-xs text-muted-foreground">Never give hidden future rules or expectations to a participant or future AI. Diagnostic counts are historical records, not unresolved work.</p>{guide ? <><div className="grid gap-3 text-sm sm:grid-cols-2"><p>People: {guide.people.map(person => `${person.name} (${person.person_id})`).join(', ')}</p><p>Connections: {guide.connections.join(', ')}</p></div><details><summary>Employee explicit commands</summary><pre className="overflow-auto rounded bg-muted p-3 text-xs">{json(guide.employee_commands)}</pre></details><details><summary>Authored channels, expectations and future rules</summary><pre className="overflow-auto rounded bg-muted p-3 text-xs">{json({ channels: guide.channels, expectations: guide.expectations, rules: guide.rules })}</pre></details></> : <p className="text-sm text-muted-foreground">No authored guide for this run.</p>}<div className="grid gap-4 lg:grid-cols-2"><EventFeed title="Behavior diagnostics" events={diagnostics} /><EventFeed title="All evidence" events={evidence} /></div><pre className="overflow-auto rounded bg-muted p-3 text-xs">{json({ run_id: run.run_id, worker_id: catalog?.worker_id, event_count: run.event_count, diagnostic_counts: run.diagnostic_counts, expires_in_seconds: run.expires_in_seconds })}</pre></div></details></>}
    </main></div>;
}
