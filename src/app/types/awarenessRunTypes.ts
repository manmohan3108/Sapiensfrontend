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
  trigger_category?: string;
  focus: AwarenessRunSubject;
  record_version?: number;
  focus_selection?: AwarenessFocusSelection;
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

export interface AwarenessFocusSelection {
  status: 'selected' | 'no_focus' | 'not_recorded';
  provenance: 'recorded' | 'legacy';
  content: string;
  content_truncated?: boolean;
  reason: string;
  reason_code: string;
  primary: AwarenessRunSubject;
  contributors: AwarenessRunSubject[];
  contributors_truncated: boolean;
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
  filters?: { trigger: string; search: string };
  trigger_categories?: Array<{ value: string; label: string }>;
}

export interface AwarenessActionDetail {
  activity_id: string | null;
  match_status: 'exact' | 'ambiguous' | 'unavailable';
  server?: string | null;
  tool?: string | null;
  arguments?: unknown;
  result?: unknown;
  result_kind?: 'activity_record' | 'outcome_evidence';
  result_detail_truncated?: boolean | null;
  is_error?: boolean | null;
  is_uncertain?: boolean | null;
  observed_at?: string | null;
}

export interface AwarenessRunStep {
  title: string;
  summary: string;
  round: number | null;
  kind?: string;
  phase?: string;
  event_index: number;
  decision?: string | null;
  evidence: AwarenessBeatEvent & { omitted?: boolean; kind?: string; phase?: string; loop_index?: number | null };
  action_detail?: AwarenessActionDetail | null;
}

export interface AwarenessRunDetail {
  sapien_id: number;
  inspection_mode: 'stored';
  run: AwarenessRunSummary;
  trigger: AwarenessRunSubject;
  focus: AwarenessRunSubject;
  focus_selection?: AwarenessFocusSelection;
  understanding: string;
  assessment: Record<string, unknown>;
  activity: { steps: AwarenessRunStep[]; round_count: number; rounds_inferred?: boolean; truncated: boolean; ordering: string };
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
