import { ENGRAM_ENDPOINTS } from '../config/apiConfig';
import type {
  EngramStats,
  WMResponse,
  UnitsListResponse,
  UnitDetailResponse,
  AdjacentResponse,
  RelatedResponse,
  SequenceResponse,
  SequenceDirection,
  SubgraphResponse,
  OverviewResponse,
  BatchUnitsResponse,
  EntitiesListResponse,
  EntityEpisodesResponse,
  RecallResponse,
  RecallDepth,
  MemoryType,
} from '../../types/engramTypes';

async function engramFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return json as T;
}

export const engramService = {
  // ── Stats ─────────────────────────────────────────────────────────────────
  getStats(sapienId: number): Promise<EngramStats> {
    return engramFetch<EngramStats>(ENGRAM_ENDPOINTS.stats(sapienId));
  },

  // ── Working memory ────────────────────────────────────────────────────────
  getWM(sapienId: number): Promise<WMResponse> {
    return engramFetch<WMResponse>(ENGRAM_ENDPOINTS.wm(sapienId));
  },

  // ── Units list ────────────────────────────────────────────────────────────
  getUnits(params: {
    sapienId: number;
    memoryType?: MemoryType | null;
    page?: number;
    pageSize?: number;
  }): Promise<UnitsListResponse> {
    const q = new URLSearchParams({ sapien_id: String(params.sapienId) });
    if (params.memoryType) q.set('memory_type', params.memoryType);
    if (params.page)       q.set('page',        String(params.page));
    if (params.pageSize)   q.set('page_size',   String(params.pageSize));
    return engramFetch<UnitsListResponse>(`${ENGRAM_ENDPOINTS.units()}?${q}`);
  },

  // ── Unit detail ───────────────────────────────────────────────────────────
  getUnit(id: string): Promise<UnitDetailResponse> {
    return engramFetch<UnitDetailResponse>(ENGRAM_ENDPOINTS.unit(id));
  },

  // ── Batch unit hydration (up to 200 ids) ─────────────────────────────────
  batchUnits(ids: string[]): Promise<BatchUnitsResponse> {
    return engramFetch<BatchUnitsResponse>(`${ENGRAM_ENDPOINTS.batchUnits()}?ids=${ids.join(',')}`);
  },

  // ── Adjacent ─────────────────────────────────────────────────────────────
  getAdjacent(
    id: string,
    params?: { mechanism?: string; relation?: string; direction?: string }
  ): Promise<AdjacentResponse> {
    const q = new URLSearchParams();
    if (params?.mechanism) q.set('mechanism', params.mechanism);
    if (params?.relation)  q.set('relation',  params.relation);
    if (params?.direction) q.set('direction', params.direction);
    const qs = q.toString() ? `?${q}` : '';
    return engramFetch<AdjacentResponse>(`${ENGRAM_ENDPOINTS.adjacent(id)}${qs}`);
  },

  // ── Related ───────────────────────────────────────────────────────────────
  getRelated(
    id: string,
    params?: { depth?: number; mechanism?: string; minWeight?: number }
  ): Promise<RelatedResponse> {
    const q = new URLSearchParams();
    if (params?.depth !== undefined)     q.set('depth',      String(params.depth));
    if (params?.mechanism)               q.set('mechanism',  params.mechanism);
    if (params?.minWeight !== undefined) q.set('min_weight', String(params.minWeight));
    const qs = q.toString() ? `?${q}` : '';
    return engramFetch<RelatedResponse>(`${ENGRAM_ENDPOINTS.related(id)}${qs}`);
  },

  // ── Sequence (narrative chain) ────────────────────────────────────────────
  getSequence(
    id: string,
    params?: { direction?: SequenceDirection; limit?: number }
  ): Promise<SequenceResponse> {
    const q = new URLSearchParams();
    if (params?.direction) q.set('direction', params.direction);
    if (params?.limit)     q.set('limit',     String(params.limit));
    const qs = q.toString() ? `?${q}` : '';
    return engramFetch<SequenceResponse>(`${ENGRAM_ENDPOINTS.sequence(id)}${qs}`);
  },

  // ── Subgraph (BFS, Cytoscape-ready) ──────────────────────────────────────
  getSubgraph(
    id: string,
    params?: { depth?: number; limit?: number; mechanism?: string }
  ): Promise<SubgraphResponse> {
    const q = new URLSearchParams();
    if (params?.depth !== undefined) q.set('depth',     String(params.depth));
    if (params?.limit !== undefined) q.set('limit',     String(params.limit));
    if (params?.mechanism)           q.set('mechanism', params.mechanism);
    const qs = q.toString() ? `?${q}` : '';
    return engramFetch<SubgraphResponse>(`${ENGRAM_ENDPOINTS.subgraph(id)}${qs}`);
  },

  // ── Overview (sampled sapien graph) ──────────────────────────────────────
  getOverview(
    sapienId: number,
    params?: { limit?: number; seed?: 'top_entities' | 'recent' }
  ): Promise<OverviewResponse> {
    const q = new URLSearchParams();
    if (params?.limit !== undefined) q.set('limit', String(params.limit));
    if (params?.seed)                q.set('seed',  params.seed);
    const qs = q.toString() ? `?${q}` : '';
    return engramFetch<OverviewResponse>(`${ENGRAM_ENDPOINTS.overview(sapienId)}${qs}`);
  },

  // ── Entities ──────────────────────────────────────────────────────────────
  getEntities(params: {
    sapienId: number;
    page?: number;
    pageSize?: number;
  }): Promise<EntitiesListResponse> {
    const q = new URLSearchParams({ sapien_id: String(params.sapienId) });
    if (params.page)     q.set('page',      String(params.page));
    if (params.pageSize) q.set('page_size', String(params.pageSize));
    return engramFetch<EntitiesListResponse>(`${ENGRAM_ENDPOINTS.entities()}?${q}`);
  },

  // ── Entity episodes ───────────────────────────────────────────────────────
  getEpisodes(entityId: string): Promise<EntityEpisodesResponse> {
    return engramFetch<EntityEpisodesResponse>(ENGRAM_ENDPOINTS.episodes(entityId));
  },

  // ── Recall ────────────────────────────────────────────────────────────────
  recall(params: {
    sapienId: number;
    query: string;
    depth: RecallDepth;
  }): Promise<RecallResponse> {
    return engramFetch<RecallResponse>(ENGRAM_ENDPOINTS.recall(), {
      method: 'POST',
      body: JSON.stringify({
        sapien_id: params.sapienId,
        query:     params.query,
        depth:     params.depth,
      }),
    });
  },
};
