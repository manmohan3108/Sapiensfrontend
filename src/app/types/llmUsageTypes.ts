export type AiUsageKind = 'llm' | 'embedding';
export type AiUsageScope = 'global' | `sapien:${string}`;
export type UsageTimeBasis = 'real_utc' | 'simulated_utc';

export interface UsageWait {
  scope: 'sapien' | 'global';
  period: 'daily' | 'burst';
  retry_at: string;
  time_basis: UsageTimeBasis;
}

export interface UsageAllowance {
  name: string;
  consumed: number;
  limit: number;
  remaining: number;
  resets_at: string;
  time_basis: UsageTimeBasis;
  burst: { available: number; capacity: number; refill_per_hour: number; next_call_at: string | null } | null;
  available_now: number;
  blocking: UsageWait[];
}

export interface AiUsageDay {
  date: string;
  by_tier: Record<string, number>;
  by_purpose: Record<string, number>;
  by_sapien: Record<string, number>;
  by_allowance?: Record<string, number>;
  total: number;
}

export interface AiUsageResponse<Kind extends AiUsageKind = AiUsageKind> {
  kind: Kind;
  today: string;
  time_basis?: 'real_utc';
  allowance_limits?: Record<string, number>;
  today_by_allowance?: Record<string, number>;
  limits: Record<string, number>;
  global_limits: Record<string, number>;
  sapien_limits: Record<string, number>;
  scope: AiUsageScope;
  today_by_tier: Record<string, number>;
  today_by_purpose: Record<string, number>;
  today_by_sapien: Record<string, number>;
  today_total: number;
  history: AiUsageDay[];
  availability?: {
    as_of: string;
    allowance_time: string;
    time_basis: UsageTimeBasis;
    rows: UsageAllowance[];
    shared_waits: Record<string, UsageWait>;
  } | null;
  runtime?: {
    activity_state: string;
    simulation_owned: boolean;
    quota_waiting_jobs: number | null;
    earliest_quota_retry_at?: string | null;
  };
}
