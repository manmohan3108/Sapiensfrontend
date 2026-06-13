import { apiConfig } from '../config/apiConfig';
import type { Goal, GoalDetail, GoalsListResponse } from '../../types/goalTypes';

export class OverloadedError extends Error {
  constructor() { super('overloaded'); this.name = 'OverloadedError'; }
}

export interface CommentResponse {
  queued: boolean;
  job_id?: string;
  scope?: string;
  step_id?: string;
}

const base = apiConfig.baseUrl;

async function goalsFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    throw new Error(`HTTP ${res.status} – server returned non-JSON`);
  }
  const json = await res.json();
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return json as T;
}

export interface GoalListParams {
  activeOnly?: boolean;
  statusIn?: string[];
  sourceIn?: string[];
  match?: string;
  topK?: number;
  orderBy?: 'priority' | 'importance' | 'updated_at' | 'created_at';
  includePlan?: boolean;
}

export const goalsService = {
  listGoals(sapienId: number, params: GoalListParams = {}): Promise<GoalsListResponse> {
    const q = new URLSearchParams();
    if (params.activeOnly !== undefined) q.set('active_only', String(params.activeOnly));
    if (params.statusIn?.length)         q.set('status_in',  params.statusIn.join(','));
    if (params.sourceIn?.length)         q.set('source_in',  params.sourceIn.join(','));
    if (params.match)                    q.set('match',       params.match);
    q.set('top_k',      String(params.topK    ?? 20));
    q.set('order_by',   params.orderBy ?? 'priority');
    q.set('include_plan', String(params.includePlan ?? true));
    return goalsFetch<GoalsListResponse>(`${base}/sapien/${sapienId}/goals?${q}`);
  },

  getGoal(sapienId: number, goalId: string): Promise<GoalDetail> {
    return goalsFetch<GoalDetail>(`${base}/sapien/${sapienId}/goals/${goalId}`);
  },

  replan(sapienId: number, goalId: string, reason: string): Promise<void> {
    return goalsFetch<void>(`${base}/sapien/${sapienId}/goals/${goalId}/replan`, {
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
    const res = await fetch(`${base}/sapien/${sapienId}/goals/${goalId}/comment`, {
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
