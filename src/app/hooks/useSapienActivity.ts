import { useCallback, useEffect, useRef, useState } from 'react';
import { sapiensService } from '../core/services/sapiensService';
import { useSapiensStore } from '../core/state/sapiensStore';
import type { SapienActivity, Sapiens } from '../types/sapiensTypes';

function knownActivity(sapien: Sapiens): SapienActivity | null {
  return typeof sapien.active === 'boolean' && sapien.activityUnavailableReason !== undefined
    ? { active: sapien.active, activityUnavailableReason: sapien.activityUnavailableReason } : null;
}

/** One explicit state change at a time; uncertain results require a fresh read. */
export function useSapienActivity(sapien: Sapiens, refreshOnMount = false,
  onActivityChange?: (sapienId: string, activity: SapienActivity | null) => void) {
  const [activity, setActivity] = useState(() => knownActivity(sapien));
  const [pending, setPending] = useState<'reading' | 'saving' | null>(refreshOnMount ? 'reading' : null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const request = useRef<AbortController | null>(null);

  useEffect(() => { setActivity(knownActivity(sapien)); },
    [sapien.id, sapien.active, sapien.activityUnavailableReason]);

  const execute = useCallback(async (active?: boolean) => {
    if (request.current && !request.current.signal.aborted) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(active === undefined ? 'reading' : 'saving');
    setError(''); setNotice('');
    // Filtering can unmount a row while its write still reaches the server.
    if (active !== undefined) onActivityChange?.(sapien.id, null);
    try {
      const result = active === undefined
        ? await sapiensService.getActivity(sapien.id, controller.signal)
        : await sapiensService.setActive(sapien.id, active, controller.signal);
      if (controller.signal.aborted) return;
      setActivity(result);
      useSapiensStore.getState().updateActivity(sapien.id, result);
      onActivityChange?.(sapien.id, result);
      if (active !== undefined) setNotice(result.active
        ? 'Autonomous work is enabled. The runtime will resume shortly.'
        : 'Autonomous work is paused. Current work may finish; chat is still available.');
    } catch (failure) {
      if (controller.signal.aborted) return;
      setActivity(null);
      onActivityChange?.(sapien.id, null);
      const detail = (failure as { message?: string }).message;
      setError(detail ? detail + ' Check status before trying again.' : 'Could not confirm activity. Check status before trying again.');
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (!controller.signal.aborted) setPending(null);
      }
    }
  }, [sapien.id, onActivityChange]);

  const refresh = useCallback(() => { void execute(); }, [execute]);
  useEffect(() => {
    if (refreshOnMount) {
      refresh();
      window.addEventListener('focus', refresh);
    }
    return () => {
      window.removeEventListener('focus', refresh);
      request.current?.abort();
    };
  }, [refreshOnMount, refresh]);

  return { activity, pending, error, notice, refresh, setActive: execute };
}
