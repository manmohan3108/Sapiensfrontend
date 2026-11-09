import { useId } from 'react';
import { Pause, Play, RefreshCw } from 'lucide-react';
import { useSapienActivity } from '../../hooks/useSapienActivity';
import type { SapienActivity, Sapiens } from '../../types/sapiensTypes';
import '../../../styles/sapien-activity.css';

export function SapienActivityControl({ sapien, refreshOnMount = false, onActivityChange, compact = false }: {
  sapien: Sapiens; refreshOnMount?: boolean; compact?: boolean;
  onActivityChange?: (sapienId: string, activity: SapienActivity | null) => void;
}) {
  const { activity, pending, error, notice, refresh, setActive } = useSapienActivity(sapien, refreshOnMount, onActivityChange);
  const helpId = useId();
  const reason = activity?.activityUnavailableReason;
  const blocked = !!reason;
  const label = pending === 'reading' ? 'Checking\u2026' : pending === 'saving' ? 'Saving\u2026'
    : !activity ? 'Check status' : activity.active ? 'Pause' : 'Activate';
  const status = reason === 'simulation_owned' ? 'Simulation controlled' : reason === 'simulation_only' ? 'Simulation only' : reason === 'deletion_pending' ? 'Deleting'
    : blocked ? 'Unavailable' : !activity ? 'Status unknown' : activity.active ? 'Active' : 'Inactive';
  const explanation = reason === 'simulation_owned' ? 'Use Simulation Lab to pause or resume this simulation.'
    : reason === 'simulation_only' ? 'Use Simulation Lab to manage runs. Normal activity is disabled for this Sapien.'
    : reason === 'deletion_pending' ? 'Deletion is in progress.'
    : blocked ? 'Activity cannot be changed right now.'
    : activity?.active
      ? 'Pause autonomous work without deleting memories or jobs. Current work may finish, and chat remains available.'
      : 'Activate autonomous activity.';
  const Icon = !activity ? RefreshCw : activity.active ? Pause : Play;

  return <div className={`sapien-activity-control${compact ? ' sapien-activity-compact' : ''}`} aria-busy={pending !== null}>
    <span className="sapien-activity-status">{status}</span>
    {!(compact && blocked) && reason !== 'simulation_only' && <button type="button" className="sapien-activity-button" disabled={!!pending || blocked}
      aria-label={label + ' ' + sapien.name} aria-describedby={helpId} title={explanation}
      onClick={() => activity ? void setActive(!activity.active) : refresh()}>
      <Icon size={15} aria-hidden="true" /><span>{label}</span>
    </button>}
    <span id={helpId} className={blocked || (activity && !activity.active) ? 'sapien-activity-help' : 'sr-only'}>{explanation}</span>
    {error && <p className="sapien-activity-error" role="alert">{error}</p>}
    <span className="sr-only" role="status">{notice}</span>
  </div>;
}
