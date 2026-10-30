import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import { ArrowRight, Bot, CheckCircle2, ChevronDown, CircleDashed, MessageSquare, TriangleAlert, Wrench, XCircle } from 'lucide-react';
import { simulationService } from '../../core/services/simulationService';
import type { InspectionActivity, InspectionActivityPage, InspectionResults, SimulationRun } from '../../types/simulationTypes';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const text = (input: unknown) => typeof input === 'string' ? input : '';
const stamp = (input?: string | null) => input ? new Date(input).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST' : 'Not recorded';
const problemText = (error: unknown) => error instanceof Error ? error.message : 'Unable to load recorded evidence.';
const basePath = (run: SimulationRun) => `/admin/simulations/${run.run_id}/world`;
const preview = (input: string, limit = 140) => input.length > limit ? `${input.slice(0, limit).trimEnd()}…` : input;
const verdictStyle = {
  pass: { title: 'Passed', Icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', fill: 'bg-emerald-500' },
  fail: { title: 'Failed', Icon: XCircle, color: 'text-red-600 dark:text-red-400', fill: 'bg-red-500' },
  insufficient_evidence: { title: 'Incomplete evidence', Icon: TriangleAlert, color: 'text-amber-600 dark:text-amber-400', fill: 'bg-amber-500' },
  not_evaluated: { title: 'Not evaluated', Icon: CircleDashed, color: 'text-muted-foreground', fill: 'bg-slate-400' },
};

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
    <header><p className="text-xs uppercase tracking-widest text-violet-500">The participant journey</p><h1 className="mt-2 text-3xl font-semibold">{label(participant)}: information to action</h1><p className="mt-3 text-sm text-muted-foreground">Follow incoming messages, responses and actions in time order. Expand a step for details.</p><details className="mt-3"><summary className="cursor-pointer text-xs text-muted-foreground">How to read this journey</summary><p className="mt-2 text-sm text-muted-foreground">Time order is not proof of cause. Only explicit reply references link entries. These records do not expose internal reasoning.</p></details><div className="mt-4 flex flex-wrap gap-4 text-sm"><NavLink className="text-violet-500 underline" to={`${base}/messages`}>Messages</NavLink><NavLink className="text-violet-500 underline" to={`${base}/jira`}>Jira</NavLink><NavLink className="text-violet-500 underline" to={`${base}/results`}>Results</NavLink></div></header>
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
    <header><p className="text-xs uppercase tracking-widest text-violet-500">Expected vs observed</p><h1 className="mt-2 text-3xl font-semibold">What did the run demonstrate?</h1><p className="mt-3 text-sm text-muted-foreground">Compare the test’s expectations with recorded outcomes. Expand a check to see what supports the result.</p><Button className="mt-4" disabled={loading} variant="outline" onClick={() => setRefresh(value => value + 1)}>Refresh results</Button></header>
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
