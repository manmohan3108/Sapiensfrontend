/** Recorded admission facts; simulated reset times are not wall-clock deadlines. */
export interface QuotaDetails {
  code: 'quota_exceeded';
  kind: string;
  purpose: string;
  tier: string;
  allowance: string;
  scope: 'sapien' | 'global';
  count: number;
  limit: number;
  time_basis: 'real_utc' | 'simulated_utc';
  window_start: string;
  resets_at: string;
  quota_scope?: string | null;
}

export type QuotaRecoveryStatus = 'pending' | 'running' | 'failed' | 'manual_required';
