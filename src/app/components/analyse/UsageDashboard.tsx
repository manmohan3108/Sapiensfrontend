import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { AiUsageKind, AiUsageResponse, UsageTimeBasis } from '../../types/llmUsageTypes';
import '../../../styles/analyse-usage.css';

export interface UsageState {
  global: AiUsageResponse | null;
  sapien: AiUsageResponse | null;
  errors: Array<{ scope: string; message: string }>;
  loading: boolean;
}
const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const label = (text: string) => text.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());

const USAGE_REFRESH_MS = 30_000;

function refreshDelay(sources: Array<AiUsageResponse | null>): number {
  const now = Date.now();
  const boundaries: number[] = [];
  for (const data of sources) {
    for (const row of data?.availability?.rows ?? []) {
      if (row.time_basis === 'real_utc') {
        boundaries.push(Date.parse(row.resets_at));
        if (row.burst?.next_call_at) boundaries.push(Date.parse(row.burst.next_call_at));
      }
      for (const wait of row.blocking) {
        if (wait.time_basis === 'real_utc') boundaries.push(Date.parse(wait.retry_at));
      }
    }
    for (const wait of Object.values(data?.availability?.shared_waits ?? {})) {
      if (wait.time_basis === 'real_utc') boundaries.push(Date.parse(wait.retry_at));
    }
    if (data?.runtime?.earliest_quota_retry_at) boundaries.push(Date.parse(data.runtime.earliest_quota_retry_at));
  }
  // Past/invalid gates fall back to normal polling instead of causing a retry loop.
  return Math.max(1_000, Math.min(USAGE_REFRESH_MS, ...boundaries
    .filter(time => Number.isFinite(time) && time > now).map(time => time - now + 100)));
}

function useUsageRefresh(state: UsageState, kind: AiUsageKind, enabled: boolean, onRefresh: (kind: AiUsageKind) => void) {
  const { loading, sapien, global } = state;
  useEffect(() => {
    if (!enabled || loading) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (document.visibilityState === 'visible') {
      timer = setTimeout(() => {
        if (document.visibilityState === 'visible') onRefresh(kind);
      }, refreshDelay([sapien, global]));
    }
    const onVisibilityChange = () => {
      clearTimeout(timer);
      if (document.visibilityState === 'visible') onRefresh(kind);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, loading, sapien, global, kind, onRefresh]);
}

function UsageTime({ value, basis = 'real_utc' }: { value: string; basis?: UsageTimeBasis }) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <span>Time unavailable</span>;
  const formatted = new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit',
    timeZoneName: 'short', ...(basis === 'simulated_utc' ? { timeZone: 'UTC' } : {}),
  }).format(date);
  return <time dateTime={value}>{formatted}{basis === 'simulated_utc' ? ' (simulation)' : ''}</time>;
}

function Bars({ values, empty }: { values: Record<string, number>; empty: string }) {
  const rows = Object.entries(values).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...rows.map(([, count]) => count));
  return rows.length ? <dl className="usage-bars">{rows.map(([key, count]) => <div key={key}>
    <dt>{label(key)}</dt><dd>{number.format(count)}</dd>
    <span className="usage-track" aria-hidden="true"><span style={{ width: `${Math.max(0, count) / max * 100}%` }} /></span>
  </div>)}</dl> : <p className="usage-muted">{empty}</p>;
}

function Allowances({ data }: { data: AiUsageResponse }) {
  const snapshot = data.availability;
  if (!snapshot) return <p className="usage-muted">{data.runtime?.simulation_owned
    ? 'Personal allowance follows the simulation clock and is not available in this real-day view.'
    : 'Live allowance unavailable. Refresh to try again; recorded usage is shown separately.'}</p>;
  return <>
    <p className="usage-note">Snapshot: <UsageTime value={snapshot.as_of} />. Updates automatically while visible.</p>
    <dl className="usage-balances">{snapshot.rows.map(row => <div key={row.name}>
      <dt>{label(row.name)}</dt>
      <dd>
        <strong>{number.format(row.available_now)} {row.name === 'conversation' ? 'personal calls available' : 'available now'}</strong>
        <span>{number.format(row.remaining)} left today · {number.format(row.consumed)} / {number.format(row.limit)} allowance used</span>
        <span>Daily allowance resets: <UsageTime value={row.resets_at} basis={row.time_basis} /></span>
        {row.burst && <span>Saved calls: {number.format(row.burst.available)} / {number.format(row.burst.capacity)} · adds {number.format(row.burst.refill_per_hour)} per hour continuously</span>}
        {row.blocking.filter(wait => wait.period !== 'daily' || (wait.scope === 'global' && data.scope !== 'global')).map(wait => <span className="usage-wait" key={`${wait.scope}-${wait.period}`}>
          {wait.scope === 'global' ? 'Shared daily limit' : wait.period === 'burst' ? 'Next call credit' : 'Daily limit resets'}: <UsageTime value={wait.retry_at} basis={wait.time_basis} />
        </span>)}
      </dd>
    </div>)}</dl>
    {!snapshot.rows.length && <p className="usage-muted">No daily allowances configured.</p>}
    {Object.keys(snapshot.shared_waits).length > 0 && data.scope !== 'global' && <p className="usage-note">
      Shared limits reached: {Object.entries(snapshot.shared_waits).map(([tier, wait], index) => <span key={tier}>{index > 0 && '; '}{label(tier)} until <UsageTime value={wait.retry_at} basis={wait.time_basis} /></span>)}. Calls using these tiers must wait.
    </p>}
    {snapshot.rows.some(row => row.burst) && <p className="usage-note">No hourly reset. Credits accumulate up to the saved-call limit; the daily reset does not refill them.</p>}
    <p className="usage-note">Allowance counts admitted attempts, including failed calls. History counts successful calls.</p>
  </>;
}

