import { useEffect, useState, useSyncExternalStore } from 'react';
import { apiConfig } from '../config/apiConfig';

export type RateLimitBucket = 'login' | 'register' | 'refresh' | 'create_sapien' | 'api_write' | 'control';
export type RateLimitedRequestInit = RequestInit & { rateLimitBucket?: RateLimitBucket };
export const rateLimitLabels: Record<RateLimitBucket, string> = {
  login: 'Sign-in', register: 'Registration', refresh: 'Session renewal',
  create_sapien: 'Sapien creation', api_write: 'Actions', control: 'Stop and pause controls',
};
const deadlines = new Map<RateLimitBucket, number>();
const listeners = new Set<() => void>();
let revision = 0;
let accountVersion = 0;
function publish() { revision += 1; listeners.forEach(listener => listener()); }
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
const snapshot = () => revision;

/** Mirrors the backend admission groups, never includes read-only polling. */
export function requestBucket(input: RequestInfo | URL, init: RateLimitedRequestInit): RateLimitBucket | undefined {
  const method = (init.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return;
  const url = new URL(input instanceof Request ? input.url : String(input), window.location.origin);
  const base = new URL(apiConfig.baseUrl, window.location.origin);
  if (url.origin !== base.origin) return;
  if (init.rateLimitBucket) return init.rateLimitBucket;
  const apiPath = base.pathname.replace(/\/$/, '');
  const root = apiPath.replace(/\/api$/, '');
  for (const bucket of ['login', 'register', 'refresh'] as const) {
    if (url.pathname === `${root}/accounts/api/${bucket}/`) return bucket;
  }
  if (!url.pathname.startsWith(`${apiPath}/`)) return;
  return url.pathname === `${apiPath}/create-sapiens` ? 'create_sapien' : 'api_write';
}

export function secondsRemaining(bucket: RateLimitBucket): number {
  return Math.max(0, Math.ceil(((deadlines.get(bucket) ?? 0) - Date.now()) / 1000));
}

export const rateLimits = {
  get accountVersion() { return accountVersion; },
  clearAccount() {
    accountVersion += 1;
    deadlines.delete('api_write'); deadlines.delete('create_sapien'); deadlines.delete('control'); publish();
  },
  observe(response: Response, bucket: RateLimitBucket | undefined, version: number) {
    if (response.status !== 429 || !bucket) return;
    const serverBucket = response.headers.get('X-RateLimit-Bucket');
    if (serverBucket && Object.prototype.hasOwnProperty.call(rateLimitLabels, serverBucket)) bucket = serverBucket as RateLimitBucket;
    if (['api_write', 'create_sapien', 'control'].includes(bucket) && version !== accountVersion) return;
    const header = response.headers.get('Retry-After')?.trim();
    if (!header) return;
    const now = Date.now();
    const deadline = /^\d+$/.test(header) ? now + Number(header) * 1000 : Date.parse(header);
    if (!Number.isFinite(deadline) || deadline <= now) return;
    deadlines.set(bucket, Math.max(deadline, deadlines.get(bucket) ?? 0)); publish();
  },
  blockedResponse(bucket: RateLimitBucket | undefined): Response | undefined {
    const seconds = bucket ? secondsRemaining(bucket) : 0;
    if (!seconds) return;
    return new Response(JSON.stringify({ error: `Try again in ${seconds} seconds.`, code: 'rate_limited' }), {
      status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(seconds) },
    });
  },
};

export function useRateLimitCountdown(bucket?: RateLimitBucket): number {
  useSyncExternalStore(subscribe, snapshot, snapshot);
  const [, tick] = useState(0);
  const remaining = bucket ? secondsRemaining(bucket) : Math.max(0, ...Array.from(deadlines.keys(), secondsRemaining));
  const active = remaining > 0;
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => tick(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [active]);
  return remaining;
}
