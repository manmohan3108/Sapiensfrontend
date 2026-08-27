export type AiUsageKind = 'llm' | 'embedding';
export type AiUsageScope = 'global' | `sapien:${string}`;

export interface AiUsageDay {
  date: string;
  by_tier: Record<string, number>;
  by_purpose: Record<string, number>;
  by_sapien: Record<string, number>;
  total: number;
}

export interface AiUsageResponse<Kind extends AiUsageKind = AiUsageKind> {
  kind: Kind;
  today: string;
  limits: Record<string, number>;
  global_limits: Record<string, number>;
  sapien_limits: Record<string, number>;
  scope: AiUsageScope;
  today_by_tier: Record<string, number>;
  today_by_purpose: Record<string, number>;
  today_by_sapien: Record<string, number>;
  today_total: number;
  history: AiUsageDay[];
}
