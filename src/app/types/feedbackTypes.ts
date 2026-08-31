export const FEEDBACK_STATES = ['unrelated', 'ambiguous', 'interpreted', 'superseded'] as const;
export type FeedbackState = typeof FEEDBACK_STATES[number];

export type FeedbackEventDetails = { available: false } | {
  available: true;
  content: string;
  metadata: Record<string, unknown>;
  observed_at: string | null;
  truncated: boolean;
};

export interface FeedbackReference {
  id: string;
  source: string;
  occurred_at: string | null;
  details?: FeedbackEventDetails;
}

export interface FeedbackFinding {
  _id: string;
  sapien_id: number;
  experience: FeedbackReference;
  activity: FeedbackReference;
  state: FeedbackState;
  meaning: string;
  confidence: number;
  created_at: string | null;
  updated_at: string | null;
  last_surfaced_at: string | null;
  acknowledged_at: string | null;
}

export interface FeedbackResponse {
  sapien_id: number;
  mode: string;
  count: number;
  findings: FeedbackFinding[];
}
