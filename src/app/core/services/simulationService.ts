import { authenticatedFetch, HttpError } from '../auth/authSession';
import { apiConfig } from '../config/apiConfig';
import type { SimulationCreateRequest, SimulationEventPage, SimulationList, SimulationResult, SimulationRun } from '../../types/simulationTypes';

const base = `${apiConfig.baseUrl}/simulations/runs/`;

async function request<T>(path = '', init: RequestInit = {}, accepted: number[] = []): Promise<T> {
  let response: Response;
  try {
    response = await authenticatedFetch(`${base}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
      signal: init.signal ?? AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new Error('Simulation API is unavailable. Check the server and single-worker routing.');
  }
  if (!response.ok && !accepted.includes(response.status)) {
    const body = await response.json().catch(() => null) as { error?: string; code?: string; worker_id?: number } | null;
    const suffix = body?.worker_id ? ` (worker ${body.worker_id})` : '';
    throw new HttpError(`${body?.error ?? `Request failed (HTTP ${response.status})`}${suffix}`, response.status);
  }
  return response.status === 204 ? (undefined as T) : response.json() as Promise<T>;
}

const idPath = (runId: string) => `${encodeURIComponent(runId)}/`;

export const simulationService = {
  list: (signal?: AbortSignal) => request<SimulationList>('', { signal }),
  get: (runId: string, signal?: AbortSignal) => request<SimulationRun>(idPath(runId), { signal }),
  create: (body: SimulationCreateRequest) => request<SimulationRun>('', { method: 'POST', body: JSON.stringify(body) }),
  control: (runId: string, action: 'start' | 'pause' | 'resume' | 'stop') => request<SimulationRun>(`${idPath(runId)}${action}/`, { method: 'POST', body: '{}' }),
  setSpeed: (runId: string, speed: number) => request<SimulationRun>(`${idPath(runId)}speed/`, { method: 'PATCH', body: JSON.stringify({ speed }) }),
  remove: (runId: string) => request<void>(idPath(runId), { method: 'DELETE' }),
  events: (runId: string, after: number, signal?: AbortSignal) => request<SimulationEventPage>(`${idPath(runId)}events/?after=${after}&limit=200`, { signal }),
  result: (runId: string, signal?: AbortSignal) => request<SimulationResult>(`${idPath(runId)}result/`, { signal }, [202]),
};
