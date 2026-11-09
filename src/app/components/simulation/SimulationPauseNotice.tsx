import { PauseCircle } from 'lucide-react';
import { Link } from 'react-router';
import type { SimulationRun } from '../../types/simulationTypes';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function SimulationPauseNotice({ run, showLabLink = false }: {
  run: SimulationRun;
  showLabLink?: boolean;
}) {
  if (run.status !== 'paused') return null;
  const automaticReason = run.pause_reason?.trim();
  const reason = automaticReason || run.detail?.trim();
  const blocked = run.resume_blocked_reason?.trim();
  const canResume = run.allowed_controls.includes('resume');
  const linkClass = 'rounded-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return <Alert role="status" aria-live="polite" className="min-w-0">
    <PauseCircle aria-hidden="true" />
    <AlertTitle className="line-clamp-none">
      {automaticReason ? 'Simulation paused automatically' : 'Simulation paused'}
    </AlertTitle>
    <AlertDescription className="min-w-0 break-words">
      <p>{reason || 'The simulation is paused. Its saved progress and remaining run time are retained.'}</p>
      <p>{blocked ? `Resume unavailable: ${blocked}` : canResume
        ? 'Resume is available. Review the saved diagnostics before continuing.'
        : 'Resume is currently unavailable. Refresh to check the latest run controls.'}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Link className={linkClass} to={`/admin/simulations/${encodeURIComponent(run.run_id)}/world/diagnostics`}>View diagnostics</Link>
        {showLabLink && <Link className={linkClass} to={`/admin/simulations?runId=${encodeURIComponent(run.run_id)}`}>Review controls in Simulation Lab</Link>}
      </div>
    </AlertDescription>
  </Alert>;
}