function RuntimeStatus({ data }: { data: AiUsageResponse }) {
  const runtime = data.runtime;
  if (!runtime) return null;
  return <div className="usage-runtime">
    {runtime.activity_state !== 'active' && <p><strong>{label(runtime.activity_state)}</strong> · Allowance availability does not change this activity state.</p>}
    {runtime.quota_waiting_jobs != null && runtime.quota_waiting_jobs > 0 && <p>{number.format(runtime.quota_waiting_jobs)} queued {runtime.quota_waiting_jobs === 1 ? 'job retains its' : 'jobs retain their'} earlier quota retry time. {runtime.earliest_quota_retry_at
      ? <>Earliest retry not before <UsageTime value={runtime.earliest_quota_retry_at} />. </>
      : <>Earliest retry time unavailable. </>}Allowance changes do not reschedule jobs; pauses and shared limits still apply.</p>}
    {runtime.quota_waiting_jobs === null && <p className="usage-muted">Queued quota-wait status unavailable.</p>}
  </div>;
}

function History({ data }: { data: AiUsageResponse }) {
  const days = [...data.history].sort((a, b) => a.date.localeCompare(b.date));
  const max = Math.max(1, ...days.map(day => day.total));
  return <section className="usage-history"><div className="usage-section-title"><h4>Successful-call history</h4><span className="usage-muted">Latest {days.length} recorded days · UTC</span></div>
    {!days.length ? <p className="usage-muted">No recorded days returned.</p> : <dl className="usage-history-bars">{days.map(day => <div key={day.date}>
      <dt>{day.date}</dt><dd><span className="usage-track" aria-hidden="true"><span style={{ width: `${Math.max(0, day.total) / max * 100}%` }} /></span><strong>{number.format(day.total)}</strong></dd>
    </div>)}</dl>}
  </section>;
}

export function UsageDashboard({ states, sapienId, sapienName, open, onRefresh }: {
  states: Record<AiUsageKind, UsageState>; sapienId: string; sapienName: string; open: boolean; onRefresh: (kind: AiUsageKind) => void;
}) {
  const [kind, setKind] = useState<AiUsageKind>('llm');
  const state = states[kind];
  const data = state.sapien;
  useUsageRefresh(state, kind, open, onRefresh);
  return <div className="usage-dashboard">
    <div className="usage-owner"><span>{sapienName} <span className="usage-muted">· ID {sapienId}</span></span><button type="button" disabled={state.loading} onClick={() => onRefresh(kind)}><RefreshCw size={16} aria-hidden="true" />{state.loading ? 'Refreshing…' : 'Refresh'}</button></div>
    <div className="usage-kinds" role="group" aria-label="AI resource">
      {(['llm', 'embedding'] as const).map(resource => <button key={resource} type="button" aria-pressed={kind === resource} onClick={() => {
        setKind(resource);
        if (kind !== resource && !states[resource].loading) onRefresh(resource);
      }}>
        <span>{resource === 'llm' ? 'Language models' : 'Embeddings'}</span>
        <strong>{states[resource].sapien ? number.format(states[resource].sapien!.today_total) : states[resource].loading ? '…' : '—'} <small>successful calls today</small></strong>
      </button>)}
    </div>
    <div className="usage-section-title"><h3>{kind === 'llm' ? 'Language-model calls' : 'Embedding calls'}</h3>{data && <span className="usage-muted">{data.today} · real UTC day</span>}</div>
    {state.errors.map(error => <div key={error.scope} role="alert" className="usage-error"><strong>{error.scope} usage unavailable</strong><p>{error.message}</p><p>Use Refresh to try again.</p></div>)}
    <div role="status" aria-live="polite">{state.loading && <p className={data ? 'sr-only' : 'usage-muted'}>{data ? 'Refreshing snapshot…' : 'Loading recorded usage…'}</p>}</div>
    {data && <>
      <RuntimeStatus data={data} />
      <div className="usage-main-grid">
        <section><h4>Current allowance</h4><Allowances data={data} /></section>
        <section><h4>Successful calls by purpose</h4><Bars values={data.today_by_purpose} empty="No successful calls attributed to a purpose today." /></section>
      </div>
      <History data={data} />
    </>}
    {state.global && <details className="usage-global"><summary>Shared system usage <span>{number.format(state.global.today_total)} successful calls · {state.global.today} UTC</span></summary>
      <p className="usage-muted">All Sapiens and system calls share these real-UTC daily limits.</p>
      <div className="usage-main-grid"><section><h4>Shared allowance</h4><Allowances data={state.global} /></section><section><h4>Global purposes</h4><Bars values={state.global.today_by_purpose} empty="No global purpose usage recorded." /></section></div>
    </details>}
  </div>;
}
