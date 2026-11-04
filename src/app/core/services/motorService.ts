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
export interface MotorToolChoice { server: string; tool: string }
interface MotorToolPage { items: MotorToolChoice[]; next_offset: number | null }
const base = (sapienId: string) => `/sapien/${encodeURIComponent(sapienId)}/motor`;
export const motorService = {
  async tools(sapienId: string, scope: string | null, signal: AbortSignal): Promise<MotorToolChoice[]> {
    const items: MotorToolChoice[] = [];
    let offset = 0;
    while (true) {
      const query = new URLSearchParams({ offset: String(offset) });
      if (scope !== null) query.set('scope', scope);
      const page = (await apiClient.get<MotorToolPage>(base(sapienId) + '/tools?' + query, { signal })).data;
      items.push(...page.items);
      if (page.next_offset === null) return items;
      if (!Number.isInteger(page.next_offset) || page.next_offset <= offset) throw new Error('Could not load all tool choices.');
      offset = page.next_offset;
    }
  },
  async list(sapienId: string, query: string, signal: AbortSignal): Promise<MotorPage> {
    return (await apiClient.get<MotorPage>(`${base(sapienId)}?${query}`, { signal })).data;
  },
  async detail(sapienId: string, id: string, scope: string | null, signal: AbortSignal): Promise<MotorDetail> {
    const query = scope === null ? '' : '?' + new URLSearchParams({ scope });
    return (await apiClient.get<{ item: MotorDetail }>(`${base(sapienId)}/${encodeURIComponent(id)}${query}`, { signal })).data.item;
  },
};
