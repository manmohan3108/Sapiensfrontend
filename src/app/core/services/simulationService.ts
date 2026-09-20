import { authenticatedFetch, HttpError } from '../auth/authSession';
import { apiConfig } from '../config/apiConfig';
import type { CaseCatalog, CaseCreateRequest, DebugGuide, EventPage, ParticipantOutcome, SimulationEvent, SimulationList, SimulationResult, SimulationRun } from '../../types/simulationTypes';

const base = `${apiConfig.baseUrl}/simulations/`;
const runPath = (id: string) => `runs/${encodeURIComponent(id)}/`;
async function request<T>(path: string, init: RequestInit = {}, accepted: number[] = []): Promise<T> {
  let response: Response;
  try { response = await authenticatedFetch(`${base}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...init.headers }, signal: init.signal ?? AbortSignal.timeout(30_000) }); }
  catch (error) { if (error instanceof HttpError || (error instanceof DOMException && error.name === 'AbortError')) throw error; throw new Error('Simulation API unavailable. Check the server and single-worker routing.'); }
  if (!response.ok && !accepted.includes(response.status)) {
    const body = await response.json().catch(() => null) as { error?: string; worker_id?: number } | null;
    throw new HttpError(`${body?.error ?? `HTTP ${response.status}`}${body?.worker_id ? ` (worker ${body.worker_id})` : ''}`, response.status);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
export const simulationService = {
  cases: (signal?: AbortSignal) => request<CaseCatalog>('cases/', { signal }),
  list: (signal?: AbortSignal) => request<SimulationList>('runs/', { signal }),
  get: (id: string, signal?: AbortSignal) => request<SimulationRun>(runPath(id), { signal }),
  create: (body: CaseCreateRequest) => request<SimulationRun>('runs/', { method: 'POST', body: JSON.stringify(body) }),
  control: (id: string, action: 'start' | 'pause' | 'resume' | 'stop') => request<SimulationRun>(`${runPath(id)}${action}/`, { method: 'POST', body: '{}' }),
  setSpeed: (id: string, speed: number) => request<SimulationRun>(`${runPath(id)}speed/`, { method: 'PATCH', body: JSON.stringify({ speed }) }),
  remove: (id: string) => request<SimulationRun | void>(runPath(id), { method: 'DELETE' }),
  events: (id: string, after: number, kind?: 'diagnostics', signal?: AbortSignal) => request<EventPage>(`${runPath(id)}events/?after=${after}&limit=200${kind ? `&kind=${kind}` : ''}`, { signal }),
  event: (id: string, sequence: number) => request<SimulationEvent>(`${runPath(id)}events/${sequence}/`),
  participant: (id: string, kind: 'messages' | 'tools', after: number, signal?: AbortSignal) => request<EventPage>(`${runPath(id)}participant/?kind=${kind}&after=${after}&limit=200`, { signal }),
  act: (id: string, body: Record<string, unknown>) => request<ParticipantOutcome>(`${runPath(id)}participant/`, { method: 'POST', body: JSON.stringify(body) }),
  debug: (id: string, signal?: AbortSignal) => request<DebugGuide>(`${runPath(id)}debug/`, { signal }),
  result: (id: string, signal?: AbortSignal) => request<SimulationResult | SimulationRun>(`${runPath(id)}result/`, { signal }, [202]),
};
