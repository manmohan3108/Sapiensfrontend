import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { Activity, ArrowLeft, Beaker, BookOpen, Bot, CheckCircle2, ChevronDown, CircleDot, Clock3, FolderKanban, Hash, LayoutDashboard, ListFilter, MessageSquare, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Phone, PlugZap, RefreshCw, Search, ShieldCheck, Star, Target, UserRound, Users, Video } from 'lucide-react';
import { SimulationWorldExplorer } from '../components/simulation/SimulationWorldExplorer';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ThemeToggle } from '../components/ThemeToggle';
import { simulationService } from '../core/services/simulationService';
import { sentinelDeskCaseV1 } from '../data/sentinelDeskCase';
import type { CaseInfo, EventPage, InspectionActivity, InspectionActivityPage, InspectionCollection, InspectionOverview, InspectionPerson, InspectionProgressItem, InspectionResults, InspectionSpecificationResponse, SimulationEvent, SimulationRun, WorldActivityItem, WorldChannel, WorldCollection, WorldEmployee, WorldOverview, WorldTicket } from '../types/simulationTypes';

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
  const detailPaneRef = useRef<HTMLElement | null>(null);

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
  useEffect(() => { detailPaneRef.current?.scrollTo({ top: 0 }); }, [selected]);
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
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#f4f5f7] text-[#172b4d] dark:bg-[#0b1020] dark:text-slate-100">
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

        <main ref={detailPaneRef} className="min-w-0 overflow-y-auto bg-white dark:bg-[#0f1628]">
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
  const [employees, setEmployees] = useState<WorldEmployee[]>([]);
  const [channels, setChannels] = useState<WorldChannel[]>([]);
  const [selected, setSelected] = useState('');
  const [items, setItems] = useState<WorldActivityItem[]>([]);
  const [cursor, setCursor] = useState<{ next: number; more: boolean }>({ next: 0, more: false });
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const previous = useRef(eventCount);
  const [refresh, setRefresh] = useState(0);
  const conversationPaneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (previous.current !== eventCount) {
      previous.current = eventCount;
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
    Promise.all([
      simulationService.worldEmployees(runId, { through: overview.through, limit: 100 }, controller.signal),
      simulationService.worldChannels(runId, { through: overview.through, limit: 100 }, controller.signal),
    ]).then(([peoplePage, channelPage]) => {
      const people = peoplePage.items.filter(person => person.person_id !== overview.participant_id);
      setEmployees(people);
      setChannels(channelPage.items);
      setSelected(current => {
        const exists = current.startsWith('person:')
          ? people.some(person => `person:${person.person_id}` === current)
          : channelPage.items.some(channel => `channel:${channel.channel_id}` === current);
        return exists ? current : people[0] ? `person:${people[0].person_id}` : channelPage.items[0] ? `channel:${channelPage.items[0].channel_id}` : '';
      });
    }).catch(problem => { if (!controller.signal.aborted) setError(message(problem)); });
    return () => controller.abort();
  }, [runId, overview?.through]);

  const selectedType = selected.startsWith('channel:') ? 'channel' : 'person';
  const selectedId = selected.slice(selected.indexOf(':') + 1);
  const employee = employees.find(person => person.person_id === selectedId);
  const channel = channels.find(item => item.channel_id === selectedId);

  const load = useCallback(async (after = 0, append = false) => {
    if (!overview || !selectedId) return;
    try {
      const page = await simulationService.worldActivity(runId, {
        through: overview.through,
        kind: 'messages',
        after,
        limit: 100,
        ...(selectedType === 'channel' ? { channel_id: selectedId } : { person_id: selectedId }),
      });
      const visible = selectedType === 'person'
        ? page.items.filter(item => !value(payload(item.event).channel_id))
        : page.items;
      setItems(current => append
        ? [...current, ...visible.filter(item => !current.some(existing => existing.event.record_id === item.event.record_id))]
        : visible);
      setCursor({ next: page.next_after, more: page.has_more });
    } catch (problem) {
      setError(message(problem));
    }
  }, [runId, overview?.through, selected, selectedId, selectedType]);

  useEffect(() => {
    setItems([]);
    setCursor({ next: 0, more: false });
    void load();
  }, [load]);

  const normalizedSearch = search.trim().toLowerCase();
  const visibleEmployees = employees.filter(person => !normalizedSearch || person.name.toLowerCase().includes(normalizedSearch) || person.person_id.toLowerCase().includes(normalizedSearch));
  const visibleChannels = channels.filter(item => !normalizedSearch || item.title.toLowerCase().includes(normalizedSearch) || item.channel_id.toLowerCase().includes(normalizedSearch));
  const conversationTitle = selectedType === 'channel' ? channel?.title || selectedId : employee?.name || selectedId;
  const conversationDetail = selectedType === 'channel'
    ? `${channel?.members.length ?? 0} members · ${channel?.posts ?? 0} recorded posts`
    : `${employee?.sent ?? 0} sent · ${employee?.received ?? 0} received`;

  useEffect(() => { conversationPaneRef.current?.scrollTo({ top: 0 }); }, [selected]);

  return (
    <div className="grid h-full min-h-0 w-full flex-1 overflow-hidden bg-[#f5f5f7] text-slate-900 dark:bg-[#090e19] dark:text-slate-100 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col bg-[#201f1f] text-white">
        <div className="border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-[#5b5fc7]"><MessageSquare className="size-5" /></span>
            <div><h2 className="font-semibold">Messages</h2><p className="text-xs text-white/45">Simulation communication</p></div>
            <Button className="ml-auto border-white/15 bg-transparent px-2 text-white hover:bg-white/10" variant="outline" size="sm" onClick={() => setRefresh(current => current + 1)} aria-label="Refresh messages"><RefreshCw className="size-4" /></Button>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-2.5 size-4 text-white/35" />
            <Input className="border-white/10 bg-white/10 pl-9 text-white placeholder:text-white/35" placeholder="Search chats and channels" value={search} onChange={event => setSearch(event.target.value)} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <section>
            <div className="flex items-center justify-between px-2 py-2"><p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Chats</p><span className="text-[10px] text-white/30">{visibleEmployees.length}</span></div>
            <div className="space-y-1">
              {visibleEmployees.map(person => (
                <button key={person.person_id} onClick={() => setSelected(`person:${person.person_id}`)} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition ${selected === `person:${person.person_id}` ? 'bg-white/15 text-white' : 'text-white/65 hover:bg-white/7 hover:text-white'}`}>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-xs font-semibold text-white">{person.name.slice(0, 2).toUpperCase()}</span>
                  <span className="min-w-0 flex-1"><strong className="block truncate text-sm font-medium">{person.name}</strong><span className="block truncate text-xs text-white/35">{person.person_id} · {person.sent + person.received} messages</span></span>
                </button>
              ))}
              {!visibleEmployees.length && <p className="px-3 py-2 text-xs text-white/35">No matching personal chats.</p>}
            </div>
          </section>

          <section className="mt-5">
            <div className="flex items-center justify-between px-2 py-2"><p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Channels</p><span className="text-[10px] text-white/30">{visibleChannels.length}</span></div>
            <div className="space-y-1">
              {visibleChannels.map(item => (
                <button key={item.channel_id} onClick={() => setSelected(`channel:${item.channel_id}`)} className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition ${selected === `channel:${item.channel_id}` ? 'bg-white/15 text-white' : 'text-white/65 hover:bg-white/7 hover:text-white'}`}>
                  <Hash className="size-4 shrink-0 text-white/40" />
                  <span className="min-w-0 flex-1"><strong className="block truncate text-sm font-medium">{item.title}</strong><span className="block truncate text-xs text-white/35">{item.posts} posts</span></span>
                </button>
              ))}
              {!visibleChannels.length && <p className="px-3 py-2 text-xs text-white/35">No matching channels.</p>}
            </div>
          </section>
        </div>

        <div className="border-t border-white/10 px-4 py-3 text-xs text-white/35">Read-only · evidence through #{overview?.through ?? '—'}</div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-col">
        <header className="flex min-h-16 items-center gap-3 border-b bg-white px-5 py-3 dark:bg-[#10172a]">
          <span className={`grid size-10 shrink-0 place-items-center ${selectedType === 'channel' ? 'rounded-lg bg-slate-100 text-slate-500 dark:bg-white/10' : 'rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-semibold text-white'}`}>
            {selectedType === 'channel' ? <Hash className="size-5" /> : (employee?.name || '?').slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{conversationTitle || 'Select a conversation'}</h2><p className="truncate text-xs text-slate-500">{conversationDetail}</p></div>
          <div className="hidden items-center gap-1 text-slate-500 sm:flex"><button className="rounded p-2 hover:bg-slate-100 dark:hover:bg-white/5" aria-label="Audio call unavailable in read-only view"><Phone className="size-4" /></button><button className="rounded p-2 hover:bg-slate-100 dark:hover:bg-white/5" aria-label="Video call unavailable in read-only view"><Video className="size-4" /></button><button className="rounded p-2 hover:bg-slate-100 dark:hover:bg-white/5" aria-label="Conversation options"><MoreHorizontal className="size-5" /></button></div>
        </header>

        {error && <p className="border-b border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}

        <div ref={conversationPaneRef} className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6 dark:bg-[#0f1628] sm:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <span className={`mx-auto grid size-16 place-items-center ${selectedType === 'channel' ? 'rounded-xl bg-slate-100 text-slate-500 dark:bg-white/10' : 'rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-xl font-semibold text-white'}`}>
                {selectedType === 'channel' ? <Hash className="size-7" /> : (employee?.name || '?').slice(0, 2).toUpperCase()}
              </span>
              <h1 className="mt-3 text-xl font-semibold">{conversationTitle}</h1>
              <p className="mt-1 text-sm text-slate-500">{selectedType === 'channel' ? `This is the beginning of the #${conversationTitle} channel record.` : `Recorded direct conversation involving ${conversationTitle}.`}</p>
            </div>

            <div className="space-y-1">
              {items.map(item => {
                const event = item.event;
                const body = payload(event);
                const senderId = value(body.sender_id || item.actor_id) || 'Unknown sender';
                const isParticipant = !!overview?.participant_id && senderId === overview.participant_id;
                const sender = employees.find(person => person.person_id === senderId);
                const senderName = sender?.name || (isParticipant ? 'Simulation participant' : senderId);
                return (
                  <article key={event.record_id} className={`group flex gap-3 rounded-lg px-2 py-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] ${isParticipant && selectedType === 'person' ? 'flex-row-reverse' : ''}`}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-xs font-semibold text-white">{senderName.slice(0, 2).toUpperCase()}</span>
                    <div className={`min-w-0 max-w-[80%] ${isParticipant && selectedType === 'person' ? 'text-right' : ''}`}>
                      <div className={`flex flex-wrap items-baseline gap-2 ${isParticipant && selectedType === 'person' ? 'justify-end' : ''}`}><strong className="text-sm">{senderName}</strong><span className="text-[11px] text-slate-400">{time(event.occurred_at)}</span></div>
                      <div className={`mt-1 rounded-2xl px-3 py-2 text-left text-sm leading-6 ${isParticipant && selectedType === 'person' ? 'rounded-tr-sm bg-[#5b5fc7] text-white' : 'rounded-tl-sm bg-slate-100 dark:bg-white/10'}`}><p className="whitespace-pre-wrap">{value(body.text) || 'Message body was not recorded.'}</p></div>
                      <details className={`mt-1 ${isParticipant && selectedType === 'person' ? 'text-right' : ''}`}><summary className="cursor-pointer text-[11px] text-slate-400">Evidence details</summary><pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-100 p-3 text-left text-xs dark:bg-black/30">{JSON.stringify(body, null, 2)}</pre></details>
                    </div>
                  </article>
                );
              })}
              {!items.length && selected && <div className="grid min-h-40 place-items-center text-center text-slate-500"><div><MessageSquare className="mx-auto size-8 opacity-30" /><p className="mt-3">No recorded messages in this conversation.</p></div></div>}
              {!selected && <div className="grid min-h-64 place-items-center text-center text-slate-500"><p>Select a chat or channel.</p></div>}
            </div>
            {cursor.more && <Button className="mt-5" variant="outline" onClick={() => void load(cursor.next, true)}>Load earlier messages</Button>}
          </div>
        </div>

        <footer className="border-t bg-white p-4 dark:bg-[#10172a]">
          <div className="mx-auto max-w-4xl rounded-lg border bg-slate-50 px-4 py-3 text-sm text-slate-400 dark:bg-black/20">Read-only simulation record — replies and calls are disabled in this inspection view.</div>
        </footer>
      </main>
    </div>
  );
}

type TestCaseTab = 'brief' | 'roadmap' | 'team' | 'backlog' | 'challenges' | 'evaluation';

const activityTitle = (item: InspectionActivity) => {
  const body = item.payload;
  if (item.category === 'message') return `${value(body.sender_id) || 'Unknown sender'} → ${value(body.recipient_id || body.channel_id) || 'Unknown recipient'}`;
  if (item.category === 'tool') return `${value(body.server || item.connection)} · ${value(body.tool) || item.event_type}`;
  if (item.issue_key) return `${item.issue_key} · ${item.event_type}`;
  return statusName(item.event_type || item.category);
};

function InspectionActivityCard({ item }: { item: InspectionActivity }) {
  return <details className="rounded-xl border bg-card p-4"><summary className="cursor-pointer list-none"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{item.category}</Badge><strong className="text-sm">{activityTitle(item)}</strong>{item.simulation_week && <span className="text-xs text-muted-foreground">Week {item.simulation_week}</span>}<span className="ml-auto text-xs text-muted-foreground">{time(item.occurred_at)}</span></div>{item.category === 'message' && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{value(item.payload.text)}</p>}<div className="mt-2 flex flex-wrap gap-1">{item.expectation_ids.map(id => <Badge key={id} variant="secondary">{id}</Badge>)}{item.rule_id && <Badge variant="secondary">{item.rule_id}</Badge>}{item.issue_key && <Badge variant="secondary">{item.issue_key}</Badge>}</div></summary><div className="mt-3 space-y-2 border-t pt-3 text-xs text-muted-foreground"><p>Evidence {item.record_id} · sequence {item.sequence}</p>{item.operation_id && <p>Operation {item.operation_id}</p>}{item.related_record_ids.length > 0 && <p>Related records: {item.related_record_ids.join(', ')}</p>}{item.arguments && <pre className="max-h-52 overflow-auto rounded bg-muted p-3 text-foreground">Arguments{JSON.stringify(item.arguments, null, 2)}</pre>}{item.result && <pre className="max-h-52 overflow-auto rounded bg-muted p-3 text-foreground">Result{JSON.stringify(item.result, null, 2)}</pre>}<pre className="max-h-72 overflow-auto rounded bg-muted p-3 text-foreground">{JSON.stringify(item.payload, null, 2)}</pre></div></details>;
}

function InspectionOverviewPortal({ run }: { run: SimulationRun }) {
  const [data, setData] = useState<InspectionOverview | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { const controller = new AbortController(); simulationService.inspectionOverview(run.run_id, undefined, controller.signal).then(setData).catch(problem => { if (!controller.signal.aborted) setError(message(problem)); }); return () => controller.abort(); }, [run.run_id, run.event_count]);
  if (!data) return <div className="grid min-h-80 place-items-center p-6 text-center text-muted-foreground"><p>{error || 'Loading inspection overview…'}</p></div>;
  const completed = data.objectives.filter(item => item.verdict === 'pass').length;
  return <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8"><section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#111827] via-[#172554] to-[#312e81] p-6 text-white shadow-xl"><div className="flex flex-wrap items-start gap-4"><div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-[.18em] text-violet-200/70">Simulation command center</p><h1 className="mt-2 text-2xl font-semibold">{statusName(run.case_id)}</h1><p className="mt-2 text-sm text-white/60">{data.current_phase ? `Current phase: ${data.current_phase.title}` : 'Current authored phase is unavailable for this evidence prefix.'}</p></div><Badge className="bg-white/10 text-white">{statusName(data.run_status)}</Badge></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-xl bg-white/8 p-4"><span className="text-xs text-white/50">Messages</span><strong className="mt-1 block text-2xl">{data.message_summary.unique_messages}</strong><span className="text-xs text-white/40">{data.message_summary.deliveries} deliveries</span></div><div className="rounded-xl bg-white/8 p-4"><span className="text-xs text-white/50">Tool calls</span><strong className="mt-1 block text-2xl">{data.tool_summary.calls ?? 0}</strong><span className="text-xs text-white/40">{data.tool_summary.errors ?? 0} errors</span></div><div className="rounded-xl bg-white/8 p-4"><span className="text-xs text-white/50">Recorded blockers</span><strong className="mt-1 block text-2xl">{data.recorded_blockers.length}</strong><span className="text-xs text-white/40">Evidence-derived only</span></div><div className="rounded-xl bg-white/8 p-4"><span className="text-xs text-white/50">Evaluation</span><strong className="mt-1 block text-2xl">{completed}/{data.objectives.length}</strong><span className="text-xs text-white/40">passing objectives</span></div></div></section><div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]"><section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Recent recorded activity</h2><p className="mt-1 text-xs text-muted-foreground">Pinned through evidence #{data.through}</p><div className="mt-4 space-y-3">{data.recent_activity.slice().reverse().slice(0, 8).map(item => <InspectionActivityCard key={item.record_id} item={item} />)}{!data.recent_activity.length && <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">No recorded activity yet.</p>}</div></section><aside className="space-y-6"><section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Evaluation progress</h2><div className="mt-4 space-y-3">{data.objectives.map(item => <div key={item.expectation_id} className="rounded-xl border p-3"><div className="flex items-center gap-2"><strong className="min-w-0 flex-1 text-sm">{item.title}</strong><Badge variant={item.verdict === 'pass' ? 'default' : 'outline'}>{item.verdict.replaceAll('_',' ')}</Badge></div><p className="mt-2 text-xs text-muted-foreground">{item.evidence_ids.length} linked evidence records</p></div>)}</div></section><section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Recorded blockers</h2><div className="mt-4 space-y-2">{data.recorded_blockers.map((item,index) => <div key={value(item.rule?.rule_id) || index} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm"><strong>{value(item.rule?.rule_id) || 'Rule'}</strong><p className="mt-1 text-xs text-muted-foreground">{value(item.rule?.expected)}</p><Badge className="mt-2" variant="outline">{item.status.replaceAll('_',' ')}</Badge></div>)}{!data.recorded_blockers.length && <p className="text-sm text-muted-foreground">No blocker diagnostics are recorded.</p>}</div></section></aside></div><p className="text-xs text-muted-foreground">State combines authored definitions and evidence through #{data.through}. Missing state remains unavailable; inspection does not execute tools or rules.</p></div>;
}

function TimelinePortal({ runId }: { runId: string }) {
  const [page, setPage] = useState<InspectionActivityPage | null>(null);
  const [items, setItems] = useState<InspectionActivity[]>([]);
  const [category, setCategory] = useState('');
  const [week, setWeek] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async (after = 0, append = false) => { try { const next = await simulationService.inspectionTimeline(runId, { after, limit: 100, ...(category ? { category: category as InspectionActivity['category'] } : {}), ...(week ? { week: Number(week) } : {}) }); setPage(next); setItems(current => append ? [...current, ...next.items.filter(item => !current.some(existing => existing.record_id === item.record_id))] : next.items); } catch (problem) { setError(message(problem)); } }, [runId, category, week]);
  useEffect(() => { setItems([]); void load(); }, [load]);
  return <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold">Unified activity timeline</h1><p className="mt-1 text-sm text-muted-foreground">Messages, tools, Jira changes, reactions, scenario events and lifecycle evidence in recorded order.</p></div><div className="flex gap-2"><select className="h-9 rounded-md border bg-background px-3 text-sm" value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{['message','tool','reaction','scenario','rejection','issue','availability','knowledge','lifecycle'].map(item => <option key={item}>{item}</option>)}</select><Input className="w-28" type="number" min="1" placeholder="Week" value={week} onChange={event => setWeek(event.target.value)} /></div></div>{error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</p>}<div className="space-y-3">{items.map(item => <InspectionActivityCard key={item.record_id} item={item} />)}{page && !items.length && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No activity matches these filters.</p>}</div>{page?.has_more && <Button variant="outline" onClick={() => void load(page.next_after, true)}>Load more activity</Button>}</div>;
}

