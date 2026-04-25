import { apiClient } from '../api/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';
import {
  CreateSapiensRequest,
  CreateSapiensResponse,
  LoadSapiensRequest,
  SaveSapiensRequest,
  LearnFolderRequest,
  TextInputRequest,
  QueryResponse,
  SapiensStateResponse,
  Sapiens,
} from '../../types/sapiensTypes';

/**
 * Backend response types (different from frontend types)
 */
interface BackendSapiens {
  id: number;
  name: string;
  role?: string;
  created_at: string;
}

/**
 * Transform backend Sapiens to frontend Sapiens
 */
function transformSapiens(backendSapiens: BackendSapiens): Sapiens {
  return {
    id: backendSapiens.id.toString(),
    name: backendSapiens.name,
    role: backendSapiens.role,
    createdAt: backendSapiens.created_at,
    lastModified: backendSapiens.created_at,
  };
}

/**
 * Service layer for Sapiens operations
 * Handles all communication with the backend API
 */
class SapiensService {
  /**
   * Create a new Sapiens instance
   */
  async createSapiens(
    request: CreateSapiensRequest
  ): Promise<CreateSapiensResponse> {
    const response = await apiClient.post<CreateSapiensResponse>(
      API_ENDPOINTS.createSapiens,
      request
    );
    return response.data;
  }

  /**
   * Load an existing Sapiens instance
   */
  async loadSapiens(request: LoadSapiensRequest): Promise<Sapiens> {
    const response = await apiClient.post<Sapiens>(
      API_ENDPOINTS.loadSapiens,
      { sapien_id: request.sapiensId }
    );
    return response.data;
  }

  /**
   * Save the current Sapiens instance
   */
  async saveSapiens(request: SaveSapiensRequest): Promise<void> {
    await apiClient.post(API_ENDPOINTS.saveSapiens, request);
  }

  /**
   * Upload folder with files to the Sapiens instance
   */
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
   * Send a query to the Sapiens instance
   * POST /api/query with payload { sapien_id: number, query: string }
   * Returns the `result` string from the backend response.
   */
  async sendTextInput(request: TextInputRequest): Promise<string> {
    const response = await apiClient.post<QueryResponse>(API_ENDPOINTS.query, {
      sapien_id: parseInt(request.sapiensId, 10),
      query: request.text,
    });
    return response.data.result;
  }

  /**
   * Run the cognitive engine for the Sapiens instance
   * POST /api/run-engine with payload { sapien_id: number }
   */
  async runEngine(sapiensId: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.runEngine, {
      sapien_id: parseInt(sapiensId, 10),
    });
  }

  /**
   * Get the current state of the Sapiens instance
   */
  async getSapiensState(sapiensId: string): Promise<SapiensStateResponse> {
    const response = await apiClient.get<SapiensStateResponse>(
      `${API_ENDPOINTS.sapiensState}?sapiens_id=${sapiensId}`
    );
    return response.data;
  }

  /**
   * Get list of saved Sapiens instances
   */
  async listSapiens(): Promise<Sapiens[]> {
    const response = await apiClient.get<{ sapiens: BackendSapiens[] }>(
      API_ENDPOINTS.listSapiens
    );
    return response.data.sapiens.map(transformSapiens);
  }
}

export const sapiensService = new SapiensService();