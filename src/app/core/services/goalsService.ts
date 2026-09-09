import { apiConfig } from '../config/apiConfig';
import type { Goal, GoalDetail, GoalsListResponse, Plan, WorkflowRecord, StateRules, GoalContext } from '../../types/goalTypes';
import { authenticatedFetch } from '../auth/authSession';

export class OverloadedError extends Error {
  constructor() { super('Sapien is busy right now. Try again in a moment.'); this.name = 'OverloadedError'; }
}

export interface CommentResponse {
  queued: boolean;
  job_id?: string;
  scope?: string;
  step_id?: string;
}

const base = apiConfig.baseUrl;

type Wire = Record<string, unknown>;
const object = (v: unknown): Wire => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Wire : {};
const array = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
const string = (v: unknown): string => typeof v === 'string' ? v : '';
const number = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null;
const flag = (v: unknown): boolean | null => typeof v === 'boolean' ? v : null;
const strings = (v: unknown): string[] => array(v).filter((s): s is string => typeof s === 'string');
const displayValue = (v: unknown): string => typeof v === 'string' ? v : v == null ? '' : JSON.stringify(v);

function rules(v: unknown): StateRules | null {
  if (v == null) return null;
  const r = object(v);
  return {
    allowed: strings(r.allowed),
    transitions: array(r.transitions).filter((p): p is [string, string] =>
      Array.isArray(p) && p.length === 2 && p.every(s => typeof s === 'string')),
    restrict_transitions: r.restrict_transitions === true,
  };
}

function record(v: unknown): WorkflowRecord {
  const r = object(v);
  return {
    id: string(r.id), sapien_id: number(r.sapien_id) ?? 0, description: string(r.description),
    state: string(r.state ?? r.status), state_rules: rules(r.state_rules),
    finished: flag(r.finished), retired: flag(r.retired), revision: number(r.revision ?? r.version),
    creator: string(r.creator), owner: string(r.owner), requested_by: string(r.requested_by) || null,
    review_enabled: flag(r.review_enabled), review_at: string(r.review_at) || null,
    review_interval_seconds: number(r.review_interval_seconds), review_version: number(r.review_version),
    evidence_refs: strings(r.evidence_refs), progress: number(r.progress),
    metadata: object(r.metadata ?? r.attrs),
    created_at: string(r.created_at) || null, updated_at: string(r.updated_at) || null,
  };
}

function plan(v: unknown): Plan | null {
  if (!string(object(v).id)) return null;
  const r = object(v);
  return { ...record(r), goal_id: string(r.goal_id) || null, task_rules: rules(r.task_rules),
    tasks: array(r.tasks ?? r.steps).map(v => {
      const t = object(v);
      return { id: string(t.id), description: string(t.description), state: string(t.state ?? t.status),
        finished: flag(t.finished), result: displayValue(t.result), evidence_refs: strings(t.evidence_refs) };
    }),
  };
}

function goal(v: unknown): Goal {
  const r = object(v), normalized = record(r), m = normalized.metadata;
  return { ...normalized,
    motivation: string(m.motivation ?? r.motivation),
    source: string(m.source ?? r.creator ?? r.source),
    importance: number(m.importance ?? r.importance), priority: number(m.priority ?? r.priority),
    relations: array(m.relations ?? r.relations).map(v => {
      const x = object(v); return { type: string(x.type), target_id: string(x.target_id) };
    }).filter(x => x.target_id),
    evidence: array(m.evidence ?? r.evidence).map(v => {
      const x = object(v); return { kind: string(x.kind), ref: string(x.ref) };
    }).filter(x => x.ref),
    current_plan: plan(r.current_plan),
  };
}

function context(v: unknown): GoalContext | null {
  if (v == null) return null;
  const r = object(v);
  return { id: string(r.id), goal_id: string(r.goal_id) || null,
    facts: array(r.facts).map(v => { const f = object(v); return {
      key: string(f.key), value: displayValue(f.value), source: string(f.source),
      confidence: number(f.confidence) ?? 0, pinned_at: string(f.pinned_at) || null,
    }; }),
    decisions: array(r.decisions).map(v => { const d = object(v); return {
      at: string(d.at), decision: string(d.decision), rationale: string(d.rationale),
    }; }),
    assumptions: array(r.assumptions).map(v => { const a = object(v); return {
      text: string(a.text), confidence: number(a.confidence) ?? 0, status: string(a.status),
    }; }),
    open_questions: array(r.open_questions).map((v, i) => { const q = object(v); return {
      id: string(q.id) || `question-${i}`, question: typeof v === 'string' ? v : string(q.question),
      asked_at: string(q.asked_at), resolved_at: string(q.resolved_at) || null, resolution: string(q.resolution) || null,
    }; }).filter(q => q.question),
  };
}

