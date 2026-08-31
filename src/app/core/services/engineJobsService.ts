import { apiClient } from '../api/apiClient';
import type { EngineJobDetailResponse, EngineJobFilters, EngineJobPage } from '../../types/engineJobTypes';

const endpoint = (sapienId: string) => `/sapien/${encodeURIComponent(sapienId)}/engine-jobs`;

export const engineJobsService = {
  async list(sapienId: string, filters: EngineJobFilters, cursor: string | null): Promise<EngineJobPage> {
    const query = new URLSearchParams({
      days: String(filters.days), limit: String(filters.limit),
      engine_name: filters.engine_name, status: filters.status,
    });
    if (cursor) query.set('cursor', cursor);
    return (await apiClient.get<EngineJobPage>(`${endpoint(sapienId)}?${query}`, { cache: 'no-store' })).data;
  },
  async detail(sapienId: string, jobId: string): Promise<EngineJobDetailResponse> {
    return (await apiClient.get<EngineJobDetailResponse>(`${endpoint(sapienId)}/${encodeURIComponent(jobId)}`, { cache: 'no-store' })).data;
  },
};
