import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { Activity, ArrowLeft, Beaker, Bot, CheckCircle2, ChevronDown, CircleDot, Clock3, FolderKanban, LayoutDashboard, ListFilter, MessageSquare, MoreHorizontal, PlugZap, RefreshCw, Search, Star, Users } from 'lucide-react';
import { SimulationWorldExplorer } from '../components/simulation/SimulationWorldExplorer';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ThemeToggle } from '../components/ThemeToggle';
import { simulationService } from '../core/services/simulationService';
import type { EventPage, SimulationEvent, SimulationResult, SimulationRun, WorldCollection, WorldOverview, WorldTicket } from '../types/simulationTypes';

const terminal = new Set(['completed', 'blocked', 'stopped', 'limit_reached', 'failed']);
const time = (value?: string | null) => value ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', second: '2-digit' }) + ' IST' : '—';
const statusName = (status: string) => status.replaceAll('_', ' ').replace(/^./, value => value.toUpperCase());
const message = (error: unknown) => error instanceof Error ? error.message : (error as { message?: string })?.message || 'Request failed';
const payload = (event: SimulationEvent) => event.payload as Record<string, unknown>;
const value = (input: unknown) => typeof input === 'string' ? input : input == null ? '' : JSON.stringify(input);

function JiraPortal({ runId, eventCount }: { runId: string; eventCount: number }) {
  const [overview, setOverview] = useState<WorldOverview | null>(null);
  const [tickets, setTickets] = useState<WorldCollection<WorldTicket> | null>(null);
  const [selected, setSelected] = useState('');
  const [history, setHistory] = useState<EventPage | null>(null);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const previousEventCount = useRef(eventCount);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (eventCount !== previousEventCount.current) {
      previousEventCount.current = eventCount;
      setRefresh(current => current + 1);
    }
  }, [eventCount]);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    simulationService.worldOverview(runId, undefined, controller.signal)
      .then(setOverview)
      .catch(problem => { if (!controller.signal.aborted) setError(message(problem)); });
    return () => controller.abort();
  }, [runId, refresh]);

  useEffect(() => {
    if (!overview) return;
    const controller = new AbortController();
    simulationService.worldTickets(runId, {
      through: overview.through,
      connection: 'jira',
      limit: 50,
      ...(debounced ? { search: debounced } : {}),
    }, controller.signal)
      .then(page => {
        setTickets(page);
        setSelected(current => current && page.items.some(ticket => ticket.issue_key === current)
          ? current
          : page.items[0]?.issue_key ?? '');
      })
      .catch(problem => { if (!controller.signal.aborted) setError(message(problem)); });
    return () => controller.abort();
  }, [runId, overview?.through, debounced]);

  useEffect(() => {
    if (!overview || !selected) {
      setHistory(null);
      return;
    }
    const controller = new AbortController();
    simulationService.worldActivity(runId, {
      through: overview.through,
      connection: 'jira',
      issue_key: selected,
      limit: 50,
    }, controller.signal)
      .then(page => setHistory({
        events: page.items.map(item => item.event),
        next_after: page.next_after,
        has_more: page.has_more,
      }))
      .catch(problem => { if (!controller.signal.aborted) setError(message(problem)); });
    return () => controller.abort();
  }, [runId, overview?.through, selected]);

  const ticket = tickets?.items.find(item => item.issue_key === selected);
  const recordedFields = useMemo(() => {
    const result: Record<string, string> = {};
    for (const event of history?.events ?? []) {
      const body = payload(event);
      const fields = body.fields && typeof body.fields === 'object' ? body.fields as Record<string, unknown> : {};
      for (const key of ['assignee', 'reporter', 'priority', 'issue_type', 'labels']) {
        const candidate = fields[key] ?? body[key];
        if (candidate != null && candidate !== '') result[key] = value(candidate);
      }
    }
    return result;
  }, [history]);

  const loadMore = async () => {
    if (!overview || !tickets?.has_more) return;
    const next = await simulationService.worldTickets(runId, {
      through: overview.through,
      connection: 'jira',
      offset: tickets.next_offset,
      limit: 50,
      ...(debounced ? { search: debounced } : {}),
    });
    setTickets(current => current ? { ...next, items: [...current.items, ...next.items] } : next);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f4f5f7] text-[#172b4d] dark:bg-[#0b1020] dark:text-slate-100">
      <header className="flex h-14 shrink-0 items-center gap-3 bg-[#0747a6] px-4 text-white shadow-sm">
        <span className="grid size-8 place-items-center rounded bg-white/15"><FolderKanban className="size-5" /></span>
        <strong className="text-lg tracking-tight">Jira Software</strong>
        <nav className="hidden items-center gap-1 text-sm md:flex">
          <button className="flex items-center gap-1 rounded px-3 py-2 hover:bg-white/10">Projects <ChevronDown className="size-3.5" /></button>
          <button className="flex items-center gap-1 rounded px-3 py-2 hover:bg-white/10">Filters <ChevronDown className="size-3.5" /></button>
          <button className="flex items-center gap-1 rounded px-3 py-2 hover:bg-white/10">Dashboards <ChevronDown className="size-3.5" /></button>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded bg-white/10 px-3 py-1.5 text-xs sm:inline">Read-only simulation</span>
          <Button className="border-white/25 bg-transparent text-white hover:bg-white/10" variant="outline" size="sm" onClick={() => setRefresh(current => current + 1)}>
            <RefreshCw className="mr-2 size-4" />Refresh
          </Button>
        </div>
      </header>

      {error && <div className="border-b border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

      <div className="grid min-h-0 flex-1 lg:grid-cols-[220px_340px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#dfe1e6] bg-[#f4f5f7] p-4 dark:border-white/10 dark:bg-[#10172a] lg:block">
          <div className="flex items-center gap-3 border-b border-[#dfe1e6] pb-4 dark:border-white/10">
            <span className="grid size-10 place-items-center rounded bg-[#0052cc] font-bold text-white">SD</span>
            <div className="min-w-0"><p className="truncate font-semibold">Sentinel Desk</p><p className="text-xs text-slate-500">Software project</p></div>
            <Star className="ml-auto size-4 text-slate-400" />
          </div>
          <nav className="mt-4 space-y-1 text-sm">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Planning</p>
            <button className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-slate-600 hover:bg-[#ebecf0] dark:text-slate-300 dark:hover:bg-white/5"><LayoutDashboard className="size-4" />Board</button>
            <button className="flex w-full items-center gap-3 rounded bg-[#deebff] px-3 py-2 text-left font-medium text-[#0052cc] dark:bg-blue-950/40 dark:text-blue-300"><ListFilter className="size-4" />Issues</button>
            <button className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-slate-600 hover:bg-[#ebecf0] dark:text-slate-300 dark:hover:bg-white/5"><Clock3 className="size-4" />Timeline</button>
          </nav>
          <div className="mt-6 rounded border border-[#dfe1e6] bg-white p-3 text-xs text-slate-500 dark:border-white/10 dark:bg-black/20">
            <p className="font-semibold text-slate-700 dark:text-slate-200">Recorded snapshot</p>
            <p className="mt-1">Evidence through #{overview?.through ?? '—'}</p>
            <p>{tickets?.total ?? overview?.counts.tickets ?? 0} observed issues</p>
          </div>
        </aside>

        <aside className="min-h-0 overflow-y-auto border-r border-[#dfe1e6] bg-white dark:border-white/10 dark:bg-[#10172a]">
          <div className="sticky top-0 z-10 border-b border-[#dfe1e6] bg-white p-4 dark:border-white/10 dark:bg-[#10172a]">
            <div className="flex items-center justify-between"><div><p className="text-xs text-slate-500">Sentinel Desk</p><h2 className="text-lg font-semibold">Issues</h2></div><MoreHorizontal className="size-5 text-slate-400" /></div>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input className="border-[#dfe1e6] bg-white pl-9 dark:bg-black/20" placeholder="Search issues" value={search} onChange={event => setSearch(event.target.value)} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>{tickets?.total ?? 0} issues</span><span>Updated</span></div>
          </div>
          <div>
            {tickets?.items.map(item => (
              <button key={item.issue_key} onClick={() => setSelected(item.issue_key)} className={`w-full border-b border-[#ebecf0] px-4 py-3 text-left transition dark:border-white/5 ${selected === item.issue_key ? 'border-l-4 border-l-[#0052cc] bg-[#deebff] pl-3 dark:bg-blue-950/35' : 'hover:bg-[#f4f5f7] dark:hover:bg-white/5'}`}>
                <div className="flex items-center gap-2 text-xs"><CircleDot className="size-3.5 text-[#0052cc]" /><span className="font-semibold text-[#0052cc]">{item.issue_key}</span><span className="ml-auto text-slate-400">{item.status || 'Unknown'}</span></div>
                <p className="mt-1 line-clamp-2 text-sm font-medium">{item.summary || 'Referenced issue — snapshot unavailable'}</p>
                <p className="mt-2 truncate text-[11px] text-slate-500">Updated {time(item.last_recorded_at)}</p>
              </button>
            ))}
            {tickets?.has_more && <Button className="m-3 w-[calc(100%-1.5rem)]" variant="outline" onClick={() => void loadMore()}>Load more ({tickets.items.length} of {tickets.total})</Button>}
            {tickets && !tickets.items.length && <p className="m-4 rounded border border-dashed p-6 text-center text-sm text-slate-500">No matching issues were recorded.</p>}
          </div>
        </aside>

        <main className="min-w-0 overflow-y-auto bg-white dark:bg-[#0f1628]">
          {ticket ? (
            <div className="mx-auto max-w-6xl px-5 py-5 lg:px-8">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#0052cc]">
                <span>Projects</span><span>/</span><span>Sentinel Desk</span><span>/</span><strong>{ticket.issue_key}</strong>
                <span className="ml-auto rounded bg-[#f4f5f7] px-2 py-1 text-slate-500 dark:bg-white/5">Recorded evidence</span>
              </div>

              <div className="mt-5 flex flex-wrap items-start gap-4">
                <span className="mt-1 grid size-8 place-items-center rounded bg-[#0052cc] text-white"><CheckCircle2 className="size-4" /></span>
                <div className="min-w-0 flex-1"><p className="text-sm text-slate-500">{ticket.issue_key}</p><h1 className="mt-1 text-2xl font-semibold leading-tight">{ticket.summary || 'Unknown summary'}</h1></div>
                <button className="flex items-center gap-2 rounded bg-[#deebff] px-3 py-2 text-sm font-semibold text-[#0052cc] dark:bg-blue-950/40 dark:text-blue-300">{ticket.status || 'Unknown state'}<ChevronDown className="size-4" /></button>
                <button className="rounded p-2 hover:bg-[#f4f5f7] dark:hover:bg-white/5"><MoreHorizontal className="size-5" /></button>
              </div>

              <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="min-w-0 space-y-8">
                  <section><h2 className="text-sm font-semibold">Description</h2><div className="mt-3 min-h-28 rounded border border-transparent p-2 text-sm leading-6 text-slate-700 hover:border-[#dfe1e6] dark:text-slate-300">{ticket.description ? <p className="whitespace-pre-wrap">{ticket.description}</p> : <p className="italic text-slate-400">No description was present in the recorded snapshot.</p>}</div></section>
                  <section>
                    <div className="flex items-center gap-4 border-b border-[#dfe1e6] dark:border-white/10"><h2 className="border-b-2 border-[#0052cc] pb-3 text-sm font-semibold">Activity</h2><span className="pb-3 text-sm text-slate-500">All</span></div>
                    <div className="mt-5 space-y-5">
                      {history?.events.map(event => {
                        const body = payload(event);
                        return <details key={event.record_id} className="group"><summary className="flex cursor-pointer list-none gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#deebff] text-xs font-bold text-[#0052cc] dark:bg-blue-950">A</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-baseline gap-2"><strong className="text-sm">{value(body.actor_id || body.sender_id || 'Simulation actor')}</strong><span className="text-xs text-slate-500">{time(event.occurred_at)}</span></span><span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">{value(body.tool || body.action || body.status || body.type || event.source)}</span></span></summary><pre className="ml-11 mt-2 max-h-72 overflow-auto rounded bg-[#f4f5f7] p-3 text-xs dark:bg-black/30">{JSON.stringify(body, null, 2)}</pre></details>;
                      })}
                      {history && !history.events.length && <p className="text-sm text-slate-500">No activity was recorded for this issue.</p>}
                    </div>
                  </section>
                </div>

                <aside>
                  <div className="rounded border border-[#dfe1e6] p-4 dark:border-white/10">
                    <h2 className="text-sm font-semibold">Details</h2>
                    <dl className="mt-4 grid grid-cols-[100px_minmax(0,1fr)] gap-x-3 gap-y-4 text-sm">
                      <dt className="text-slate-500">Status</dt><dd><Badge variant="secondary">{ticket.status || 'Not recorded'}</Badge></dd>
                      <dt className="text-slate-500">Assignee</dt><dd>{recordedFields.assignee || 'Not recorded'}</dd>
                      <dt className="text-slate-500">Reporter</dt><dd>{recordedFields.reporter || 'Not recorded'}</dd>
                      <dt className="text-slate-500">Priority</dt><dd>{recordedFields.priority || 'Not recorded'}</dd>
                      <dt className="text-slate-500">Issue type</dt><dd>{recordedFields.issue_type || 'Not recorded'}</dd>
                      <dt className="text-slate-500">Labels</dt><dd className="break-words">{recordedFields.labels || 'None recorded'}</dd>
                    </dl>
                  </div>
                  <div className="mt-4 rounded border border-[#dfe1e6] p-4 text-xs dark:border-white/10">
                    <h2 className="font-semibold">Simulation provenance</h2>
                    <dl className="mt-3 space-y-3 text-slate-500">
                      <div><dt>Snapshot quality</dt><dd className="mt-0.5 text-slate-700 dark:text-slate-300">{ticket.has_snapshot ? 'Full recorded snapshot' : 'Partial observed reference'}</dd></div>
                      <div><dt>Evidence ID</dt><dd className="mt-0.5 break-all font-mono text-slate-700 dark:text-slate-300">{ticket.evidence_id || 'Not recorded'}</dd></div>
                      <div><dt>Last observed</dt><dd className="mt-0.5 text-slate-700 dark:text-slate-300">{time(ticket.last_recorded_at)}</dd></div>
                    </dl>
                  </div>
                </aside>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center text-center text-slate-500"><div><FolderKanban className="mx-auto size-10 opacity-30" /><p className="mt-3">Select an issue to inspect its recorded Jira state.</p></div></div>
          )}
        </main>
      </div>
    </div>
  );
}

function ChatPortal({ runId, eventCount }: { runId: string; eventCount: number }) {
  const [overview, setOverview] = useState<WorldOverview | null>(null);
  const [channels, setChannels] = useState<Array<{ channel_id: string; title: string; members: string[]; posts: number }>>([]);
  const [selected, setSelected] = useState('');
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [cursor, setCursor] = useState<{ next: number; more: boolean }>({ next: 0, more: false });
  const [error, setError] = useState('');
  const previous = useRef(eventCount);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => { if (previous.current !== eventCount) { previous.current = eventCount; setRefresh(value => value + 1); } }, [eventCount]);
  useEffect(() => { const controller = new AbortController(); simulationService.worldOverview(runId, undefined, controller.signal).then(setOverview).catch(problem => { if (!controller.signal.aborted) setError(message(problem)); }); return () => controller.abort(); }, [runId, refresh]);
  useEffect(() => { if (!overview) return; const controller = new AbortController(); simulationService.worldChannels(runId, { through: overview.through, limit: 200 }, controller.signal).then(page => { setChannels(page.items); setSelected(current => current && page.items.some(channel => channel.channel_id === current) ? current : page.items[0]?.channel_id ?? ''); }).catch(problem => { if (!controller.signal.aborted) setError(message(problem)); }); return () => controller.abort(); }, [runId, overview?.through]);
  const load = useCallback(async (after = 0, append = false) => { if (!overview || !selected) return; try { const page = await simulationService.worldActivity(runId, { through: overview.through, channel_id: selected, kind: 'messages', after, limit: 50 }); setEvents(current => append ? [...current, ...page.items.map(item => item.event).filter(event => !current.some(existing => existing.record_id === event.record_id))] : page.items.map(item => item.event)); setCursor({ next: page.next_after, more: page.has_more }); } catch (problem) { setError(message(problem)); } }, [runId, overview?.through, selected]);
  useEffect(() => { setEvents([]); void load(); }, [load]);
  const channel = channels.find(item => item.channel_id === selected);
  return <div className="grid min-h-0 flex-1 bg-[#f5f5f7] text-slate-900 dark:bg-[#090e19] dark:text-slate-100 lg:grid-cols-[300px_minmax(0,1fr)]"><aside className="border-r bg-[#201f1f] text-white"><div className="border-b border-white/10 p-4"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded bg-[#5b5fc7]"><MessageSquare className="size-5" /></span><div><h2 className="font-semibold">Simulated Messages</h2><p className="text-xs text-white/45">Recorded workplace channels</p></div></div></div><div className="p-3"><p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-white/35">Channels</p>{channels.map(item => <button key={item.channel_id} onClick={() => setSelected(item.channel_id)} className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm ${selected === item.channel_id ? 'bg-white/12 text-white' : 'text-white/60 hover:bg-white/5'}`}><span className="text-white/35">#</span><span className="min-w-0 flex-1 truncate">{item.title}</span><span className="text-xs text-white/35">{item.posts}</span></button>)}</div></aside><main className="flex min-h-0 flex-col"><header className="flex items-center justify-between gap-3 border-b bg-white px-5 py-4 dark:bg-[#10172a]"><div><h2 className="font-semibold"># {channel?.title || selected || 'Select a channel'}</h2><p className="text-xs text-slate-500">{channel ? `${channel.members.length} declared members · ${channel.posts} recorded posts` : 'No channel selected'}</p></div><Button size="sm" variant="outline" onClick={() => setRefresh(value => value + 1)}><RefreshCw className="mr-2 size-4" />Refresh</Button></header>{error && <p className="border-b border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}<div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="mx-auto max-w-4xl space-y-5">{events.map(event => { const body = payload(event); return <article key={event.record_id} className="flex gap-3"><span className="grid size-10 shrink-0 place-items-center rounded bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-semibold text-white">{value(body.sender_id).slice(0, 2).toUpperCase() || '?'}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline gap-2"><strong className="text-sm">{value(body.sender_id) || 'Unknown sender'}</strong><span className="text-xs text-slate-500">{time(event.occurred_at)}</span></div><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{value(body.text)}</p><details className="mt-1"><summary className="cursor-pointer text-xs text-slate-400">Delivery details</summary><pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-100 p-3 text-xs dark:bg-black/30">{JSON.stringify(body, null, 2)}</pre></details></div></article>; })}{!events.length && <div className="grid min-h-64 place-items-center text-center text-slate-500"><div><MessageSquare className="mx-auto size-9 opacity-30" /><p className="mt-3">No posts recorded in this channel yet.</p></div></div>}{cursor.more && <Button variant="outline" onClick={() => void load(cursor.next, true)}>Load earlier recorded posts</Button>}</div></div><footer className="border-t bg-white p-4 dark:bg-[#10172a]"><div className="rounded-lg border bg-slate-50 px-4 py-3 text-sm text-slate-400 dark:bg-black/20">Read-only simulation record — sending messages from this admin portal is disabled.</div></footer></main></div>;
}

function ParticipantPortal({ run }: { run: SimulationRun }) {
  const [kind, setKind] = useState<'messages' | 'tools'>('messages');
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [page, setPage] = useState<EventPage | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async (after = 0, append = false) => { try { const next = await simulationService.participant(run.run_id, kind, after); setPage(next); setEvents(current => append ? [...current, ...next.events.filter(item => !current.some(existing => existing.record_id === item.record_id))] : next.events); } catch (problem) { setError(message(problem)); } }, [run.run_id, kind]);
  useEffect(() => { setEvents([]); setPage(null); void load(); }, [load]);
  if (run.participant_mode === 'environment_only') return <div className="grid min-h-80 place-items-center text-center text-slate-500"><div><Bot className="mx-auto size-10 opacity-30" /><p className="mt-3">This run has no participant.</p></div></div>;
  return <div className="mx-auto max-w-5xl space-y-5 p-5"><div className="rounded-xl border bg-card p-5"><p className="text-xs uppercase tracking-wider text-muted-foreground">Participant-visible evidence</p><h2 className="mt-1 text-xl font-semibold">{run.participant_mode === 'sapien' ? `Sapiens ${run.sapien_id}` : `Manual participant ${run.participant_id}`}</h2><p className="mt-1 text-sm text-muted-foreground">Simulated identity: {run.participant_id}. Delivery is recorded evidence, not proof that a message was understood.</p></div><div className="flex gap-2 border-b">{(['messages','tools'] as const).map(item => <button key={item} onClick={() => setKind(item)} className={`border-b-2 px-4 py-3 text-sm capitalize ${kind === item ? 'border-violet-500' : 'border-transparent text-muted-foreground'}`}>{item === 'tools' ? 'Tool requests' : 'Messages'}</button>)}</div>{error && <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="space-y-3">{events.map(event => { const body = payload(event); return <details key={event.record_id} className="rounded-xl border bg-card p-4"><summary className="cursor-pointer list-none"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{value(body.type || event.source)}</Badge><strong className="text-sm">{kind === 'messages' ? `${value(body.sender_id)} → ${value(body.recipient_id || body.channel_id)}` : `${value(body.server)} · ${value(body.tool)}`}</strong><span className="ml-auto text-xs text-muted-foreground">Recorded {time(event.occurred_at)}</span></div>{kind === 'messages' && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{value(body.text)}</p>}</summary><pre className="mt-3 max-h-96 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(body, null, 2)}</pre></details>; })}{!events.length && !error && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No participant-visible {kind} recorded yet.</p>}</div>{page?.has_more && <Button variant="outline" onClick={() => void load(page.next_after, true)}>Load more</Button>}</div>;
}

function ResultsPortal({ run }: { run: SimulationRun }) {
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [note, setNote] = useState('Loading result…');
  useEffect(() => { const controller = new AbortController(); simulationService.result(run.run_id, controller.signal).then(response => { if ('report' in response) { setResult(response); setNote(''); } else setNote('The final report is not available yet.'); }).catch(problem => setNote(message(problem))); return () => controller.abort(); }, [run.run_id, run.status]);
  return <div className="mx-auto max-w-5xl space-y-5 p-5">{note && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{note}</p>}{result && <><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl border bg-card p-4"><span className="text-xs text-muted-foreground">Status</span><strong className="mt-1 block text-xl">{statusName(result.status)}</strong></div><div className="rounded-xl border bg-card p-4"><span className="text-xs text-muted-foreground">Pass rate</span><strong className="mt-1 block text-xl">{result.pass_rate == null ? 'Not gradeable' : `${Math.round(result.pass_rate * 100)}%`}</strong></div><div className="rounded-xl border bg-card p-4"><span className="text-xs text-muted-foreground">Checks</span><strong className="mt-1 block text-xl">{result.report.metrics.length}</strong></div></div><p className="rounded-xl border bg-card p-5 text-sm">{result.detail}</p><div className="space-y-3">{result.report.metrics.map(metric => <article key={metric.expectation_id} className="rounded-xl border bg-card p-5"><div className="flex items-center gap-2"><CheckCircle2 className={`size-5 ${metric.verdict === 'pass' ? 'text-emerald-500' : metric.verdict === 'fail' ? 'text-red-500' : 'text-amber-500'}`} /><strong>{metric.expectation_id}</strong><Badge variant="outline">{metric.verdict.replaceAll('_', ' ')}</Badge></div><p className="mt-3 text-sm text-muted-foreground">{metric.explanation}</p><p className="mt-2 text-xs text-muted-foreground">Evidence: {metric.evidence_ids.join(', ') || 'None cited'}</p></article>)}</div></>}</div>;
}

export function SimulationWorldPage() {
  const { runId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [error, setError] = useState('');
  const section = location.pathname.split('/').filter(Boolean).at(-1) || 'overview';
  const valid = ['world','overview','people','messages','jira','connections','sapien','results'];
  useEffect(() => { if (!valid.includes(section)) navigate(`/admin/simulations/${encodeURIComponent(runId)}/world/overview`, { replace: true }); }, [section, runId, navigate]);
  useEffect(() => { const controller = new AbortController(); let timer = 0; let inFlight = false; const poll = async () => { if (document.hidden || inFlight) return; inFlight = true; try { const next = await simulationService.get(runId, controller.signal); setRun(next); setError(''); if (!(next.archived && terminal.has(next.status))) timer = window.setTimeout(poll, next.status === 'scheduled' || next.status === 'paused' ? 30_000 : 15_000); } catch (problem) { if (!controller.signal.aborted) { setError(message(problem)); timer = window.setTimeout(poll, 60_000); } } finally { inFlight = false; } }; const resume = () => { if (!document.hidden) void poll(); }; document.addEventListener('visibilitychange', resume); void poll(); return () => { controller.abort(); window.clearTimeout(timer); document.removeEventListener('visibilitychange', resume); }; }, [runId]);
  useEffect(() => { const next = new URLSearchParams(params); const desired = section === 'people' ? 'employees' : section === 'messages' ? 'channels' : section === 'jira' || section === 'connections' ? 'tools' : null; if (desired) next.set('section', desired); if (section === 'jira') next.set('connection', 'jira'); setParams(next, { replace: true }); }, [section]);
  const base = `/admin/simulations/${encodeURIComponent(runId)}/world`;
  const links = useMemo(() => [{ to: `${base}/overview`, label: 'Overview', icon: LayoutDashboard }, { to: `${base}/people`, label: 'People', icon: Users }, { to: `${base}/messages`, label: 'Messages', icon: MessageSquare }, { to: `${base}/jira`, label: 'Jira', icon: FolderKanban }, { to: `${base}/connections`, label: 'Connections', icon: PlugZap }, { to: `${base}/sapien`, label: run?.participant_mode === 'manual' ? 'Participant' : 'Sapiens', icon: Bot }, { to: `${base}/results`, label: 'Results', icon: CheckCircle2 }], [base, run?.participant_mode]);
  if (!run) return <div className="grid min-h-screen place-items-center bg-[#07101f] text-white"><div className="text-center"><Beaker className="mx-auto size-9 animate-pulse text-violet-300" /><p className="mt-3 text-sm text-white/60">{error || 'Opening simulation world…'}</p><Button className="mt-4" variant="outline" onClick={() => navigate('/admin/simulations')}>Back to Simulation Lab</Button></div></div>;
  return <div className="flex h-[100dvh] overflow-hidden bg-background text-foreground"><aside className="hidden w-64 shrink-0 flex-col border-r bg-[#07101f] text-white lg:flex"><div className="border-b border-white/10 p-4"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-violet-500/20"><Beaker className="size-5 text-violet-200" /></span><div className="min-w-0"><p className="font-semibold">Simulation World</p><p className="truncate text-xs text-white/40">{run.case_id}</p></div></div></div><nav className="flex-1 space-y-1 p-3">{links.map(item => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}><Icon className="size-4" />{item.label}</NavLink>; })}</nav><div className="border-t border-white/10 p-3"><button onClick={() => navigate(`/admin/simulations?runId=${encodeURIComponent(run.run_id)}`)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/55 hover:bg-white/5"><ArrowLeft className="size-4" />Simulation Lab</button></div></aside><div className="flex min-w-0 flex-1 flex-col"><header className="border-b bg-card"><div className="flex flex-wrap items-center gap-3 px-4 py-3"><button onClick={() => navigate(`/admin/simulations?runId=${encodeURIComponent(run.run_id)}`)} className="p-2 lg:hidden"><ArrowLeft className="size-5" /></button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate font-semibold">{run.case_id}</h1><Badge variant="secondary">{statusName(run.status)}</Badge>{run.archived && <Badge variant="outline">Archived</Badge>}</div><p className="truncate text-xs text-muted-foreground">{run.run_id} · {run.sapien_id ? `Sapiens ${run.sapien_id}` : 'No bound Sapiens'}</p></div><div className="hidden items-center gap-5 text-xs md:flex"><p><span className="text-muted-foreground">Simulated time</span><br />{time(run.simulated_time)}</p><p><span className="text-muted-foreground">Speed</span><br />{run.speed}×</p><p><span className="text-muted-foreground">Evidence</span><br />{run.event_count} records</p></div><ThemeToggle /></div><nav className="flex overflow-x-auto border-t px-2 lg:hidden">{links.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => `whitespace-nowrap border-b-2 px-3 py-2 text-xs ${isActive ? 'border-violet-500' : 'border-transparent text-muted-foreground'}`}>{item.label}</NavLink>)}</nav></header>{error && <p className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-600">{error}</p>}<main className="min-h-0 flex-1 overflow-y-auto">{section === 'jira' ? <JiraPortal runId={run.run_id} eventCount={run.event_count} /> : section === 'messages' ? <ChatPortal runId={run.run_id} eventCount={run.event_count} /> : section === 'sapien' ? <ParticipantPortal run={run} /> : section === 'results' ? <ResultsPortal run={run} /> : <div className="p-4 lg:p-6"><SimulationWorldExplorer key={`${run.run_id}:${section}`} runId={run.run_id} eventCount={run.event_count} archived={!!run.archived} /></div>}</main></div></div>;
}
