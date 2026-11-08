export interface WorkspaceQuestion {
  id: string;
  question: string | null;
  state: 'open' | 'answered' | 'stale' | null;
  created_at: string | null;
  closed_at: string | null;
  simulation_run_id: string | null;
}
export interface WorkspaceQuestionDetail extends WorkspaceQuestion {
  explanation: string | null;
  original_input: string | null;
  supporting_context: string[];
}
export interface WorkspaceQuestionPage {
  sapien_id: number;
  as_of: string;
  items: WorkspaceQuestion[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}
