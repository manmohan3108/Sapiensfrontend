import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { simulationService } from '../../core/services/simulationService';
import type { WorldActivityCategory, WorldActivityItem, WorldActivityPage, WorldChannel, WorldCollection, WorldConnection, WorldEmployee, WorldOverview, WorldQuery, WorldTicket } from '../../types/simulationTypes';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';

type Section = 'employees' | 'channels' | 'tools';
type Collection = WorldCollection<WorldEmployee | WorldChannel | WorldConnection | WorldTicket>;

const activityStamp = (value?: string | null) => value ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', second: '2-digit' }) + ' IST' : 'No recorded activity';
const errorMessage = (error: unknown) => error instanceof Error ? error.message : (error as { message?: string })?.message || 'World API unavailable. Deploy the matching backend and retry.';
const payload = (item: WorldActivityItem) => item.event.payload as Record<string, unknown>;
const text = (value: unknown) => typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value);
function pretty(value: unknown) { if (typeof value !== 'string') return JSON.stringify(value, null, 2); try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; } }

type ActivityFilters = Pick<WorldQuery, 'person_id' | 'channel_id' | 'connection' | 'issue_key' | 'kind' | 'direction'>;
function ActivityList({ runId, through, filters, title }: { runId: string; through: number; filters: ActivityFilters; title: string }) {
  const runRef = useRef(runId);
  const [params, setParams] = useSearchParams();
  const requestedEvent = params.get('event');
  const [page, setPage] = useState<WorldActivityPage | null>(null);
  const [items, setItems] = useState<WorldActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkedEvent, setLinkedEvent] = useState<WorldActivityItem['event'] | null>(null);
  const filterKey = JSON.stringify(filters);
  useEffect(() => { runRef.current = runId; }, [runId]);
  const load = useCallback(async (after = 0, append = false) => {
    setLoading(true); setError('');
    try {
      const response = await simulationService.worldActivity(runId, { through, after, limit: 50, ...filters }, undefined);
      if (runRef.current !== runId) return;
      setPage(response); setItems(current => append ? [...current, ...response.items.filter(item => !current.some(existing => existing.event.record_id === item.event.record_id))] : response.items);
    } catch (problem) { setError(errorMessage(problem)); }
    finally { setLoading(false); }
  }, [runId, through, filterKey]); // filterKey intentionally represents the filter object
  useEffect(() => { const controller = new AbortController(); setLoading(true); setError(''); simulationService.worldActivity(runId, { through, after: 0, limit: 50, ...filters }, controller.signal).then(response => { setPage(response); setItems(response.items); }).catch(problem => { if (!controller.signal.aborted) setError(errorMessage(problem)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); }); return () => controller.abort(); }, [runId, through, filterKey]);
  useEffect(() => { if (!requestedEvent) { setLinkedEvent(null); return; } const sequence = Number(requestedEvent); if (!Number.isInteger(sequence) || sequence < 1) { const next = new URLSearchParams(params); next.delete('event'); setParams(next, { replace: true }); return; } const controller = new AbortController(); simulationService.event(runId, sequence).then(setLinkedEvent).catch(problem => { if (!controller.signal.aborted) setError(errorMessage(problem)); }); return () => controller.abort(); }, [runId, requestedEvent]);
  return <div className="space-y-3"><div className="flex items-center justify-between gap-3"><h4 className="font-medium">{title}</h4><span className="text-xs text-muted-foreground">Through #{through}</span></div>{linkedEvent && <details open className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 text-sm"><summary className="cursor-pointer font-medium">Linked evidence #{linkedEvent.sequence}</summary><pre className="mt-3 max-h-96 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(linkedEvent, null, 2)}</pre></details>}{error && <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">{error}</p>}{!loading && !error && !items.length && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No matching recorded activity yet.</p>}<div className="space-y-2">{items.map(item => { const body = payload(item); const label = item.category === 'messages' ? `${text(body.sender_id || item.actor_id)} → ${item.recipient_ids?.join(', ') || text(body.recipient_id || body.channel_id)}` : item.category === 'tools' ? `${item.connection} · ${text(body.tool)}` : item.category === 'changes' ? `${text(body.type)}${item.issue_key ? ` · ${item.issue_key}` : ''}` : 'Rejected action'; return <details key={item.event.record_id} onToggle={event => { if (event.currentTarget.open) { const next = new URLSearchParams(params); next.set('event', String(item.event.sequence)); setParams(next, { replace: true }); } }} className="rounded-lg border p-3 text-sm"><summary className="cursor-pointer list-none"><span className="flex flex-wrap items-center gap-2"><Badge variant="outline">{item.category}</Badge><strong>{label}</strong><span className="ml-auto text-xs text-muted-foreground">{activityStamp(item.event.occurred_at)}</span></span>{item.category === 'messages' && <span className="mt-2 block whitespace-pre-wrap text-muted-foreground">{text(body.text)}</span>}</summary><div className="mt-3 space-y-2 border-t pt-3 text-xs"><p>Recorded in real time: {activityStamp(item.event.observed_at)}</p>{item.event.scheduled_at && <p>Scheduled simulated time: {activityStamp(item.event.scheduled_at)}</p>}<p>Evidence: {item.event.record_id} · sequence {item.event.sequence}{item.event.operation_id ? ` · operation ${item.event.operation_id}` : ''}</p>{item.recipient_ids && <p>Recipients: {item.recipient_ids.join(', ') || 'None'}</p>}<pre className="max-h-80 overflow-auto rounded bg-muted p-3">{JSON.stringify(body, null, 2)}</pre>{item.category === 'tools' && <div className="grid gap-2 md:grid-cols-2"><pre className="overflow-auto rounded bg-muted p-3">Request{`\n`}{pretty(body.arguments_json)}</pre><pre className="overflow-auto rounded bg-muted p-3">Response{`\n`}{pretty(body.result_json)}</pre></div>}<p className="break-all text-muted-foreground">UTC: {item.event.occurred_at}</p></div></details>; })}</div>{loading && <p className="text-sm text-muted-foreground">Loading recorded history…</p>}{page?.has_more && <Button variant="outline" disabled={loading} onClick={() => void load(page.next_after, true)}>Load more</Button>}</div>;
}

