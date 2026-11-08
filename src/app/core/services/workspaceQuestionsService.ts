import { apiClient } from '../api/apiClient';
import type { WorkspaceQuestionDetail, WorkspaceQuestionPage } from '../../types/workspaceQuestionTypes';

const endpoint = (sapienId: string) => `/sapien/${encodeURIComponent(sapienId)}/open-questions`;
export const workspaceQuestionsService = {
  async list(sapienId: string, offset = 0): Promise<WorkspaceQuestionPage> {
    const { data } = await apiClient.get<WorkspaceQuestionPage>(
      `${endpoint(sapienId)}?limit=20&offset=${offset}`, { cache: 'no-store' });
    if (Number(data.sapien_id) !== Number(sapienId) || data.offset !== offset) throw new Error('Question scope mismatch');
    return data;
  },
  async detail(sapienId: string, id: string): Promise<WorkspaceQuestionDetail> {
    const { data } = await apiClient.get<{ sapien_id: number; item: WorkspaceQuestionDetail }>(
      `${endpoint(sapienId)}/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (Number(data.sapien_id) !== Number(sapienId) || data.item.id !== id) throw new Error('Question scope mismatch');
    return data.item;
  },
};