function PeoplePortal({ runId }: { runId: string }) {
  const [data, setData] = useState<InspectionCollection<InspectionPerson> | null>(null);
  const [selected, setSelected] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { const controller = new AbortController(); simulationService.inspectionPeople(runId, { limit: 200 }, controller.signal).then(next => { setData(next); setSelected(current => current || next.items[0]?.person_id || ''); }).catch(problem => { if (!controller.signal.aborted) setError(message(problem)); }); return () => controller.abort(); }, [runId]);
  const people = (data?.items || []).filter(person => !search.trim() || `${person.name} ${person.person_id} ${person.role}`.toLowerCase().includes(search.trim().toLowerCase()));
  const person = data?.items.find(item => item.person_id === selected);
  return <div className="grid min-h-full lg:grid-cols-[340px_minmax(0,1fr)]"><aside className="border-r bg-card p-4"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search people" value={search} onChange={event => setSearch(event.target.value)} /></div><div className="mt-4 space-y-2">{people.map(item => <button key={item.person_id} onClick={() => setSelected(item.person_id)} className={`w-full rounded-xl border p-3 text-left ${selected === item.person_id ? 'border-violet-500 bg-violet-500/5' : ''}`}><strong className="block text-sm">{item.name}</strong><span className="text-xs text-muted-foreground">{item.role || item.person_id}</span></button>)}</div></aside><main className="p-5 lg:p-8">{error && <p className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</p>}{person && <div className="mx-auto max-w-4xl space-y-6"><section className="rounded-2xl border bg-card p-6"><div className="flex items-center gap-4"><span className="grid size-14 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-semibold text-white">{person.name.slice(0,2).toUpperCase()}</span><div><h1 className="text-2xl font-semibold">{person.name}</h1><p className="text-sm text-muted-foreground">{person.role || 'Role not separately authored'} · {person.person_id}</p></div></div><p className="mt-5 text-sm leading-7 text-muted-foreground">{person.authored_context || 'No separate authored context.'}</p>{person.project_context && <p className="mt-3 rounded-xl bg-muted/50 p-4 text-sm leading-6">{person.project_context}</p>}</section><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border bg-card p-4"><span className="text-xs text-muted-foreground">Sent</span><strong className="mt-1 block text-2xl">{person.sent}</strong></div><div className="rounded-xl border bg-card p-4"><span className="text-xs text-muted-foreground">Received</span><strong className="mt-1 block text-2xl">{person.received}</strong></div><div className="rounded-xl border bg-card p-4"><span className="text-xs text-muted-foreground">Tool calls</span><strong className="mt-1 block text-2xl">{person.tool_calls}</strong></div></div><section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Owned Jira work</h2><div className="mt-3 flex flex-wrap gap-2">{person.owned_issues.map(issue => <Badge key={issue} variant="outline">{issue}</Badge>)}{!person.owned_issues.length && <p className="text-sm text-muted-foreground">No authored issue ownership.</p>}</div></section><section className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">Availability and authority</h2><p className="mt-3 text-sm text-muted-foreground">Availability: {person.available_at ? time(person.available_at) : 'No recorded availability change'}</p><p className="mt-2 text-sm text-muted-foreground">Structured organization, authority and relationships are {person.organization || person.authority_boundaries || person.relationships ? 'partially available' : 'not authored separately; no values are inferred from prose'}.</p></section></div>}</main></div>;
}

