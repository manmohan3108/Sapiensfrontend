import { useEffect, useState } from 'react';
import { connectionsService } from '../../core/services/connectionsService';
import { CONNECTION_REQUESTS_UPDATED, pendingConnectionCount } from '../../core/navigation/connectionRequests';
import type { ConnectionsResponse } from '../../types/connectionTypes';

export function useConnectionRequestCount(sapienId: string | undefined, accountId: string | undefined) {
  const key = `${accountId ?? ''}:${sapienId ?? ''}`;
  const [result, setResult] = useState<{ key: string; count: number }>();
  useEffect(() => {
    setResult(undefined);
    if (!accountId || !sapienId || !Number.isFinite(Number(sapienId))) return;
    let active = true;
    let controller: AbortController | undefined;
    const accept = (data: ConnectionsResponse) => {
      if (active && data.sapien_id === Number(sapienId)) setResult({ key, count: pendingConnectionCount(data) });
    };
    const refresh = async () => {
      if (document.visibilityState === 'hidden' || controller) return;
      const request = new AbortController();
      controller = request;
      try {
        const data = await connectionsService.list(Number(sapienId), request.signal);
        if (!request.signal.aborted) accept(data);
      } catch {
        if (active && !request.signal.aborted) setResult(undefined);
      } finally { if (controller === request) controller = undefined; }
    };
    const updated = (event: Event) => {
      const data = (event as CustomEvent<ConnectionsResponse>).detail;
      if (data.sapien_id !== Number(sapienId)) return;
      controller?.abort(); controller = undefined;
      accept(data);
    };
    const visible = () => { void refresh(); };
    void refresh();
    const timer = window.setInterval(visible, 60_000);
    window.addEventListener(CONNECTION_REQUESTS_UPDATED, updated);
    document.addEventListener('visibilitychange', visible);
    return () => {
      active = false; controller?.abort(); window.clearInterval(timer);
      window.removeEventListener(CONNECTION_REQUESTS_UPDATED, updated);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [sapienId, accountId, key]);
  return result?.key === key ? result.count : null;
}
