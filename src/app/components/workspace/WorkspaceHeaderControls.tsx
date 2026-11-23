import { useEffect } from 'react';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { useSapienActivity } from '../../hooks/useSapienActivity';
import { SapienActivityActions } from '../customer/SapienActivityControl';
import { RunEngineButton } from './RunEngineButton';
import type { Sapiens } from '../../types/sapiensTypes';

export function WorkspaceHeaderControls({ sapien }: { sapien: Sapiens }) {
  const activity = useSapienActivity(sapien, true);
  const { refresh } = activity;
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);
  const status = useSapiensStore(state => state.status);
  const overloaded = useSapiensStore(state => state.isOverloaded);
  return <div className="app-workspace-controls" aria-label="Workspace controls">
    <SapienActivityActions sapien={sapien} controller={activity} compact hidePausedHelp secondaryUnderMore dismissMoreOnOutside
      extraActions={<>
        {(status !== 'idle' || overloaded) && <p role="status">{overloaded ? 'Catching up' : status === 'processing' ? 'Processing' : status === 'loading' ? 'Loading…' : 'Error'}</p>}
        <RunEngineButton />
      </>} />
  </div>;
}
