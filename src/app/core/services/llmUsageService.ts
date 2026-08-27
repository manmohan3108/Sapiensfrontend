import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';
import type { AiUsageKind, AiUsageResponse } from '../../types/llmUsageTypes';

class AiUsageService {
  async getUsage<Kind extends AiUsageKind>(kind: Kind, sapienId?: string, days = 7): Promise<AiUsageResponse<Kind>> {
    const params = new URLSearchParams({ days: String(days) });
    if (sapienId) params.set('sapien_id', sapienId);
    const endpoint = kind === 'llm' ? API_ENDPOINTS.llmUsage : API_ENDPOINTS.embeddingUsage;
    const response = await apiClient.get<AiUsageResponse<Kind>>(`${endpoint}?${params.toString()}`);
    return response.data;
  }
}

export const aiUsageService = new AiUsageService();
