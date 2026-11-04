import { apiClient } from '../api/apiClient';

export type MotorStatus = 'success' | 'error' | 'uncertain' | 'unknown';
export interface MotorActivity {
  id: string; occurred_at: string | null; observed_at: string | null;
  scope: string | null; server: string | null; tool: string | null;
  status: MotorStatus; caller: string | null; execution_id: string | null;
}
export interface MotorDetail extends MotorActivity {
  evidence: { content?: string; truncated?: boolean };
  arguments: unknown; context: unknown; communication: unknown;
  correlation_id: string | null; source_ref: string | null;
}
export interface MotorPage {
  sapien_id: number; items: MotorActivity[]; total: number; offset: number;
  limit: number; next_offset: number | null;
}
const base = (sapienId: string) => `/sapien/${encodeURIComponent(sapienId)}/motor`;
export const motorService = {
  async list(sapienId: string, query: string, signal: AbortSignal): Promise<MotorPage> {
    return (await apiClient.get<MotorPage>(`${base(sapienId)}?${query}`, { signal })).data;
  },
  async detail(sapienId: string, id: string, scope: string | null, signal: AbortSignal): Promise<MotorDetail> {
    const query = scope === null ? '' : '?' + new URLSearchParams({ scope });
    return (await apiClient.get<{ item: MotorDetail }>(`${base(sapienId)}/${encodeURIComponent(id)}${query}`, { signal })).data.item;
  },
};
