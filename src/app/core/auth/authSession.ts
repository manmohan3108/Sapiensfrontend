import { apiConfig } from '../config/apiConfig';
import type { TokenPair } from '../../types/authTypes';

const STORAGE_KEY = 'sapiens.auth.tokens';
const AUTH_EXPIRED_EVENT = 'sapiens:auth-expired';
let sessionVersion = 0;

function authUrl(path: string) {
  const apiUrl = new URL(apiConfig.baseUrl, window.location.origin);
  apiUrl.pathname = apiUrl.pathname.replace(/\/api\/?$/, '');
  return `${apiUrl.toString().replace(/\/$/, '')}/accounts/api/${path.replace(/^\//, '')}`;
}

function readTokens(): TokenPair | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    const tokens = value ? JSON.parse(value) as TokenPair : null;
    return tokens && typeof tokens.access === 'string' && typeof tokens.refresh === 'string' ? tokens : null;
  } catch {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Storage is unavailable. */ }
    return null;
  }
}

export const authSession = {
  get tokens() { return readTokens(); },
  save(tokens: TokenPair) { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tokens)); },
  clear(notify = false) {
    sessionVersion += 1;
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* Already inaccessible. */ }
    if (notify) window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  },
  expiredEvent: AUTH_EXPIRED_EVENT,
  url: authUrl,
};

let refreshPromise: Promise<string> | null = null;

async function responseMessage(response: Response) {
  try {
    const body = await response.clone().json() as { error?: string | string[]; detail?: string };
    if (Array.isArray(body.error)) return body.error.join(' ');
    return body.error || body.detail || `Request failed (HTTP ${response.status})`;
  } catch {
    return `Request failed (HTTP ${response.status})`;
  }
}

export class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'HttpError';
  }
}

async function refreshAccessToken() {
  const tokens = authSession.tokens;
  if (!tokens?.refresh) throw new HttpError('Your session has expired. Please sign in again.', 401);
  const response = await fetch(authUrl('refresh/'), {
    method: 'POST',
    credentials: 'omit',
    signal: AbortSignal.timeout(30_000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: tokens.refresh }),
  });
  if (!response.ok) throw new HttpError(await responseMessage(response), response.status);
  const rotated = await response.json() as TokenPair;
  // A sign-out or a newer login must never be undone by an in-flight refresh.
  if (authSession.tokens?.refresh !== tokens.refresh) throw new HttpError('Session changed. Please try again.', 401);
  authSession.save(rotated);
  return rotated.access;
}

async function getRefreshedAccessToken() {
  if (!refreshPromise) {
    const originalRefresh = authSession.tokens?.refresh;
    refreshPromise = refreshAccessToken()
      .catch(error => {
        if (authSession.tokens?.refresh === originalRefresh) authSession.clear(true);
        throw error;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}, retry = true): Promise<Response> {
  const version = sessionVersion;
  const headers = new Headers(init.headers);
  const access = authSession.tokens?.access;
  if (access) headers.set('Authorization', `Bearer ${access}`);
  const response = await fetch(input, { ...init, credentials: 'omit', headers });
  if (sessionVersion !== version) throw new HttpError('Session changed. Please try again.', 401);
  if (response.status !== 401 || !retry) return response;
  if (!authSession.tokens?.refresh) { authSession.clear(true); return response; }
  const nextAccess = await getRefreshedAccessToken();
  headers.set('Authorization', `Bearer ${nextAccess}`);
  const retried = await fetch(input, { ...init, credentials: 'omit', headers });
  if (sessionVersion !== version) throw new HttpError('Session changed. Please try again.', 401);
  if (retried.status === 401) authSession.clear(true);
  return retried;
}

export async function parseAuthResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw new HttpError(await responseMessage(response), response.status);
  return response.json() as Promise<T>;
}
