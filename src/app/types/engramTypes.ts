// ─── Core shapes ──────────────────────────────────────────────────────────────

export type MemoryType = 'episodic' | 'entity' | 'summary' | 'semantic';
export type LinkMechanism =
  | 'entity_mention'
  | 'semantic_similarity'
  | 'narrative_thread'
  | 'temporal_proximity'
  | 'provenance_analysis';
export type RecallDepth = 'shallow' | 'deep';
export type RecallStrategy = 'meaning' | 'keyword' | 'graph';
export type RecallStageStrategy = RecallStrategy | 'working_memory';
export type SequenceDirection = 'forward' | 'backward' | 'both';
export type WMSort = 'activation' | 'recency' | 'frequency' | 'last_used' | 'worth' | 'created_at';
export type WMOrder = 'asc' | 'desc';
export type WMEmbeddingFilter = 'all' | 'with' | 'without';

export interface EngramUnit {
  id: string;
  sapien_id: number;
  memory_type: MemoryType;
  content: string;
  checksum?: string;
  created_at: string;
  weights?: {
    worth: number;
    frequency: number;
    recency: string;
  };
}

export interface EngramLink {
  id: string;
  type: 'unit' | 'context';
  relation: string;
  mechanism: LinkMechanism;
  mechanism_data?: Record<string, unknown>;
  weight: number;
}

// MemoryRef is now hydrated — content + memory_type from adjacent/related/recall/sequence
export interface MemoryRef {
  id: string;
  source: 'unit' | 'context';
  score: number;
  content?: string;
  memory_type?: string;
  meta: {
    strategy?: RecallStrategy;   // not present in recall stage refs — inferred from stage name
    qdrant_id?: string;
    bm25_score?: number;
    mechanism?: string;
    relation?: string;
    weight?: number;
    mechanism_data?: Record<string, unknown>;
  };
}

// Rich context attached to each merged recall result
export interface ComposedMemoryContext {
  provenance?: {
    memory_entry_id?: string;
    source_type?: string;
    source_name?: string;
    mime_type?: string;
    source_position?: number;
    chunk_index?: number;
  };
  temporal?: {
    system_at?: string;
    asserted_at?: string;
    validity_window?: unknown;
  };
  quality?: {
    indexed_by?: string;
    spaces?: string[];
  };
  entities?: {
    nouns?: string[];
    activities?: string[];
  };
  keywords_extracted?: Record<string, unknown>;
  entity_promoted?: Record<string, unknown>;
}

// Links in merged results use unit_id (not id) and carry a snippet
export interface ComposedMemoryLink {
  unit_id: string;
  type: 'unit' | 'context';
  relation: string;
  mechanism: string;
  mechanism_data?: Record<string, unknown>;
  weight: number;
  snippet?: string;
}

export interface ComposedMemory {
  unit_id: string;
  content: string;
  memory_type: MemoryType;
  score: number;
  strategy: RecallStrategy;
  sapien_id: number;
  context?: ComposedMemoryContext;
  links?: ComposedMemoryLink[];
}

// ─── Endpoint responses ───────────────────────────────────────────────────────

export interface UnitsListResponse {
  sapien_id: number;
  memory_type: string | null;
  page: number;
  page_size: number;
  total: number;
  results: EngramUnit[];
}

export interface UnitDetailResponse {
  unit: EngramUnit;
  context: Record<string, unknown>;
  links: EngramLink[];
}

export interface AdjacentResponse {
  unit_id: string;
  direction: string;
  mechanism: string | null;
  relation: string | null;
  neighbors: MemoryRef[];
}

export interface RelatedResponse {
  unit_id: string;
  depth: number;
  results: MemoryRef[];
}

export interface SequenceResponse {
  unit_id: string;
  direction: string;
  limit: number;
  sequence: MemoryRef[];
}

export interface EntitiesListResponse {
  sapien_id: number;
  page: number;
  page_size: number;
  total: number;
  results: EngramUnit[];
}

export interface EntityEpisodesResponse {
  entity: EngramUnit;
  count: number;
  episodes: Array<{
    id: string;
    weight: number;
    content: string;
    memory_type: MemoryType;
  }>;
}

export interface RecallStageCandidate {
  unit_id: string;
  raw_score: number;
  strategy: RecallStageStrategy;
}

export interface RecallResultStage {
  hit: boolean;
  raw: number | null;
}

export interface RecallRelevance {
  value: number;
  basis: string;
  set_size: number;
  rank: number;
  components: string[];
}

