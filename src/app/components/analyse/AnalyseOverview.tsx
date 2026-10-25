import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, ArrowRight, Eye, RefreshCw, Target } from 'lucide-react';
import { sapiensService } from '../../core/services/sapiensService';
import { goalsService } from '../../core/services/goalsService';
import { engineJobsService } from '../../core/services/engineJobsService';
import type { AwarenessResponse } from '../../types/sapiensTypes';
import type { GoalsListResponse } from '../../types/goalTypes';
import type { EngineJobPage } from '../../types/engineJobTypes';
import type { AnalyseSection } from './AnalyseShell';

export type Snapshot<T> = { data: T | null; loading: boolean; error: string; readAt: string };
type OverviewData = { awareness: Snapshot<AwarenessResponse>; jobs: Snapshot<EngineJobPage>; goals: Snapshot<GoalsListResponse> };
const initial = { data: null, loading: true, error: '', readAt: '' };
const initialData: OverviewData = { awareness: initial, jobs: initial, goals: initial };
export function readTime(value?: string) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Time not recorded';
  return new Date(value).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' });
}
function ReadState({ resource, empty, children }: { resource: Snapshot<unknown>; empty?: boolean; children: ReactNode }) {
  if (resource.loading) return <p className="analyse-read-state" role="status">Reading records…</p>;
  if (resource.error) return <div className="analyse-read-state" role="alert"><strong>Unavailable</strong><p>{resource.error}</p><p>Use Refresh snapshot to try again.</p></div>;
  if (!resource.data || empty) return <p className="analyse-read-state">No records returned for this scope.</p>;
  return <>{children}</>;
}
const assessments: Record<string, string> = { completed: 'Assessed as complete', ongoing: 'Still in progress', waiting: 'Waiting', blocked: 'Blocked', unresolved: 'Unresolved' };

