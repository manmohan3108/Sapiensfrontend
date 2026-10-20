import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { simulationService } from '../../core/services/simulationService';
import type { InspectionActivity, InspectionActivityPage, InspectionOverview, InspectionResults, InspectionSpecificationResponse, SimulationRun } from '../../types/simulationTypes';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const text = (input: unknown) => typeof input === 'string' ? input : '';
const stamp = (input?: string | null) => input ? new Date(input).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST' : 'Not recorded';
const problemText = (error: unknown) => error instanceof Error ? error.message : 'Unable to load recorded evidence.';
const basePath = (run: SimulationRun) => `/admin/simulations/${run.run_id}/world`;

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
  const blockers = data.recorded_blockers.filter(item => item.status === 'blocked' || item.status === 'review_needed');
  const waiting = data.recorded_blockers.filter(item => item.status === 'waiting').length;
  const base = basePath(run);
  return <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-8">
    {error && <p role="alert" className="rounded-xl border border-amber-500/30 p-4 text-sm">Some display data could not be refreshed: {error}</p>}
    <section className="rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-6 text-white lg:p-8">
      <p className="text-xs uppercase tracking-widest text-violet-200">A simulated workplace. A real Sapien.</p>
      <h1 className="mt-3 text-3xl font-semibold">{person?.name || `Sapiens ${run.sapien_id ?? run.participant_id}`} in {run.case_id.replaceAll('-', ' ')}</h1>
      <p className="mt-4 max-w-3xl leading-7 text-slate-200">{authored?.overview?.mission || 'Explore the authored case, then follow the participant’s recorded interactions.'}</p>
      <div className="mt-6 flex flex-wrap gap-3"><Badge variant="secondary">{role || 'Participant role: see case brief'}</Badge><Badge variant="secondary">{data.current_phase?.title || 'Phase not recorded'}</Badge><Badge variant="secondary">{run.status.replaceAll('_', ' ')}</Badge></div>
      <p className="mt-4 text-sm text-slate-300">Simulated time: {stamp(run.simulated_time)} · {run.speed}× speed</p>
    </section>
    <div className="grid gap-4 md:grid-cols-3">
      {[
        ['01', 'Understand the case', 'The product, people, planned challenges and what success means.', 'test-case'],
        ['02', 'Follow the Sapien', 'See incoming information, visible actions and recorded results in time order.', 'sapien'],
        ['03', 'Review the evidence', 'Compare authored expectations with saved evaluation—not assumptions.', 'results'],
      ].map(([step, title, description, path]) => <NavLink key={path} to={`${base}/${path}`} className="rounded-2xl border bg-card p-5 transition hover:border-violet-400"><span className="text-xs font-semibold text-violet-500">{step}</span><h2 className="mt-2 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></NavLink>)}
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border bg-card p-6"><h2 className="text-lg font-semibold">What we are looking for</h2><p className="mt-1 text-sm text-muted-foreground">These are authored checks, not a measure of general intelligence.</p><div className="mt-5 space-y-4">{data.objectives.map(item => <div key={item.expectation_id} className="flex items-start justify-between gap-4 border-b pb-3 last:border-0"><p className="text-sm">{item.title}</p><Badge variant="outline">{item.verdict === 'not_evaluated' ? 'Not evaluated yet' : item.verdict.replaceAll('_', ' ')}</Badge></div>)}</div></section>
      <section className="rounded-2xl border bg-card p-6"><h2 className="text-lg font-semibold">What has been observed</h2><div className="mt-5 grid grid-cols-2 gap-4"><div><strong className="text-3xl">{data.message_summary.unique_messages}</strong><p className="text-sm text-muted-foreground">workplace messages</p></div><div><strong className="text-3xl">{data.tool_summary.calls ?? 0}</strong><p className="text-sm text-muted-foreground">recorded tool calls, all actors</p></div></div><p className="mt-5 text-sm text-muted-foreground">Counts include the simulated employees, not only the Sapien. Successful delivery does not prove understanding.</p><div className="mt-5 flex flex-wrap gap-3"><NavLink className="text-sm text-violet-500 underline" to={`${base}/messages`}>Open Teams-style messages</NavLink><NavLink className="text-sm text-violet-500 underline" to={`${base}/jira`}>Open Jira workspace</NavLink></div></section>
    </div>
    <section className="rounded-2xl border bg-card p-6"><h2 className="text-lg font-semibold">Needs attention</h2>{blockers.length ? <div className="mt-4 space-y-3">{blockers.map((item, index) => <div key={text(item.rule?.rule_id) || index} className="rounded-xl border border-amber-500/30 p-4"><Badge variant="outline">{item.status.replaceAll('_', ' ')}</Badge><p className="mt-2 text-sm">{text(item.rule?.expected) || 'Inspect the recorded rule decision.'}</p></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No blocked or review-needed rules in this overview snapshot. This is not a final pass.</p>}<p className="mt-4 text-xs text-muted-foreground">{waiting} recorded rules are waiting for their conditions; waiting alone is not a blocker. <NavLink className="underline" to={`${base}/progress`}>Inspect rule progress</NavLink></p></section>
    <p className="text-xs text-muted-foreground">Evidence snapshot #{data.through}. {data.partial ? 'This snapshot is partial. ' : ''}This view is read-only. Case information shown to the viewer is not necessarily information already delivered to the Sapien.</p>
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
    <header className="rounded-2xl border bg-card p-6"><p className="text-xs uppercase tracking-widest text-violet-500">The participant journey</p><h1 className="mt-2 text-3xl font-semibold">{label(participant)}: information to action</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">Follow what arrived, what the participant sent or attempted, and what the tools reported. Entries are chronological—not a claim that one caused the next. Explicit reply links are shown where recorded.</p><div className="mt-4 flex flex-wrap gap-4 text-sm"><NavLink className="text-violet-500 underline" to={`${base}/messages`}>Open messages</NavLink><NavLink className="text-violet-500 underline" to={`${base}/jira`}>Open Jira</NavLink><NavLink className="text-violet-500 underline" to={`${base}/results`}>Expected vs observed</NavLink></div></header>
    <div className="flex flex-wrap items-center gap-2">{[['all','Full sequence'],['incoming','Incoming information'],['outgoing','Participant messages'],['action','Tools & other evidence']].map(([id,title]) => <Button key={id} variant={filter === id ? 'default' : 'outline'} onClick={() => setFilter(id)}>{title}</Button>)}<Button className="ml-auto" variant="outline" disabled={loading} onClick={() => setRefresh(value => value + 1)}>Refresh snapshot</Button></div>
    {error && <p role="alert" className="rounded-xl border border-red-500/30 p-4">{error}</p>}
    <div className="space-y-4">{visible.map(item => {
      const kind = direction(item);
      const source = item.reply_to_message_id ? items.find(other => other.message_id === item.reply_to_message_id) : undefined;
      const title = item.category === 'message' ? `${label(item.payload.sender_id)} → ${label(item.payload.recipient_id || item.channel_id)}` : `${text(item.payload.tool) || item.event_type} · ${item.connection || item.category}`;
      return <article id={`evidence-${item.sequence}`} key={item.record_id} className={`rounded-2xl border border-l-4 bg-card p-5 ${kind === 'incoming' ? 'border-l-blue-500' : kind === 'outgoing' ? 'border-l-violet-500' : 'border-l-emerald-500'}`}>
        <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{kind === 'incoming' ? 'Information received' : kind === 'outgoing' ? 'Participant said' : 'Recorded action / evidence'}</Badge><span className="ml-auto text-xs text-muted-foreground">{stamp(item.occurred_at)}</span></div><h2 className="mt-3 font-semibold">{title}</h2>
        {source && <a onClick={() => setFilter('all')} className="mt-2 block text-xs text-violet-500 underline" href={`#evidence-${source.sequence}`}>Reply to recorded message #{source.sequence}</a>}
        {item.reply_to_message_id && !source && <p className="mt-2 text-xs text-muted-foreground">Reply to {item.reply_to_message_id}; original is outside the loaded entries.</p>}
        {item.category === 'message' && <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{text(item.payload.text)}</p>}
        {item.category === 'tool' && <div className="mt-4 grid gap-3 md:grid-cols-2"><details className="rounded-xl bg-muted/50 p-3"><summary className="cursor-pointer text-sm font-medium">What was requested</summary><pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(item.arguments ?? {}, null, 2)}</pre></details><details className="rounded-xl bg-muted/50 p-3"><summary className="cursor-pointer text-sm font-medium">What the tool returned</summary><pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(item.result ?? {}, null, 2)}</pre></details></div>}
        <details className="mt-4 border-t pt-3"><summary className="cursor-pointer text-xs text-muted-foreground">Evidence and recorded links · #{item.sequence}</summary><p className="mt-2 break-all text-xs text-muted-foreground">{item.record_id}</p><pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">{JSON.stringify({ payload: item.payload, related_record_ids: item.related_record_ids, operation_id: item.operation_id }, null, 2)}</pre></details>
      </article>;
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
    if (item.verdict !== 'not_evaluated') return { pass: 'Passed', fail: 'Failed', insufficient_evidence: 'Needs human review' }[item.verdict];
    const due = Date.parse(text(item.expected_behavior.deadline));
    return Number.isFinite(due) && due > Date.parse(run.simulated_time) ? 'Not yet due · not evaluated' : 'Awaiting evaluation';
  };
  return <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
    <header className="rounded-2xl border bg-card p-6"><p className="text-xs uppercase tracking-widest text-violet-500">Expected vs observed</p><h1 className="mt-2 text-3xl font-semibold">What does this run demonstrate?</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Only saved evaluations count as passes or failures. A deadline or an apparent action is not a frontend-generated verdict.</p><div className="mt-5 flex flex-wrap gap-3">{data && <><Badge variant="outline">{data.total} authored checks</Badge><Badge variant="outline">{data.items.filter(item => item.verdict === 'pass').length} passed in loaded checks</Badge><Badge variant="outline">Snapshot #{data.through}</Badge></>}<Button disabled={loading} variant="outline" onClick={() => setRefresh(value => value + 1)}>Refresh results</Button></div></header>
    {error && <p role="alert" className="rounded-xl border border-red-500/30 p-4">{error}</p>}
    {!data && <p role="status">{loading ? 'Loading saved evaluations…' : 'No evaluation data available.'}</p>}
    {data?.items.map(item => <article key={item.expectation_id} className="rounded-2xl border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="max-w-2xl text-lg font-semibold">{item.title}</h2><Badge variant={item.verdict === 'pass' ? 'default' : 'outline'}>{label(item)}</Badge></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2"><section className="rounded-xl bg-muted/50 p-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expected</h3><p className="mt-3 text-sm leading-6">{text(item.expected_behavior.expected) || item.title}</p>{text(item.expected_behavior.target) && <p className="mt-2 text-sm">Target: {text(item.expected_behavior.target)}</p>}<p className="mt-3 text-xs text-muted-foreground">Deadline: {stamp(text(item.expected_behavior.deadline))}</p></section><section className="rounded-xl bg-muted/50 p-4"><h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recorded outcome</h3><p className="mt-3 text-sm leading-6">{text(item.observed_behavior?.explanation) || (item.verdict === 'not_evaluated' ? 'No evaluation has been saved for this check yet. Pending evaluation is not failure.' : 'See the saved evaluation details below.')}</p><p className="mt-3 text-xs text-muted-foreground">{item.evidence_ids.length} linked evidence records</p></section></div>
      <details className="mt-4 border-t pt-4"><summary className="cursor-pointer text-sm text-muted-foreground">Evaluation details and evidence references</summary><pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded bg-muted p-4 text-xs">{JSON.stringify({ expectation: item.expected_behavior, observed: item.observed_behavior, missing_actions: item.missing_actions, evidence_ids: item.evidence_ids }, null, 2)}</pre></details>
    </article>)}
    {data?.has_more && <Button disabled={loading} variant="outline" onClick={() => void more()}>Load more checks</Button>}
    {data?.partial && <p className="text-sm text-amber-600">Evidence coverage is partial; do not treat this as a complete report.</p>}
    <p className="text-xs leading-6 text-muted-foreground">These checks measure the authored behavior only—not general competence or the correctness of every decision. Use the journey, Messages and Jira to review the surrounding evidence.</p>
  </div>;
}
