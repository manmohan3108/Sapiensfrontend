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
export interface AuthorizationStart extends ConnectionResponse { authorization_url: string; state: string }

export class ConnectionRequestError extends Error {
  constructor(message: string, public readonly connection?: SapiensConnection) {
    super(message);
    this.name = 'ConnectionRequestError';
  }
}

async function connectionFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await authenticatedFetch(`${apiConfig.baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    throw new ConnectionRequestError(body?.error ?? `Request failed (HTTP ${response.status})`, body?.connection);
  }
  return body as T;
}

const collectionPath = (sapienId: number) => `/sapien/${sapienId}/connections`;

export const connectionsService = {
  startAuthorization(sapienId: number, payload: UpdateConnectionPayload): Promise<AuthorizationStart> {
    return connectionFetch(`${collectionPath(sapienId)}/authorization`, {
      method: 'POST', body: JSON.stringify({ ...payload, action: 'start' }),
    });
  },

  cancelAuthorization(sapienId: number, connectionId: number, state: string): Promise<ConnectionResponse> {
    return connectionFetch(`${collectionPath(sapienId)}/authorization`, {
      method: 'POST', body: JSON.stringify({ action: 'cancel', connection_id: connectionId, state }),
    });
  },

  get(sapienId: number, connectionId: number, signal?: AbortSignal): Promise<ConnectionResponse> {
    return connectionFetch(`${collectionPath(sapienId)}/${connectionId}`, { signal });
  },

  confirmAuthorization(sapienId: number, connectionId: number, requestId?: number, approvalHint = ''): Promise<ConnectionResponse> {
    return connectionFetch(`${collectionPath(sapienId)}/authorization`, {
      method: 'POST', body: JSON.stringify({ action: 'confirm', connection_id: connectionId, request_id: requestId, approval_hint: approvalHint }),
    });
  },

  list(sapienId: number, signal?: AbortSignal): Promise<ConnectionsResponse> {
    return connectionFetch<ConnectionsResponse>(collectionPath(sapienId), { signal });
  },

  create(sapienId: number, payload: CreateConnectionPayload): Promise<ConnectionResponse> {
    return connectionFetch<ConnectionResponse>(collectionPath(sapienId), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  configureSubscriptions(sapienId: number, connectionId: number, resources: string[]): Promise<{ subscription_setup: string }> {
    return connectionFetch(`${collectionPath(sapienId)}/${connectionId}`, {
      method: 'POST', body: JSON.stringify({ action: 'subscriptions', resources }),
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

  disconnect(sapienId: number, connectionId: number): Promise<{ deleted: true; connection_id: number; remote_cleanup_confirmed?: boolean }> {
    return connectionFetch(`${collectionPath(sapienId)}/${connectionId}`, { method: 'DELETE' });
  },

  fulfillRequest(sapienId: number, requestId: number, connectionId: number, approvalHint = ''): Promise<RequestResponse & ConnectionResponse> {
    return connectionFetch(`/sapien/${sapienId}/connection-requests/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({ action: 'fulfill', connection_id: connectionId, approval_hint: approvalHint }),
    });
  },

  updateRequest(sapienId: number, requestId: number, action: 'reject' | 'reopen', denialReason = ''): Promise<RequestResponse> {
    return connectionFetch<RequestResponse>(`/sapien/${sapienId}/connection-requests/${requestId}`, {
      method: 'POST',
      body: JSON.stringify({ action, ...(action === 'reject' ? { denial_reason: denialReason } : {}) }),
    });
  },
};
