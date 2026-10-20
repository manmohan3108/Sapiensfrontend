import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { ArrowDown, ArrowRight, Bot, Building2, CheckCircle2, ChevronDown, CircleDashed, MessageSquare, TriangleAlert, Wrench, XCircle } from 'lucide-react';
import { simulationService } from '../../core/services/simulationService';
import type { InspectionActivity, InspectionActivityPage, InspectionOverview, InspectionResults, InspectionSpecificationResponse, SimulationRun } from '../../types/simulationTypes';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const text = (input: unknown) => typeof input === 'string' ? input : '';
const stamp = (input?: string | null) => input ? new Date(input).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST' : 'Not recorded';
const problemText = (error: unknown) => error instanceof Error ? error.message : 'Unable to load recorded evidence.';
const basePath = (run: SimulationRun) => `/admin/simulations/${run.run_id}/world`;
const preview = (input: string, limit = 140) => input.length > limit ? `${input.slice(0, limit).trimEnd()}…` : input;
// Case-specific presentation copy, never a claim about the participant's performance.
const caseIntroductions: Record<string, { title: string; situation: string; challenge: string }> = {
  'sentinel-desk': {
    title: 'an AI Scrum Master joining Sentinel Desk',
    situation: 'Sentinel Desk is a fictional project that helps analysts investigate security issues using evidence and human-reviewed recommendations.',
    challenge: 'The team introduces the project and asks for coordination. Can the Sapien understand the work, contact the right people and follow through—without taking over decisions that belong to others?',
  },
};
const verdictStyle = {
  pass: { title: 'Passed', Icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', fill: 'bg-emerald-500' },
  fail: { title: 'Failed', Icon: XCircle, color: 'text-red-600 dark:text-red-400', fill: 'bg-red-500' },
  insufficient_evidence: { title: 'Incomplete evidence', Icon: TriangleAlert, color: 'text-amber-600 dark:text-amber-400', fill: 'bg-amber-500' },
  not_evaluated: { title: 'Not evaluated', Icon: CircleDashed, color: 'text-muted-foreground', fill: 'bg-slate-400' },
};

function HowItWorks({ base }: { base: string }) {
  return <section aria-label="How this simulation works" className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
    {[
      { Icon: Building2, title: 'Workplace', caption: 'People, requests & project changes', route: 'test-case', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-300' },
      { Icon: Bot, title: 'Sapien', caption: 'Receives context & chooses actions', route: 'sapien', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-300' },
      { Icon: CheckCircle2, title: 'Observed outcome', caption: 'Messages, tool results & evaluation', route: 'results', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' },
    ].map(({ Icon, title, caption, route, color }, index) => <div key={route} className="contents">{index > 0 && <><ArrowRight aria-hidden="true" className="hidden size-5 text-muted-foreground md:block" /><ArrowDown aria-hidden="true" className="mx-auto size-5 text-muted-foreground md:hidden" /></>}<NavLink to={`${base}/${route}`} className="group rounded-2xl border bg-card p-6 text-center transition hover:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-500"><span className={`mx-auto grid size-14 place-items-center rounded-2xl ${color}`}><Icon aria-hidden="true" className="size-7" /></span><h2 className="mt-4 text-lg font-semibold">{title}</h2><p className="mt-2 text-xs text-muted-foreground">{caption}</p><span className="mt-4 inline-flex items-center gap-1 text-xs text-violet-500">Explore <ArrowRight aria-hidden="true" className="size-3" /></span></NavLink></div>)}
  </section>;
}

function FeaturedInteraction({ run, through, people }: {
  run: SimulationRun;
  through: number;
  people: Array<{ person_id: string; name: string }>;
}) {
  const [page, setPage] = useState<InspectionActivityPage | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    simulationService.inspectionJourney(run.run_id, { through, limit: 100 }, controller.signal)
      .then(result => { if (!controller.signal.aborted) setPage(result); })
      .catch(problem => { if (!controller.signal.aborted) setError(problemText(problem)); });
    return () => controller.abort();
  }, [run.run_id, through]);
  const participant = page?.participant_id || run.participant_id;
  const messages = (page?.items || []).filter(item => item.category === 'message');
  const incoming = messages.filter(item => item.payload.sender_id !== participant);
  const outgoing = messages.filter(item => item.payload.sender_id === participant);
  // Only explicit reply links establish an exchange; proximity and shared actors do not.
  const reply = [...outgoing].reverse().find(item => item.reply_to_message_id &&
    incoming.some(source => source.message_id === item.reply_to_message_id));
  const source = reply ? incoming.find(item => item.message_id === reply.reply_to_message_id) : incoming.at(-1);
  const name = (id: unknown) => people.find(person => person.person_id === text(id))?.name || text(id) || 'Unknown';
  const linkedTool = reply?.operation_id ? page?.items.find(item =>
    item.category === 'tool' && item.operation_id === reply.operation_id &&
    item.payload.actor_id === participant) : undefined;
  const records = [source, reply, linkedTool].filter((item): item is InspectionActivity => !!item);
  return <section className="rounded-2xl border border-violet-500/30 bg-card p-5 lg:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-violet-500">What happened in this run?</p><h2 className="mt-2 text-xl font-semibold">A moment from the workplace</h2></div><Badge variant="outline">From recorded activity</Badge></div>
    {error ? <p role="alert" className="mt-4 text-sm text-amber-600">Could not refresh this interaction: {error}</p> : !page ? <p role="status" className="mt-4 text-sm text-muted-foreground">Loading recorded activity…</p> : !source ? <p className="mt-4 text-sm text-muted-foreground">No incoming message in the loaded journey yet. Open the journey to inspect other activity.</p> : <>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <article className="rounded-xl bg-blue-500/5 p-4"><MessageSquare aria-hidden="true" className="size-5 text-blue-500" /><h3 className="mt-3 text-sm font-semibold">1 · What the team said</h3><p className="mt-2 text-xs text-muted-foreground">{name(source.payload.sender_id)} → {name(source.payload.recipient_id || source.channel_id)}</p><blockquote className="mt-3 text-sm leading-6">{preview(text(source.payload.text), 220)}</blockquote></article>
        <article className="rounded-xl bg-violet-500/5 p-4"><Bot aria-hidden="true" className="size-5 text-violet-500" /><h3 className="mt-3 text-sm font-semibold">2 · What {name(participant)} said</h3><p className="mt-2 text-xs text-muted-foreground">{reply ? stamp(reply.occurred_at) : 'No explicitly linked reply in loaded evidence'}</p>{reply && <blockquote className="mt-3 text-sm leading-6">{preview(text(reply.payload.text), 220)}</blockquote>}</article>
        <article className="rounded-xl bg-muted/50 p-4"><CircleDashed aria-hidden="true" className="size-5 text-muted-foreground" /><h3 className="mt-3 text-sm font-semibold">3 · Is it finished?</h3><p className="mt-3 text-sm leading-6">{reply ? 'We can verify the reply—not whether all requested work is finished.' : 'Not yet known from this exchange. A missing reply link does not mean the Sapien did nothing.'}</p>{linkedTool && <p className="mt-2 text-sm">{text(linkedTool.payload.tool)}: {linkedTool.payload.is_error === false ? 'tool reported success' : linkedTool.payload.is_error === true ? 'tool reported an error' : 'result available in evidence'}.</p>}<p className="mt-3 text-xs text-muted-foreground">Pending work is not inferred from silence or a promise to act.</p></article>
      </div>
      <details className="mt-4 border-t pt-3"><summary className="cursor-pointer text-sm text-violet-500">Full exchange & evidence</summary><div className="mt-3 space-y-4">{records.map(item => <div key={item.record_id}><p className="text-xs text-muted-foreground">{stamp(item.occurred_at)} · #{item.sequence}</p>{item.category === 'message' ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{text(item.payload.text)}</p> : <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify({ arguments: item.arguments, result: item.result }, null, 2)}</pre>}<p className="mt-2 break-all text-xs text-muted-foreground">{item.record_id}</p></div>)}</div></details>
    </>}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><NavLink to={`${basePath(run)}/sapien`} className="inline-flex items-center gap-2 text-sm text-violet-500">Explore the full journey <ArrowRight aria-hidden="true" className="size-4" /></NavLink>{page && <details><summary className="cursor-pointer text-xs text-muted-foreground">How this was selected</summary><p className="mt-2 max-w-lg text-xs leading-5 text-muted-foreground">Latest explicitly linked reply within {page.items.length} loaded journey entries; otherwise the latest incoming message in that window. Snapshot #{page.through}.{page.has_more ? ' More entries exist outside this window.' : ''}{page.partial ? ' Evidence coverage is partial.' : ''} No links or outcomes are inferred from timing.</p></details>}</div>
  </section>;
}

export function SimulationStoryOverview({ run }: { run: SimulationRun }) {
  const [data, setData] = useState<InspectionOverview | null>(null);
  const [spec, setSpec] = useState<InspectionSpecificationResponse | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    simulationService.inspectionOverview(run.run_id, undefined, controller.signal)
      .then(async overview => {
        if (!controller.signal.aborted) setData(overview);
        const specification = await simulationService.inspectionSpecification(run.run_id, { through: overview.through }, controller.signal);
        if (!controller.signal.aborted) setSpec(specification);
      }).catch(error => { if (!controller.signal.aborted) setError(problemText(error)); });
    return () => controller.abort();
  }, [run.run_id, run.event_count]);
  if (!data) return <div className="p-8 text-muted-foreground" role="status">{error || 'Loading the simulation story…'}</div>;
  const authored = spec?.specification;
  const person = authored?.scenario.initial_world.people.find(person => person.person_id === run.participant_id);
  const role = person?.facts.find(fact => fact.key === 'role')?.text;
  const participantName = person?.name || `Sapien ${run.sapien_id ?? run.participant_id ?? ''}`;
  const introduction = caseIntroductions[run.case_id];
  const unchecked = data.objectives.filter(item => item.verdict !== 'pass');
  const blockers = data.recorded_blockers.filter(item => item.status === 'blocked' || item.status === 'review_needed');
  const waiting = data.recorded_blockers.filter(item => item.status === 'waiting').length;
  const base = basePath(run);
  const latest = [...data.recent_activity].reverse().find(item => item.category === 'message');
  return <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
    {error && <p role="alert" className="rounded-xl border border-amber-500/30 p-4 text-sm">Some display data could not be refreshed: {error}</p>}
    <section className="rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-6 text-white lg:p-8">
      <p className="text-xs uppercase tracking-widest text-violet-200">The situation</p>
      <h1 className="mt-3 text-3xl font-semibold">Meet {participantName}{introduction ? `, ${introduction.title}.` : '.'}</h1>
      <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-200">{introduction?.situation || authored?.overview?.mission || 'An AI individual takes part in a simulated workplace with people, messages and project work.'}</p>
      <div className="mt-5 max-w-3xl border-l-2 border-violet-400 pl-4"><h2 className="text-sm font-semibold text-violet-200">The challenge</h2><p className="mt-2 text-sm leading-6 text-slate-200">{introduction?.challenge || 'Observe how the Sapien responds to the workplace. Compare its recorded actions with the case’s expectations.'}</p></div>
      <div className="mt-5 flex flex-wrap gap-3">{role && <Badge variant="secondary">{role}</Badge>}<Badge variant="secondary">{data.current_phase?.title || 'Phase not recorded'}</Badge><Badge variant="secondary">{run.status.replaceAll('_', ' ')}</Badge></div>
      <p className="mt-4 text-sm text-slate-300">Simulated time: {stamp(run.simulated_time)} · {run.speed}× speed</p>
      <details className="mt-4 border-t border-white/15 pt-3"><summary className="cursor-pointer text-sm text-violet-200">About the product and case</summary><p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">{authored?.overview?.mission || 'No case mission recorded.'}</p></details>
    </section>
    <FeaturedInteraction key={run.run_id} run={run} through={data.through} people={authored?.scenario.initial_world.people || []} />
    <section className="rounded-2xl border bg-card p-5"><h2 className="text-lg font-semibold">What still needs checking?</h2><p className="mt-2 text-sm text-muted-foreground">These are case checks, not the Sapien’s personal to-do list. Unevaluated work is not automatically unfinished.</p><div className="mt-4 space-y-3">{unchecked.length ? unchecked.map(item => <details key={item.expectation_id} className="rounded-xl border p-3"><summary className="cursor-pointer text-sm"><span className="font-medium">{item.title}</span><span className="ml-2 text-xs text-muted-foreground">{verdictStyle[item.verdict].title}</span></summary><p className="mt-3 text-sm leading-6">{text(item.observed_behavior?.explanation) || 'No conclusion has been recorded for this check yet.'}</p>{item.missing_actions != null && <details className="mt-3"><summary className="cursor-pointer text-xs text-muted-foreground">Recorded missing actions</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(item.missing_actions, null, 2)}</pre></details>}</details>) : <p className="text-sm text-muted-foreground">{data.objectives.length ? 'All checks shown here have a recorded pass. This does not prove that every task in the project is finished.' : 'No case checks are available in this view.'}</p>}</div><NavLink className="mt-4 inline-block text-sm text-violet-500" to={`${base}/results`}>See results and supporting details →</NavLink></section>
    <details className="rounded-xl border bg-card p-4"><summary className="cursor-pointer text-sm font-medium">How the simulation works</summary><div className="mt-4"><HowItWorks base={base} /></div></details>
    {(run.detail || run.participant?.failure_type || run.status === 'failed') && <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4"><div className="flex items-center gap-2"><TriangleAlert aria-hidden="true" className="size-5 text-amber-600" /><h2 className="font-semibold">Run status: {run.status.replaceAll('_', ' ')}</h2></div><p className="mt-2 text-sm">{preview(run.detail || run.participant?.failure_type || 'Failure reason is not available in this response.')}</p><details className="mt-3"><summary className="cursor-pointer text-xs text-muted-foreground">Recorded status details</summary><p className="mt-2 whitespace-pre-wrap text-sm">{run.detail || run.participant?.failure_type || 'No reason recorded.'}</p></details></section>}
    <details className="rounded-xl border bg-card p-4"><summary className="cursor-pointer text-sm font-medium">More workplace activity</summary><div className="mt-4 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border bg-card p-6"><h2 className="font-semibold">Latest recorded message</h2>{latest ? <><p className="mt-2 text-xs text-muted-foreground">{stamp(latest.occurred_at)}</p><blockquote className="mt-4 border-l-2 border-violet-500 pl-4 text-lg leading-7">{preview(text(latest.payload.text), 180)}</blockquote><details className="mt-4"><summary className="cursor-pointer text-sm text-violet-500">Full message & source</summary><p className="mt-3 text-xs text-muted-foreground">{text(latest.payload.sender_id)} → {text(latest.payload.recipient_id || latest.channel_id)}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{text(latest.payload.text)}</p><p className="mt-2 break-all text-xs text-muted-foreground">{latest.record_id}</p></details></> : <p className="mt-3 text-sm text-muted-foreground">No message in the recent evidence window.</p>}<NavLink className="mt-5 inline-flex items-center gap-2 text-sm text-violet-500" to={`${base}/sapien`}>Follow the journey <ArrowRight className="size-4" /></NavLink></section>
      <section className="rounded-2xl border bg-card p-6"><h2 className="font-semibold">The workplace so far</h2><div className="mt-5 grid grid-cols-2 gap-4"><div><MessageSquare aria-hidden="true" className="mb-2 size-5 text-blue-500" /><strong className="text-3xl">{data.message_summary.unique_messages}</strong><p className="text-xs text-muted-foreground">messages · all actors</p></div><div><Wrench aria-hidden="true" className="mb-2 size-5 text-violet-500" /><strong className="text-3xl">{data.tool_summary.calls ?? 0}</strong><p className="text-xs text-muted-foreground">tool calls · all actors</p></div></div><div className="mt-5 flex flex-wrap gap-3"><NavLink className="rounded-lg border px-3 py-2 text-sm" to={`${base}/messages`}>Messages</NavLink><NavLink className="rounded-lg border px-3 py-2 text-sm" to={`${base}/jira`}>Jira</NavLink></div><details className="mt-4"><summary className="cursor-pointer text-xs text-muted-foreground">What these counts mean</summary><p className="mt-2 text-sm text-muted-foreground">Includes simulated employees and the Sapien. Delivery or tool success alone does not prove understanding.</p></details></section>
    </div></details>
    <details className="rounded-xl border bg-card p-4"><summary className="cursor-pointer font-medium">Checks & rule details <span className="ml-2 text-xs text-muted-foreground">{data.objectives.length} checks · {blockers.length} rules need attention · {waiting} waiting</span></summary><div className="mt-4 space-y-3">{data.objectives.map(item => <div key={item.expectation_id} className="flex flex-wrap justify-between gap-2 border-b pb-3 text-sm"><span>{item.title}</span><Badge variant="outline">{verdictStyle[item.verdict].title}</Badge></div>)}{blockers.map((item, index) => <p key={index} className="text-sm text-amber-600">{text(item.rule?.expected)} · {item.status.replaceAll('_', ' ')}</p>)}<NavLink className="inline-block text-sm text-violet-500 underline" to={`${base}/progress`}>Inspect rule progress</NavLink><p className="text-xs text-muted-foreground">Waiting alone is not a blocker. Case information visible here is not necessarily information already delivered to the Sapien.</p></div></details>
    <p className="text-xs text-muted-foreground">Read-only · evidence snapshot #{data.through}{data.partial ? ' · partial coverage' : ''}</p>
  </div>;
}

export function SimulationJourney({ run }: { run: SimulationRun }) {
  const [page, setPage] = useState<InspectionActivityPage | null>(null);
  const [items, setItems] = useState<InspectionActivity[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setItems([]); setPage(null); setNames({}); setError(''); setLoading(true);
    simulationService.inspectionJourney(run.run_id, { limit: 100 }, controller.signal)
      .then(next => {
        if (!controller.signal.aborted) { setPage(next); setItems(next.items); }
        return simulationService.inspectionPeople(run.run_id, { through: next.through, limit: 200 }, controller.signal);
      }).then(people => { if (!controller.signal.aborted) setNames(Object.fromEntries(people.items.map(person => [person.person_id, person.name]))); })
      .catch(error => { if (!controller.signal.aborted) setError(problemText(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [run.run_id, refresh]);
  async function more() {
    if (!page || loading) return;
    setLoading(true); setError('');
    try {
      const next = await simulationService.inspectionJourney(run.run_id, { through: page.through, after: page.next_after, limit: 100 });
      setPage(next); setItems(current => [...current, ...next.items.filter(item => !current.some(existing => existing.record_id === item.record_id))]);
    } catch (error) { setError(problemText(error)); } finally { setLoading(false); }
  }
  const participant = page?.participant_id || run.participant_id;
  const label = (id: unknown) => names[text(id)] || text(id) || 'Unknown';
  const direction = (item: InspectionActivity) => item.category === 'message'
    ? (item.payload.sender_id === participant ? 'outgoing' : 'incoming')
    : item.category === 'notification' || item.category === 'notification_delivery' ? 'incoming' : 'action';
  const visible = items.filter(item => filter === 'all' || direction(item) === filter);
  const base = basePath(run);
  if (run.participant_mode === 'environment_only') return <p className="p-8">This run has no participant.</p>;
  return <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
    <header><p className="text-xs uppercase tracking-widest text-violet-500">The participant journey</p><h1 className="mt-2 text-3xl font-semibold">{label(participant)}: information to action</h1><p className="mt-3 text-sm text-muted-foreground">Received → said or attempted → recorded result. Expand any step.</p><details className="mt-3"><summary className="cursor-pointer text-xs text-muted-foreground">How to read this journey</summary><p className="mt-2 text-sm text-muted-foreground">Time order is not proof of cause. Only explicit reply references link entries. These records do not expose internal reasoning.</p></details><div className="mt-4 flex flex-wrap gap-4 text-sm"><NavLink className="text-violet-500 underline" to={`${base}/messages`}>Messages</NavLink><NavLink className="text-violet-500 underline" to={`${base}/jira`}>Jira</NavLink><NavLink className="text-violet-500 underline" to={`${base}/results`}>Results</NavLink></div></header>
    <div className="flex flex-wrap items-center gap-2">{[['all','Full sequence'],['incoming','Incoming information'],['outgoing','Participant messages'],['action','Tools & other evidence']].map(([id,title]) => <Button key={id} variant={filter === id ? 'default' : 'outline'} onClick={() => setFilter(id)}>{title}</Button>)}<Button className="ml-auto" variant="outline" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh snapshot</Button></div>
    {error && <p role="alert" className="rounded-xl border border-red-500/30 p-4">{error}</p>}
    <div className="relative space-y-3 border-l-2 border-muted pl-5">{visible.map(item => {
      const kind = direction(item);
      const source = item.reply_to_message_id ? items.find(other => other.message_id === item.reply_to_message_id) : undefined;
      const title = item.category === 'message' ? `${label(item.payload.sender_id)} → ${label(item.payload.recipient_id || item.channel_id)}` : `${text(item.payload.tool) || item.event_type} · ${item.connection || item.category}`;
      const Icon = item.category === 'tool' ? Wrench : kind === 'outgoing' ? Bot : MessageSquare;
      const toolError = item.payload.is_error;
      return <details id={`evidence-${item.sequence}`} key={item.record_id} className="group relative rounded-xl border bg-card">
        <summary className="cursor-pointer list-none p-4"><span aria-hidden="true" className={`absolute -left-[27px] top-6 size-3 rounded-full ring-4 ring-background ${kind === 'incoming' ? 'bg-blue-500' : kind === 'outgoing' ? 'bg-violet-500' : 'bg-emerald-500'}`} /><div className="flex items-start gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${kind === 'incoming' ? 'bg-blue-500/10 text-blue-500' : kind === 'outgoing' ? 'bg-violet-500/10 text-violet-500' : 'bg-emerald-500/10 text-emerald-600'}`}><Icon aria-hidden="true" className="size-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-[11px] uppercase tracking-wide text-muted-foreground">{kind === 'incoming' ? 'Received' : kind === 'outgoing' ? 'Said' : 'Attempted'}</span><span className="text-xs text-muted-foreground">{stamp(item.occurred_at)}</span>{item.category === 'tool' && <Badge variant="outline">{toolError === true ? 'Tool reported error' : toolError === false ? 'Tool reported success' : 'See tool result'}</Badge>}</div><h2 className="mt-1 break-words text-sm font-semibold">{title}</h2>{item.category === 'message' && <p className="mt-2 text-sm text-muted-foreground">{preview(text(item.payload.text))}</p>}</div><ChevronDown aria-hidden="true" className="mt-2 size-4 shrink-0 text-muted-foreground transition group-open:rotate-180" /></div></summary>
        <div className="border-t p-4">
        {source && <a onClick={() => setFilter('all')} className="mt-2 block text-xs text-violet-500 underline" href={`#evidence-${source.sequence}`}>Reply to recorded message #{source.sequence}</a>}
        {item.reply_to_message_id && !source && <p className="mt-2 text-xs text-muted-foreground">Reply to {item.reply_to_message_id}; original is outside the loaded entries.</p>}
        {item.category === 'message' && <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{text(item.payload.text)}</p>}
        {item.category === 'tool' && <div className="mt-4 grid gap-3 md:grid-cols-2"><details className="rounded-xl bg-muted/50 p-3"><summary className="cursor-pointer text-sm font-medium">What was requested</summary><pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(item.arguments ?? {}, null, 2)}</pre></details><details className="rounded-xl bg-muted/50 p-3"><summary className="cursor-pointer text-sm font-medium">What the tool returned</summary><pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(item.result ?? {}, null, 2)}</pre></details></div>}
        <details className="mt-4 border-t pt-3"><summary className="cursor-pointer text-xs text-muted-foreground">Evidence and recorded links · #{item.sequence}</summary><p className="mt-2 break-all text-xs text-muted-foreground">{item.record_id}</p><pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">{JSON.stringify({ payload: item.payload, related_record_ids: item.related_record_ids, operation_id: item.operation_id }, null, 2)}</pre></details>
        </div>
      </details>;
    })}</div>
    {!visible.length && <p className="rounded-xl border border-dashed p-6 text-muted-foreground">{loading ? 'Loading evidence…' : page?.has_more ? 'No matching entries in the loaded portion. Load more to continue.' : 'No matching evidence in this snapshot.'}</p>}
    {page?.has_more && <Button disabled={loading} variant="outline" onClick={() => void more()}>{loading ? 'Loading…' : 'Load next part of the journey'}</Button>}
    {page && <p className="text-xs text-muted-foreground">{items.length} loaded entries · snapshot #{page.through}{page.has_more ? ' · more entries available' : ''}. {page.partial ? 'Partial evidence coverage. ' : ''}The absence of a reply in this view does not prove the work was forgotten; internal reasoning is not represented here.</p>}
  </div>;
}

export function SimulationResults({ run }: { run: SimulationRun }) {
  const [data, setData] = useState<InspectionResults | null>(null);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setError(''); setLoading(true);
    simulationService.inspectionResults(run.run_id, { limit: 200 }, controller.signal)
      .then(next => { if (!controller.signal.aborted) setData(next); })
      .catch(error => { if (!controller.signal.aborted) setError(problemText(error)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [run.run_id, run.status, refresh]);
  async function more() {
    if (!data || loading) return;
    setLoading(true); setError('');
    try {
      const next = await simulationService.inspectionResults(run.run_id, { through: data.through, offset: data.next_offset, limit: 200 });
      setData(current => current ? { ...next, items: [...current.items, ...next.items] } : next);
    } catch (error) { setError(problemText(error)); } finally { setLoading(false); }
  }
  const label = (item: NonNullable<typeof data>['items'][number]) => {
    if (item.verdict !== 'not_evaluated') return verdictStyle[item.verdict].title;
    const due = Date.parse(text(item.expected_behavior.deadline));
    return Number.isFinite(due) && due > Date.parse(run.simulated_time) ? 'Not yet due · not evaluated' : 'Awaiting evaluation';
  };
  return <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
    <header><p className="text-xs uppercase tracking-widest text-violet-500">Expected vs observed</p><h1 className="mt-2 text-3xl font-semibold">What did the run demonstrate?</h1><p className="mt-3 text-sm text-muted-foreground">Saved evaluations, not an inferred success score. Expand a check to see the evidence.</p><Button className="mt-4" disabled={loading} variant="outline" onClick={() => setRefresh(value => value + 1)}>Refresh results</Button></header>
    {error && <p role="alert" className="rounded-xl border border-red-500/30 p-4">{error}</p>}
    {!data && <p role="status">{loading ? 'Loading saved evaluations…' : 'No evaluation data available.'}</p>}
    {data && <section className="rounded-2xl border bg-card p-5" aria-label="Evaluation summary">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{(Object.keys(verdictStyle) as Array<keyof typeof verdictStyle>).map(verdict => {
        const { Icon, color, title } = verdictStyle[verdict];
        return <div key={verdict}><Icon aria-hidden="true" className={`mb-2 size-5 ${color}`} /><strong className="text-3xl">{data.items.filter(item => item.verdict === verdict).length}</strong><p className="mt-1 text-xs text-muted-foreground">{title}</p></div>;
      })}</div>
      <div aria-hidden="true" className="mt-5 flex h-2 overflow-hidden rounded-full bg-muted">{(Object.keys(verdictStyle) as Array<keyof typeof verdictStyle>).map(verdict => <span key={verdict} className={verdictStyle[verdict].fill} style={{ width: `${data.items.length ? data.items.filter(item => item.verdict === verdict).length / data.items.length * 100 : 0}%` }} />)}</div>
      <p className="mt-3 text-xs text-muted-foreground">{data.items.length} loaded of {data.total} checks · snapshot #{data.through}{data.has_more ? ' · load more below for the remaining checks' : ''}</p>
    </section>}
    {data?.items.map(item => {
      const { Icon, color } = verdictStyle[item.verdict];
      return <details key={item.expectation_id} className="group rounded-2xl border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5"><Icon aria-hidden="true" className={`size-6 shrink-0 ${color}`} /><h2 className="min-w-0 flex-1 text-sm font-semibold">{item.title}</h2><Badge variant="outline">{label(item)}</Badge><ChevronDown aria-hidden="true" className="size-4 shrink-0 transition group-open:rotate-180" /></summary>
      <div className="border-t px-5 pb-5">
      <div className="mt-5 grid gap-4 md:grid-cols-2"><section className="rounded-xl bg-muted/50 p-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expected</h3><p className="mt-3 text-sm leading-6">{text(item.expected_behavior.expected) || item.title}</p>{text(item.expected_behavior.target) && <p className="mt-2 text-sm">Target: {text(item.expected_behavior.target)}</p>}<p className="mt-3 text-xs text-muted-foreground">Deadline: {stamp(text(item.expected_behavior.deadline))}</p></section><section className="rounded-xl bg-muted/50 p-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recorded outcome</h3><p className="mt-3 text-sm leading-6">{text(item.observed_behavior?.explanation) || (item.verdict === 'not_evaluated' ? 'No evaluation has been saved for this check yet. Pending evaluation is not failure.' : 'See the saved evaluation details below.')}</p><p className="mt-3 text-xs text-muted-foreground">{item.evidence_ids.length} linked evidence records</p></section></div>
      <details className="mt-4 border-t pt-4"><summary className="cursor-pointer text-sm text-muted-foreground">Evaluation details and evidence references</summary><pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded bg-muted p-4 text-xs">{JSON.stringify({ expectation: item.expected_behavior, observed: item.observed_behavior, missing_actions: item.missing_actions, evidence_ids: item.evidence_ids }, null, 2)}</pre></details>
      </div></details>;
    })}
    {data?.has_more && <Button disabled={loading} variant="outline" onClick={() => void more()}>Load more checks</Button>}
    {data?.partial && <p className="text-sm text-amber-600">Evidence coverage is partial; do not treat this as a complete report.</p>}
    <p className="text-xs leading-6 text-muted-foreground">These checks measure the authored behavior only—not general competence or the correctness of every decision. Use the journey, Messages and Jira to review the surrounding evidence.</p>
  </div>;
}
