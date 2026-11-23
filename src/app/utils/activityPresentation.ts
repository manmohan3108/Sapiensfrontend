import type { SapienActivity } from '../types/sapiensTypes';

export function activityStatusLabel(activity: SapienActivity | null): string {
  const reason = activity?.activityUnavailableReason;
  if (reason === 'simulation_owned') return 'Simulation controlled';
  if (reason === 'simulation_only') return 'Simulation only';
  if (reason === 'deletion_pending') return 'Deleting';
  if (reason) return 'Unavailable';
  if (!activity || !activity.activityState) return 'Status unknown';
  return activity.activityState === 'active' ? 'Active' : activity.activityState === 'paused' ? 'Paused' : 'Inactive';
}
