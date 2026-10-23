import { apiClient } from '../api/apiClient';
import type { FeedbackResponse, FeedbackState } from '../../types/feedbackTypes';

export const feedbackService = {
  async list(sapienId: string | number, states: FeedbackState[] = [], limit = 50, offset = 0): Promise<FeedbackResponse> {
    const query = new URLSearchParams();
    states.forEach(state => query.append('state', state));
    query.set('limit', String(Math.min(100, Math.max(1, Math.trunc(limit) || 50))));
    query.set('offset', String(offset));
    return (await apiClient.get<FeedbackResponse>(`/sapien/${sapienId}/feedback?${query}`, { cache: 'no-store' })).data;
  },
};
