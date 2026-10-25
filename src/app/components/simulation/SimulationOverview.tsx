import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Bot, CheckCircle2, CircleDashed, Clock3, FolderKanban, MessageSquare, Users } from 'lucide-react';
import { simulationService } from '../../core/services/simulationService';
import type { InspectionActivity, InspectionActivityPage, InspectionOverviewDetails, InspectionSpecificationResponse, InspectionStory, SimulationRun } from '../../types/simulationTypes';
import { Button } from '../ui/button';

const text = (value: unknown) => typeof value === 'string' ? value : '';
const human = (value: string) => value.replaceAll('_', ' ').replaceAll('-', ' ');
const time = (value: string) => new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
const failure = (error: unknown) => error instanceof Error ? error.message : 'Unable to load recorded activity.';
const label = (item: InspectionActivity) => text(item.payload.text) || [human(text(item.payload.tool) || item.event_type), item.issue_key].filter(Boolean).join(' · ');

function ResponseStory({ runId, sequence }: { runId: string; sequence: number }) {
  const [story, setStory] = useState<InspectionStory | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStory(null); setError('');
    simulationService.inspectionStory(runId, sequence, controller.signal)
      .then(value => { if (!controller.signal.aborted) setStory(value); })
      .catch(problem => { if (!controller.signal.aborted) setError(failure(problem)); });
    return () => controller.abort();
  }, [runId, sequence, retry]);
  if (error) return <div role="alert" className="space-y-2 p-4"><p>{error}</p><Button variant="outline" onClick={() => setRetry(value => value + 1)}>Retry story</Button></div>;
  if (!story) return <p role="status" className="p-4 text-sm">Loading recorded response…</p>;
  if (story.link_status !== 'linked') return <div className="p-4 text-sm"><p>{story.link_status === 'ambiguous' ? 'More than one record matches this message.' : 'A linked decision record is unavailable.'} This does not mean the Sapien ignored it.</p><details className="mt-2"><summary className="cursor-pointer">Link details</summary><p>{human(story.reason || 'unknown')}</p></details></div>;
  return <div className="space-y-4 border-t bg-muted/30 p-4">
    <p className="text-sm text-muted-foreground">Recorded response to this message · latest retained trace. Later follow-through may belong to another cycle.</p>
    <div className="rounded-xl border bg-card p-4"><h4 className="font-medium">2 · What was decided</h4>{story.beat?.events.length ? <ol className="mt-2 space-y-2">{story.beat.events.map((event, index) => <li key={`${event.sequence}:${index}`} className="border-l-2 border-amber-500/40 pl-3 text-sm"><p className="font-medium">{event.title || human(event.stage)}</p><p>{event.summary}</p></li>)}</ol> : <p className="text-sm">No decision details retained.</p>}</div>
    <div className="rounded-xl border bg-card p-4"><h4 className="font-medium">3 · What was done</h4>{story.actions.length ? story.actions.map(action => <div key={action.record_id} className="mt-2 rounded-lg border bg-card p-3 text-sm"><p className="whitespace-pre-wrap">{label(action)}</p><p className="mt-1 text-muted-foreground">{time(action.occurred_at)}{action.category === 'tool' ? action.payload.is_error ? ' · Tool failed' : ' · Tool reported success' : ''}</p><details className="mt-2"><summary className="cursor-pointer">Evidence</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(action.payload, null, 2)}</pre></details></div>) : <p className="text-sm">No external actions linked in the retained evidence.</p>}</div>
    <details className="rounded-xl border bg-card p-4"><summary className="cursor-pointer font-medium">4 · What is known afterward</summary><p className="mt-2 text-sm text-muted-foreground">The Sapien’s own assessment, not an independently verified outcome. Later actions may change this assessment.</p><dl className="mt-3 space-y-3">{Object.entries(story.beat?.assessment || {}).filter(([, value]) => value != null && value !== '').map(([key, value]) => <div key={key}><dt className="text-sm font-medium capitalize">{human(key)}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{typeof value === 'string' ? value : JSON.stringify(value, null, 2)}</dd></div>)}</dl></details>
    {(story.actions_truncated || story.beat?.events_truncated || story.missing_operation_ids.length > 0) && <p className="text-sm text-muted-foreground">This story is incomplete: some actions or trace entries are not included in the retained view.</p>}
  </div>;
}

