import type { Sapiens } from '../types/sapiensTypes';
import type { SimulationRun } from '../types/simulationTypes';

export function needsSimulationClock(sapien: Sapiens | null | undefined) {
  return sapien?.simulationEnabled === true
    || sapien?.simulationUnavailableReason === 'runtime_reserved'
    || sapien?.activityUnavailableReason?.startsWith('simulation_') === true;
}

export function activeChatRun(runs: SimulationRun[], sapienId: string): SimulationRun | null {
  const matches = runs.filter(run => String(run.sapien_id) === sapienId && !run.archived
    && run.runtime_available !== false && (run.status === 'running' || run.status === 'paused'));
  // Never choose arbitrarily between multiple possible clock owners.
  return matches.length === 1 ? matches[0] : null;
}

export function projectChatClock(run: SimulationRun | null, receivedAt: number, now: number): Date | null {
  if (!run || now - receivedAt > 45000 || now < receivedAt) return null;
  const base = Date.parse(run.simulated_time);
  const end = Date.parse(run.end_at);
  if (!Number.isFinite(base) || !Number.isFinite(end) || !Number.isFinite(run.speed) || run.speed < 0) return null;
  const advancing = run.status === 'running' && !run.paused;
  return new Date(Math.min(end, base + (advancing ? (now - receivedAt) * run.speed : 0)));
}
