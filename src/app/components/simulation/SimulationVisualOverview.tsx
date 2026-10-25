import { SimulationPurpose } from './SimulationPurpose';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, Bot, Check, ChevronDown, CircleHelp, FileText, MessageSquare, RefreshCw, X } from 'lucide-react';
import { simulationService } from '../../core/services/simulationService';
import type { InspectionActivity, InspectionActivityPage, InspectionOverviewDetails, InspectionSpecificationResponse, InspectionStory, SimulationRun } from '../../types/simulationTypes';
import { Button } from '../ui/button';
import '../../../styles/simulation-visual-overview.css';

const text = (value: unknown) => typeof value === 'string' ? value : '';
const readable = (value: string) => value.replaceAll('_', ' ').replaceAll('-', ' ');
const stamp = (value: string) => new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
const initials = (name: string) => name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join('');
const problemText = (value: unknown) => value instanceof Error ? value.message : 'Unable to load this story.';
const actionNames: Record<string, string> = {
  jira_get_issue: 'Read an issue', jira_get_comments: 'Read issue discussions', jira_add_comment: 'Added a comment',
  jira_update_issue: 'Updated an issue', jira_transition_issue: 'Changed issue status', jira_list_transitions: 'Checked available statuses',
  'send-chat-message': 'Sent a message', 'send-channel-message': 'Posted to a channel', 'list-users': 'Looked up colleagues',
  'get-user': 'Looked up a colleague', 'create-chat': 'Opened a conversation', 'list-chats': 'Found conversations',
  'list-chat-members': 'Checked conversation members', 'list-chat-messages': 'Read a conversation',
};
function actionName(action: InspectionActivity) {
  if (action.event_type === 'MessageDelivered') return action.channel_id ? 'Posted to a channel' : 'Sent a message';
  const name = actionNames[text(action.payload.tool)] || readable(text(action.payload.tool) || action.event_type);
  return action.payload.is_error ? `Attempted: ${name.toLowerCase()}` : name;
}

type StoryNode = { id: string; name: string; caption: string; kind: 'person' | 'work'; records: InspectionActivity[] };
function branches(story: InspectionStory, participant: string | null, name: (id: string) => string): StoryNode[] {
  const delivered = story.actions.filter(item => item.event_type === 'MessageDelivered' && item.payload.sender_id === participant);
  const deliveredOperations = new Set(delivered.map(item => item.operation_id).filter(Boolean));
  const nodes = new Map<string, StoryNode>();
  for (const item of story.actions) {
    // A send and its delivery describe one action visually; keep both in the evidence.
    if (item.category === 'tool' && item.operation_id && deliveredOperations.has(item.operation_id)) continue;
    if (item.event_type === 'MessageDelivered' && item.payload.sender_id !== participant) continue;
    if (item.event_type !== 'MessageDelivered' && item.category !== 'tool') continue;
    const person = item.event_type === 'MessageDelivered' && !item.channel_id ? text(item.payload.recipient_id) : '';
    const key = person ? `person:${person}` : item.channel_id ? `channel:${item.channel_id}` : item.issue_key ? `issue:${item.connection}:${item.issue_key}` : `operation:${item.operation_id || item.record_id}`;
    const title = person ? name(person) : item.channel_id ? 'Team channel' : item.issue_key || actionName(item);
    const existing = nodes.get(key);
    if (existing) { existing.records.push(item); existing.caption = `${existing.records.length} recorded actions`; }
    else nodes.set(key, { id: key, name: title, caption: actionName(item), kind: person ? 'person' : 'work', records: [item] });
  }
  // Show communication and project work before supporting discovery operations.
  const priority = (node: StoryNode) => node.records.some(item => item.event_type === 'MessageDelivered') ? 0
    : node.records.some(item => item.issue_key) ? 1 : 2;
  return [...nodes.values()].sort((left, right) => priority(left) - priority(right));
}

