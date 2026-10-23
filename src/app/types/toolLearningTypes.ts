export interface LearningEnvelope {
  sapien_id: number;
  configured_mode: string;
  as_of: string;
}

export interface LearningPage<T> extends LearningEnvelope {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  next_offset: number | null;
}

export interface ToolLesson {
  guidance?: string;
  conditions?: string;
  uncertainty?: string;
  confidence?: number;
  evidence_ids?: string[];
  _truncated?: boolean;
}

export interface ToolProfile {
  id: string;
  scope: string;
  server: string;
  tool: string;
  fingerprint: string;
  revision: number;
  revision_id: string | null;
  lesson_count: number;
  updated_at: string | null;
  documented_at: string | null;
  description?: string;
  lessons?: (ToolLesson | string)[];
}

export interface LearningEvidence {
  id: string;
  available: boolean;
  content?: string;
  metadata?: Record<string, unknown>;
  observed_at?: string | null;
  truncated?: boolean;
  provenance?: {
    source?: string;
    occurred_at?: string;
    caller?: string;
    execution_id?: string;
    server?: string;
    tool?: string;
    is_error?: boolean | null;
    is_uncertain?: boolean | null;
  };
}

export interface LearningRevision {
  id: string;
  revision: number;
  publication: 'current' | 'published' | 'legacy' | 'unpublished_candidate';
  lessons?: (ToolLesson | string)[];
  updated_at: string | null;
  batch_id?: string;
}

export interface LearningUsage {
  id: string;
  consumer?: string;
  outcome?: string;
  reason?: string;
  occurred_at?: string;
  items?: ({ item_id?: string; outcome?: string; reason?: string } | string)[];
}

export interface LearningDetail extends LearningEnvelope {
  profile: ToolProfile;
  evidence: LearningEvidence[];
}

export interface RevisionDetail extends LearningEnvelope {
  revision: LearningRevision;
  evidence: LearningEvidence[];
}