// Separate view keeps the actual UI reviewable with isolated fixtures, without
// bypassing authentication or adding a mock-data mode to the application.
export function AnalyseOverviewView({ data, go, onRefresh }: { data: OverviewData; go: (section: AnalyseSection, params?: Record<string, string>) => void; onRefresh: () => void }) {
  const { awareness, jobs, goals } = data;
  const current = awareness.data?.current;
  const busy = Object.values(data).some(item => item.loading);
  const count = (status: string) => jobs.data?.summary.filter(row => row.status === status).reduce((total, row) => total + row.count, 0) ?? 0;
  return <div className="analyse-overview">
    <div className="analyse-intro"><div><p className="analyse-eyebrow">Diagnostic overview</p><h2>Start with what happened.</h2><p>Inspect the understanding, work and goals behind this Sapien’s behaviour.</p></div><button type="button" className="analyse-button" onClick={onRefresh} disabled={busy}><RefreshCw size={15} className={busy ? 'animate-spin' : ''} />{busy ? 'Reading…' : 'Refresh snapshot'}</button></div>
    <p className="analyse-scope-note">Sapien-wide records · Read on demand · Each source has its own scope and read time.</p>
    <div className="analyse-overview-grid">
      <section className="analyse-overview-panel analyse-understanding">
        <div className="analyse-panel-heading"><h3><Eye size={17} />Latest understanding</h3><button onClick={() => go('awareness')} className="analyse-text-link">Inspect runs<ArrowRight size={15} /></button></div>
        <ReadState resource={awareness} empty={!current}>
          {current && <><div className="analyse-record-meta"><span className="analyse-badge">{current.state ? assessments[current.state] || current.state.replaceAll('_', ' ') : 'Assessment not recorded'}</span><time>{readTime(current.created_at)}</time></div><p className="analyse-understanding-text">{current.understanding || current.focus || 'No understanding text retained.'}</p>
            {current.remaining && <p className="analyse-remaining"><strong>Remaining:</strong> {current.remaining}</p>}
            <div className="analyse-input-context"><span className="analyse-eyebrow">Input context</span><p>{current.subject?.content || 'The original input was not retained with this record.'}</p><span>Source: {current.subject?.source || current.source || 'Not recorded'}</span></div>
          </>}
        </ReadState>
        {(current || awareness.readAt) && <p className="analyse-panel-footnote">{current && 'Saved assessment; it does not confirm message delivery.'}{awareness.readAt && ` Read ${readTime(awareness.readAt)}.`}</p>}
      </section>
      <section className="analyse-overview-panel analyse-jobs">
        <div className="analyse-panel-heading"><h3><Activity size={17} />Engine work</h3><button className="analyse-text-link" onClick={() => go('engine-jobs')}>Inspect jobs<ArrowRight size={15} /></button></div>
        <ReadState resource={jobs}>
          <p className="analyse-section-description">Created in the last 7 days · All engines</p>
          <div className="analyse-job-counts">{(['failed', 'pending', 'running', 'completed'] as const).map(status => <div key={status} data-status={status}><strong>{count(status).toLocaleString()}</strong><span>{status}</span></div>)}</div>
          <p className="analyse-panel-footnote">Pending includes scheduled work and is not automatically overdue. Completed refers to the job, not its real-world outcome.</p>
          <details className="analyse-window"><summary>Exact creation window</summary><p>{readTime(jobs.data?.since)} → {readTime(jobs.data?.until)}</p><p>Statuses may change between reads. Simulation timing is explained in job details.</p></details>
          <div className="analyse-recent-jobs"><p className="analyse-eyebrow">Newest jobs · up to 3</p>{jobs.data?.jobs.length ? jobs.data.jobs.slice(0, 3).map(job => <button key={job.id} onClick={() => go('engine-jobs', { job_id: job.id })}><span><strong>{job.engine_name.replaceAll('_', ' ')}</strong><small>{typeof job.action === 'string' ? job.action.replaceAll('_', ' ') : 'Stored action'} · {readTime(job.created_at)}</small></span><span className="analyse-badge" data-status={job.status}>{job.status}</span><ArrowRight size={14} /></button>) : <p>No jobs in this creation window.</p>}</div>
        </ReadState>
        {jobs.data && <p className="analyse-panel-footnote">{jobs.data.total.toLocaleString()} jobs in window · Read {readTime(jobs.data.as_of)}</p>}
      </section>
      <section className="analyse-overview-panel analyse-goals">
        <div className="analyse-panel-heading"><h3><Target size={17} />Unfinished goals</h3><button className="analyse-text-link" onClick={() => go('goals')}>Inspect goals<ArrowRight size={15} /></button></div>
        <p className="analyse-section-description">Up to 3 recently updated, non-retired goals. This is a preview, not a total.</p>
        <ReadState resource={goals} empty={!goals.data?.goals.length}><ol className="analyse-goal-preview">{goals.data?.goals.map(goal => <li key={goal.id}><div><span className="analyse-badge">{goal.state || 'State not recorded'}</span><span>{goal.current_plan ? 'Plan recorded' : 'No plan recorded'}</span></div><p>{goal.description || 'Description not recorded'}</p><span>Updated {readTime(goal.updated_at || undefined)}</span></li>)}</ol></ReadState>
        {goals.readAt && <p className="analyse-panel-footnote">Read {readTime(goals.readAt)}</p>}
      </section>
    </div>
  </div>;
}

export function AnalyseOverview({ sapienId, go }: { sapienId: string; go: (section: AnalyseSection, params?: Record<string, string>) => void }) {
  const [data, setData] = useState<OverviewData>(initialData);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setData(initialData);
    const read = async <K extends keyof OverviewData>(key: K, request: () => Promise<OverviewData[K]['data']>) => {
      try {
        const result = await request();
        if (active) setData(previous => ({ ...previous, [key]: { data: result, loading: false, error: '', readAt: new Date().toISOString() } }));
      } catch {
        if (active) setData(previous => ({ ...previous, [key]: { data: null, loading: false, error: 'This source could not be read. Other sources remain available.', readAt: '' } }));
      }
    };
    void read('awareness', () => sapiensService.getAwareness(sapienId, 1));
    void read('jobs', () => engineJobsService.list(sapienId, { days: 7, engine_name: '', status: '', limit: 3 }, null));
    void read('goals', () => goalsService.listGoals(Number(sapienId), { finished: false, retired: false, topK: 3, orderBy: 'updated_at', includePlan: true }));
    return () => { active = false; };
  }, [sapienId, revision]);
  return <AnalyseOverviewView data={data} go={go} onRefresh={() => setRevision(value => value + 1)} />;
}