function Evidence({ title, records, onClose }: { title: string; records: InspectionActivity[]; onClose: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.scrollIntoView({ block: 'nearest' }); heading.current?.focus({ preventScroll: true }); }, [title]);
  return <section className="sv-evidence" aria-label="Selected evidence">
    <div className="sv-evidence-heading"><h3 ref={heading} tabIndex={-1}>{title}</h3><Button variant="ghost" size="sm" onClick={onClose} aria-label="Close evidence"><X className="size-4" /></Button></div>
    {records.map(item => <article key={item.record_id} className="sv-evidence-record"><p className="sv-meta">{stamp(item.occurred_at)} · {item.event_type === 'MessageDelivered' ? 'Recorded message' : actionName(item)}</p>
      {text(item.payload.text) ? <p className="sv-message">{text(item.payload.text)}</p> : <p>{item.issue_key ? `${item.issue_key} · ` : ''}{item.payload.is_error ? 'This attempt reported an error.' : 'The tool reported success. This is not a project-completion verdict.'}</p>}
      <details><summary>Technical evidence</summary><pre>{JSON.stringify(item.payload, null, 2)}</pre></details>
    </article>)}
  </section>;
}

function StoryCanvas({ run, source, people, participantName }: { run: SimulationRun; source: InspectionActivity; people: Map<string, string>; participantName: string }) {
  const [story, setStory] = useState<InspectionStory | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const decisionHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (detail === 'decision') { decisionHeading.current?.scrollIntoView({ block: 'nearest' }); decisionHeading.current?.focus({ preventScroll: true }); }
  }, [detail]);
  useEffect(() => {
    const controller = new AbortController();
    simulationService.inspectionStory(run.run_id, source.sequence, controller.signal)
      .then(value => { if (!controller.signal.aborted) setStory(value); })
      .catch(problem => { if (!controller.signal.aborted) setError(problemText(problem)); });
    return () => controller.abort();
  }, [run.run_id, source.sequence, retry]);
  const name = (id: string) => people.get(id) || id || 'Unknown person';
  const sender = name(text(source.payload.sender_id));
  const linked = story?.link_status === 'linked';
  const nodes = linked && story ? branches(story, run.participant_id, name) : [];
  const visible = showAll ? nodes : nodes.slice(0, 4);
  const selectedNode = nodes.find(node => node.id === detail);
  const sends = linked && story ? story.actions.filter(item => item.event_type === 'MessageDelivered' && item.payload.sender_id === run.participant_id) : [];
  const contacted = new Set(sends.filter(item => !item.channel_id).map(item => text(item.payload.recipient_id)));
  const incomplete = !!(story?.actions_truncated || story?.beat?.events_truncated || story?.missing_operation_ids.length);
  const decisions = story?.beat?.events.filter(event => ['controller', 'hold', 'focus_revision', 'correction', 'outcome_assessment'].includes(event.stage)) || [];
  return <>
    <div className="sv-stage" aria-label={`Recorded response to ${sender}'s message`}>
      <div className="sv-source">
        <p className="sv-step"><span>1</span>A teammate says</p>
        <button className="sv-person" onClick={() => setDetail('source')} aria-expanded={detail === 'source'}><span className="sv-avatar">{initials(sender)}</span><strong>{sender}</strong><span className="sv-meta">{stamp(source.occurred_at)}</span></button>
        <button className="sv-bubble" onClick={() => setDetail('source')} aria-label={`Read full message from ${sender}`}><span className="sv-quote">“</span><span className="sv-excerpt">{text(source.payload.text) || 'Incoming message'}</span><span className="sv-read">Read message <ArrowRight className="size-3" /></span></button>
      </div>
      <div className="sv-flow-arrow" aria-hidden="true"><span /><ArrowRight /></div>
      <div className="sv-self">
        <p className="sv-step"><span>2</span>{participantName}’s decision</p>
        <button className="sv-core" onClick={() => setDetail('decision')} aria-expanded={detail === 'decision'} aria-label={`Inspect ${participantName}'s recorded decision`}><span className="sv-orbit" /><span className="sv-core-inner"><Bot strokeWidth={1.4} /></span></button>
        <h3>{participantName}</h3><button className="sv-text-button" onClick={() => setDetail('decision')}>Why this action? <ArrowRight className="size-3" /></button>
      </div>
      <div className={`sv-flow-arrow ${!nodes.length ? 'sv-flow-unconfirmed' : ''}`} aria-hidden="true"><span /><ArrowRight /></div>
      <div className="sv-destinations">
        <p className="sv-step"><span>3</span>Recorded actions</p>
        {visible.length ? <ul className="sv-branches">{visible.map(node => <li key={node.id}><button className={`sv-destination ${detail === node.id ? 'sv-selected' : ''}`} aria-expanded={detail === node.id} onClick={() => setDetail(node.id)}><span className={`sv-avatar ${node.kind === 'work' ? 'sv-work-avatar' : ''}`}>{node.kind === 'person' ? initials(node.name) : <FileText className="size-5" />}</span><span><strong>{node.name}</strong><small>{node.caption}</small></span><ArrowRight className="size-4" /></button></li>)}</ul> : <div className="sv-no-link"><CircleHelp className="size-7" /><p>{error ? 'Story unavailable' : !story ? 'Loading what happened…' : !linked ? 'Response details unavailable' : 'No external action shown'}</p><small>{!story && !error ? 'Reading the saved history' : 'The saved history may be incomplete.'}</small></div>}
        {nodes.length > 4 && <button className="sv-text-button sv-more" onClick={() => setShowAll(value => !value)}>{showAll ? 'Show fewer' : `Show ${nodes.length - 4} more`}<ChevronDown className="size-4" /></button>}
      </div>
    </div>
    <div className="sv-outcome" role="status"><span className="sv-outcome-icon">{sends.length ? <Check className="size-5" /> : <CircleHelp className="size-5" />}</span><div><strong>{sends.length ? `${sends.length} message${sends.length === 1 ? '' : 's'} sent${contacted.size ? ` · ${contacted.size} colleague${contacted.size === 1 ? '' : 's'} contacted` : ''}` : linked && nodes.length ? `${nodes.length} recorded action group${nodes.length === 1 ? '' : 's'}` : 'Outcome not yet established'}</strong><p>{incomplete ? 'Partial retained evidence. ' : ''}Actions shown are recorded. Later replies and completed work are not confirmed here.</p></div></div>
    {error && <div className="sv-inline-error" role="alert"><p>{error}</p><Button variant="outline" onClick={() => { setError(''); setRetry(value => value + 1); }}>Retry story</Button></div>}
    {detail === 'source' && <Evidence title={`Message from ${sender}`} records={[source]} onClose={() => setDetail(null)} />}
    {selectedNode && <Evidence title={selectedNode.name} records={selectedNode.records} onClose={() => setDetail(null)} />}
    {detail === 'decision' && <section className="sv-evidence" aria-label="Recorded decision"><div className="sv-evidence-heading"><h3 ref={decisionHeading} tabIndex={-1}>{participantName}’s recorded decision</h3><Button variant="ghost" size="sm" aria-label="Close decision" onClick={() => setDetail(null)}><X className="size-4" /></Button></div>{decisions.length ? <ol className="sv-decisions">{decisions.map((event, index) => <li key={`${event.sequence}:${index}`}><strong>{event.title || readable(event.stage)}</strong><p>{event.summary}</p></li>)}</ol> : <p>{story ? 'No unique decision trace is available for this message.' : 'Loading decision details…'}</p>}
      {linked && <details><summary>Sapien’s assessment — not an independent verdict</summary><dl>{Object.entries(story?.beat?.assessment || {}).map(([key, value]) => <div key={key}><dt>{readable(key)}</dt><dd>{typeof value === 'string' ? value : JSON.stringify(value)}</dd></div>)}</dl></details>}
    </section>}
    <details className="sv-technical"><summary>How this story is linked</summary><p>Message → selected decision cycle → exact action identifiers. Actions from that cycle may have other purposes; the links do not prove they resolved this message. Later replies are not inferred from timing.</p><p>{story ? `Link: ${readable(story.link_status)}. ${story.reason ? readable(story.reason) : ''} Latest evidence snapshot: ${story.through}.` : 'Waiting for the recorded trace.'}</p>{story && <details><summary>All linked action evidence</summary><pre>{JSON.stringify(story.actions, null, 2)}</pre></details>}</details>
  </>;
}

