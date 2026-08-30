import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';
import {
  CreateSapiensRequest,
  CreateSapiensResponse,
  LoadSapiensRequest,
  SaveSapiensRequest,
  LearnFolderRequest,
  TextInputRequest,
  ChatRequest,
  ChatApiResponse,
  QueryRequest,
  QueryApiResponse,
  UserSignalPayload,
  Sapiens,
  ChatHistoryResponse,
  ChatDetail,
  AwarenessResponse,
  AwarenessBeatsResponse,
} from '../../types/sapiensTypes';
import { logger } from '../../utils/logger';

interface BackendSapiens {
  id: number;
  name: string;
  role?: string;
  created_at: string;
}

interface BackendCreateSapiensResponse {
  id: number | string;
  name: string;
  role?: string;
  created_at?: string;
}

function transformSapiens(backendSapiens: BackendSapiens): Sapiens {
  return {
    id: backendSapiens.id.toString(),
    name: backendSapiens.name,
    role: backendSapiens.role,
    createdAt: backendSapiens.created_at,
    lastModified: backendSapiens.created_at,
  };
}

class SapiensService {
  async createSapiens(request: CreateSapiensRequest): Promise<CreateSapiensResponse> {
    const response = await apiClient.post<BackendCreateSapiensResponse>(
      API_ENDPOINTS.createSapiens,
      request
    );
    const data = response.data;

    return {
      sapiensId: String(data.id),
      name: data.name,
      role: data.role,
      createdAt: data.created_at ?? new Date().toISOString(),
    };
  }

  async loadSapiens(request: LoadSapiensRequest): Promise<Sapiens> {
    const response = await apiClient.post<Sapiens>(
      API_ENDPOINTS.loadSapiens,
      { sapien_id: request.sapiensId }
    );
    return response.data;
  }

  async saveSapiens(request: SaveSapiensRequest): Promise<void> {
    await apiClient.post(API_ENDPOINTS.saveSapiens, request);
  }

  async uploadFolder(request: LearnFolderRequest): Promise<void> {
    const formData = new FormData();
    formData.append('sapiens_id', request.sapiensId);
    request.files.forEach((file) => {
      const filePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      formData.append('files', file, file.name);
      if ((file as File & { webkitRelativePath?: string }).webkitRelativePath) {
        formData.append('file_paths', filePath);
      }
    });
    await apiClient.postFormData(API_ENDPOINTS.learnFolder, formData);
  }

  /**
   * POST /api/chat
   * Turn 1: session_id = null  → backend starts new thread, returns thread_id
   * Turn 2+: session_id = thread_id from previous response → continues thread
   */
  async sendTextInput(
    request: TextInputRequest & { sessionId?: string | null }
  ): Promise<ChatApiResponse> {
    const body: ChatRequest = {
      sapien_id: parseInt(request.sapiensId, 10),
      session_id: request.sessionId ?? null,
      message: request.text,
    };
    const response = await apiClient.post<ChatApiResponse>(API_ENDPOINTS.chat, body);
    const data = response.data;
    return {
      ...data,
      reply: data.reply ?? (data as { message?: string }).message ?? '',
      thread_id: data.thread_id,
      memory_units: data.memory_units ?? [],
      context_used: data.context_used ?? 0,
    };
  }

  /**
   * POST /api/query (legacy endpoint)
   */
  async sendQuery(
    sapiensId: string,
    query: string
  ): Promise<string> {
    const body: QueryRequest = {
      sapien_id: parseInt(sapiensId, 10),
      query,
    };
    const response = await apiClient.post<QueryApiResponse>(API_ENDPOINTS.query, body);
    const data = response.data;
    return (
      data.response ??
      data.answer ??
      data.result ??
      data.message ??
      JSON.stringify(data)
    );
  }

  async sendUserSignal(payload: UserSignalPayload): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.chatSignal, payload);
    } catch (err) {
      logger.warn('User signal could not be sent to backend', err);
    }
  }

  async getChatHistory(sapiensId: string, limit = 20): Promise<ChatHistoryResponse> {
    const response = await apiClient.get<ChatHistoryResponse>(
      `${API_ENDPOINTS.sapienChats(sapiensId)}?limit=${limit}`
    );
    return response.data;
  }

  async getChatDetail(sapiensId: string, threadId: string): Promise<ChatDetail> {
    const response = await apiClient.get<ChatDetail>(
      `${API_ENDPOINTS.sapienChats(sapiensId)}/${encodeURIComponent(threadId)}`
    );
    return response.data;
  }

  async getAwareness(sapiensId: string, limit = 10): Promise<AwarenessResponse> {
    const response = await apiClient.get<AwarenessResponse>(
      `${API_ENDPOINTS.sapienAwareness(sapiensId)}?limit=${limit}`
    );
    return response.data;
  }

  async getAwarenessBeats(sapiensId: string, limit = 20, includeStaffSession = false): Promise<AwarenessBeatsResponse> {
    const boundedLimit = Math.min(20, Math.max(1, limit));
    const response = await apiClient.get<AwarenessBeatsResponse>(
      `${API_ENDPOINTS.sapienAwarenessBeats(sapiensId)}?limit=${boundedLimit}`,
      includeStaffSession ? { credentials: 'include' } : undefined
    );
    return response.data;
  }

  async runEngine(sapiensId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.runEngine, {
      sapien_id: parseInt(sapiensId, 10),
    });
  }

  async listSapiens(): Promise<Sapiens[]> {
    const response = await apiClient.get<{ sapiens: BackendSapiens[] }>(
      API_ENDPOINTS.listSapiens
    );
    return response.data.sapiens.map(transformSapiens);
  }
}

export const sapiensService = new SapiensService();
