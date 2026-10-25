import { useEffect, useState } from 'react';
import { Link } from 'react-router';
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
    <div><h4 className="font-medium">Decision and progress</h4>{story.beat?.events.length ? <ol className="mt-2 space-y-2">{story.beat.events.map((event, index) => <li key={`${event.sequence}:${index}`} className="border-l-2 border-amber-500/40 pl-3 text-sm"><p className="font-medium">{event.title || human(event.stage)}</p><p>{event.summary}</p></li>)}</ol> : <p className="text-sm">No decision details retained.</p>}</div>
    <div><h4 className="font-medium">Linked actions</h4>{story.actions.length ? story.actions.map(action => <div key={action.record_id} className="mt-2 rounded-lg border bg-card p-3 text-sm"><p className="whitespace-pre-wrap">{label(action)}</p><p className="mt-1 text-muted-foreground">{time(action.occurred_at)}{action.category === 'tool' ? action.payload.is_error ? ' · Tool failed' : ' · Tool reported success' : ''}</p><details className="mt-2"><summary className="cursor-pointer">Evidence</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs">{JSON.stringify(action.payload, null, 2)}</pre></details></div>) : <p className="text-sm">No external actions linked in the retained evidence.</p>}</div>
    <details><summary className="cursor-pointer font-medium">Sapien’s assessment</summary><p className="mt-2 text-sm text-muted-foreground">An interpretation, not an independently evaluated result.</p><dl className="mt-3 space-y-3">{Object.entries(story.beat?.assessment || {}).filter(([, value]) => value != null && value !== '').map(([key, value]) => <div key={key}><dt className="text-sm font-medium capitalize">{human(key)}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{typeof value === 'string' ? value : JSON.stringify(value, null, 2)}</dd></div>)}</dl></details>
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
        simulationService.inspectionJourney(run.run_id, { through: next.through, order: 'desc', limit: 20 }, controller.signal),
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
      const next = await simulationService.inspectionJourney(run.run_id, { through: page.through, before: page.next_before, order: 'desc', limit: 20 });
      setPage({ ...next, items: [...page.items, ...next.items] });
    } catch (problem) { setError(failure(problem)); } finally { setLoading(false); }
  }
  const base = `/admin/simulations/${encodeURIComponent(run.run_id)}/world`;
  const people = spec?.specification?.scenario.initial_world.people || [];
  const name = (id: unknown) => people.find(person => person.person_id === id)?.name || text(id) || 'Unknown participant';
  const participant = name(run.participant_id);
  const context = spec?.specification?.overview;
  const counts = overview?.participant_summary?.available ? overview.participant_summary.counts : null;
  return <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">Simulation overview</p><h1 className="mt-1 text-2xl font-semibold">{participant === 'Unknown participant' ? 'Recorded simulation' : `${participant} at work`}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{context?.introduction || context?.mission || 'Explore what this simulation asks of the Sapien and what actually happened.'}</p></div><Button variant="outline" disabled={loading} onClick={() => setRefresh(value => value + 1)}>{loading ? 'Loading…' : 'Refresh overview'}</Button></header>
    {error && <p role="alert" className="rounded-lg border border-red-500/30 p-4 text-sm">{error}</p>}
    {!overview && loading && <p role="status">Loading simulation summary…</p>}
    {overview && <>
      <section className="rounded-xl border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Where things stand</h2><p className="mt-2 font-medium capitalize">{human(overview.run_status)}</p><p className="mt-1 text-sm text-muted-foreground">{overview.run_state?.detail || 'Run status is separate from task completion.'}</p></div><div className="text-sm"><p>Simulated time: {time(overview.run_state?.simulated_time || run.simulated_time)}</p><p className="mt-1 text-muted-foreground">{overview.current_phase ? `Scheduled phase: ${overview.current_phase.title}` : 'No scheduled phase available'}</p></div></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Messages sent', counts?.messages_sent], ['People contacted', overview.participant_summary?.available ? overview.participant_summary.direct_contact_person_ids.length : undefined], ['Successful tool calls', counts?.tool_calls_succeeded], ['Failed tool calls', counts?.tool_calls_failed]].map(([title, count]) => <div key={String(title)} className="rounded-lg bg-muted/40 p-3"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-semibold">{count ?? '—'}</p></div>)}</div><p className="mt-3 text-xs text-muted-foreground">Recorded activity counts, not a completion score.</p>
      </section>
      <section className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">What happened recently?</h2><p className="text-sm text-muted-foreground">Newest first. Select an incoming message to inspect its recorded response.</p></div><Link className="underline underline-offset-4" to={`${base}/sapien`}>Full journey</Link></div>
        {page?.items.map(item => <article key={item.record_id} className="overflow-hidden rounded-xl border bg-card"><div className="p-4"><p className="text-xs text-muted-foreground">{time(item.occurred_at)} · {item.category === 'message' ? `${name(item.payload.sender_id)} → ${name(item.payload.recipient_id)}` : human(item.event_type)}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{label(item)}</p>{item.event_type === 'MessageDelivered' && item.payload.recipient_id === run.participant_id && item.payload.sender_id !== run.participant_id && <Button className="mt-3" variant="outline" aria-expanded={selected === item.sequence} onClick={() => setSelected(selected === item.sequence ? null : item.sequence)}>{selected === item.sequence ? 'Hide response story' : 'View response story'}</Button>}</div>{selected === item.sequence && <ResponseStory runId={run.run_id} sequence={item.sequence} />}</article>)}
        {!page?.items.length && <p className="rounded-lg border border-dashed p-4 text-sm">No participant activity recorded in this snapshot.</p>}
        {page?.has_more && <Button variant="outline" disabled={loading} onClick={() => void older()}>{loading ? 'Loading…' : 'Load older activity'}</Button>}
      </section>
      <section className="rounded-xl border bg-card p-5"><h2 className="text-lg font-semibold">What has been verified?</h2><p className="mt-1 text-sm text-muted-foreground">{overview.evaluation?.available ? 'Results from recorded simulation checks.' : 'No evaluation is available. Activity alone does not establish success or failure.'}</p><ul className="mt-4 divide-y">{overview.objectives.map(objective => <li key={objective.expectation_id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{objective.title}</span><strong>{human(objective.verdict)}</strong></li>)}</ul><Link className="mt-3 inline-block underline underline-offset-4" to={`${base}/results`}>Results and evidence</Link></section>
      <section className="rounded-xl border bg-card p-5"><h2 className="text-lg font-semibold">What still needs attention?</h2><p className="mt-2 text-sm text-muted-foreground">{overview.unresolved_decisions == null ? 'A complete list of unresolved Sapien decisions is not available. Inspect individual response stories and conversations for recorded remaining work.' : 'See recorded decisions in the detailed views.'} Simulation diagnostics are shown separately; they are not automatically workplace blockers.</p><div className="mt-4 flex flex-wrap gap-4">{[['messages', 'Conversations'], ['jira', 'Jira work'], ['test-case', 'Scenario and expectations'], ['diagnostics', 'Simulation diagnostics']].map(([path, title]) => <Link key={path} className="underline underline-offset-4" to={`${base}/${path}`}>{title}</Link>)}</div></section>
      <p className="text-xs text-muted-foreground">Overview snapshot #{overview.through}. Response stories use the latest retained decision trace and may include newer evidence. {overview.partial ? 'Some evidence is unavailable.' : ''}</p>
    </>}
  </div>;
}
