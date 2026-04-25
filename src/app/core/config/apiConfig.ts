import type { ApiConfig } from "../../types/apiTypes";

// Environment configuration
export const getEnvironment = () => {
  return {
    apiBaseUrl:
      import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:8000/api",
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
  createSapiens: "/create-sapiens",
  loadSapiens: "/load-sapiens",
  saveSapiens: "/save_sapiens",
  learnFolder: "/sapiens/learn-folder",
  query: "/query",
  sapiensState: "/sapiens_state",
  listSapiens: "/get-all-sapiens",
  runEngine: "/run-engines",
} as const;