export type SimulationStatus =
  | 'created' | 'starting' | 'running' | 'paused' | 'stopping'
  | 'completed' | 'stopped' | 'limit_reached' | 'failed';

export interface SimulationRun {
  run_id: string;
  status: SimulationStatus;
  simulated_time: string;
  speed: number;
  paused: boolean;
  pending_scenario_events: number | null;
  pending_replies: number | null;
  detail: string | null;
}

export interface SimulationEvent {
  run_id: string;
  sequence: number;
  source: string;
  occurred_at: string;
  observed_at: string;
  payload: Record<string, unknown>;
  operation_id: string | null;
  scheduled_at: string | null;
}

export interface SimulationMetric {
  expectation_id: string;
  verdict: 'pass' | 'fail' | 'insufficient_evidence';
  explanation: string;
  evidence_ids: string[];
}

export interface SimulationResult {
  run_id: string;
  status: SimulationStatus;
  detail: string;
  report: { run_id: string | null; run_status: string | null; metrics: SimulationMetric[] };
  pass_rate: number | null;
}

export interface SimulationCreateRequest {
  config: { run_id: string; speed: number; max_wall_seconds: number; max_records: number };
  scenario: Record<string, unknown>;
  expectations: unknown[];
}

export interface SimulationList { worker_id: number; runs: SimulationRun[] }
export interface SimulationEventPage { events: SimulationEvent[]; next_after: number; has_more: boolean }

