import { apiClient } from '../api/apiClient';
import type { LearningDetail, LearningPage, LearningRevision, LearningUsage, RevisionDetail, ToolProfile } from '../../types/toolLearningTypes';

const base = (sapienId: string) => `/sapien/${encodeURIComponent(sapienId)}/tool-learning`;
const record = (sapienId: string, id: string) => `${base(sapienId)}/${encodeURIComponent(id)}`;

export const toolLearningService = {
  async profiles(sapienId: string, query: string): Promise<LearningPage<ToolProfile>> {
    return (await apiClient.get<LearningPage<ToolProfile>>(`${base(sapienId)}?${query}`)).data;
  },
  async services(sapienId: string, signal: AbortSignal): Promise<string[]> {
    // The API has no facets endpoint. Read every page without result filters so
    // a service cannot disappear because of search, scope, or the selected page.
    const servers = new Set<string>();
    let offset = 0;
    while (true) {
      signal.throwIfAborted();
      const query = new URLSearchParams({ limit: '25', offset: String(offset), sort: 'server', direction: 'asc' });
      const page = (await apiClient.get<LearningPage<ToolProfile>>(`${base(sapienId)}?${query}`, { signal })).data;
      signal.throwIfAborted();
      for (const profile of page.items) servers.add(profile.server);
      if (page.next_offset == null) break;
      if (!Number.isSafeInteger(page.next_offset) || page.next_offset <= offset) {
        throw new Error('Could not finish reading the service list. Please retry.');
      }
      offset = page.next_offset;
    }
    return [...servers].sort((a, b) => a.localeCompare(b));
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
