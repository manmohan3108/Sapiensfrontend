import { apiConfig } from '../config/apiConfig';
import { ApiError, ApiResponse } from '../../types/apiTypes';
import { authenticatedFetch } from '../auth/authSession';

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseUrl = apiConfig.baseUrl;
    this.defaultHeaders = apiConfig.headers;
  }

  // Always read timeout from config so it picks up any runtime changes
  private get timeout(): number {
    return apiConfig.timeout;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await authenticatedFetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const body = await response.clone().json().catch(() => null) as { error?: string } | null;
        const error: ApiError = {
          message: body?.error ?? `Request failed (HTTP ${response.status})`,
          status: response.status,
        };
        throw error;
      }

      const data = await response.json();
      return {
        data,
        success: true,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        const apiError: ApiError = {
          message: error.name === 'AbortError' 
            ? 'Request timeout' 
            : error.message,
        };
        throw apiError;
      }
      
      throw error;
    }
  }

  async get<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async postFormData<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Don't include default headers for FormData - let browser set Content-Type with boundary
      const response = await authenticatedFetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Explicitly don't set Content-Type - browser will set it with boundary
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error: ApiError = {
          message: `HTTP Error: ${response.statusText}`,
          status: response.status,
        };
        throw error;
      }

      // Handle empty responses or non-JSON responses
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // For empty or non-JSON responses, return empty object
        data = {} as T;
      }

      return {
        data,
        success: true,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        const apiError: ApiError = {
          message: error.name === 'AbortError' 
            ? 'Request timeout' 
            : error.message,
        };
        throw apiError;
      }
      
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
