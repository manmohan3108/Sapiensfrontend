import { authenticatedFetch } from '../auth/authSession';
import { apiConfig } from '../config/apiConfig';

export interface WorkspaceActivityItem {
  id: string;
  kind: 'tool' | 'awareness';
  headline: string;
  headline_shortened: boolean;
  occurred_at: string;
  status: string;
  source: string;
  scope?: string | null;
  reference: { memory_source: string; id: string };
}

export interface WorkspaceActivityFeed {
  sapien_id: number;
  as_of: string;
  inspection_mode: 'stored';
  items: WorkspaceActivityItem[];
  poll_after_seconds: number;
}

export class ActivityFeedError extends Error {
  constructor(public status: number, public retryAfterMs = 0) {
    super('Recent activity could not be refreshed.');
  }
}

function retryDelay(header: string | null): number {
  if (!header) return 0;
  const delay = /^\d+$/.test(header) ? Number(header) * 1000 : Date.parse(header) - Date.now();
  return Number.isFinite(delay) ? Math.max(0, delay) : 0;
}

export async function getWorkspaceActivity(sapienId: string, signal: AbortSignal): Promise<WorkspaceActivityFeed> {
  const response = await authenticatedFetch(
    apiConfig.baseUrl + '/sapien/' + encodeURIComponent(sapienId) + '/activity-feed?limit=5',
    { signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]), cache: 'no-store' });
  if (!response.ok) throw new ActivityFeedError(response.status, retryDelay(response.headers.get('Retry-After')));
  const data = await response.json() as WorkspaceActivityFeed;
  if (Number(data.sapien_id) !== Number(sapienId) || data.inspection_mode !== 'stored'
    || !Number.isFinite(Date.parse(data.as_of)) || !Array.isArray(data.items) || data.items.length > 20
    || !Number.isFinite(data.poll_after_seconds) || data.poll_after_seconds < 1
    || data.items.some(item => !item || typeof item.id !== 'string'
      || !['tool', 'awareness'].includes(item.kind) || typeof item.headline !== 'string'
      || typeof item.headline_shortened !== 'boolean' || !Number.isFinite(Date.parse(item.occurred_at))
      || typeof item.status !== 'string' || typeof item.source !== 'string'
      || (item.scope != null && typeof item.scope !== 'string')
      || !item.reference || typeof item.reference.id !== 'string'
      || item.reference.memory_source !== (item.kind === 'tool' ? 'experience' : 'awareness_beat'))) {
    throw new Error('Unexpected activity feed.');
  }
  return data;
}