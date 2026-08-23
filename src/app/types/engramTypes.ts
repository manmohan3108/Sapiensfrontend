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
export type SequenceDirection = 'forward' | 'backward' | 'both';

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
  strategy: RecallStrategy;
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
  stages: Record<RecallStrategy, RecallResultStage>;
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
  limits: { top_k: number; graph_depth: number; graph_seed_limit: number; graph_seeds_used: number };
  graph: { seeds: number; depth: number; neo4j_round_trips: number; visited: number; net_new: number };
  learning: { applied: false; final_result_set?: string[]; [key: string]: unknown };
  stages: {
    meaning: RecallStageCandidate[];
    keyword: RecallStageCandidate[];
    graph: RecallStageCandidate[];
  };
  results: RecallExplainResult[];
  why_not: Record<string, unknown> | null;
}

// WMEntry now includes content + memory_type for memory_source === "memory_unit"
export interface WMEntry {
  id: string;
  memory_source: string;
  score: number;
  has_embedding: boolean;
  content?: string;
  memory_type?: string;
}

export interface WMResponse {
  sapien_id: number;
  wm: {
    focus_id: string | null;
    entries: WMEntry[];
  };
  capacity: {
    global: number;
    by_source: Record<string, number>;
  };
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
