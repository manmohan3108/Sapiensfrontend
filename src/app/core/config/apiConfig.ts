import type { ApiConfig } from "../../types/apiTypes";

// Environment configuration
export const getEnvironment = () => {
  const apiBaseUrl = (
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8000/api"
  ).replace(/\/$/, "");

  return {
    apiBaseUrl,
    environment: import.meta.env.MODE || "development",
  };
};

// API Configuration
export const apiConfig: ApiConfig = {
  baseUrl: getEnvironment().apiBaseUrl,
  timeout: 600000, // 10 minutes — backend processing can take time
  headers: {
    "Content-Type": "application/json",
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  createSapiens: '/create-sapiens',
  loadSapiens: '/load-sapiens',
  saveSapiens: '/save_sapiens',
  learnFolder: '/sapiens/learn-folder',
  chat: '/chat',
  query: '/query',
  chatSignal: '/chat/signal',
  sapienChats: (sapienId: string | number) => `/sapien/${sapienId}/chats`,
  sapienAwareness: (sapienId: string | number) => `/sapien/${sapienId}/awareness`,
  sapienWorkingMemory: (sapienId: string | number) => `${apiConfig.baseUrl}/sapien/${sapienId}/working-memory`,
  sapiensState: '/sapiens_state',
  listSapiens: '/get-all-sapiens',
  runEngine: '/run-engines',
  orchestratorStatus: '/orchestrator/status',
} as const;

// Engram endpoints (base: /api/engram/)
export const ENGRAM_BASE = `${apiConfig.baseUrl}/engram`;

export const ENGRAM_ENDPOINTS = {
  stats:      (sapienId: number) => `${ENGRAM_BASE}/stats/${sapienId}`,
  units:      () => `${ENGRAM_BASE}/units`,
  unit:       (id: string)       => `${ENGRAM_BASE}/units/${id}`,
  adjacent:   (id: string)       => `${ENGRAM_BASE}/units/${id}/adjacent`,
  related:    (id: string)       => `${ENGRAM_BASE}/units/${id}/related`,
  sequence:   (id: string)       => `${ENGRAM_BASE}/units/${id}/sequence`,
  subgraph:   (id: string)       => `${ENGRAM_BASE}/units/${id}/subgraph`,
  batchUnits: ()                 => `${ENGRAM_BASE}/units/batch`,
  entities:     () => `${ENGRAM_BASE}/entities`,
  entityDetail: (id: string)       => `${ENGRAM_BASE}/entities/${id}`,
  episodes:     (id: string)       => `${ENGRAM_BASE}/entities/${id}/episodes`,
  recallExplain: () => `${ENGRAM_BASE}/recall/explain`,
  overview:   (sapienId: number) => `${ENGRAM_BASE}/sapien/${sapienId}/overview`,
} as const;
