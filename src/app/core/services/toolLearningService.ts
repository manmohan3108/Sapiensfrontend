import { apiClient } from '../api/apiClient';
import type { LearningDetail, LearningPage, LearningRevision, LearningUsage, RevisionDetail, ToolProfile } from '../../types/toolLearningTypes';

const base = (sapienId: string) => `/sapien/${encodeURIComponent(sapienId)}/tool-learning`;
const record = (sapienId: string, id: string) => `${base(sapienId)}/${encodeURIComponent(id)}`;

export const toolLearningService = {
  async profiles(sapienId: string, query: string): Promise<LearningPage<ToolProfile>> {
    return (await apiClient.get<LearningPage<ToolProfile>>(`${base(sapienId)}?${query}`)).data;
  },
  async detail(sapienId: string, id: string): Promise<LearningDetail> {
    return (await apiClient.get<LearningDetail>(record(sapienId, id))).data;
  },
  async revisions(sapienId: string, id: string, query: string): Promise<LearningPage<LearningRevision>> {
    return (await apiClient.get<LearningPage<LearningRevision>>(`${record(sapienId, id)}/revisions?${query}`)).data;
  },
  async revision(sapienId: string, id: string, revisionId: string): Promise<RevisionDetail> {
    return (await apiClient.get<RevisionDetail>(`${record(sapienId, id)}/revisions/${encodeURIComponent(revisionId)}`)).data;
  },
  async usage(sapienId: string, id: string, query: string): Promise<LearningPage<LearningUsage>> {
    return (await apiClient.get<LearningPage<LearningUsage>>(`${record(sapienId, id)}/usage?${query}`)).data;
  },
};
