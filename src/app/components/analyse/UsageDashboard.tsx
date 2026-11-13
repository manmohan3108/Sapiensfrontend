import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { AiUsageKind, AiUsageResponse } from '../../types/llmUsageTypes';
import '../../../styles/analyse-usage.css';

export interface UsageState {
  global: AiUsageResponse | null;
  sapien: AiUsageResponse | null;
  errors: Array<{ scope: string; message: string }>;
  loading: boolean;
}
const number = new Intl.NumberFormat();
const label = (text: string) => text.replaceAll('_', ' ').replace(/\b\w/g, char => char.toUpperCase());

function Bars({ values, empty }: { values: Record<string, number>; empty: string }) {
  const rows = Object.entries(values).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...rows.map(([, count]) => count));
  return rows.length ? <dl className="usage-bars">{rows.map(([key, count]) => <div key={key}>
    <dt>{label(key)}</dt><dd>{number.format(count)}</dd>
    <span className="usage-track" aria-hidden="true"><span style={{ width: `${Math.max(0, count) / max * 100}%` }} /></span>
  </div>)}</dl> : <p className="usage-muted">{empty}</p>;
}

function TierComparison({ data, global = false }: { data: AiUsageResponse; global?: boolean }) {
  const limits = global ? data.global_limits ?? data.limits ?? {} : data.sapien_limits ?? {};
  const keys = [...new Set([...Object.keys(limits), ...Object.keys(data.today_by_tier)])];
  return <div>
    <div className="usage-column-label"><span>Tier</span><span>Today / daily limit</span></div>
    <dl className="usage-tiers">{keys.map(key => {
      const used = data.today_by_tier[key] ?? 0;
      const limit = limits[key];
      return <div key={key}><dt>{label(key)}</dt><dd><strong>{number.format(used)}</strong><span> / {limit == null ? 'Not provided' : number.format(limit)}</span></dd></div>;
    })}</dl>
    {!keys.length && <p className="usage-muted">No tier usage or limits returned.</p>}
    {!global && Object.keys(data.allowance_limits ?? {}).length > 0 && <div className="usage-allowances">
      <h5>Separate allowances</h5>
      <dl className="usage-tiers">{Object.entries(data.allowance_limits!).map(([key, limit]) => <div key={key}><dt>{label(key)}</dt><dd><strong>{data.today_by_allowance?.[key] == null ? '—' : number.format(data.today_by_allowance[key])}</strong><span> / {number.format(limit)}</span></dd></div>)}</dl>
      <p className="usage-muted">Already included in tier totals. Not additional calls.</p>
    </div>}
  </div>;
}

function History({ data }: { data: AiUsageResponse }) {
  const days = [...data.history].sort((a, b) => a.date.localeCompare(b.date));
  const max = Math.max(1, ...days.map(day => day.total));
  return <section className="usage-history"><div className="usage-section-title"><h4>Daily history</h4><span className="usage-muted">Latest {days.length} recorded days · UTC</span></div>
    {!days.length ? <p className="usage-muted">No recorded days returned.</p> : <dl className="usage-history-bars">{days.map(day => <div key={day.date}>
      <dt>{day.date}</dt><dd><span className="usage-track" aria-hidden="true"><span style={{ width: `${Math.max(0, day.total) / max * 100}%` }} /></span><strong>{number.format(day.total)}</strong></dd>
    </div>)}</dl>}
  </section>;
}

export function UsageDashboard({ states, sapienId, sapienName, onRefresh }: {
  states: Record<AiUsageKind, UsageState>; sapienId: string; sapienName: string; onRefresh: (kind: AiUsageKind) => void;
}) {
  const [kind, setKind] = useState<AiUsageKind>('llm');
  const state = states[kind];
  const data = state.sapien;
  return <div className="usage-dashboard">
    <div className="usage-owner"><span>{sapienName} <span className="usage-muted">· ID {sapienId}</span></span><button type="button" disabled={state.loading} onClick={() => onRefresh(kind)}><RefreshCw size={16} aria-hidden="true" />{state.loading ? 'Refreshing…' : 'Refresh'}</button></div>
    <div className="usage-kinds" role="group" aria-label="AI resource">
      {(['llm', 'embedding'] as const).map(resource => <button key={resource} type="button" aria-pressed={kind === resource} onClick={() => setKind(resource)}>
        <span>{resource === 'llm' ? 'Language models' : 'Embeddings'}</span>
        <strong>{states[resource].sapien ? number.format(states[resource].sapien!.today_total) : states[resource].loading ? '…' : '—'} <small>calls today</small></strong>
      </button>)}
    </div>
    <div className="usage-section-title"><h3>{kind === 'llm' ? 'Language-model calls' : 'Embedding calls'}</h3>{data && <span className="usage-muted">{data.today} · real UTC day</span>}</div>
    {state.errors.map(error => <div key={error.scope} role="alert" className="usage-error"><strong>{error.scope} usage unavailable</strong><p>{error.message}</p><p>Use Refresh to try again.</p></div>)}
    {state.loading && !data && <p role="status">Loading recorded usage…</p>}
    {data && <>
      <div className="usage-main-grid">
        <section><h4>Usage & daily limits</h4><TierComparison data={data} />
          <p className="usage-note">Recorded today / configured limit—not remaining balance. Simulation days and allowance resets can differ from the real UTC day.</p>
        </section>
        <section><h4>Today by purpose</h4><Bars values={data.today_by_purpose} empty="No calls attributed to a purpose today." /></section>
      </div>
      <History data={data} />
    </>}
    {state.global && <details className="usage-global"><summary>Shared system usage <span>{number.format(state.global.today_total)} calls · {state.global.today} UTC</span></summary>
      <p className="usage-muted">All Sapiens and system calls share these real-UTC daily limits.</p>
      <div className="usage-main-grid"><section><h4>Global tier usage / limit</h4><TierComparison data={state.global} global /></section><section><h4>Global purposes</h4><Bars values={state.global.today_by_purpose} empty="No global purpose usage recorded." /></section></div>
    </details>}
  </div>;
}