export function SimulationWorldExplorer({ runId, eventCount, archived }: { runId: string; eventCount: number; archived: boolean }) {
  const runRef = useRef(runId);
  const [params, setParams] = useSearchParams();
  const requestedSection = params.get('section');
  const [overview, setOverview] = useState<WorldOverview | null>(null);
  const [section, setSection] = useState<Section>(requestedSection === 'channels' || requestedSection === 'tools' ? requestedSection : 'employees');
  const [collection, setCollection] = useState<Collection | null>(null);
  const [selected, setSelected] = useState(() => params.get('personId') || params.get('channelId') || params.get('connection') || '');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshNonce, setRefreshNonce] = useState(0);
  const previousEventCount = useRef(eventCount);
  const overviewRequest = useRef<Promise<WorldOverview> | null>(null);

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300); return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => { const next = new URLSearchParams(params); next.set('section', section); next.delete('personId'); next.delete('channelId'); next.delete('connection'); if (selected) next.set(section === 'employees' ? 'personId' : section === 'channels' ? 'channelId' : 'connection', selected); setParams(next, { replace: true }); }, [section, selected]);
  useEffect(() => { if (eventCount !== previousEventCount.current) { previousEventCount.current = eventCount; setRefreshNonce(value => value + 1); } }, [eventCount]);
  useEffect(() => { runRef.current = runId; setOverview(null); setCollection(null); setSelected(''); setSearch(''); previousEventCount.current = eventCount; setRefreshNonce(0); }, [runId]);

  useEffect(() => {
    if (document.hidden) return;
    const controller = new AbortController(); setLoading(true); setError('');
    const request = simulationService.worldOverview(runId, undefined, controller.signal); overviewRequest.current = request;
    request.then(value => { if (overviewRequest.current === request) setOverview(value); }).catch(problem => { if (!controller.signal.aborted) setError(errorMessage(problem)); }).finally(() => { if (!controller.signal.aborted && overviewRequest.current === request) setLoading(false); });
    return () => controller.abort();
  }, [runId, refreshNonce]);

  useEffect(() => {
    if (!overview || document.hidden) return;
    const controller = new AbortController(); setLoading(true); setError('');
    const common = { through: overview.through, offset: 0, limit: 50, ...(debouncedSearch ? { search: debouncedSearch } : {}) };
    const request = (section === 'employees' ? simulationService.worldEmployees(runId, common, controller.signal) : section === 'channels' ? simulationService.worldChannels(runId, common, controller.signal) : simulationService.worldConnections(runId, common, controller.signal)) as Promise<Collection>;
    request.then(value => { setCollection(value); setSelected(current => current && value.items.some(item => ('person_id' in item ? item.person_id : 'channel_id' in item ? item.channel_id : item.connection) === current) ? current : value.items[0] ? ('person_id' in value.items[0] ? value.items[0].person_id : 'channel_id' in value.items[0] ? value.items[0].channel_id : value.items[0].connection) : ''); }).catch(problem => { if (!controller.signal.aborted) setError(errorMessage(problem)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [runId, overview?.through, section, debouncedSearch]);

  useEffect(() => { const visible = () => { if (!document.hidden) setRefreshNonce(value => value + 1); }; document.addEventListener('visibilitychange', visible); return () => document.removeEventListener('visibilitychange', visible); }, []);

  const employee = section === 'employees' ? collection?.items.find(item => 'person_id' in item && item.person_id === selected) as WorldEmployee | undefined : undefined;
  const channel = section === 'channels' ? collection?.items.find(item => 'channel_id' in item && item.channel_id === selected) as WorldChannel | undefined : undefined;
  const connection = section === 'tools' ? collection?.items.find(item => 'connection' in item && !('issue_key' in item) && item.connection === selected) as WorldConnection | undefined : undefined;
  const [tickets, setTickets] = useState<WorldCollection<WorldTicket> | null>(null);
  const [ticketKey, setTicketKey] = useState(() => params.get('issueKey') || '');
  useEffect(() => { const next = new URLSearchParams(params); if (ticketKey) next.set('issueKey', ticketKey); else next.delete('issueKey'); setParams(next, { replace: true }); }, [ticketKey]);
  useEffect(() => { if (!overview || section !== 'tools' || selected !== 'jira') { setTickets(null); setTicketKey(''); return; } const controller = new AbortController(); simulationService.worldTickets(runId, { through: overview.through, connection: selected, limit: 50 }, controller.signal).then(value => { setTickets(value); setTicketKey(current => current && value.items.some(ticket => ticket.issue_key === current) ? current : value.items[0]?.issue_key ?? ''); }).catch(problem => { if (!controller.signal.aborted) setError(errorMessage(problem)); }); return () => controller.abort(); }, [runId, overview?.through, section, selected]);
  const ticket = tickets?.items.find(item => item.issue_key === ticketKey);
  const loadMoreCollection = async () => {
    if (!overview || !collection?.has_more || loading) return;
    setLoading(true); setError('');
    try {
      const values = { through: overview.through, offset: collection.next_offset, limit: 50, ...(debouncedSearch ? { search: debouncedSearch } : {}) };
      const next = (section === 'employees' ? await simulationService.worldEmployees(runId, values) : section === 'channels' ? await simulationService.worldChannels(runId, values) : await simulationService.worldConnections(runId, values)) as Collection;
      if (runRef.current !== runId) return;
      setCollection(current => current ? { ...next, items: [...current.items, ...next.items] } : next);
    } catch (problem) { setError(errorMessage(problem)); }
    finally { setLoading(false); }
  };
  const loadMoreTickets = async () => {
    if (!overview || !tickets?.has_more || !selected || loading) return;
    setLoading(true); setError('');
    try {
      const next = await simulationService.worldTickets(runId, { through: overview.through, connection: selected, offset: tickets.next_offset, limit: 50 });
      if (runRef.current !== runId) return;
      setTickets(current => current ? { ...next, items: [...current.items, ...next.items] } : next);
    } catch (problem) { setError(errorMessage(problem)); }
    finally { setLoading(false); }
  };

  const counts = overview?.counts;
  const cards: Array<[Section, string, number | undefined]> = [['employees', 'Employees', counts?.employees], ['channels', 'Channels', counts?.channels], ['tools', 'Connections', counts?.connections]];
  return <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>World</CardTitle><p className="text-sm text-muted-foreground">Admin view of the simulated world · recorded evidence only{overview ? ` · through #${overview.through}` : ''}</p></div><Button size="sm" variant="outline" disabled={loading} onClick={() => setRefreshNonce(value => value + 1)}><RefreshCw className={`mr-2 size-4 ${loading ? 'animate-spin' : ''}`} />Refresh world</Button></div></CardHeader><CardContent className="space-y-5">{error && <div role="alert" className="flex gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm"><AlertTriangle className="size-4 shrink-0" /><span><strong>World API unavailable.</strong> {error} The interface will not reconstruct privileged world state from raw evidence.</span></div>}{overview && !overview.directory_available && <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">The authored directory is unavailable. Discovered records may be shown, but counts may not represent every employee or channel.</p>}<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([id, label, count]) => <button key={id} type="button" onClick={() => { setSection(id); setSearch(''); }} className={`rounded-xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${section === id ? 'border-violet-500 bg-violet-500/5' : ''}`}><span className="text-xs text-muted-foreground">{label}</span><strong className="mt-1 block text-2xl">{count ?? '—'}</strong></button>)}<button type="button" onClick={() => { setSection('tools'); setSelected('jira'); }} className="rounded-xl border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"><span className="text-xs text-muted-foreground">Jira tickets</span><strong className="mt-1 block text-2xl">{counts?.tickets ?? '—'}</strong></button></div><div className="flex gap-2 border-b" role="tablist">{(['employees','channels','tools'] as Section[]).map(item => <button key={item} role="tab" aria-selected={section === item} onClick={() => { setSection(item); setSearch(''); }} className={`border-b-2 px-3 py-2 text-sm capitalize ${section === item ? 'border-violet-500 text-foreground' : 'border-transparent text-muted-foreground'}`}>{item}</button>)}</div><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input className="pl-9" value={search} maxLength={200} onChange={event => setSearch(event.target.value)} placeholder={`Search ${section}`} /></div>{loading && !collection && <p className="text-sm text-muted-foreground">Loading {section} through the current evidence watermark…</p>}<div className="grid gap-4 lg:grid-cols-[minmax(240px,0.7fr)_minmax(0,1.3fr)]"><div className={`space-y-2 ${selected ? 'hidden lg:block' : ''}`}>{collection && collection.items.map(item => { const id = 'person_id' in item ? item.person_id : 'channel_id' in item ? item.channel_id : item.connection; const title = 'name' in item ? item.name : 'title' in item ? item.title : item.connection; const detail = 'last_activity_at' in item ? activityStamp(item.last_activity_at) : 'posts' in item ? `${item.posts} recorded posts` : `${item.tool_calls} calls · ${item.errors} errors`; return <button type="button" key={id} onClick={() => setSelected(id)} className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left ${selected === id ? 'border-violet-500 bg-violet-500/5' : ''}`}><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{title}</strong><span className="block truncate text-xs text-muted-foreground">{id} · {detail}</span></span><ChevronRight className="size-4" /></button>; })}{collection && !collection.items.length && <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">No matching {section}.</p>} {collection?.has_more && <Button variant="outline" disabled={loading} onClick={() => void loadMoreCollection()}>Load more ({collection.items.length} of {collection.total})</Button>}</div><div className={`${selected ? '' : 'hidden lg:block'}`}>{selected && <Button className="mb-3 lg:hidden" size="sm" variant="ghost" onClick={() => setSelected('')}><ArrowLeft className="mr-2 size-4" />Back to list</Button>}{employee && <div className="space-y-4"><div><h3 className="text-lg font-semibold">{employee.name}</h3><p className="text-sm text-muted-foreground">{employee.person_id} · {employee.sent} sent · {employee.received} received · {employee.tool_calls} tool calls</p></div><ActivityList runId={runId} through={overview!.through} filters={{ person_id: employee.person_id }} title="Recorded activity" /></div>}{channel && <div className="space-y-4"><div><h3 className="text-lg font-semibold">{channel.title}</h3><p className="text-sm text-muted-foreground">{channel.channel_id} · {channel.posts} posts · members: {channel.members.join(', ') || 'Directory unavailable'}</p></div><ActivityList runId={runId} through={overview!.through} filters={{ channel_id: channel.channel_id, kind: 'messages' }} title="Channel posts" /></div>}{connection && <div className="space-y-4"><div><h3 className="text-lg font-semibold">{connection.connection}</h3><p className="text-sm text-muted-foreground">Configured connection · {connection.tool_calls} recorded calls · {connection.errors} errors</p></div>{connection.connection === 'jira' && tickets ? <div className="grid gap-3 md:grid-cols-[220px_1fr]"><div className="space-y-2">{tickets.items.map(item => <button type="button" key={item.issue_key} onClick={() => setTicketKey(item.issue_key)} className={`w-full rounded-lg border p-3 text-left ${ticketKey === item.issue_key ? 'border-violet-500 bg-violet-500/5' : ''}`}><strong>{item.issue_key}</strong><span className="block truncate text-xs text-muted-foreground">{item.summary || 'Unknown summary'} · {item.status || 'Unknown state'}</span></button>)}{tickets.has_more && <Button className="w-full" variant="outline" disabled={loading} onClick={() => void loadMoreTickets()}>Load more tickets ({tickets.items.length} of {tickets.total})</Button>}</div>{ticket && <div className="space-y-3 rounded-lg border p-4"><div className="flex flex-wrap gap-2"><h4 className="font-semibold">{ticket.issue_key}: {ticket.summary || 'Unknown summary'}</h4><Badge variant="outline">{ticket.status || 'Unknown state'}</Badge>{!ticket.has_snapshot && <Badge variant="secondary">Partial reference</Badge>}</div><p className="whitespace-pre-wrap text-sm text-muted-foreground">{ticket.description || 'No recorded description.'}</p><p className="text-xs text-muted-foreground">Last recorded {activityStamp(ticket.last_recorded_at)} · state through #{overview!.through}</p><ActivityList runId={runId} through={overview!.through} filters={{ connection: ticket.connection, issue_key: ticket.issue_key }} title="Ticket history" /></div>}</div> : <ActivityList runId={runId} through={overview!.through} filters={{ connection: connection.connection, kind: 'tools' }} title="Tool activity" />}</div>}</div></div><p className="text-xs text-muted-foreground">{archived ? 'Archived evidence source.' : 'Live evidence source.'} Counts cover the pinned watermark; visible rows may be paged. Opening this inspector never calls a participant tool.</p></CardContent></Card>;
}