async function goalsFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await authenticatedFetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const ct = res.headers.get('content-type') ?? '';
  if (res.status === 503) throw new OverloadedError();
  if (!ct.includes('application/json')) {
    throw new Error(`HTTP ${res.status} – server returned non-JSON`);
  }
  const json = await res.json();
  if (!res.ok) {
    throw new Error(string(object(json).error) || `HTTP ${res.status}`);
  }
  return json as T;
}

export interface GoalListParams {
  activeOnly?: boolean;
  finished?: boolean;
  retired?: boolean;
  statusIn?: string[];
  sourceIn?: string[];
  match?: string;
  topK?: number;
  orderBy?: 'priority' | 'importance' | 'updated_at' | 'created_at';
  includePlan?: boolean;
}

export const goalsService = {
  async listGoals(sapienId: number, params: GoalListParams = {}): Promise<GoalsListResponse> {
    const q = new URLSearchParams();
    if (params.activeOnly !== undefined) q.set('active_only', String(params.activeOnly));
    if (params.finished !== undefined) q.set('finished', String(params.finished));
    if (params.retired !== undefined) q.set('retired', String(params.retired));
    if (params.finished !== undefined || params.retired !== undefined) q.set('active_only', 'false');
    if (params.statusIn?.length)         q.set('status_in',  params.statusIn.join(','));
    if (params.sourceIn?.length)         q.set('source_in',  params.sourceIn.join(','));
    if (params.match)                    q.set('match',       params.match);
    q.set('top_k',      String(params.topK    ?? 20));
    q.set('order_by',   params.orderBy ?? 'priority');
    q.set('include_plan', String(params.includePlan ?? true));
    const r = await goalsFetch<Wire>(`${base}/sapien/${sapienId}/goals?${q}`);
    const goals = array(r.goals).map(goal).filter(g => g.id);
    // Older servers silently ignore these filters. Never show mismatched records;
    // server-side filtering is still required to apply the bound correctly.
    if (goals.some(g => (params.finished !== undefined && g.finished !== params.finished)
      || (params.retired !== undefined && g.retired !== params.retired))) {
      throw new Error('The server did not apply lifecycle filters. The Goal/Plan backend update is required.');
    }
    return { goals, count: number(r.count) ?? goals.length };
  },

  async getGoal(sapienId: number, goalId: string): Promise<GoalDetail> {
    const r = await goalsFetch<Wire>(`${base}/sapien/${sapienId}/goals/${encodeURIComponent(goalId)}`);
    if (!string(object(r.goal).id)) throw new Error('Goal not found or no longer available.');
    const currentPlan = plan(r.current_plan);
    return { goal: goal(r.goal), context: context(r.context), current_plan: currentPlan,
      plan_context: currentPlan ? context(r.plan_context) : null };
  },

  replan(sapienId: number, goalId: string, reason: string): Promise<void> {
    return goalsFetch<void>(`${base}/sapien/${sapienId}/goals/${encodeURIComponent(goalId)}/replan`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // ── Comment ───────────────────────────────────────────────────────────────
  async comment(sapienId: number, goalId: string, params: {
    comment: string;
    scope: 'goal' | 'plan' | 'step';
    step_id?: string;
  }): Promise<CommentResponse> {
    const res = await authenticatedFetch(`${base}/sapien/${sapienId}/goals/${encodeURIComponent(goalId)}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const ct = res.headers.get('content-type') ?? '';
    const json = ct.includes('application/json') ? await res.json() : null;
    if (res.status === 503) throw new OverloadedError();
    if (!res.ok) throw new Error((json as { error?: string })?.error ?? `HTTP ${res.status}`);
    return json as CommentResponse;
  },
};

// Re-export type so consumers can import from service
export type { Goal, GoalDetail, GoalsListResponse };
