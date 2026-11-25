import type { ConnectionsResponse } from '../../types/connectionTypes';

export const CONNECTION_REQUESTS_UPDATED = 'sapiens:connection-requests-updated';

export function pendingConnectionCount(data: ConnectionsResponse): number {
  return new Set(data.requests.filter(request => request.sapien_id === data.sapien_id && request.status === 'pending').map(request => request.id)).size;
}
