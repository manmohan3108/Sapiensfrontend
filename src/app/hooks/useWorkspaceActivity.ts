import { useEffect, useState } from 'react';
import { ActivityFeedError, getWorkspaceActivity, type WorkspaceActivityFeed } from '../core/services/workspaceActivityService';

interface FeedState {
  sapienId: string;
  data: WorkspaceActivityFeed | null;
  error: boolean;
  visible: boolean;
}

export function useWorkspaceActivity(sapienId: string) {
  const [state, setState] = useState<FeedState>({
    sapienId, data: null, error: false, visible: document.visibilityState === 'visible',
  });

  useEffect(() => {
    let disposed = false;
    let stopped = false;
    let failures = 0;
    let retryAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let request: AbortController | null = null;
    setState({ sapienId, data: null, error: false, visible: document.visibilityState === 'visible' });

    function schedule(delay: number) {
      clearTimeout(timer);
      if (!disposed && !stopped && document.visibilityState === 'visible') {
        timer = setTimeout(() => { void refresh(); }, Math.min(delay, 2_147_483_647));
      }
    }

    async function refresh() {
      if (disposed || stopped || request || document.visibilityState !== 'visible') return;
      if (retryAt > Date.now()) { schedule(retryAt - Date.now()); return; }
      const controller = new AbortController();
      request = controller;
      let delay = 15_000;
      try {
        const data = await getWorkspaceActivity(sapienId, controller.signal);
        if (disposed || controller.signal.aborted) return;
        failures = 0;
        retryAt = 0;
        setState(previous => ({ ...previous, data, error: false }));
        delay = Math.max(15_000, Math.min(120_000, data.poll_after_seconds * 1000));
      } catch (error) {
        if (disposed || controller.signal.aborted) return;
        failures += 1;
        delay = Math.max(Math.min(120_000, 15_000 * 2 ** Math.min(failures, 3)),
          error instanceof ActivityFeedError ? error.retryAfterMs : 0);
        retryAt = Date.now() + delay;
        stopped = error instanceof ActivityFeedError && [401, 403, 404].includes(error.status);
        setState(previous => ({ ...previous, error: true }));
      } finally {
        // A cancelled hidden-tab request must not schedule over a newer request.
        if (request === controller) {
          request = null;
          schedule(delay);
        }
      }
    }

    function visibilityChanged() {
      const visible = document.visibilityState === 'visible';
      setState(previous => ({ ...previous, visible }));
      clearTimeout(timer);
      if (!visible) { request?.abort(); request = null; }
      else void refresh();
    }

    void refresh();
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      disposed = true;
      clearTimeout(timer);
      request?.abort();
      document.removeEventListener('visibilitychange', visibilityChanged);
    };
  }, [sapienId]);

  return state.sapienId === sapienId ? state : { sapienId, data: null, error: false, visible: false };
}