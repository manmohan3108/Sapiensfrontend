import { useEffect, useId, useState } from 'react';
import { RateLimitButton } from '../shared/RateLimitButton';
import { Pause, Play, RefreshCw, MessageSquare, Power } from 'lucide-react';
import { PauseScheduleControl } from '../shared/PauseScheduleControl';
import { useSapienActivity } from '../../hooks/useSapienActivity';
import type { SapienActivity, Sapiens } from '../../types/sapiensTypes';
import { activityStatusLabel } from '../../utils/activityPresentation';
import '../../../styles/sapien-activity.css';

export function SapienActivityControl({ sapien, refreshOnMount = false, onActivityChange, compact = false, hidePausedHelp = false }: {
  sapien: Sapiens; refreshOnMount?: boolean; compact?: boolean; hidePausedHelp?: boolean;
  onActivityChange?: (sapienId: string, activity: SapienActivity | null) => void;
}) {
  const controller = useSapienActivity(sapien, refreshOnMount, onActivityChange);
  return <SapienActivityActions sapien={sapien} controller={controller} compact={compact} hidePausedHelp={hidePausedHelp} />;
}

/** The owner keeps activity requests alive independently of where controls are displayed. */
export function SapienActivityActions({ sapien, controller, compact = false, hidePausedHelp = false, secondaryUnderMore = false }: {
  sapien: Sapiens; controller: ReturnType<typeof useSapienActivity>; compact?: boolean; hidePausedHelp?: boolean; secondaryUnderMore?: boolean;
}) {
  const { activity, pending, error, notice, refresh, setActivity, schedulePause } = controller;
  const helpId = useId();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreId = useId();
  useEffect(() => { if (error) setMoreOpen(true); }, [error]);
  const reason = activity?.activityUnavailableReason;
  const blocked = !!reason;
  const state = activity?.activityState;
  const label = pending === 'reading' ? 'Checking…' : pending === 'saving' ? 'Saving…'
    : !activity ? 'Check status' : state === 'active' ? 'Pause' : state === 'paused' ? 'Resume' : 'Activate';
  const status = secondaryUnderMore && pending
    ? pending === 'reading' ? 'Checking…' : 'Updating…'
    : activityStatusLabel(activity);
  const explanation = reason === 'simulation_owned' ? 'Use Simulation Lab to pause or resume this simulation.'
    : reason === 'simulation_only' ? 'Use Simulation Lab to manage runs. Normal activity is disabled for this Sapien.'
    : reason === 'deletion_pending' ? 'Deletion is in progress.'
    : blocked ? 'Activity cannot be changed right now.'
    : !activity ? 'Check status to see the available controls.'
    : activity.draining ? 'Finishing current work. New autonomous work is stopped.'
    : state === 'active' ? 'Pause stops autonomous work and keeps chat available.'
    : state === 'paused' ? 'Chat uses stored information. Tools and background learning wait until resume.'
    : 'Activate for autonomous work, or enable chat only. History is preserved.';
  const Icon = !activity ? RefreshCw : state === 'active' ? Pause : Play;
  const showHelp = blocked || (activity && state !== 'active'
    && (!hidePausedHelp || state !== 'paused' || activity.draining));

  const secondary = <>
      {activity && !blocked && <RateLimitButton rateLimitBucket="control" type="button" className="sapien-activity-button" disabled={!!pending || activity.draining}
        aria-label={`${state === 'inactive' ? 'Enable chat for' : 'Deactivate'} ${sapien.name}`}
        aria-describedby={helpId}
        onClick={() => void setActivity(state === 'inactive' ? 'paused' : 'inactive')}>
        {state === 'inactive' ? <MessageSquare size={15} aria-hidden="true" /> : <Power size={15} aria-hidden="true" />}
        <span>{state === 'inactive' ? 'Chat only' : 'Deactivate'}</span>
      </RateLimitButton>}
  </>;
  const schedule = activity && state === 'active' && !blocked ? <PauseScheduleControl
      label={sapien.name} scheduledAt={activity.scheduledPauseAt} disabled={!!pending}
      onSchedule={minutes => void schedulePause(minutes)} /> : null;

  return <div className={`sapien-activity-control${compact ? ' sapien-activity-compact' : ''}${secondaryUnderMore ? ' sapien-directory-actions' : ''}`} aria-busy={pending !== null}>
    <span className="sapien-activity-status" role="status" aria-live="polite">{status}{activity?.draining ? ' · Finishing work…' : ''}</span>
    {!(compact && blocked) && reason !== 'simulation_only' && <div className="sapien-activity-actions">
      <RateLimitButton rateLimitBucket={activity ? state === 'active' ? 'control' : 'api_write' : false} type="button" className="sapien-activity-button" disabled={!!pending || blocked || activity?.draining}
        aria-label={label + ' ' + sapien.name} aria-describedby={helpId} title={explanation}
        onClick={() => activity ? void setActivity(state === 'active' ? 'paused' : 'active') : refresh()}>
        <Icon size={15} aria-hidden="true" /><span>{label}</span>
      </RateLimitButton>
      {!secondaryUnderMore && secondary}
    </div>}
    {secondaryUnderMore ? <>
      <button type="button" className="sapien-activity-button sapien-directory-more" aria-expanded={moreOpen}
        aria-controls={moreId} onClick={() => setMoreOpen(open => !open)}>
        More<span aria-hidden="true">{moreOpen ? '−' : '+'}</span><span className="sr-only"> actions for {sapien.name}</span>
      </button>
      <div id={moreId} className="sapien-directory-more-content" hidden={!moreOpen}>{secondary}{schedule}<p>{explanation}</p></div>
    </> : schedule}
    <span id={helpId} className={!secondaryUnderMore && showHelp ? 'sapien-activity-help' : 'sr-only'}>{explanation}</span>
    {error && <p className="sapien-activity-error" role="alert">{error}</p>}
    <span className="sr-only" role="status">{notice}</span>
  </div>;
}
