export type GoalStatus = string;
export type GoalSource = string;
export type StepStatus = string;
export type PlanStatus = string;

export interface StateRules {
  allowed: string[];
  transitions: [string, string][];
  restrict_transitions: boolean;
}

export interface WorkflowRecord {
  id: string;
  sapien_id: number;
  description: string;
  state: string;
  state_rules: StateRules | null;
  // Missing legacy flags are unknown, never inferred from state names.
  finished: boolean | null;
  retired: boolean | null;
  revision: number | null;
  creator: string;
  owner: string;
  requested_by: string | null;
  review_enabled: boolean | null;
  review_at: string | null;
  review_interval_seconds: number | null;
  review_version: number | null;
  evidence_refs: string[];
  progress: number | null;
  metadata: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
}

export interface GoalRelation { type: string; target_id: string }
export interface GoalEvidence { kind: string; ref: string }

export interface PlanStep {
  id: string;
  description: string;
  state: StepStatus;
  finished: boolean | null;
  result: string;
  evidence_refs: string[];
}

export interface Plan extends WorkflowRecord {
  goal_id: string | null;
  tasks: PlanStep[];
  task_rules: StateRules | null;
}

export interface Goal extends WorkflowRecord {
  motivation: string;
  source: GoalSource;
  importance: number | null;
  priority: number | null;
  relations: GoalRelation[];
  evidence: GoalEvidence[];
  current_plan?: Plan | null;
}

export interface ContextFact {
  key: string;
  value: string;
  source: string;
  confidence: number;
  pinned_at: string | null;
}

export interface ContextDecision {
  at: string;
  decision: string;
  rationale: string;
}

export interface ContextAssumption {
  text: string;
  confidence: number;
  status: string;
}

export interface ContextQuestion {
  id: string;
  question: string;
  asked_at: string;
  resolved_at?: string | null;
  resolution?: string | null;
}

export interface GoalContext {
  id: string;
  goal_id: string | null;
  facts: ContextFact[];
  decisions: ContextDecision[];
  assumptions: ContextAssumption[];
  open_questions: ContextQuestion[];
}

export interface GoalDetail {
  goal: Goal;
  context: GoalContext | null;
  current_plan: Plan | null;
  plan_context: GoalContext | null;
}

export interface GoalsListResponse {
  goals: Goal[];
  count: number;
}