export function SimulationOverview({ run }: { run: SimulationRun }) {
  const [overview, setOverview] = useState<InspectionOverviewDetails | null>(null);
  const [spec, setSpec] = useState<InspectionSpecificationResponse | null>(null);
  const [page, setPage] = useState<InspectionActivityPage | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setSelected(null); setOverview(null); setPage(null); setSpec(null);
    async function load() {
      const next = await simulationService.inspectionOverview(run.run_id, undefined, controller.signal);
      const [definition, activity] = await Promise.all([
        simulationService.inspectionSpecification(run.run_id, { through: next.through }, controller.signal),
        simulationService.inspectionJourney(run.run_id, { through: next.through, order: 'desc', category: 'message', limit: 20 }, controller.signal),
      ]);
      if (!controller.signal.aborted) { setOverview(next); setSpec(definition); setPage(activity); }
    }
    void load().catch(problem => { if (!controller.signal.aborted) setError(failure(problem)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [run.run_id, refresh]);
  async function older() {
    if (!page?.has_more || page.next_before == null || loading) return;
    setLoading(true); setError('');
    try {
      const next = await simulationService.inspectionJourney(run.run_id, { through: page.through, before: page.next_before, order: 'desc', category: 'message', limit: 20 });
      setPage({ ...next, items: [...page.items, ...next.items] });
    } catch (problem) { setError(failure(problem)); } finally { setLoading(false); }
  }
  const base = `/admin/simulations/${encodeURIComponent(run.run_id)}/world`;
  const people = spec?.specification?.scenario.initial_world.people || [];
  const name = (id: unknown) => people.find(person => person.person_id === id)?.name || text(id) || 'Unknown participant';
  const participant = name(run.participant_id);
  const context = spec?.specification?.overview;
  const role = people.find(person => person.person_id === run.participant_id)?.facts.find(fact => fact.key === 'role')?.text;
  const teammates = people.filter(person => person.person_id !== run.participant_id && person.person_id !== 'setup');
  const phases = context?.phases || [];
  const clock = Date.parse(overview?.run_state?.simulated_time || run.simulated_time);
  const incoming = (page?.items || []).filter(item => item.payload.recipient_id === run.participant_id && item.payload.sender_id !== run.participant_id);
  const verified = overview?.objectives.filter(item => item.verdict === 'pass') || [];
  const now = overview?.run_state?.simulated_time || run.simulated_time;
  return <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Inside the simulation</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Meet {participant === 'Unknown participant' ? 'your Sapien' : participant}.</h1><p className="mt-2 text-lg text-muted-foreground">{role ? `An AI ${role} working with a simulated project team.` : 'An AI individual working in a simulated workplace.'}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{context?.introduction || context?.mission || 'Follow the conversations, decisions and work recorded in this run.'}</p></div>
      <div className="space-y-3 text-sm"><span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 capitalize"><Clock3 className="size-4" />{human(overview?.run_status || run.status)}</span><p className="text-xs text-muted-foreground">Simulated time<br />{time(now)}</p><Button variant="outline" size="sm" disabled={loading} onClick={() => setRefresh(value => value + 1)}>{loading ? 'Loading…' : 'Refresh overview'}</Button></div>
    </header>
    {error && <p role="alert" className="rounded-lg border border-red-500/30 p-4 text-sm">{error}</p>}
    {!overview && loading && <p role="status">Loading simulation summary…</p>}
    {overview && <>
      <section aria-labelledby="workplace-title" className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b px-5 py-4"><h2 id="workplace-title" className="font-semibold">One Sapien. A team. A shared project.</h2><p className="mt-1 text-sm text-muted-foreground">The workplace setup — not a claim that every action has occurred.</p></div>
        <div className="grid items-center gap-4 p-5 sm:p-7 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <Link to={`${base}/messages`} className="rounded-xl border bg-background p-5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Users className="mb-4 size-7 text-emerald-700 dark:text-emerald-400" /><h3 className="font-semibold">The teammates</h3><p className="mt-2 text-sm text-muted-foreground">People share context, ask questions and respond.</p><div className="mt-4 flex -space-x-2" aria-hidden="true">{teammates.slice(0, 5).map(person => <span key={person.person_id} className="grid size-9 place-items-center rounded-full border-2 border-card bg-muted text-xs font-semibold">{person.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span>)}</div><p className="mt-3 text-sm">Explore conversations →</p></Link>
          <div className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground lg:flex-col"><MessageSquare className="size-5" /><span>Discusses<br />and coordinates</span><ArrowRight className="size-4 rotate-90 lg:rotate-0" aria-hidden="true" /></div>
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-6 text-center"><span className="mx-auto grid size-20 place-items-center rounded-full border border-amber-500/30 bg-amber-500/10"><Bot className="size-10 text-amber-700 dark:text-amber-400" /></span><h3 className="mt-4 text-xl font-semibold">{participant}</h3><p className="mt-1 text-sm text-muted-foreground">{role || 'AI participant'}</p><p className="mt-4 text-sm leading-6">Understands context, decides what to do and acts through connected tools.</p></div>
          <div className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground lg:flex-col"><ArrowRight className="size-4 rotate-90 lg:rotate-0" aria-hidden="true" /><span>Reads and<br />updates work</span><FolderKanban className="size-5" /></div>
          <Link to={`${base}/jira`} className="rounded-xl border bg-background p-5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><FolderKanban className="mb-4 size-7 text-emerald-700 dark:text-emerald-400" /><h3 className="font-semibold">The project workspace</h3><p className="mt-2 text-sm text-muted-foreground">Issues, ownership, dependencies and discussions.</p><div className="mt-4 grid grid-cols-3 gap-2" aria-hidden="true">{[2, 3, 1].map((count, index) => <div key={index} className="space-y-2 rounded border bg-muted/30 p-2">{Array.from({ length: count }, (_, row) => <div key={row} className="h-3 rounded bg-foreground/10" />)}</div>)}</div><p className="mt-3 text-sm">Explore Jira work →</p></Link>
        </div><p className="border-t px-5 py-3 text-xs text-muted-foreground">Teams and Jira are simulated. The conversations and actions shown below are recorded from this run.</p>
      </section>
      <section aria-labelledby="timeline-title"><div className="flex flex-wrap items-baseline justify-between gap-2"><h2 id="timeline-title" className="text-lg font-semibold">Where are we in the project?</h2><Link className="text-sm underline underline-offset-4" to={`${base}/test-case`}>Explore the scenario</Link></div><p className="mt-1 text-sm text-muted-foreground">The timeline follows the scenario calendar. Time passed does not mean work completed.</p>
        {phases.length ? <ol className="mt-4 flex gap-3 overflow-x-auto pb-3">{phases.map(phase => { const current = clock >= Date.parse(phase.start_at) && clock < Date.parse(phase.end_at); const past = clock >= Date.parse(phase.end_at); return <li key={phase.phase_id} aria-current={current ? 'step' : undefined} className={`min-w-48 flex-1 rounded-xl border-t-4 bg-card p-4 ${current ? 'border-amber-500 ring-1 ring-amber-500/30' : 'border-border'}`}><p className={`text-xs font-medium ${current ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}>{current ? 'Current simulated period' : past ? 'Earlier period' : 'Upcoming period'}</p><h3 className="mt-2 font-semibold">{phase.title}</h3><p className="mt-2 text-xs text-muted-foreground">{time(phase.start_at)}<br />to {time(phase.end_at)}</p></li>; })}</ol> : <p className="mt-3 text-sm text-muted-foreground">No project timeline is available for this run.</p>}
      </section>
      <section className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">See {participant} in action</h2><p className="mt-1 text-sm text-muted-foreground">Recent incoming messages. Open a story to see the recorded response.</p></div><Link className="text-sm underline underline-offset-4" to={`${base}/sapien`}>All activity →</Link></div>
        <ol aria-label="How to read a response story" className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-3 sm:grid-cols-4">{['What happened', 'What was decided', 'What was done', 'What is known afterward'].map((step, index) => <li key={step} className="flex items-center gap-2 text-sm"><span className="grid size-6 shrink-0 place-items-center rounded-full border bg-card text-xs">{index + 1}</span>{step}</li>)}</ol>
        {incoming.map(item => <article key={item.record_id} className="overflow-hidden rounded-xl border bg-card"><div className="p-4 sm:p-5"><p className="flex items-center gap-2 text-sm font-medium"><MessageSquare className="size-4 text-emerald-700 dark:text-emerald-400" />{name(item.payload.sender_id)} → {participant}</p><p className="mt-1 text-xs text-muted-foreground">{time(item.occurred_at)}</p><blockquote className="mt-3 whitespace-pre-wrap border-l-2 border-amber-500/40 pl-4 text-sm leading-6">{label(item)}</blockquote><Button className="mt-4" variant="outline" aria-expanded={selected === item.sequence} onClick={() => setSelected(selected === item.sequence ? null : item.sequence)}>{selected === item.sequence ? 'Close story' : 'See what happened next'}<ArrowRight className="ml-2 size-4" /></Button></div>{selected === item.sequence && <ResponseStory runId={run.run_id} sequence={item.sequence} />}</article>)}
        {!incoming.length && <p className="rounded-lg border border-dashed p-4 text-sm">No incoming messages in this loaded portion. {page?.has_more ? 'Load older messages to explore earlier exchanges.' : 'New exchanges will appear here once recorded.'}</p>}
        {page?.has_more && <Button variant="outline" disabled={loading} onClick={() => void older()}>{loading ? 'Loading…' : 'Load older messages'}</Button>}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-5"><CheckCircle2 className="size-7 text-emerald-700 dark:text-emerald-400" /><h2 className="mt-3 text-lg font-semibold">What has been verified?</h2><p className="mt-1 text-sm text-muted-foreground">{verified.length ? `${verified.length} scenario checks passed.` : 'No passed checks are recorded yet. This does not mean the Sapien has done no work.'}</p><ul className="mt-4 divide-y">{overview.objectives.map(objective => <li key={objective.expectation_id} className="flex items-start justify-between gap-3 py-3 text-sm"><span>{objective.title}</span><span className="shrink-0 rounded bg-muted px-2 py-1 text-xs">{human(objective.verdict)}</span></li>)}</ul><Link className="mt-3 inline-block text-sm underline underline-offset-4" to={`${base}/results`}>View evaluation and evidence →</Link></div>
        <div className="rounded-xl border bg-card p-5"><CircleDashed className="size-7 text-amber-700 dark:text-amber-400" /><h2 className="mt-3 text-lg font-semibold">What remains open?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Open a response story to see what the Sapien assessed as unfinished or uncertain. A complete, verified list of unresolved work is not available in this overview.</p><p className="mt-3 text-sm leading-6 text-muted-foreground">A sent message or successful tool call does not by itself prove a workplace problem was resolved.</p>{overview.run_state?.detail && <details className="mt-4 border-t pt-3"><summary className="cursor-pointer text-sm font-medium">About this run’s status</summary><p className="mt-2 text-sm text-muted-foreground">{overview.run_state.detail}</p></details>}<Link className="mt-5 inline-block text-sm underline underline-offset-4" to={`${base}/messages`}>Read the conversations →</Link></div>
      </section>
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t pt-4"><div className="flex flex-wrap gap-4 text-sm">{[['messages', 'Conversations'], ['jira', 'Jira'], ['test-case', 'Scenario'], ['diagnostics', 'Diagnostics']].map(([path, title]) => <Link key={path} className="underline underline-offset-4" to={`${base}/${path}`}>{title}</Link>)}</div><p className="max-w-md text-xs text-muted-foreground">Snapshot #{overview.through}. Stories use the latest retained decision trace. {overview.partial ? 'Some evidence is unavailable.' : ''}</p></footer>
    </>}
  </div>;
}
