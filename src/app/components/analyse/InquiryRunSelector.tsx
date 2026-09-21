import { useEffect, useState } from 'react';
import { simulationService } from '../../core/services/simulationService';
import type { SimulationList } from '../../types/simulationTypes';

const input = 'mt-2 block w-full rounded-lg border border-white/10 bg-[#0b1220] px-3 py-2 text-xs text-white/80';
const button = 'rounded-lg border border-white/15 px-3 py-2 text-xs text-white/70 hover:bg-white/5 disabled:opacity-40';

/** Saved history is discovery only: it never starts a run or changes the selected scope. */
export function InquiryRunSelector({ sapienId, runId, onChange }: { sapienId: string; runId: string; onChange: (runId: string) => void }) {
  const [history, setHistory] = useState<SimulationList | null>(null);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  const [manualId, setManualId] = useState(runId);
  useEffect(() => {
    const controller = new AbortController();
    setHistory(null); setFailed(false);
    simulationService.list(controller.signal).then(result => {
      if (!controller.signal.aborted) setHistory(result);
    }).catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [sapienId, revision]);
  const runs = history?.runs.filter(run => run.sapien_id != null && String(run.sapien_id) === sapienId) ?? [];
  const selectedRun = runs.find(run => run.run_id === runId);
  const differentSapien = history?.runs.some(run => run.run_id === runId && String(run.sapien_id) !== sapienId);
  const loading = !history && !failed;
  return <section className="rounded-xl border border-white/[.07] bg-white/[.025] p-4">
    <div className="flex flex-wrap items-end gap-3">
      <label className="min-w-0 flex-1 text-xs text-white/60">Records for Sapien {sapienId}
        <select className={input} value={runId} onChange={event => onChange(event.target.value)}>
          <option value="">Normal — excludes all simulation runs</option>
          {runId && !selectedRun && <option value={runId}>Selected run (not in this Sapien’s returned history) · {runId}</option>}
          {runs.map(run => <option key={run.run_id} value={run.run_id}>{run.case_id} · {run.status.replaceAll('_', ' ')}{run.archived ? ' · archived' : ''} · {run.start_at} · {run.run_id}</option>)}
        </select>
      </label>
      <button type="button" className={button} disabled={loading} onClick={() => setRevision(value => value + 1)}>Refresh saved runs</button>
    </div>
    <div className="mt-3 space-y-2 text-xs leading-5 text-white/50" role="status">
      {loading && <p>Loading saved simulation history… The selected record scope is unchanged.</p>}
      {failed && <p className="text-amber-100">Saved simulation history is unavailable. Retry “Refresh saved runs”, or use a known run ID below. This does not mean there are no saved records.</p>}
      {history && <p>{runs.length ? `${runs.length} saved runs available for this Sapien, including any stopped or completed runs returned by history.` : 'No runs for this Sapien appear in the returned history.'} History is bounded (limit {history.history_limit}); older runs may be absent.</p>}
      {!runId && runs.length > 0 && <p className="text-cyan-100">Viewing Normal records. To inspect simulation questions or probes, choose a saved run above. Normal can be empty even when simulation records exist.</p>}
      {runId && history && !selectedRun && <p className="text-amber-100">{differentSapien ? 'This run is listed for a different Sapien. Select a run belonging to this Sapien.' : 'The selected run is absent from this returned history. Its explicit ID is preserved; stored records may still be available.'}</p>}
      {runId && <p className="break-all">Selected simulation: {runId}. Only this run’s records are read; its runtime does not need to be active.</p>}
    </div>
    <details className="mt-3 text-xs text-white/50"><summary className="cursor-pointer">Use a known run ID missing from history</summary>
      <form className="mt-2 flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); const id = manualId.trim(); if (id && id.length <= 128) onChange(id); }}>
        <label className="min-w-64 flex-1">Exact simulation run ID<input className={input} maxLength={128} required value={manualId} onChange={event => setManualId(event.target.value)} /></label>
        <button type="submit" className={button} disabled={!manualId.trim()}>Inspect this run</button>
      </form>
    </details>
  </section>;
}
