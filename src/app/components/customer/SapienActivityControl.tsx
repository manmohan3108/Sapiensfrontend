import { useId } from 'react';
import { Pause, Play, RefreshCw, MessageSquare, Power } from 'lucide-react';
import { useSapienActivity } from '../../hooks/useSapienActivity';
import type { SapienActivity, Sapiens } from '../../types/sapiensTypes';
import '../../../styles/sapien-activity.css';

export function SapienActivityControl({ sapien, refreshOnMount = false, onActivityChange, compact = false }: {
  sapien: Sapiens; refreshOnMount?: boolean; compact?: boolean;
  onActivityChange?: (sapienId: string, activity: SapienActivity | null) => void;
}) {
  const { activity, pending, error, notice, refresh, setActivity } = useSapienActivity(sapien, refreshOnMount, onActivityChange);
  const helpId = useId();
  const reason = activity?.activityUnavailableReason;
  const blocked = !!reason;
  const state = activity?.activityState;
  const label = pending === 'reading' ? 'Checking…' : pending === 'saving' ? 'Saving…'
    : !activity ? 'Check status' : state === 'active' ? 'Pause' : state === 'paused' ? 'Resume' : 'Activate';
  const status = reason === 'simulation_owned' ? 'Simulation controlled' : reason === 'simulation_only' ? 'Simulation only' : reason === 'deletion_pending' ? 'Deleting'
    : blocked ? 'Unavailable' : !activity ? 'Status unknown' : state === 'active' ? 'Active' : state === 'paused' ? 'Paused' : 'Inactive';
  const explanation = reason === 'simulation_owned' ? 'Use Simulation Lab to pause or resume this simulation.'
    : reason === 'simulation_only' ? 'Use Simulation Lab to manage runs. Normal activity is disabled for this Sapien.'
    : reason === 'deletion_pending' ? 'Deletion is in progress.'
    : blocked ? 'Activity cannot be changed right now.'
    : activity?.draining ? 'Finishing current work. New autonomous work is stopped.'
    : state === 'active' ? 'Pause stops autonomous work and keeps chat available.'
    : state === 'paused' ? 'Chat uses stored information. Tools and background learning wait until resume.'
    : 'Activate for autonomous work, or enable chat only. History is preserved.';
  const Icon = !activity ? RefreshCw : state === 'active' ? Pause : Play;

  return <div className={`sapien-activity-control${compact ? ' sapien-activity-compact' : ''}`} aria-busy={pending !== null}>
    <span className="sapien-activity-status" role="status" aria-live="polite">{status}{activity?.draining ? ' · Finishing work…' : ''}</span>
    {!(compact && blocked) && reason !== 'simulation_only' && <div className="sapien-activity-actions">
      <button type="button" className="sapien-activity-button" disabled={!!pending || blocked || activity?.draining}
        aria-label={label + ' ' + sapien.name} aria-describedby={helpId} title={explanation}
        onClick={() => activity ? void setActivity(state === 'active' ? 'paused' : 'active') : refresh()}>
        <Icon size={15} aria-hidden="true" /><span>{label}</span>
      </button>
      {activity && !blocked && <button type="button" className="sapien-activity-button" disabled={!!pending || activity.draining}
        aria-label={`${state === 'inactive' ? 'Enable chat for' : 'Deactivate'} ${sapien.name}`}
        aria-describedby={helpId}
        onClick={() => void setActivity(state === 'inactive' ? 'paused' : 'inactive')}>
        {state === 'inactive' ? <MessageSquare size={15} aria-hidden="true" /> : <Power size={15} aria-hidden="true" />}
        <span>{state === 'inactive' ? 'Chat only' : 'Deactivate'}</span>
      </button>}
    </div>}
    <span id={helpId} className={blocked || (activity && state !== 'active') ? 'sapien-activity-help' : 'sr-only'}>{explanation}</span>
    {error && <p className="sapien-activity-error" role="alert">{error}</p>}
    <span className="sr-only" role="status">{notice}</span>
  </div>;
}