export interface RecallExplainResult {
  unit_id: string;
  title?: string;
  content: string;
  memory_type: MemoryType;
  strategy: RecallStrategy;
  final_score: number;
  stages: Record<RecallStrategy, RecallResultStage> & { working_memory?: RecallResultStage };
  score_components?: string[];
  wm_boost: number;
  worth_boost: number;
  relevance: RecallRelevance | null;
  context?: ComposedMemoryContext;
  links?: ComposedMemoryLink[];
}

export interface RecallExplainResponse {
  query: string;
  sapien_id: number;
  depth: RecallDepth;
  read_only: boolean;
  timings_ms: Record<string, number>;
  limits: {
    top_k: number;
    graph_depth: number;
    graph_seed_limit: number;
    graph_seeds_used: number;
    candidate_limit_per_source?: number;
  };
  graph: {
    seeds: number;
    depth: number;
    neo4j_round_trips: number;
    visited: number;
    net_new: number;
    seed_details?: Array<{ unit_id: string; reason: 'entity' | 'meaning' | 'keyword' }>;
    links_read?: number;
    weak_links?: number;
    within_walk_duplicates?: number;
    structural_links?: number;
    evidence?: number;
    direct_candidate_overlap?: number;
    direct_candidate_overlap_ids?: string[];
    cross_seed_duplicates?: number;
  };
  learning: { applied: false; final_result_set?: string[]; [key: string]: unknown };
  stages: {
    meaning: RecallStageCandidate[];
    keyword: RecallStageCandidate[];
    graph: RecallStageCandidate[];
    working_memory?: RecallStageCandidate[];
  };
  results: RecallExplainResult[];
  why_not: Record<string, unknown> | null;
}

// WMEntry now includes content + memory_type for memory_source === "memory_unit"
export interface WMEntry {
  rank?: number;
  activation_rank?: number;
  id: string;
  memory_source: string;
  score?: number;
  activation?: number;
  recency?: number;
  frequency?: number;
  last_used?: number | string;
  last_used_at?: string;
  age_seconds?: number;
  event_at?: string;
  timeline?: Record<string, unknown> | string | null;
  provenance?: Record<string, unknown> | string | null;
  pending?: boolean;
  has_embedding?: boolean;
  is_focus?: boolean;
  metadata?: Record<string, unknown> | null;
  content?: string;
  memory_type?: string;
  created_at?: string;
  worth?: number;
  memory_frequency?: number;
  memory_recency_at?: string;
}

export interface WMResponse {
  sapien_id: number;
  summary?: {
    entry_count?: number;
    total?: number;
    total_count?: number;
    total_entries?: number;
    matching_count?: number;
    returned_count?: number;
    focus_id?: string | null;
    focus_count?: number;
    pending_count?: number;
    embedded_count?: number;
    activation_version?: string | number;
    activation_min?: number;
    activation_max?: number;
    activation_avg?: number;
    [key: string]: unknown;
  };
  wm: {
    focus_id: string | null;
    entries: WMEntry[];
  };
  capacity: {
    global: number;
    by_source: Record<string, number>;
  };
  timeline?: { earliest?: string | null; latest?: string | null; [key: string]: unknown };
  sources?: Record<string, number> | Array<{ source: string; count: number }>;
  filters?: Record<string, unknown>;
}

export interface WMQuery {
  source?: string;
  sort?: WMSort;
  order?: WMOrder;
  limit?: number;
  minActivation?: number;
  hasEmbedding?: boolean;
  focusOnly?: boolean;
  includeContent?: boolean;
  includeMetadata?: boolean;
}

export interface EngramStats {
  sapien_id: number;
  total_units: number;
  total_links: number;
  by_memory_type: Record<string, number>;
  link_mechanisms: Record<string, number>;
}

// ─── Subgraph / overview (new endpoints) ─────────────────────────────────────

export interface SubgraphNode {
  id: string;
  memory_type: string;
  content: string;
}

export interface SubgraphEdge {
  source: string;
  target: string;
  mechanism: string;
  relation: string;
  weight: number;
}

export interface SubgraphResponse {
  center: string;
  depth: number;
  limit: number;
  mechanism: string | null;
  nodes: SubgraphNode[];
  edges: SubgraphEdge[];
}

export interface OverviewResponse {
  nodes: SubgraphNode[];
  edges: SubgraphEdge[];
}

export interface BatchUnitsResponse {
  results: UnitDetailResponse[];
}
