import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowRight, Bell, MessageSquare, RefreshCw, Wrench } from 'lucide-react';
import { Button } from '../ui/button';
import { DiagnosticText } from '../analyse/DiagnosticPrimitives';
import type { SimulationRun } from '../../types/simulationTypes';
import { SimulationRecordReader, activityOrigin } from './SimulationRecordReader';
import { activityLabel, groupActivity, simulationSectionPath, simulationText, simulationTime, toolOutcome } from './simulationOverviewModel';
import { useSimulationOverview } from './useSimulationOverview';
import '../../../styles/simulation-visual-overview.css';

export function SimulationVisualOverview({ run, knownSapienName }: { run: SimulationRun; knownSapienName?: string | null }) {
  const { snapshot, loading, loadingMore, error, contextError, refresh, loadMore } = useSimulationOverview(run.run_id);
  const [params, setParams] = useSearchParams();
  const [mobileReader, setMobileReader] = useState(() => !!params.get('activity'));
  const reader = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const overview = snapshot?.overview;
  const spec = snapshot?.spec?.specification;
  const page = snapshot?.page;
  const participantId = page?.participant_id || overview?.participant_id || run.participant_id;
  const people = new Map((spec?.scenario.initial_world.people || []).map(person => [person.person_id, person.name]));
  if (knownSapienName && participantId) people.set(participantId, knownSapienName);
  const channels = new Map((spec?.scenario.initial_world.channels || []).map(channel => [channel.channel_id, channel.title]));
  const participant = knownSapienName || people.get(participantId || '') || (run.sapien_id != null ? `Sapien #${run.sapien_id}` : 'The participant');
  const role = spec?.scenario.initial_world.people.find(person => person.person_id === participantId)?.facts.find(fact => fact.key === 'role')?.text;
  const groups = groupActivity(page?.items || []);
  const selectedKey = params.get('activity');
  const selected = selectedKey ? groups.find(group => group.key === selectedKey) : groups[0];
  function href(section: string) {
    return simulationSectionPath(run, section, knownSapienName, params.get('returnTo'));
  }
  function select(key: string) {
    setParams(current => { const next = new URLSearchParams(current); next.set('activity', key); return next; }, { replace: true });
    setMobileReader(true);
    requestAnimationFrame(() => reader.current?.focus({ preventScroll: true }));
  }
  function backToList() {
    setMobileReader(false);
    requestAnimationFrame(() => (list.current?.querySelector('[aria-current=true]') as HTMLButtonElement | null)?.focus({ preventScroll: true }));
  }
  const evaluationText = overview?.evaluation?.available ? 'A saved evaluation is available.'
    : overview?.evaluation?.reason === 'run_not_finished' ? 'No final evaluation yet; the run has not finished.'
    : overview?.evaluation?.reason === 'historical_snapshot' ? 'No evaluation is available for this evidence snapshot.'
    : overview?.evaluation ? 'No saved evaluation is available.' : 'Open Results to inspect any saved checks.';

  return <div className="sv-overview">
    <div className="sv-intro"><div><p>See how {participant} behaves at work in a simulated workplace.</p>{role && <p className="sv-meta">Assigned role: {role}</p>}</div><Button type="button" variant="outline" onClick={refresh} disabled={loading}><RefreshCw size={16} aria-hidden="true" />{loading ? 'Refreshing…' : 'Refresh records'}</Button></div>
    <div className="sv-workplace-links" aria-label="Explore this simulation">
      <Link to={href('messages')}><strong>Messages (Teams)</strong><span>Read the team’s exchanges</span><ArrowRight size={16} aria-hidden="true" /></Link>
      <Link to={href('jira')}><strong>Jira</strong><span>Inspect issues and changes</span><ArrowRight size={16} aria-hidden="true" /></Link>
      <Link to={href('sapien')}><strong>Sapien activity</strong><span>Browse messages and tool use</span><ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
    {error && <div className="sv-error" role="alert"><p>{error} {page ? 'Loaded records remain available.' : ''}</p><Button type="button" variant="outline" disabled={loading} onClick={refresh}>Retry records</Button></div>}
    <div className="sv-section-heading"><div><h2>Recorded activity</h2><p className="sv-meta">{overview ? `Snapshot #${overview.through} · newest first · simulated times${overview.partial ? ' · partial retained evidence' : ''}` : 'Messages and tool activity involving this Sapien'}</p></div><Link to={href('sapien')}>All activity<ArrowRight size={15} aria-hidden="true" /></Link></div>
    <section className="sv-activity" aria-label="Recorded activity reader" aria-busy={loading} data-mobile-reader={mobileReader}>
      {!page && !groups.length ? <div className="sv-empty" role="status"><h3>{loading ? 'Loading recorded activity…' : 'Activity could not be loaded'}</h3><p>{loading ? 'Reading the run’s saved messages and tool records.' : 'Retry the records above, or open Messages (Teams).'}</p></div>
        : !groups.length ? <div className="sv-empty"><MessageSquare size={28} aria-hidden="true" /><h3>No participant activity in this snapshot</h3><p>{participantId ? 'Refresh after activity is recorded, or explore the test case.' : 'This run has no recorded participant identity. Open the test case for its setup.'}</p><Link to={href('test-case')}>Explore the test case<ArrowRight size={15} aria-hidden="true" /></Link>{page?.has_more && <Button type="button" variant="outline" disabled={loading || loadingMore} onClick={() => void loadMore()}>Load older records</Button>}</div>
        : <>
          <div className="sv-activity-list" ref={list}>
            <p className="sv-list-label">{groups.length} {page?.has_more ? 'recent ' : ''}entries loaded</p>
            <ul>{groups.map(group => {
              const item = group.item;
              const outcome = toolOutcome(item);
              const Icon = item.event_type === 'MessageDelivered' ? MessageSquare : item.event_type === 'ToolActivity' ? Wrench : Bell;
              return <li key={group.key}><button type="button" aria-current={selected?.key === group.key ? 'true' : undefined} aria-controls="simulation-activity-reader" onClick={() => select(group.key)}>
                <span className="sv-list-kind"><Icon size={15} aria-hidden="true" />{activityLabel(item, participantId)}</span>
                <strong>{activityOrigin(item, people, channels)}</strong>
                <span className="sv-list-preview">{simulationText(item.payload.text) || outcome?.label || 'Open the recorded details'}</span>
                <time dateTime={item.occurred_at}>{simulationTime(item.occurred_at)}</time>
              </button></li>;
            })}</ul>
            {page?.has_more && <Button type="button" className="sv-load-more" variant="outline" disabled={loading || loadingMore} onClick={() => void loadMore()}>{loadingMore ? 'Loading older records…' : 'Load older records'}</Button>}
          </div>
          <div className="sv-reader" id="simulation-activity-reader" tabIndex={-1} ref={reader}>
            <button type="button" className="sv-back" onClick={backToList}><ArrowLeft size={16} aria-hidden="true" />Back to activity</button>
            {selected ? <SimulationRecordReader key={`${selected.key}:${overview?.through}`} records={selected.records} runId={run.run_id} participant={participantId} names={people} channels={channels} hrefFor={href} />
              : <div className="sv-empty"><h3>Selected entry is outside the loaded records</h3><p>Choose another entry{page?.has_more ? ' or load older records to find it' : ''}.</p>{page?.has_more && <Button type="button" variant="outline" onClick={() => void loadMore()} disabled={loading || loadingMore}>{loadingMore ? 'Loading…' : 'Load older records'}</Button>}</div>}
          </div>
        </>}
    </section>
    <p className="sv-load-status" role="status">{loadingMore ? 'Loading older records…' : ''}</p>
    <div className="sv-context">
      <section><h2>The setting</h2>
        {spec?.overview?.mission ? <DiagnosticText text={spec.overview.mission} limit={210} /> : <p className="sv-muted">{loading ? 'Loading the saved test case…' : 'The test case contains the workplace setup and expected behaviour.'}</p>}
        {contextError && <p className="sv-context-error">{contextError}</p>}<Link to={href('test-case')}>Read the test case<ArrowRight size={15} aria-hidden="true" /></Link>
      </section>
      <section><h2>Results</h2><p>{evaluationText}</p><p className="sv-muted">Recorded activity and evaluation are separate: sending a message or using a tool does not itself establish success.</p><Link to={href('results')}>Inspect results & evidence<ArrowRight size={15} aria-hidden="true" /></Link></section>
    </div>
    <footer className="sv-footer"><span>Read-only inspection. Refresh records to capture newer evidence.</span><Link to={href('diagnostics')}>Technical diagnostics</Link></footer>
  </div>;
}
