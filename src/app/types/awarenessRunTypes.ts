import type { QuotaDetails } from './quotaTypes';
import type { AwarenessBeatEvent, AwarenessFocusDiagnostic } from './sapiensTypes';

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

export interface AwarenessContinuation {
  previous_beat_id?: string | null;
  stage?: string;
  reason?: string;
}

export interface AwarenessRunSummary {
  id: string;
  mode: string;
  title: string;
  started_at?: string | null;
  completed_at?: string | null;
  trigger: AwarenessRunSubject;
  trigger_category?: string;
  continuation?: AwarenessContinuation | null;
  focus: AwarenessRunSubject;
  record_version?: number;
  focus_selection?: AwarenessFocusSelection;
  processing_state: string;
  quota?: QuotaDetails | null;
  quota_events?: QuotaDetails[];
  failure_stage?: string | null;
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

export interface AwarenessFocusSelection extends AwarenessFocusDiagnostic<AwarenessRunSubject> {
  provenance: 'recorded' | 'legacy';
  content_truncated?: boolean;
}

export interface AwarenessRunsResponse {
  sapien_id: number;
  inspection_mode: 'stored';
  current_understanding?: AwarenessStory;
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
  ongoing_understanding?: AwarenessStoryReview;
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

export interface AwarenessStory {
  availability: 'available' | 'empty' | 'unavailable' | 'not_recorded' | 'ambiguous';
  revision?: number;
  reference?: string;
  recorded_at?: string | null;
  overall_perspective?: string;
  immediate_perspective?: string;
  summary_record_id?: string | null;
}

export interface AwarenessStoryReview {
  supplied: AwarenessStory;
  update: {
    status: 'saved' | 'pending' | 'review_pending' | 'reviewed' | 'failed' | 'no_update_recorded' | 'not_recorded' | 'unavailable' | 'ambiguous';
    proposal?: {
      based_revision: number;
      overall_perspective: string;
      immediate_perspective: string;
      edits?: Array<{ perspective?: 'overall_perspective' | 'immediate_perspective'; old_text: string; new_text: string; reason: string; evidence_refs: string[] }>;
      evidence_refs?: string[];
    };
    saved_story?: AwarenessStory;
    resolution_thought?: string;
  };
}
