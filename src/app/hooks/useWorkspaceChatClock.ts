import { useEffect, useState } from 'react';
import { resourceSession } from '../core/auth/authSession';
import { simulationService } from '../core/services/simulationService';
import type { Sapiens } from '../types/sapiensTypes';
import type { SimulationRun } from '../types/simulationTypes';
import { activeChatRun, needsSimulationClock, projectChatClock } from '../utils/workspaceChatClock';

/** Existing read-only run API; normal chat never polls the simulation service. */
export function useWorkspaceChatClock(sapien: Sapiens | null, canReadRuns: boolean) {
  const simulation = needsSimulationClock(sapien);
  const [now, setNow] = useState(Date.now);
  const [snapshot, setSnapshot] = useState<{ sapienId: string; run: SimulationRun | null; receivedAt: number } | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = window.setInterval(update, simulation ? 1000 : 30000);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); };
  }, [simulation, sapien?.id]);

  useEffect(() => {
    if (!simulation || !canReadRuns || !sapien) return;
    const controller = new AbortController();
    const version = resourceSession.version;
    const sapienId = sapien.id;
    let busy = false;
    const refresh = async () => {
      if (busy || document.visibilityState === 'hidden') return;
      busy = true;
      try {
        const result = await simulationService.list(AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]));
        if (controller.signal.aborted || version !== resourceSession.version) return;
        const receivedAt = Date.now();
        setSnapshot({ sapienId, run: activeChatRun(result.runs, sapienId), receivedAt });
        setNow(receivedAt);
      } catch {
        if (!controller.signal.aborted && version === resourceSession.version) setSnapshot(null);
      } finally { busy = false; }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    const visible = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', visible);
    document.addEventListener('visibilitychange', visible);
    return () => {
      controller.abort(); window.clearInterval(timer);
      window.removeEventListener('focus', visible);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [sapien?.id, simulation, canReadRuns]);

  return { simulation, now: !simulation ? new Date(now)
    : canReadRuns && snapshot?.sapienId === sapien?.id ? projectChatClock(snapshot.run, snapshot.receivedAt, now) : null };
}
