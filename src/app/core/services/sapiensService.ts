import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';
import {
  CreateSapiensRequest,
  CreateSapiensResponse,
  LoadSapiensRequest,
  LearnFolderRequest,
  UploadAcceptance,
  TextInputRequest,
  ChatRequest,
  ChatApiResponse,
  UserSignalPayload,
  Sapiens,
  ChatHistoryResponse,
  ChatDetail,
  AwarenessResponse,
  AwarenessBeatsResponse,
} from '../../types/sapiensTypes';
import { logger } from '../../utils/logger';
import type { AwarenessRunsResponse, AwarenessRunDetail } from '../../types/awarenessRunTypes';
import { ACCESS_CHECK_TIMEOUT_MS, verifyResourceAccess } from '../auth/authSession';
import type { SapiensDirectoryEntry as BackendSapiens } from '../../types/sapiensTypes';

interface BackendCreateSapiensResponse {
  id: number | string;
  name: string;
  role?: string;
  created_at?: string;
  simulation_enabled?: boolean;
}

function transformSapiens(backendSapiens: BackendSapiens): Sapiens {
  return {
    id: backendSapiens.id.toString(),
    name: backendSapiens.name,
    role: backendSapiens.role,
    createdAt: backendSapiens.created_at,
    lastModified: backendSapiens.created_at,
    simulationEnabled: backendSapiens.simulation_enabled,
    simulationAvailable: backendSapiens.simulation_available,
    simulationUnavailableReason: backendSapiens.simulation_unavailable_reason === 'runtime_reserved'
      ? 'Busy, reserved, or awaiting review.'
      : backendSapiens.simulation_unavailable_reason === 'simulation_disabled'
        ? 'Simulation is not enabled in Django admin.'
        : backendSapiens.simulation_unavailable_reason,
  };
}

class SapiensService {
  async createSapiens(request: CreateSapiensRequest): Promise<CreateSapiensResponse> {
    const response = await apiClient.post<BackendCreateSapiensResponse>(
      API_ENDPOINTS.createSapiens,
      {
        name: request.name,
        ...(request.role ? { role: request.role } : {}),
        ...(request.simulation_enabled !== undefined
          ? { simulation_enabled: request.simulation_enabled }
          : {}),
      }
    );
    const data = response.data;

    if (data.id === undefined || data.id === null || !/^\d+$/.test(String(data.id))) {
      throw new Error('Creation response did not confirm an identity.');
    }

    return {
      sapiensId: String(data.id),
      name: data.name,
      role: data.role,
      createdAt: data.created_at ?? new Date().toISOString(),
      simulationEnabled: data.simulation_enabled,
    };
  }

  async loadSapiens(request: LoadSapiensRequest): Promise<Sapiens> {
    const response = await apiClient.post<Sapiens>(
      API_ENDPOINTS.loadSapiens,
      { sapiens_id: request.sapiensId }
    );
    return response.data;
  }

  async uploadFolder(request: LearnFolderRequest): Promise<UploadAcceptance> {
    const formData = new FormData();
    formData.append('sapiens_id', request.sapiensId);
    request.files.forEach((file) => {
      const filePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      formData.append('files', file, file.name);
      if ((file as File & { webkitRelativePath?: string }).webkitRelativePath) {
        formData.append('file_paths', filePath);
      }
    });
    const response = await apiClient.postFormData<UploadAcceptance>(API_ENDPOINTS.learnFolder, formData);
    if (response.data?.status !== 'accepted' || !Array.isArray(response.data.documents) || !response.data.documents.length) {
      throw new Error('The server did not confirm any documents were accepted.');
    }
    return response.data;
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

  async getAwarenessBeats(sapiensId: string, limit = 20, thoughtId?: string): Promise<AwarenessBeatsResponse> {
    const boundedLimit = Math.min(20, Math.max(1, limit));
    const response = await apiClient.get<AwarenessBeatsResponse>(
      `${API_ENDPOINTS.sapienAwarenessBeats(sapiensId)}?limit=${boundedLimit}${thoughtId ? `&thought_id=${encodeURIComponent(thoughtId)}` : ''}`
    );
    return response.data;
  }

  async getAwarenessRuns(sapiensId: string, offset = 0, signal?: AbortSignal): Promise<AwarenessRunsResponse> {
    const response = await apiClient.get<AwarenessRunsResponse>(
      `${API_ENDPOINTS.sapienAwarenessRuns(sapiensId)}?offset=${offset}&limit=20`, { signal }
    );
    if (Number(response.data.sapien_id) !== Number(sapiensId) || response.data.inspection_mode !== 'stored'
      || response.data.offset !== offset || !Array.isArray(response.data.items)) {
      throw new Error('The response did not match the requested Sapien and page.');
    }
    return response.data;
  }

  async getAwarenessRun(sapiensId: string, runId: string, signal?: AbortSignal): Promise<AwarenessRunDetail> {
    const response = await apiClient.get<AwarenessRunDetail>(
      `${API_ENDPOINTS.sapienAwarenessRuns(sapiensId)}/${encodeURIComponent(runId)}`, { signal }
    );
    if (Number(response.data.sapien_id) !== Number(sapiensId) || response.data.inspection_mode !== 'stored'
      || response.data.run?.id !== runId) {
      throw new Error('The response did not match the requested Awareness run.');
    }
    return response.data;
  }

  async runEngine(sapiensId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.runEngine, {
      sapien_id: parseInt(sapiensId, 10),
    });
  }

  async listSapiens(): Promise<Sapiens[]> {
    const response = await apiClient.get<{ sapiens: BackendSapiens[] }>(
      API_ENDPOINTS.listSapiens, { signal: AbortSignal.timeout(ACCESS_CHECK_TIMEOUT_MS) }
    );
    return response.data.sapiens.map(transformSapiens);
  }

  async verifyAccess(sapienId: string): Promise<Sapiens> {
    return transformSapiens(await verifyResourceAccess(sapienId));
  }
}

export const sapiensService = new SapiensService();