function SimulationIntroduction({ spec, overview, participant, role, base, loading }: {
  spec: InspectionSpecificationResponse | null; overview: InspectionOverviewDetails | null;
  participant: string; role?: string; base: string; loading: boolean;
}) {
  const stages = spec?.specification?.overview?.stages || [];
  const checks = stages.length ? stages.map(stage => ({ id: stage.stage_id, title: stage.title }))
    : (overview?.objectives || []).map(check => ({ id: check.expectation_id, title: check.title }));
  const connections = spec?.specification?.connection_seeds.map(connection => connection.name).join(' + ');
  return <section className="sv-introduction" aria-labelledby="sv-introduction-title">
    <div className="sv-intro-heading"><h2 id="sv-introduction-title">{participant} joins a simulated team{role ? ` as its ${role}` : ''}.</h2><Link to={`${base}/test-case`}>Test case <ArrowRight className="size-4" /></Link></div>
    <div className="sv-world-diagram" role="group" aria-label="Simulation setup: teammates talk with the Sapien, who acts in simulated workplace tools">
      <div className="sv-world-node"><span className="sv-world-art sv-team-art"><svg viewBox="0 0 140 90" fill="none" aria-hidden="true"><path d="M28 64H112M70 55V74" stroke="currentColor" strokeOpacity=".35" /><circle cx="28" cy="26" r="11" fill="currentColor" fillOpacity=".13" stroke="currentColor" /><path d="M9 60V53C9 35 47 35 47 53V60" stroke="currentColor" strokeWidth="1.5" /><circle cx="112" cy="26" r="11" fill="currentColor" fillOpacity=".13" stroke="currentColor" /><path d="M93 60V53C93 35 131 35 131 53V60" stroke="currentColor" strokeWidth="1.5" /><circle cx="70" cy="19" r="13" fill="var(--card)" stroke="currentColor" strokeWidth="1.5" /><path d="M48 60V49C48 30 92 30 92 49V60" fill="var(--card)" stroke="currentColor" strokeWidth="1.5" /><rect x="48" y="70" width="44" height="15" rx="7" fill="currentColor" fillOpacity=".12" /><path d="M59 77H81" stroke="currentColor" strokeOpacity=".5" /></svg></span><strong>Simulated teammates</strong></div>
      <div className="sv-world-connector" aria-hidden="true"><span>Conversations</span><svg className="sv-world-line" viewBox="0 0 100 24" preserveAspectRatio="none"><path d="M2 12H98M8 6L2 12L8 18M92 6L98 12L92 18" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg></div>
      <div className="sv-world-node sv-world-self"><span className="sv-world-art"><Bot strokeWidth={1.4} aria-hidden="true" /></span><strong>{participant}</strong><small>AI Sapien</small></div>
      <div className="sv-world-connector" aria-hidden="true"><span>Actions</span><svg className="sv-world-line" viewBox="0 0 100 24" preserveAspectRatio="none"><path d="M2 12H98M8 6L2 12L8 18M92 6L98 12L92 18" fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" /></svg></div>
      <div className="sv-world-node"><span className="sv-world-art"><svg viewBox="0 0 140 90" fill="none" aria-hidden="true"><rect x="5" y="7" width="130" height="77" rx="8" stroke="currentColor" strokeWidth="1.5" /><path d="M5 24H135M49 24V84M92 24V84" stroke="currentColor" strokeOpacity=".3" /><circle cx="15" cy="16" r="2" fill="currentColor" /><path d="M24 16H53" stroke="currentColor" strokeOpacity=".5" /><g fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeOpacity=".4"><rect x="13" y="33" width="28" height="16" rx="3" /><rect x="13" y="56" width="28" height="16" rx="3" /><rect x="57" y="33" width="27" height="16" rx="3" /><rect x="100" y="33" width="27" height="16" rx="3" /></g><path d="M18 39H34M18 62H33M62 39H77M105 39H120" stroke="currentColor" strokeOpacity=".5" /></svg></span><strong className="capitalize">{connections || 'Workplace tools'}</strong><small>Simulated workspace</small></div>
    </div>
    <div className="sv-testing"><span className="sv-eyebrow">Testing</span>{checks.length ? <ol>{checks.slice(0, 3).map((check, index) => <li key={check.id}><span>{index + 1}</span>{check.title}</li>)}</ol> : <p>{loading ? 'Loading…' : 'See the full test case'}</p>}{checks.length > 3 && <Link to={`${base}/test-case`}>+{checks.length - 3} more</Link>}</div>
  </section>;
}

