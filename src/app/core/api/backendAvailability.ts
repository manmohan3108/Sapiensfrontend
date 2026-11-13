import { apiConfig } from '../config/apiConfig';

type Availability = 'available' | 'restarting' | 'unavailable' | 'offline' | 'recovered' | 'restoring';
const GATEWAY_STATUSES = new Set([502, 503, 504]);
const CHECK_INTERVAL_MS = 10_000;
const CHECK_TIMEOUT_MS = 8_000;
const RECOVERY_RELOAD_KEY = 'sapiens.backend.recovery-reload';
const STABLE_CONNECTION_MS = 30_000;
let availability: Availability = 'available';
let checking: Promise<void> | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let restartRevision = 0;
let recoveryRequested = false;
let stableTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function publish(value: Availability) {
  if (availability === value) return;
  if (value !== 'available') cancelStableConnection();
  availability = value;
  listeners.forEach(listener => listener());
}

export const backendAvailability = {
  getSnapshot: () => availability,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

function cancelStableConnection() {
  if (stableTimer !== undefined) clearTimeout(stableTimer);
  stableTimer = undefined;
}

function noteHealthyResponse() {
  if (availability !== 'available' || stableTimer !== undefined) return;
  try { if (!sessionStorage.getItem(RECOVERY_RELOAD_KEY)) return; }
  catch { return; }
  // Rearm only after the new page has received a successful API response and
  // stayed healthy. A brief successful probe must not cause a reload loop.
  stableTimer = setTimeout(() => {
    stableTimer = undefined;
    if (availability === 'available') {
      try { sessionStorage.removeItem(RECOVERY_RELOAD_KEY); } catch { /* Keep the manual fallback. */ }
    }
  }, STABLE_CONNECTION_MS);
}

function recoverPage() {
  recoveryRequested = false;
  if (availability === 'restoring') return;
  try {
    if (!sessionStorage.getItem(RECOVERY_RELOAD_KEY)) {
      sessionStorage.setItem(RECOVERY_RELOAD_KEY, '1');
      publish('restoring');
      window.location.reload();
      return;
    }
  } catch { /* Without a durable guard, automatic reload could loop. */ }
  publish('recovered');
}

/** A failed startup read needs a fresh page even if the probe never saw the outage. */
export function recoverPageWhenAvailable() {
  recoveryRequested = true;
  cancelStableConnection();
  void checkAvailability();
}

function retryDelay(response?: Response) {
  const value = response?.headers.get('Retry-After');
  if (!value) return CHECK_INTERVAL_MS;
  const seconds = Number(value);
  const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - Date.now();
  return Number.isFinite(delay) ? Math.min(60_000, Math.max(2_000, delay)) : CHECK_INTERVAL_MS;
}

function scheduleCheck(delay = CHECK_INTERVAL_MS) {
  // Multiple failing requests must not keep postponing the same recovery check.
  if (timer !== undefined) return;
  timer = setTimeout(() => { timer = undefined; void checkAvailability(); }, delay);
}

/** A credential-free current-user request returns JSON 401 when Django is reachable. */
function probeUrl() {
  const url = new URL(apiConfig.baseUrl, window.location.origin);
  url.pathname = `${url.pathname.replace(/\/api\/?$/, '')}/accounts/api/me/`;
  url.search = '';
  url.hash = '';
  return url.href;
}

async function probeAvailability() {
  const revision = restartRevision;
  let response: Response | undefined;
  let reason: Availability = navigator.onLine ? 'unavailable' : 'offline';
  try {
    // Raw fetch avoids auth refresh and prevents the probe from observing itself.
    response = await fetch(probeUrl(), {
      credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    const body = await response.json().catch(() => null) as { error?: unknown; code?: string } | null;
    // A newer restart signal takes precedence over an already-running probe.
    if (revision !== restartRevision) return;
    if (response.status === 401 && body?.error === 'Authentication required') {
      if (availability !== 'available' || recoveryRequested) recoverPage();
      return;
    }
    if (response.status === 503 && body?.code === 'runtime_draining') reason = 'restarting';
  } catch { /* Connectivity and probe timeouts are retried, never application actions. */ }
  if (revision !== restartRevision) return;
  publish(reason);
  scheduleCheck(retryDelay(response));
}

function checkAvailability() {
  if (checking) return checking;
  if (timer !== undefined) return;
  checking = probeAvailability().finally(() => {
    checking = null;
    // Keep checking if a newer restart arrived during this probe.
    if (recoveryRequested || !['available', 'recovered', 'restoring'].includes(availability)) scheduleCheck();
  });
  return checking;
}

async function observeResponse(response: Response) {
  if (!GATEWAY_STATUSES.has(response.status)) {
    if (response.ok) noteHealthyResponse();
    return;
  }
  cancelStableConnection();
  const body = await response.clone().json().catch(() => null) as { code?: string } | null;
  if (response.status === 503 && body?.code === 'runtime_draining') {
    restartRevision += 1;
    publish('restarting');
    scheduleCheck(retryDelay(response));
  } else {
    // An endpoint failure alone does not establish a whole-server outage.
    void checkAvailability();
  }
}

/** Observe availability without changing responses or replaying failed requests. */
export async function backendFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  try {
    const response = await fetch(input, init);
    void observeResponse(response);
    return response;
  } catch (error) {
    const signal = init.signal ?? (input instanceof Request ? input.signal : undefined);
    const timedOut = signal?.reason?.name === 'TimeoutError';
    if ((!signal?.aborted && error instanceof TypeError) || timedOut) {
      cancelStableConnection();
      void checkAvailability();
    }
    throw error;
  }
}

/** Temporary transport failures do not invalidate credentials. */
export function isTemporaryBackendFailure(error: unknown): boolean {
  if (error instanceof TypeError || (error instanceof Error && error.name === 'TimeoutError')) return true;
  return typeof error === 'object' && error !== null && 'status' in error && GATEWAY_STATUSES.has(Number(error.status));
}
