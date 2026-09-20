import { apiClient } from '../api/apiClient';
import type { InquiryDetail, InquiryFilters, InquiryKind, InquiryPage } from '../../types/inquiryTypes';

const endpoint = (sapienId: string, kind: InquiryKind) => `/sapien/${encodeURIComponent(sapienId)}/${kind}/${kind === 'questioning' ? 'questions' : 'probes'}`;
export const inquiryService = {
  async list(sapienId: string, kind: InquiryKind, filters: InquiryFilters): Promise<InquiryPage> {
    const query = new URLSearchParams({ limit: String(filters.limit) });
    for (const key of ['state', 'source', 'simulation_run_id', 'channel', 'delivery_state'] as const) {
      if (kind === 'questioning' && (key === 'channel' || key === 'delivery_state')) continue;
      if (filters[key]) query.set(key, filters[key]);
    }
    return (await apiClient.get<InquiryPage>(`${endpoint(sapienId, kind)}?${query}`, { cache: 'no-store' })).data;
  },
  async detail(sapienId: string, kind: InquiryKind, id: string, runId: string): Promise<InquiryDetail> {
    const query = new URLSearchParams();
    if (runId) query.set('simulation_run_id', runId);
    return (await apiClient.get<InquiryDetail>(`${endpoint(sapienId, kind)}/${encodeURIComponent(id)}?${query}`, { cache: 'no-store' })).data;
  },
};
