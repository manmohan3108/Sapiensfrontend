import { useEffect, useRef } from 'react';
import { useSapiensStore } from '../core/state/sapiensStore';
import { apiConfig, API_ENDPOINTS } from '../core/config/apiConfig';

const POLL_INTERVAL_MS = 10_000;

interface OrchestratorStatusResponse {
  overloaded: boolean;
  pending: number;
  limit: number;
}

async function fetchStatus(baseUrl: string): Promise<OrchestratorStatusResponse | null> {
  try {
    const res = await fetch(`${baseUrl}${API_ENDPOINTS.orchestratorStatus}`);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) return null;
    return await res.json() as OrchestratorStatusResponse;
  } catch {
    return null;
  }
}

/**
 * Polls GET /api/orchestrator/status every 10 s while the browser tab is visible.
 * Updates the store's isOverloaded flag. Safe to mount once in the workspace.
 */
export function useOrchestratorStatus() {
  const setOverloaded = useSapiensStore(s => s.setOverloaded);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const baseUrl = apiConfig.baseUrl;

    const poll = async () => {
      // Only poll when the tab is visible
      if (document.visibilityState !== 'visible') return;
      const data = await fetchStatus(baseUrl);
      if (data !== null) {
        setOverloaded(data.overloaded);
      }
    };

    // Poll immediately, then on interval
    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [setOverloaded]);
}
