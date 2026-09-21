export type InquiryKind = 'questioning' | 'curiosity';
export interface InquiryFilters {
  limit: number;
  state: '' | 'open' | 'answered' | 'stale';
  source: string;
  channel: '' | 'user' | 'source' | 'experiment';
  delivery_state: '' | 'proposed' | 'attention_requested' | 'reviewed';
}
export interface InquiryRecord {
  id: string;
  question: string | null;
  original_question?: string | null;
  source: string | null;
  source_handle: unknown;
  state: 'open' | 'answered' | 'stale' | null;
  created_at: string | null;
  simulation_run_id?: string | null;
  job_id: string | null;
  request_id?: string | null;
  workflow_id: string | null;
  occurred_at?: string | null;
  expires_at: string | null;
  closed_at?: string | null;
  gap_key?: string | null;
  channel?: 'user' | 'source' | 'experiment' | null;
  selection_reason?: string | null;
  delivery_state?: 'proposed' | 'attention_requested' | 'reviewed' | null;
  review_version?: number | null;
  review_at?: string | null;
  resolved_at?: string | null;
  asked_at?: string | null;
  attention?: unknown;
  usage_outcome?: unknown;
  usage_observed_at?: string | null;
  updated_at?: string | null;
  blocking?: boolean | null;
}
export interface InquiryPage {
  sapien_id: number;
  as_of: string;
  count: number;
  limit: number;
  has_more: boolean;
  subset_only: true;
  ordering: 'created_at_desc_within_subset';
  filters: Partial<InquiryFilters>;
  summary: { states: Record<string, number>; sources: Record<string, number>; channels?: Record<string, number>; delivery_states?: Record<string, number> };
  items: InquiryRecord[];
}
export interface InquiryDetail {
  sapien_id: number;
  as_of: string;
  item: InquiryRecord & { context: unknown; outcome: unknown; question_record_id?: string | null };
}
