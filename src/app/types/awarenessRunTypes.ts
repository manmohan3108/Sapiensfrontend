import type { AwarenessBeatEvent } from './sapiensTypes';

export interface AwarenessMemoryReference {
  id: string;
  memory_source: string;
  container_id?: string;
}

export interface AwarenessRunSubject {
  availability?: 'recorded' | 'not_recorded' | 'not_applicable';
  kind: string;
  source?: string;
  provider?: string | null;
  sender?: { ref: string | null; name: string | null };
  recipient?: { ref: string | null; name: string | null };
  channel?: Record<string, string | null>;
  content?: string;
  content_truncated?: boolean;
  event_at?: string | null;
  source_reference?: AwarenessMemoryReference | null;
  origin_relation?: 'event' | 'related_subject';
  origin?: Record<string, unknown>;
  handle?: string | null;
  correlation_id?: string | null;
  causation_id?: string | null;
}

export interface AwarenessRunSummary {
  id: string;
  mode: string;
  title: string;
  started_at?: string | null;
  completed_at?: string | null;
  trigger: AwarenessRunSubject;
  focus: AwarenessRunSubject;
  processing_state: string;
  assessment_state: string;
  understanding_preview: string;
  remaining_preview: string;
  actions: { recorded: number; succeeded: number; failed: number; uncertain: number; trace_truncated: boolean };
  delivery: {
    outward_expected: boolean | null;
    response_present: boolean | null;
    reply_satisfied_by_tool: boolean | null;
    confirmed_tool_messages: number | null;
  };
  thought_link: { status: 'exact' | 'ambiguous' | 'unavailable'; id: string | null };
}

export interface AwarenessRunsResponse {
  sapien_id: number;
  inspection_mode: 'stored';
  items: AwarenessRunSummary[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
  next_offset: number | null;
  ordering: 'started_at_desc';
}

export interface AwarenessActionDetail {
  activity_id: string | null;
  match_status: 'exact' | 'ambiguous' | 'unavailable';
  server?: string | null;
  tool?: string | null;
  arguments?: unknown;
  result?: unknown;
  result_detail_truncated?: boolean | null;
  is_error?: boolean | null;
  is_uncertain?: boolean | null;
  observed_at?: string | null;
}

export interface AwarenessRunStep {
  title: string;
  summary: string;
  round: number | null;
  event_index: number;
  decision?: string | null;
  evidence: AwarenessBeatEvent & { omitted?: boolean };
  action_detail?: AwarenessActionDetail | null;
}

export interface AwarenessRunDetail {
  sapien_id: number;
  inspection_mode: 'stored';
  run: AwarenessRunSummary;
  trigger: AwarenessRunSubject;
  focus: AwarenessRunSubject;
  understanding: string;
  assessment: Record<string, unknown>;
  activity: { steps: AwarenessRunStep[]; round_count: number; truncated: boolean; ordering: string };
  context: Record<string, unknown>;
  delivery: Record<string, unknown>;
  source_records: Array<{
    reference: AwarenessMemoryReference;
    availability: 'available' | 'unavailable';
    content: string | null;
    content_truncated: boolean;
    metadata: Record<string, unknown>;
  }>;
  technical: Record<string, unknown>;
}