function ProgressPortal({ runId }: { runId: string }) {
  const [data, setData] = useState<InspectionCollection<InspectionProgressItem> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { const controller = new AbortController(); simulationService.inspectionProgress(runId, { limit: 200 }, controller.signal).then(setData).catch(problem => { if (!controller.signal.aborted) setError(message(problem)); }); return () => controller.abort(); }, [runId]);
  return <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-8"><div><h1 className="text-2xl font-semibold">Scenario progress</h1><p className="mt-1 text-sm text-muted-foreground">Evidence-derived status for authored rules and scheduled events. Unavailable means the backend has no recorded proof—not that the item was skipped.</p></div>{error && <p className="rounded border border-red-500/30 bg-red-500/10 p-3 text-sm">{error}</p>}<div className="grid gap-4 lg:grid-cols-2">{data?.items.map((item,index) => { const source = item.rule || item.event || {}; const id = value(source.rule_id || source.event_id) || `item-${index}`; return <article key={id} className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2"><strong className="min-w-0 flex-1">{id}</strong><Badge variant={item.status === 'fired' || item.status === 'released' ? 'default' : 'outline'}>{item.status.replaceAll('_',' ')}</Badge></div><p className="mt-3 text-sm leading-6 text-muted-foreground">{value(source.expected || source.type || source.action) || 'Authored scenario item'}</p><p className="mt-3 text-xs text-muted-foreground">At {time(value(source.at))}{source.deadline ? ` · deadline ${time(value(source.deadline))}` : ''}</p>{item.last_decision && <details className="mt-3"><summary className="cursor-pointer text-xs text-violet-600">Recorded decision evidence</summary><pre className="mt-2 max-h-64 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(item.last_decision.payload, null, 2)}</pre></details>}</article>; })}</div></div>;
}

