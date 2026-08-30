import { apiConfig } from '../config/apiConfig';
import type {
  ConnectionsResponse,
  CreateConnectionPayload,
  UpdateConnectionPayload,
  SapiensConnection,
  SapiensConnectionRequest,
} from '../../types/connectionTypes';
import { authenticatedFetch } from '../auth/authSession';

interface ConnectionResponse { connection: SapiensConnection }
interface VerifyResponse extends ConnectionResponse { verified: boolean }
interface RequestResponse { request: SapiensConnectionRequest }

async function connectionFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(`${apiConfig.baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    throw new Error((body as { error?: string } | null)?.error ?? `Request failed (HTTP ${response.status})`);
  }
  return body as T;
}

const collectionPath = (sapienId: number) => `/sapien/${sapienId}/connections`;

export const connectionsService = {
  list(sapienId: number): Promise<ConnectionsResponse> {
    return connectionFetch<ConnectionsResponse>(collectionPath(sapienId));
  },

  create(sapienId: number, payload: CreateConnectionPayload): Promise<ConnectionResponse> {
    return connectionFetch<ConnectionResponse>(collectionPath(sapienId), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  verify(sapienId: number, connectionId: number): Promise<VerifyResponse> {
    return connectionFetch<VerifyResponse>(`${collectionPath(sapienId)}/${connectionId}`, { method: 'POST' });
  },

  update(sapienId: number, connectionId: number, payload: UpdateConnectionPayload): Promise<ConnectionResponse> {
    return connectionFetch<ConnectionResponse>(`${collectionPath(sapienId)}/${connectionId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  disconnect(sapienId: number, connectionId: number): Promise<{ deleted: true; connection_id: number }> {
    return connectionFetch(`${collectionPath(sapienId)}/${connectionId}`, { method: 'DELETE' });
  },

  updateRequest(sapienId: number, requestId: number, action: 'reject' | 'reopen'): Promise<RequestResponse> {
    return connectionFetch<RequestResponse>(`/sapien/${sapienId}/connection-requests/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },
};
