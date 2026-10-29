import type { AuthUser } from '../../types/authTypes';

export function canAnalyzeAndSimulate(user: AuthUser | null | undefined): boolean {
  return user?.role === 'admin' || (user?.role === 'customer' && user.analysis_simulation_access === true);
}
