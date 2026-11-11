import { useCallback, useEffect, useRef, useState } from 'react';
import { sapiensService } from '../core/services/sapiensService';
import { useSapiensStore } from '../core/state/sapiensStore';
import type { ActivityState, SapienActivity, Sapiens } from '../types/sapiensTypes';

function knownActivity(sapien: Sapiens): SapienActivity | null {
  return typeof sapien.active === 'boolean' && sapien.activityUnavailableReason !== undefined
    ? { active: sapien.active, activityState: sapien.activityState ?? (sapien.active ? 'active' : 'inactive'),
      draining: sapien.draining ?? false, chatAvailable: sapien.chatAvailable,
      activityUnavailableReason: sapien.activityUnavailableReason } : null;
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
    [sapien.id, sapien.active, sapien.activityState, sapien.draining, sapien.chatAvailable, sapien.activityUnavailableReason]);

  const execute = useCallback(async (desired?: ActivityState) => {
    if (request.current && !request.current.signal.aborted) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(desired === undefined ? 'reading' : 'saving');
    setError(''); setNotice('');
    // Filtering can unmount a row while its write still reaches the server.
    if (desired !== undefined) onActivityChange?.(sapien.id, null);
    try {
      const result = desired === undefined
        ? await sapiensService.getActivity(sapien.id, controller.signal)
        : await sapiensService.setActivity(sapien.id, desired, controller.signal);
      if (controller.signal.aborted) return;
      setActivity(result);
      useSapiensStore.getState().updateActivity(sapien.id, result);
      onActivityChange?.(sapien.id, result);
      if (desired !== undefined) setNotice(result.activityState === 'active'
        ? 'Autonomous work is enabled. The runtime will resume shortly.'
        : result.activityState === 'paused'
          ? 'Autonomous work is paused. Chat is available; learning waits until resume.'
          : 'This Sapien is inactive. Current work may finish; history is preserved.');
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

  useEffect(() => {
    if (!activity?.draining) return;
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    const timer = window.setTimeout(onVisible, 3000);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [activity, refresh]);

  return { activity, pending, error, notice, refresh, setActivity: execute };
}