export function SimulationVisualOverview({ run }: { run: SimulationRun }) {
  const [overview, setOverview] = useState<InspectionOverviewDetails | null>(null);
  const [spec, setSpec] = useState<InspectionSpecificationResponse | null>(null);
  const [page, setPage] = useState<InspectionActivityPage | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const paging = useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    paging.current?.abort(); setLoading(true); setError(''); setOverview(current => current?.run_id === run.run_id ? current : null); setSpec(current => current?.run_id === run.run_id ? current : null); setPage(null); setIndex(0);
    async function load() {
      const data = await simulationService.inspectionOverview(run.run_id, undefined, controller.signal);
      if (!controller.signal.aborted) setOverview(data);
      await Promise.all([
        simulationService.inspectionSpecification(run.run_id, { through: data.through }, controller.signal)
          .then(definition => { if (!controller.signal.aborted) setSpec(definition); }),
        simulationService.inspectionJourney(run.run_id, { through: data.through, order: 'desc', category: 'message', limit: 40 }, controller.signal)
          .then(messages => { if (!controller.signal.aborted) setPage(messages); }),
      ]);
    }
    void load().catch(problem => { if (!controller.signal.aborted) setError(problemText(problem)); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); paging.current?.abort(); };
  }, [run.run_id, refresh]);
  async function loadEarlier(advance = false) {
    if (!page?.has_more || page.next_before == null || loading) return;
    const controller = new AbortController(); paging.current = controller; setLoading(true); setError('');
    try {
      const next = await simulationService.inspectionJourney(run.run_id, { through: page.through, before: page.next_before, order: 'desc', category: 'message', limit: 40 }, controller.signal);
      if (!controller.signal.aborted) {
        const currentCount = page.items.filter(item => item.event_type === 'MessageDelivered' && item.payload.recipient_id === run.participant_id && item.payload.sender_id !== run.participant_id).length;
        const hasIncoming = next.items.some(item => item.event_type === 'MessageDelivered' && item.payload.recipient_id === run.participant_id && item.payload.sender_id !== run.participant_id);
        setPage({ ...next, items: [...page.items, ...next.items] });
        if (advance && hasIncoming) setIndex(currentCount);
      }
    } catch (problem) { if (!controller.signal.aborted) setError(problemText(problem)); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  }
  const people = new Map((spec?.specification?.scenario.initial_world.people || []).map(person => [person.person_id, person.name]));
  const participant = people.get(run.participant_id || '') || (run.sapien_id ? `Sapien ${run.sapien_id}` : 'The participant');
  const role = spec?.specification?.scenario.initial_world.people.find(person => person.person_id === run.participant_id)?.facts.find(fact => fact.key === 'role')?.text;
  const sources = (page?.items || []).filter(item => item.event_type === 'MessageDelivered' && item.payload.recipient_id === run.participant_id && item.payload.sender_id !== run.participant_id);
  const source = sources[index];
  const base = `/admin/simulations/${encodeURIComponent(run.run_id)}/world`;
  const phases = spec?.specification?.overview?.phases || [];
  const now = Date.parse(overview?.run_state?.simulated_time || run.simulated_time);
  return <div className="sv-overview">
    <header className="sv-header"><div><p className="sv-eyebrow">A simulated workplace</p><h1 className="capitalize">{readable(run.case_id)}<span>.</span></h1></div><div className="sv-run-state"><span className="sv-status">{readable(overview?.run_status || run.status)}</span><small>Simulated time · {stamp(overview?.run_state?.simulated_time || run.simulated_time)}</small><Button variant="ghost" size="sm" disabled={loading} onClick={() => setRefresh(value => value + 1)}><RefreshCw className="mr-2 size-3.5" />{loading ? 'Loading…' : 'Refresh'}</Button></div></header>
    {error && <p role="alert" className="sv-inline-error">{error}</p>}
    <div className="mb-4"><SimulationPurpose /></div>
    <SimulationIntroduction spec={spec} overview={overview} participant={participant} role={role} base={base} loading={loading} />
    <div className="sv-story-intro"><h2>What did {participant} do?</h2></div>
    <section className="sv-story" aria-label="Guided response story">
      <div className="sv-story-toolbar"><div><span className="sv-eyebrow">One exchange, step by step</span><p>Read the message. Follow the arrows. Select anyone to see more.</p></div><div className="sv-navigation"><Button variant="outline" size="sm" aria-label="Previous story, newer message" disabled={!index || loading} onClick={() => setIndex(value => value - 1)}><ArrowLeft className="size-4" /><span>Previous</span></Button><span className="sv-story-count">{source ? `${index + 1} / ${sources.length}` : '—'}</span><Button variant="outline" size="sm" aria-label="Next story, older message" disabled={!sources.length || (index >= sources.length - 1 && !page?.has_more) || loading} onClick={() => { if (index < sources.length - 1) setIndex(value => value + 1); else void loadEarlier(true); }}><span>Next</span><ArrowRight className="size-4" /></Button></div></div>
      {source ? <StoryCanvas key={`${run.run_id}:${source.sequence}:${refresh}`} run={run} source={source} people={people} participantName={participant} /> : <div className="sv-empty"><MessageSquare className="size-10" /><h2>{loading ? 'Opening the recorded exchanges…' : 'No incoming messages in this portion'}</h2><p>{loading ? 'The story will appear when the saved evidence is loaded.' : page?.has_more ? 'Load earlier messages to explore another part of the run.' : 'Messages will appear here once recorded. You can still explore the scenario below.'}</p></div>}
      <div className="sv-story-picker"><label htmlFor="sv-story-select">Browse exchanges</label><select id="sv-story-select" disabled={!sources.length || loading} value={source ? String(index) : ''} onChange={event => setIndex(Number(event.target.value))}>{!sources.length && <option value="">No exchanges loaded</option>}{sources.map((item, position) => <option key={item.record_id} value={position}>{people.get(text(item.payload.sender_id)) || text(item.payload.sender_id)} · {stamp(item.occurred_at)} · {text(item.payload.text).slice(0, 65)}</option>)}</select>{page?.has_more && <Button variant="outline" size="sm" disabled={loading} onClick={() => void loadEarlier()}>{loading ? 'Loading…' : 'Load earlier exchanges'}</Button>}<small>Newest first · {sources.length} exchanges loaded</small></div>
    </section>
    <div className="sv-explore"><h2>Explore the workplace</h2><div>{[['messages', 'Conversations'], ['jira', 'Project board'], ['sapien', 'All activity'], ['results', 'Verified results']].map(([path, title]) => <Link key={path} to={`${base}/${path}`}>{title}<ArrowRight className="size-4" /></Link>)}</div></div>
    <details className="sv-background"><summary><span>Timeline & results</span><span>Explore this run <ChevronDown className="size-4" /></span></summary><div className="sv-background-content"><h3>Project calendar</h3><p className="sv-meta">Time reached is not work completed.</p>{phases.length ? <ol className="sv-phases">{phases.map(phase => { const current = now >= Date.parse(phase.start_at) && now < Date.parse(phase.end_at); return <li key={phase.phase_id} aria-current={current ? 'step' : undefined}><span /><strong>{phase.title}</strong><small>{current ? 'Current period' : now >= Date.parse(phase.end_at) ? 'Earlier period' : 'Upcoming period'}</small></li>; })}</ol> : <p>No phase timeline recorded.</p>}<h3>Independent checks</h3>{overview?.objectives.length ? <ul className="sv-checks">{overview.objectives.map(objective => <li key={objective.expectation_id}><span>{objective.title}</span><strong>{readable(objective.verdict)}</strong></li>)}</ul> : <p>No evaluated checks are available.</p>}<p className="sv-meta">A complete list of unresolved work is not available here. Inspect a story’s assessment or conversations for remaining work.</p></div></details>
    <footer className="sv-footer"><span>Recorded activity from this simulation. Snapshot #{overview?.through ?? '—'}{overview?.partial ? ' · Partial evidence' : ''}.</span><Link to={`${base}/diagnostics`}>Technical diagnostics</Link></footer>
  </div>;
}
