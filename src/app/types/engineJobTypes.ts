export type EngineJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface EngineJobFilters {
  days: number;
  engine_name: string;
  status: EngineJobStatus | '';
  limit: number;
}

export interface EngineJobSummary {
  engine_name: string;
  status: EngineJobStatus;
  count: number;
  due: number;
  delayed: number;
  expired_leases: number;
  retried: number;
}

export interface EngineJob {
  id: string;
  engine_name: string;
  action: unknown;
  workflow_id: unknown;
  parent_job_id: unknown;
  status: EngineJobStatus;
  origin: unknown;
  retries: number;
  max_retries: number;
  cooldown_seconds: number;
  created_at: string;
  updated_at: string;
  available_at: string | null;
  run_started_at: string | null;
  lease_until: string | null;
  eligibility: 'due' | 'delayed' | 'leased' | 'lease_expired' | 'terminal' | 'unknown';
  age_seconds: number;
  running_seconds: number | null;
  has_error: boolean;
  error_flags: Partial<Record<'retryable' | 'will_retry' | 'timed_out', boolean>>;
}

export interface EngineJobPage {
  sapien_id: number;
  as_of: string;
  since: string;
  until: string;
  filters: Omit<EngineJobFilters, 'limit'>;
  total: number;
  summary: EngineJobSummary[];
  jobs: EngineJob[];
  limit: number;
  next_cursor: string | null;
}

export interface EngineJobDetailResponse {
  sapien_id: number;
  as_of: string;
  job: EngineJob & { payload: unknown; progress: unknown; error: unknown };
}
