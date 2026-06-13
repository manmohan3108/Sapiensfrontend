export type GoalStatus = 'pending' | 'active' | 'blocked' | 'done' | 'failed' | 'abandoned';
export type GoalSource = 'user' | 'curiosity' | 'parent' | 'lesson' | 'external';
export type StepStatus  = 'pending' | 'active' | 'done' | 'skipped' | 'blocked';
export type PlanStatus  = 'active' | 'superseded' | 'abandoned' | 'done';

export interface GoalRelation { type: string; target_id: string }
export interface GoalEvidence { kind: string; ref: string }

export interface PlanStep {
  id: string;
  description: string;
  status: StepStatus;
  attrs: Record<string, unknown>;
}

export interface Plan {
  id: string;
  goal_id: string;
  version: number;
  status: PlanStatus;
  steps: PlanStep[];
}

export interface Goal {
  id: string;
  sapien_id: number;
  description: string;
  motivation: string;
  source: GoalSource;
  status: GoalStatus;
  importance: number;
  priority: number;
  progress: number;
  relations: GoalRelation[];
  evidence: GoalEvidence[];
  attrs: Record<string, unknown>;
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
  goal_id: string;
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
  total?: number;
}
