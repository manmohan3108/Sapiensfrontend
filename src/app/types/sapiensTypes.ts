export interface Sapiens {
  id: string;
  name: string;
  role?: string;
  createdAt: string;
  lastModified: string;
}

export interface SapiensState {
  sapiens: Sapiens | null;
  activityLogs: ActivityLog[];
  outputs: Output[];
  status: 'idle' | 'loading' | 'processing' | 'error';
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface Output {
  id: string;
  timestamp: string;
  content: string;
  type: 'response' | 'result' | 'error';
}

export interface CreateSapiensRequest {
  name: string;
  role?: string;
}

export interface CreateSapiensResponse {
  sapiensId: string;
  name: string;
  role?: string;
  createdAt: string;
}

export interface LoadSapiensRequest {
  sapiensId: string;
}

export interface SaveSapiensRequest {
  sapiensId: string;
}

export interface LearnFolderRequest {
  sapiensId: string;
  files: File[];
}

export interface TextInputRequest {
  sapiensId: string;
  text: string;
}

/**
 * A memory unit returned by the backend with each chat response.
 */
export interface MemoryUnit {
  id: string;
  content: string;
  timestamp: string;
  relevance_score: number;
}

/**
 * Debug information returned by the backend.
 * The frontend augments this with raw_request / raw_response.
 */
export interface DebugInfo {
  latency: Record<string, number>;
  engine_flow: string[];
  prompt?: string;
  memory_hits?: number;
  /** Augmented by frontend — the exact JSON body sent */
  raw_request?: unknown;
  /** Augmented by frontend — the full response JSON */
  raw_response?: unknown;
}

/** Signal types a user can attach to an AI message */
export type UserSignalType =
  | 'thumbs_up'
  | 'thumbs_down'
  | 'important'
  | 'remember'
  | 'not_relevant';

/** Structured payload sent to the backend for user signals */
export interface UserSignalPayload {
  session_id?: string;
  message_id: string;
  signal: UserSignalType;
  content?: string;
  timestamp: string;
}

/**
 * Request to POST /api/chat
 */
export interface ChatRequest {
  sapien_id: number;
  session_id: string | null;
  message: string;
}

/**
 * Response from POST /api/chat.
 * thread_id must be stored and sent back as session_id on the next turn.
 */
export interface ChatApiResponse {
  thread_id: string;
  reply: string;
  /** Alias — backend may return "message" instead of "reply" */
  message?: string;
  memory_units?: MemoryUnit[];
  context_used?: number;
  debug_info?: DebugInfo;
  /** True when the sapien's background task queue is over its threshold */
  overloaded?: boolean;
}

/**
 * Request to POST /api/query (legacy endpoint)
 */
export interface QueryRequest {
  sapien_id: number;
  query: string;
}

/**
 * Response from POST /api/query.
 * Backend may return the answer under several field names.
 */
export interface QueryApiResponse {
  /** Primary answer field */
  response?: string;
  /** Alternate answer fields the backend may use */
  answer?: string;
  result?: string;
  message?: string;
  /** Any extra fields the backend returns */
  [key: string]: unknown;
}

/**
 * A single message in the chat window, enriched with observability metadata.
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isLoading?: boolean;
  /** Which API produced this message */
  apiMode?: 'chat' | 'query';
  /** Memory units referenced in this response */
  memoryUnits?: MemoryUnit[];
  /** Number of context items used */
  contextUsed?: number;
  /** Session ID at the time of this message */
  sessionId?: string;
  /** User signal attached to this message */
  userSignal?: UserSignalType;
  /** Whether the user marked this message as important */
  isImportant?: boolean;
  /** True if the sapien was overloaded when it produced this reply */
  overloaded?: boolean;
}

export interface SapiensStateResponse {
  sapiens: Sapiens;
  activityLogs: ActivityLog[];
  outputs: Output[];
}

export interface ChatHistoryItem {
  thread_id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatHistoryResponse {
  sapien_id: number;
  count: number;
  chats: ChatHistoryItem[];
}

export interface StoredChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  occurred_at: string;
  source?: Record<string, unknown>;
}

export interface ChatDetail extends ChatHistoryItem {
  sapien_id: number;
  messages: StoredChatMessage[];
}
