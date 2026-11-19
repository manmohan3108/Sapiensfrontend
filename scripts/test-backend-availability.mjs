import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { transformWithEsbuild } from 'vite';

const source = (await readFile(new URL('../src/app/core/api/backendAvailability.ts', import.meta.url), 'utf8'))
  .replace("import { apiConfig } from '../config/apiConfig';", "const apiConfig = { baseUrl: 'https://api.example.test/api' };")
  .replace(/import .* from '\.\/rateLimits';/, `const rateLimits = { accountVersion: 0, blockedResponse: () => null, observe() {} }; const requestBucket = () => 'read';`);
const { code } = await transformWithEsbuild(source, 'availability.ts', { loader: 'ts', format: 'cjs' });
function setup() {
  const events = new EventTarget();
  const timers = new Map();
  let id = 0;
  let reloads = 0;
  const storage = new Map();
  const context = {
    exports: {}, module: { exports: {} }, navigator: { onLine: true },
    window: { location: { origin: 'https://app.example.test', reload() { reloads++; } }, addEventListener: events.addEventListener.bind(events) },
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    setTimeout: callback => { timers.set(++id, callback); return id; }, clearTimeout: key => timers.delete(key),
    fetch: async () => { throw new TypeError('Network unavailable'); },
    Response, Request, URL, AbortSignal, TypeError,
  };
  vm.runInNewContext(code, context);
  return { context, api: context.module.exports, events, timers, reloads: () => reloads };
}
const flush = async () => { for (let i = 0; i < 20; i++) await new Promise(resolve => setImmediate(resolve)); };
const healthy = () => new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });

const test = setup();
await assert.rejects(test.api.backendFetch('https://api.example.test/action', { method: 'POST' }));
await flush();
assert.equal(test.api.backendAvailability.getSnapshot(), 'connection', 'Unknown network failure must not claim server outage');
test.context.navigator.onLine = false;
test.events.dispatchEvent(new Event('offline'));
assert.equal(test.api.backendAvailability.getSnapshot(), 'offline');
test.context.fetch = async () => healthy();
test.context.navigator.onLine = true;
test.events.dispatchEvent(new Event('online'));
await flush();
assert.equal(test.api.backendAvailability.getSnapshot(), 'available');
assert.equal(test.reloads(), 0, 'Existing page must survive reconnection');

const server = setup();
server.context.fetch = async () => new Response('{}', { status: 503 });
await server.api.backendFetch('https://api.example.test/read');
await flush();
assert.equal(server.api.backendAvailability.getSnapshot(), 'unavailable');
server.context.fetch = async () => healthy();
const retry = server.timers.values().next().value;
server.timers.clear();
retry();
await flush();
assert.equal(server.api.backendAvailability.getSnapshot(), 'available');
assert.equal(server.reloads(), 0);

const restart = setup();
restart.context.fetch = async () => new Response(JSON.stringify({ code: 'runtime_draining' }), { status: 503 });
await restart.api.backendFetch('https://api.example.test/read');
await flush();
assert.equal(restart.api.backendAvailability.getSnapshot(), 'restarting');

const cancelled = setup();
await assert.rejects(cancelled.api.backendFetch('https://api.example.test/read', { signal: AbortSignal.abort() }));
assert.equal(cancelled.api.backendAvailability.getSnapshot(), 'available', 'Cancelled reads are not outages');

const stale = setup();
let resolveProbe;
stale.context.fetch = async url => String(url).endsWith('/me/')
  ? new Promise(resolve => { resolveProbe = resolve; })
  : Promise.reject(new TypeError('Connection failed'));
await assert.rejects(stale.api.backendFetch('https://api.example.test/read'));
await flush();
stale.context.navigator.onLine = false;
stale.events.dispatchEvent(new Event('offline'));
resolveProbe(healthy());
await flush();
assert.equal(stale.api.backendAvailability.getSnapshot(), 'offline', 'An older successful probe cannot override going offline');

const bootstrap = setup();
bootstrap.context.fetch = async () => healthy();
bootstrap.api.recoverPageWhenAvailable();
await flush();
assert.equal(bootstrap.reloads(), 1, 'Blocked session bootstrap retains guarded recovery');
console.log('Connection states and non-destructive recovery passed.');