function TestCasePortal({ run }: { run: SimulationRun }) {
  const [caseInfo, setCaseInfo] = useState<CaseInfo | null>(null);
  const [inspection, setInspection] = useState<InspectionSpecificationResponse | null>(null);
  const [tab, setTab] = useState<TestCaseTab>('brief');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      simulationService.cases(controller.signal),
      simulationService.inspectionSpecification(run.run_id, undefined, controller.signal),
    ]).then(([catalogResult, inspectionResult]) => {
      if (controller.signal.aborted) return;
      if (catalogResult.status === 'fulfilled') setCaseInfo(catalogResult.value.cases.find(item => item.case_id === run.case_id && item.version === run.case_version) ?? null);
      if (inspectionResult.status === 'fulfilled') setInspection(inspectionResult.value);
      else setError('The structured inspection specification is unavailable; showing the versioned legacy presentation where possible.');
    });
    return () => controller.abort();
  }, [run.run_id, run.case_id, run.case_version]);

  const spec = useMemo(() => {
    const authored = inspection?.specification;
    if (!authored) return run.case_id === sentinelDeskCaseV1.caseId && run.case_version === sentinelDeskCaseV1.version ? sentinelDeskCaseV1 : null;
    const overview = authored.overview;
    const facts = (person: typeof authored.scenario.initial_world.people[number]) => Object.fromEntries((person.facts || []).map(fact => [fact.key, fact.text]));
    const people = authored.scenario.initial_world.people.map(person => {
      const personFacts = facts(person);
      return { id: person.person_id, name: person.name, role: personFacts.role || 'Authored participant', context: personFacts.context || personFacts.project || 'No separate authored context.', group: 'engineering' as const };
    });
    const expectationTitle = (item: Record<string, unknown>, index: number) => value(item.expected || item.expectation_id) || `Expectation ${index + 1}`;
    return {
      caseId: authored.scenario.scenario_id,
      version: authored.scenario.version,
      product: { name: caseInfo?.title || statusName(authored.scenario.scenario_id), summary: overview?.mission || caseInfo?.description || 'Authored simulation case.', boundaries: overview?.limitations || [] },
      mission: {
        role: run.participant_mode === 'sapien' ? 'Sapiens participant' : 'Simulation participant',
        objective: overview?.mission || caseInfo?.description || 'Complete the authored scenario.',
        responsibilities: authored.expectations.map(expectationTitle),
        onboardingGate: 'Readiness and participation requirements are defined by the authored evaluation windows below.',
      },
      channels: authored.scenario.initial_world.channels.map(channel => ({ id: channel.channel_id, name: channel.title, purpose: `${channel.members.length} authored members` })),
      decisionRights: [] as Array<readonly [string, string]>,
      people,
      phases: (overview?.phases || []).map(phase => ({ period: phase.title, goal: phase.title, evidence: `Authored interval: ${time(phase.start_at)} to ${time(phase.end_at)}` })),
      backlog: (overview?.backlog || []).map(item => ({ id: item.issue_key, summary: item.title, owner: item.owner_id, week: item.target_week, dependencies: item.dependencies })),
      challenges: (authored.scenario.program?.rules || []).map((rule, index) => ({ id: value(rule.rule_id) || `Rule ${index + 1}`, window: time(value(rule.at)), signal: value(rule.expected) || 'Authored scenario behavior', response: value(rule.on_unmet || rule.on_expiry) || 'Follow the authored actions and conditions.' })),
      evaluation: authored.expectations.map((item, index) => ({ id: value(item.expectation_id) || `expectation-${index + 1}`, objective: expectationTitle(item, index), evidence: `${value(item.event_type) || 'Observable activity'} involving ${value(item.target_id) || 'the authored target'} by ${time(value(item.deadline))}` })),
    };
  }, [inspection, run.case_id, run.case_version, run.participant_mode, caseInfo]);

  if (!spec) return <div className="mx-auto max-w-4xl p-6"><div className="rounded-2xl border bg-card p-8"><BookOpen className="size-8 text-violet-600" /><h1 className="mt-4 text-2xl font-semibold">{caseInfo?.title || statusName(run.case_id)}</h1><p className="mt-3 leading-7 text-muted-foreground">{caseInfo?.description || 'No detailed presentation model is available for this case version.'}</p><p className="mt-5 text-sm text-muted-foreground">Case {run.case_id} · version {run.case_version}</p></div></div>;

  const participantName = run.participant_id || 'Incoming participant';
  const ownerName = (id: string) => spec.people.find(person => person.id === id)?.name || id;
  const normalized = search.trim().toLowerCase();
  const visibleBacklog = spec.backlog.filter(item => !normalized || item.id.toLowerCase().includes(normalized) || item.summary.toLowerCase().includes(normalized) || ownerName(item.owner).toLowerCase().includes(normalized));
  const tabs: Array<[TestCaseTab, string, number | null]> = [
    ['brief', 'Case brief', null],
    ['roadmap', 'Project roadmap', spec.phases.length],
    ['team', 'People & authority', spec.people.length],
    ['backlog', 'Initial backlog', spec.backlog.length],
    ['challenges', 'Scenario challenges', spec.challenges.length],
    ['evaluation', 'Evaluation', spec.evaluation.length],
  ];

  return (
    <div className="min-h-full bg-[#f6f7fb] text-slate-900 dark:bg-[#0b1020] dark:text-slate-100">
      <div className="border-b bg-white dark:bg-[#10172a]">
        <div className="mx-auto max-w-7xl px-4 py-7 lg:px-8">
          {error && <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">{error}</p>}
          <div className="flex flex-wrap items-start gap-5">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg"><BookOpen className="size-7" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><Badge variant="outline">Authored test case</Badge><Badge variant="secondary">{inspection?.specification ? 'Backend specification' : 'Legacy fallback'}</Badge><span>{spec.caseId}</span><span>•</span><span>Version {spec.version}</span></div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">{spec.product.name}</h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">{spec.product.summary}</p>
            </div>
            <div className="rounded-xl border bg-slate-50 px-4 py-3 text-right dark:bg-white/5"><p className="text-xs text-slate-500">Subject under test</p><p className="mt-1 font-semibold">{participantName}</p><p className="text-xs text-slate-500">{run.participant_mode === 'sapien' ? `Sapiens ID ${run.sapien_id}` : statusName(run.participant_mode)}</p></div>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl overflow-x-auto px-4 lg:px-8" aria-label="Test case sections">
          {tabs.map(([id, label, count]) => <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm transition ${tab === id ? 'border-violet-600 font-medium text-violet-700 dark:text-violet-300' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>{label}{count != null && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-white/10">{count}</span>}</button>)}
        </nav>
      </div>

      <div className="mx-auto max-w-7xl p-4 lg:p-8">
        {tab === 'brief' && <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.7fr)]">
          <div className="space-y-6">
            <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-[#10172a]">
              <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950"><Target className="size-4" /></span><div><h2 className="font-semibold">Participant mission</h2><p className="text-xs text-slate-500">What this case is actually testing</p></div></div>
              <p className="mt-5 text-base leading-7">{spec.mission.objective}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">{spec.mission.responsibilities.map((item, index) => <div key={item} className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-white/5"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-violet-600 text-xs font-semibold text-white">{index + 1}</span><p className="text-sm leading-6">{item}</p></div>)}</div>
            </section>

            <section className="rounded-2xl border border-amber-300/60 bg-amber-50 p-6 dark:border-amber-500/20 dark:bg-amber-950/15">
              <h2 className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200"><ShieldCheck className="size-5" />Onboarding readiness gate</h2>
              <p className="mt-3 text-sm leading-7 text-amber-900/80 dark:text-amber-100/70">{spec.mission.onboardingGate}</p>
            </section>

            <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-[#10172a]">
              <h2 className="font-semibold">Product boundaries</h2>
              <p className="mt-1 text-xs text-slate-500">Core truths the participant must preserve throughout the case</p>
              <div className="mt-5 space-y-3">{spec.product.boundaries.map(item => <div key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /><p className="text-sm leading-6">{item}</p></div>)}{!spec.product.boundaries.length && <p className="text-sm text-slate-500">No separately structured product boundaries were authored for this case snapshot.</p>}</div>
            </section>

            <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-[#10172a]">
              <h2 className="font-semibold">Communication spaces</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">{spec.channels.map(channel => <article key={channel.id} className="rounded-xl border p-4"><div className="flex items-center gap-2"><Hash className="size-4 text-indigo-600" /><strong>{channel.name}</strong><code className="ml-auto text-[10px] text-slate-400">{channel.id}</code></div><p className="mt-2 text-sm leading-6 text-slate-500">{channel.purpose}</p></article>)}</div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-[#10172a]"><h2 className="font-semibold">Role under test</h2><p className="mt-3 text-lg font-semibold text-violet-700 dark:text-violet-300">{spec.mission.role}</p><p className="mt-2 text-sm leading-6 text-slate-500">Facilitate, expose impediments and escalate to the correct owner. Do not replace specialist or customer authority.</p></section>
            <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-[#10172a]"><h2 className="font-semibold">Connected workplace</h2><div className="mt-4 space-y-2"><div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-white/5"><MessageSquare className="size-4 text-[#5b5fc7]" /><span className="text-sm">Personal and channel messaging</span></div><div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3 dark:bg-white/5"><FolderKanban className="size-4 text-[#0052cc]" /><span className="text-sm">Sentinel Desk Jira project</span></div></div></section>
            <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-[#10172a]"><h2 className="font-semibold">Case limitations</h2><p className="mt-3 text-sm leading-6 text-slate-500">{caseInfo?.limitations || 'Employee behavior follows authored response options. Evaluation measures participation rather than complete Scrum quality.'}</p></section>
          </aside>
        </div>}

        {tab === 'roadmap' && <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-[#10172a]"><div><h2 className="text-xl font-semibold">Fifteen-week project journey</h2><p className="mt-1 text-sm text-slate-500">Each phase has a delivery goal and evidence required before the project can honestly proceed.</p></div><div className="mt-7 space-y-0">{spec.phases.map((phase, index) => <article key={phase.period} className="grid gap-4 sm:grid-cols-[44px_180px_minmax(0,1fr)]"><div className="flex flex-col items-center"><span className="grid size-9 place-items-center rounded-full bg-violet-600 text-sm font-semibold text-white">{index + 1}</span>{index < spec.phases.length - 1 && <span className="min-h-16 w-px flex-1 bg-violet-200 dark:bg-violet-900" />}</div><p className="pb-8 pt-2 text-sm font-semibold text-violet-700 dark:text-violet-300">{phase.period}</p><div className="pb-8 pt-1"><h3 className="font-semibold">{phase.goal}</h3><p className="mt-2 text-sm leading-6 text-slate-500"><strong className="font-medium text-slate-700 dark:text-slate-300">Evidence required:</strong> {phase.evidence}</p></div></article>)}</div></section>}

        {tab === 'team' && <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-[#10172a]"><h2 className="text-xl font-semibold">Decision authority</h2><p className="mt-1 text-sm text-slate-500">The Scrum Master coordinates these decisions but does not inherit their authority.</p>{spec.decisionRights.length ? <div className="mt-5 overflow-hidden rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-white/5"><tr><th className="px-4 py-3 font-medium">Decision</th><th className="px-4 py-3 font-medium">Accountable authority</th></tr></thead><tbody>{spec.decisionRights.map(([decision, owner]) => <tr key={decision} className="border-t"><td className="px-4 py-3 font-medium">{decision}</td><td className="px-4 py-3 text-slate-500">{owner}</td></tr>)}</tbody></table></div> : <p className="mt-5 rounded-xl border border-dashed p-4 text-sm text-slate-500">Structured decision authority is unavailable in this backend snapshot; role and context prose is shown below without inventing authority fields.</p>}</section>
          <section><div className="mb-4"><h2 className="text-xl font-semibold">People and stakeholder context</h2><p className="mt-1 text-sm text-slate-500">What each person owns and the constraint the participant must understand.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{spec.people.map(person => <article key={person.id} className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-[#10172a]"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-semibold text-white">{person.name.slice(0,2).toUpperCase()}</span><div><h3 className="font-semibold">{person.name}</h3><p className="text-xs text-slate-500">{person.role}</p></div><Badge className="ml-auto" variant="outline">{person.group}</Badge></div><p className="mt-4 text-sm leading-6 text-slate-500">{person.context}</p><p className="mt-3 font-mono text-[10px] text-slate-400">{person.id}</p></article>)}</div></section>
        </div>}

        {tab === 'backlog' && <section className="rounded-2xl border bg-white shadow-sm dark:bg-[#10172a]">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b p-6"><div><h2 className="text-xl font-semibold">Initial project backlog</h2><p className="mt-1 text-sm text-slate-500">All 32 authored issues begin in Proposed state. Dependencies matter more than isolated status labels.</p></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-2.5 size-4 text-slate-400" /><Input className="pl-9" placeholder="Search issue, owner or title" value={search} onChange={event => setSearch(event.target.value)} /></div></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500 dark:bg-white/5"><tr><th className="px-5 py-3 font-medium">Issue</th><th className="px-5 py-3 font-medium">Outcome</th><th className="px-5 py-3 font-medium">Point of contact</th><th className="px-5 py-3 font-medium">Target</th><th className="px-5 py-3 font-medium">Dependencies</th></tr></thead><tbody>{visibleBacklog.map(item => <tr key={item.id} className="border-t hover:bg-slate-50 dark:hover:bg-white/[0.03]"><td className="px-5 py-4 font-semibold text-[#0052cc]">{item.id}</td><td className="px-5 py-4 font-medium">{item.summary}</td><td className="px-5 py-4 text-slate-500">{ownerName(item.owner)}</td><td className="px-5 py-4 text-slate-500">Week {item.week}</td><td className="px-5 py-4"><div className="flex flex-wrap gap-1">{item.dependencies.length ? item.dependencies.map(dependency => <span key={dependency} className="rounded bg-slate-100 px-2 py-1 font-mono text-[10px] dark:bg-white/10">{dependency}</span>) : <span className="text-slate-400">None</span>}</div></td></tr>)}</tbody></table></div>
          {!visibleBacklog.length && <p className="p-8 text-center text-sm text-slate-500">No matching backlog item.</p>}
        </section>}

        {tab === 'challenges' && <section><div className="mb-5"><h2 className="text-xl font-semibold">Authored scenario challenges</h2><p className="mt-1 max-w-4xl text-sm leading-6 text-slate-500">These are pressures the case may introduce. The participant is expected to establish facts, respect authority, preserve uncertainty and coordinate a traceable response—not merely react to alerts.</p></div><div className="grid gap-4 lg:grid-cols-2">{spec.challenges.map(challenge => <article key={challenge.id} className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-[#10172a]"><div className="flex items-center gap-2"><Badge variant="outline">{challenge.id}</Badge><span className="text-xs font-medium text-amber-700 dark:text-amber-300">{challenge.window}</span></div><h3 className="mt-4 text-sm font-semibold leading-6">{challenge.signal}</h3><div className="mt-4 rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/20"><p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Expected response</p><p className="mt-1 text-sm leading-6 text-emerald-900/80 dark:text-emerald-100/70">{challenge.response}</p></div></article>)}</div></section>}

        {tab === 'evaluation' && <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_320px]">
          <section className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-[#10172a]"><div><h2 className="text-xl font-semibold">Observable evaluation checks</h2><p className="mt-1 text-sm text-slate-500">The executable backend currently grades these five participation signals.</p></div><div className="mt-6 space-y-4">{spec.evaluation.map((check, index) => <article key={check.id} className="rounded-xl border p-5"><div className="flex gap-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-500/10 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{index + 1}</span><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{check.objective}</h3><code className="rounded bg-slate-100 px-2 py-1 text-[10px] text-slate-500 dark:bg-white/10">{check.id}</code></div><p className="mt-2 text-sm leading-6 text-slate-500">{check.evidence}</p></div></div></article>)}</div></section>
          <aside className="space-y-5"><section className="rounded-2xl border border-blue-300/50 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-950/20"><h2 className="font-semibold text-blue-900 dark:text-blue-200">What the score means</h2><p className="mt-3 text-sm leading-6 text-blue-900/75 dark:text-blue-100/70">These checks prove that the participant performed important interactions at the relevant time. They do not prove complete Scrum competence or that every project decision was good.</p></section><section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-[#10172a]"><h2 className="font-semibold">Human review should also inspect</h2><ul className="mt-4 space-y-3 text-sm text-slate-500">{['Whether messages showed correct understanding','Whether the participant contacted the right authority','Whether uncertainty and unresolved dependencies remained visible','Whether Jira status was verified against real evidence','Whether customer, security and privacy boundaries were respected'].map(item => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-violet-600" />{item}</li>)}</ul></section></aside>
        </div>}
      </div>
    </div>
  );
}

function ParticipantPortal({ run }: { run: SimulationRun }) {
  const [category, setCategory] = useState<'message' | 'tool'>('message');
  const [page, setPage] = useState<InspectionActivityPage | null>(null);
  const [items, setItems] = useState<InspectionActivity[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async (after = 0, append = false) => {
    try {
      const next = await simulationService.inspectionJourney(run.run_id, { category, after, limit: 100 });
      setPage(next);
      setItems(current => append ? [...current, ...next.items.filter(item => !current.some(existing => existing.record_id === item.record_id))] : next.items);
    } catch (problem) { setError(message(problem)); }
  }, [run.run_id, category]);
  useEffect(() => { setItems([]); void load(); }, [load]);
  if (run.participant_mode === 'environment_only') return <div className="grid min-h-80 place-items-center text-center text-slate-500"><div><Bot className="mx-auto size-10 opacity-30" /><p className="mt-3">This run has no participant.</p></div></div>;
  return <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-8"><section className="rounded-2xl border bg-card p-6"><p className="text-xs uppercase tracking-wider text-muted-foreground">Participant journey</p><h1 className="mt-1 text-2xl font-semibold">{run.participant_mode === 'sapien' ? `Sapiens ${run.sapien_id}` : `Manual participant ${run.participant_id}`}</h1><p className="mt-2 text-sm text-muted-foreground">A chronological record of information delivered and actions observed for simulated identity {run.participant_id}. Delivery and tool success do not prove understanding.</p></section><div className="flex gap-2 border-b">{(['message','tool'] as const).map(item => <button key={item} onClick={() => setCategory(item)} className={`border-b-2 px-4 py-3 text-sm ${category === item ? 'border-violet-500' : 'border-transparent text-muted-foreground'}`}>{item === 'message' ? 'Messages seen and sent' : 'Tool requests and results'}</button>)}</div>{error && <p className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="space-y-3">{items.map(item => <InspectionActivityCard key={item.record_id} item={item} />)}{page && !items.length && !error && <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No participant {category} evidence recorded yet.</p>}</div>{page?.has_more && <Button variant="outline" onClick={() => void load(page.next_after, true)}>Load more</Button>}<p className="text-xs text-muted-foreground">Understanding verified: no. This page reports observable delivery and actions only.</p></div>;
}
function ResultsPortal({ run }: { run: SimulationRun }) {
  const [data, setData] = useState<InspectionResults | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { const controller = new AbortController(); simulationService.inspectionResults(run.run_id, { limit: 200 }, controller.signal).then(setData).catch(problem => { if (!controller.signal.aborted) setError(message(problem)); }); return () => controller.abort(); }, [run.run_id, run.status]);
  if (!data) return <div className="grid min-h-64 place-items-center p-6 text-center text-muted-foreground"><p>{error || 'Loading evaluation report…'}</p></div>;
  const passing = data.items.filter(item => item.verdict === 'pass').length;
  const failing = data.items.filter(item => item.verdict === 'fail').length;
  const insufficient = data.items.filter(item => item.verdict === 'insufficient_evidence').length;
  return <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8"><section className="rounded-2xl border bg-card p-6"><div className="flex flex-wrap items-start gap-4"><div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-wider text-muted-foreground">Evaluation report</p><h1 className="mt-1 text-2xl font-semibold">{data.evaluation_available ? 'Final recorded evaluation' : 'Evaluation not yet available'}</h1><p className="mt-2 text-sm text-muted-foreground">Saved metrics only; opening this page never grades or changes the run.</p></div><Badge variant="outline">Through #{data.through}</Badge></div><div className="mt-6 grid gap-3 sm:grid-cols-4"><div className="rounded-xl bg-muted/50 p-4"><span className="text-xs text-muted-foreground">Objectives</span><strong className="mt-1 block text-2xl">{data.total}</strong></div><div className="rounded-xl bg-emerald-500/10 p-4"><span className="text-xs text-emerald-700 dark:text-emerald-300">Pass</span><strong className="mt-1 block text-2xl">{passing}</strong></div><div className="rounded-xl bg-red-500/10 p-4"><span className="text-xs text-red-700 dark:text-red-300">Fail</span><strong className="mt-1 block text-2xl">{failing}</strong></div><div className="rounded-xl bg-amber-500/10 p-4"><span className="text-xs text-amber-700 dark:text-amber-300">Insufficient</span><strong className="mt-1 block text-2xl">{insufficient}</strong></div></div></section><div className="space-y-4">{data.items.map(item => <article key={item.expectation_id} className="rounded-2xl border bg-card p-6"><div className="flex flex-wrap items-start gap-3"><CheckCircle2 className={`mt-0.5 size-5 ${item.verdict === 'pass' ? 'text-emerald-500' : item.verdict === 'fail' ? 'text-red-500' : 'text-amber-500'}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.title}</h2><Badge variant="outline">{item.verdict.replaceAll('_',' ')}</Badge><code className="text-[10px] text-muted-foreground">{item.expectation_id}</code></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-xl bg-muted/45 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expected behavior</p><dl className="mt-3 space-y-2 text-sm">{Object.entries(item.expected_behavior).map(([key,val]) => <div key={key}><dt className="text-xs capitalize text-muted-foreground">{key.replaceAll('_',' ')}</dt><dd className="break-words">{value(val)}</dd></div>)}</dl></div><div className="rounded-xl bg-muted/45 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observed behavior</p>{item.observed_behavior ? <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(item.observed_behavior, null, 2)}</pre> : <p className="mt-3 text-sm text-muted-foreground">No saved metric at this evidence prefix.</p>}</div></div><div className="mt-4"><p className="text-xs font-semibold text-muted-foreground">Supporting evidence</p><div className="mt-2 flex flex-wrap gap-2">{item.evidence_ids.map(id => <span key={id} className="rounded bg-violet-500/10 px-2 py-1 font-mono text-xs text-violet-700 dark:text-violet-300">{id}</span>)}{!item.evidence_ids.length && <span className="text-sm text-muted-foreground">No evidence linked.</span>}</div></div></div></div></article>)}</div><p className="text-xs text-muted-foreground">Missing actions remain unavailable unless the backend records them explicitly. Participation evidence is not proof of complete Scrum competence.</p></div>;
}
export function SimulationWorldPage() {
  const { runId = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [run, setRun] = useState<SimulationRun | null>(null);
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => sessionStorage.getItem('simulation-world-sidebar-collapsed') === 'true');
  const section = location.pathname.split('/').filter(Boolean).at(-1) || 'overview';
  const valid = ['world','overview','test-case','timeline','progress','people','messages','jira','connections','sapien','results'];
  useEffect(() => { if (!valid.includes(section)) navigate(`/admin/simulations/${encodeURIComponent(runId)}/world/overview`, { replace: true }); }, [section, runId, navigate]);
  useEffect(() => { const controller = new AbortController(); let timer = 0; let inFlight = false; const poll = async () => { if (document.hidden || inFlight) return; inFlight = true; try { const next = await simulationService.get(runId, controller.signal); setRun(next); setError(''); if (!(next.archived && terminal.has(next.status))) timer = window.setTimeout(poll, next.status === 'scheduled' || next.status === 'paused' ? 30_000 : 15_000); } catch (problem) { if (!controller.signal.aborted) { setError(message(problem)); timer = window.setTimeout(poll, 60_000); } } finally { inFlight = false; } }; const resume = () => { if (!document.hidden) void poll(); }; document.addEventListener('visibilitychange', resume); void poll(); return () => { controller.abort(); window.clearTimeout(timer); document.removeEventListener('visibilitychange', resume); }; }, [runId]);
  useEffect(() => { const next = new URLSearchParams(params); const desired = section === 'jira' || section === 'connections' ? 'tools' : null; if (desired) next.set('section', desired); if (section === 'jira') next.set('connection', 'jira'); setParams(next, { replace: true }); }, [section]);
  const base = `/admin/simulations/${encodeURIComponent(runId)}/world`;
  const links = useMemo(() => [{ to: `${base}/overview`, label: 'Overview', icon: LayoutDashboard }, { to: `${base}/test-case`, label: 'Test case', icon: BookOpen }, { to: `${base}/timeline`, label: 'Timeline', icon: Clock3 }, { to: `${base}/progress`, label: 'Progress', icon: Activity }, { to: `${base}/people`, label: 'People', icon: Users }, { to: `${base}/messages`, label: 'Messages', icon: MessageSquare }, { to: `${base}/jira`, label: 'Jira', icon: FolderKanban }, { to: `${base}/connections`, label: 'Connections', icon: PlugZap }, { to: `${base}/sapien`, label: run?.participant_mode === 'manual' ? 'Participant' : 'Sapiens', icon: Bot }, { to: `${base}/results`, label: 'Results', icon: CheckCircle2 }], [base, run?.participant_mode]);
  const toggleSidebar = () => setSidebarCollapsed(collapsed => { const next = !collapsed; sessionStorage.setItem('simulation-world-sidebar-collapsed', String(next)); return next; });
  if (!run) return <div className="grid min-h-screen place-items-center bg-[#07101f] text-white"><div className="text-center"><Beaker className="mx-auto size-9 animate-pulse text-violet-300" /><p className="mt-3 text-sm text-white/60">{error || 'Opening simulation world…'}</p><Button className="mt-4" variant="outline" onClick={() => navigate('/admin/simulations')}>Back to Simulation Lab</Button></div></div>;
  return <div className="flex h-[100dvh] overflow-hidden bg-background text-foreground"><aside className={`hidden shrink-0 flex-col border-r bg-[#07101f] text-white transition-[width] duration-200 lg:flex ${sidebarCollapsed ? 'w-[72px]' : 'w-64'}`}><div className={`flex items-center border-b border-white/10 ${sidebarCollapsed ? 'flex-col gap-2 p-3' : 'gap-3 p-4'}`}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-500/20"><Beaker className="size-5 text-violet-200" /></span>{!sidebarCollapsed && <div className="min-w-0 flex-1"><p className="font-semibold">Simulation World</p><p className="truncate text-xs text-white/40">{run.case_id}</p></div>}<button type="button" onClick={toggleSidebar} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="grid size-8 shrink-0 place-items-center rounded-lg text-white/55 hover:bg-white/10 hover:text-white">{sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}</button></div><nav className={`flex-1 space-y-1 ${sidebarCollapsed ? 'px-3 py-3' : 'p-3'}`}>{links.map(item => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} title={sidebarCollapsed ? item.label : undefined} aria-label={sidebarCollapsed ? item.label : undefined} className={({ isActive }) => `flex items-center rounded-lg py-2.5 text-sm transition ${sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} ${isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}><Icon className="size-4 shrink-0" />{!sidebarCollapsed && item.label}</NavLink>; })}</nav><div className="border-t border-white/10 p-3"><button title={sidebarCollapsed ? 'Simulation Lab' : undefined} aria-label={sidebarCollapsed ? 'Simulation Lab' : undefined} onClick={() => navigate(`/admin/simulations?runId=${encodeURIComponent(run.run_id)}`)} className={`flex w-full items-center rounded-lg py-2 text-sm text-white/55 hover:bg-white/5 ${sidebarCollapsed ? 'justify-center px-2' : 'gap-2 px-3'}`}><ArrowLeft className="size-4 shrink-0" />{!sidebarCollapsed && 'Simulation Lab'}</button></div></aside><div className="flex min-w-0 flex-1 flex-col"><header className="border-b bg-card"><div className="flex flex-wrap items-center gap-3 px-4 py-3"><button onClick={() => navigate(`/admin/simulations?runId=${encodeURIComponent(run.run_id)}`)} className="p-2 lg:hidden"><ArrowLeft className="size-5" /></button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate font-semibold">{run.case_id}</h1><Badge variant="secondary">{statusName(run.status)}</Badge>{run.archived && <Badge variant="outline">Archived</Badge>}</div><p className="truncate text-xs text-muted-foreground">{run.run_id} · {run.sapien_id ? `Sapiens ${run.sapien_id}` : 'No bound Sapiens'}</p></div><div className="hidden items-center gap-5 text-xs md:flex"><p><span className="text-muted-foreground">Simulated time</span><br />{time(run.simulated_time)}</p><p><span className="text-muted-foreground">Speed</span><br />{run.speed}×</p><p><span className="text-muted-foreground">Evidence</span><br />{run.event_count} records</p></div><ThemeToggle /></div><nav className="flex overflow-x-auto border-t px-2 lg:hidden">{links.map(item => <NavLink key={item.to} to={item.to} className={({ isActive }) => `whitespace-nowrap border-b-2 px-3 py-2 text-xs ${isActive ? 'border-violet-500' : 'border-transparent text-muted-foreground'}`}>{item.label}</NavLink>)}</nav></header>{error && <p className="border-b border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-600">{error}</p>}<main className="min-h-0 flex-1 overflow-y-auto">{section === 'overview' ? <InspectionOverviewPortal run={run} /> : section === 'test-case' ? <TestCasePortal run={run} /> : section === 'timeline' ? <TimelinePortal runId={run.run_id} /> : section === 'progress' ? <ProgressPortal runId={run.run_id} /> : section === 'people' ? <PeoplePortal runId={run.run_id} /> : section === 'jira' ? <JiraPortal runId={run.run_id} eventCount={run.event_count} /> : section === 'messages' ? <ChatPortal runId={run.run_id} eventCount={run.event_count} /> : section === 'sapien' ? <ParticipantPortal run={run} /> : section === 'results' ? <ResultsPortal run={run} /> : <div className="p-4 lg:p-6"><SimulationWorldExplorer key={`${run.run_id}:${section}`} runId={run.run_id} eventCount={run.event_count} archived={!!run.archived} /></div>}</main></div></div>;
}
