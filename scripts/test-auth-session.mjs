import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';

// Compile the production module with only its public API URL configuration stubbed.
// Network, browser events and tab storage are isolated; no real account is touched.
const source = (await readFile(new URL('../src/app/core/auth/authSession.ts', import.meta.url), 'utf8'))
  .replace("import { apiConfig } from '../config/apiConfig';", "const apiConfig = { baseUrl: 'https://api.example.test/api' };");
const compiled = await transformWithEsbuild(source, 'authSession.ts', { loader: 'ts' });
const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
const events = new EventTarget();
globalThis.window = { location: { origin: 'https://app.example.test' }, dispatchEvent: event => events.dispatchEvent(event) };
const { authSession, authenticatedFetch, resourceSession, verifyResourceAccess, ACCESS_CHECK_TIMEOUT_MS } = await import(`data:text/javascript;base64,${Buffer.from(compiled.code).toString('base64')}`);
const pair = (access, refresh) => ({ access, refresh, token_type: 'Bearer', access_expires_in: 900 });
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
let expired = 0;
events.addEventListener(authSession.expiredEvent, () => expired++);

assert.equal(authSession.url('login/'), 'https://api.example.test/accounts/api/login/');
authSession.save(pair('access-one', 'refresh-one'));
globalThis.fetch = async (_url, init) => {
  assert.equal(new Headers(init.headers).get('Authorization'), 'Bearer access-one');
  assert.equal(init.credentials, 'omit');
  return json({ ok: true });
};
assert.equal((await authenticatedFetch('https://api.example.test/api/example')).status, 200);

let refreshCalls = 0;
let apiCalls = 0;
globalThis.fetch = async (url, init) => {
  if (String(url).endsWith('/refresh/')) {
    refreshCalls++;
    assert.equal(JSON.parse(init.body).refresh, 'refresh-one');
    return json(pair('access-two', 'refresh-two'));
  }
  apiCalls++;
  return new Headers(init.headers).get('Authorization') === 'Bearer access-two' ? json({ ok: true }) : json({}, 401);
};
await Promise.all([authenticatedFetch('/api/example'), authenticatedFetch('/api/example')]);
assert.equal(refreshCalls, 1, 'concurrent 401s share one refresh');
assert.equal(apiCalls, 4, 'each request retries exactly once');
assert.equal(authSession.tokens.refresh, 'refresh-two', 'rotated refresh is persisted');

globalThis.fetch = async url => String(url).endsWith('/refresh/') ? json({ error: 'revoked' }, 401) : json({}, 401);
await assert.rejects(authenticatedFetch('/api/example'));
assert.equal(authSession.tokens, null, 'revoked refresh clears tokens');
assert.equal(expired, 1, 'revocation notifies the UI');

authSession.save(pair('access-three', 'refresh-three'));
let finishRefresh;
globalThis.fetch = async url => {
  if (String(url).endsWith('/refresh/')) return new Promise(resolve => { finishRefresh = resolve; });
  return json({}, 401);
};
const pending = authenticatedFetch('/api/example');
await new Promise(resolve => setTimeout(resolve, 0));
authSession.clear();
finishRefresh(json(pair('access-four', 'refresh-four')));
await assert.rejects(pending);
assert.equal(authSession.tokens, null, 'in-flight refresh cannot undo logout');

authSession.save(pair('access-five', 'refresh-five'));
refreshCalls = 0;
globalThis.fetch = async url => {
  if (String(url).endsWith('/refresh/')) { refreshCalls++; return json(pair('access-six', 'refresh-six')); }
  return json({}, 401);
};
assert.equal((await authenticatedFetch('/api/example')).status, 401);
assert.equal(refreshCalls, 1, 'a rejected retry does not loop');
assert.equal(authSession.tokens, null, 'a rejected retry ends the session');
console.log('Auth session checks passed: Bearer headers, cookie exclusion, shared refresh, rotation, revocation, logout race, and bounded retry.');

authSession.save(pair('owned-access', 'owned-refresh'));
resourceSession.select('12');
let unavailable = 0;
events.addEventListener(resourceSession.unavailableEvent, () => unavailable++);
globalThis.fetch = async () => json({ error: 'Memory not found' }, 404);
await assert.rejects(authenticatedFetch('https://api.example.test/api/engram/units/batch?ids=missing'), /no longer available/);
assert.equal(resourceSession.selectedId, null);
assert.equal(unavailable, 1, 'inaccessible batches clear selection rather than returning partial data');
resourceSession.select('12');
assert.equal((await authenticatedFetch('https://api.example.test/api/get-all-sapiens')).status, 404);
assert.equal(resourceSession.selectedId, '12', 'missing discovery endpoint is not an ownership signal');

let finishBody;
globalThis.fetch = async () => new Response(new ReadableStream({ start(controller) {
  finishBody = () => { controller.enqueue(new TextEncoder().encode('{"private":"old data"}')); controller.close(); };
} }));
const lateBody = authenticatedFetch('https://api.example.test/api/sapien/12/chats');
await new Promise(resolve => setTimeout(resolve, 0));
resourceSession.select('13');
finishBody();
await assert.rejects(lateBody, /account or Sapiens changed/);
assert.equal(resourceSession.selectedId, '13');
console.log('Ownership checks passed: scoped 404, inaccessible batch, discovery failure, and late response after selection change.');

// Customer child failures must revalidate the owner-filtered list. Admin behavior
// above remains unchanged. An inconclusive check blocks access without deletion.
resourceSession.customer = true;
resourceSession.select('12');
globalThis.fetch = async url => String(url).endsWith('/get-all-sapiens') ? json({ sapiens: [{ id: 12 }] }) : json({ error: 'chat not found' }, 404);
assert.equal((await authenticatedFetch('https://api.example.test/api/sapien/12/chats/missing')).status, 404);
assert.equal(resourceSession.selectedId, '12');
assert.equal(resourceSession.accessState, 'verified');
globalThis.fetch = async url => String(url).endsWith('/get-all-sapiens') ? json({}, 503) : json({}, 404);
await assert.rejects(authenticatedFetch('https://api.example.test/api/sapien/12/chats/missing'), /verify access/);
assert.equal(resourceSession.selectedId, '12');
assert.equal(resourceSession.accessState, 'failed');
globalThis.fetch = async url => String(url).endsWith('/get-all-sapiens') ? json({ sapiens: [] }) : json({}, 404);
await assert.rejects(authenticatedFetch('https://api.example.test/api/sapien/12/chats/missing'), /not available/);
assert.equal(resourceSession.selectedId, null);
console.log('Customer access checks passed: missing child retained only after verification, failed verification blocked, revoked identity cleared.');

// Verification is scoped to the selection lifetime, not a page pathname.
resourceSession.select('58');
assert.equal(resourceSession.isVerified('58'), false, 'Selecting a cached identity alone is not verification');
let checks = 0;
let finishCheck;
globalThis.fetch = async (_url, init) => { checks++; assert(init.signal); return new Promise(resolve => { finishCheck = resolve; }); };
const initialCheck = verifyResourceAccess('58');
const remountedCheck = verifyResourceAccess('58');
assert.equal(initialCheck, remountedCheck, 'Route remounts share one pending access check');
finishCheck(json({ sapiens: [{ id: 58, name: 'Sample' }] }));
await initialCheck;
assert.equal(checks, 1);
for (const route of ['/workspace', '/connections', '/admin/analyse', '/admin/analyse/awareness']) {
  assert(resourceSession.isVerified('58'), `Verification remains valid at ${route}`);
}
assert.equal(resourceSession.isVerified('59'), false);
resourceSession.select('58');
assert.equal(resourceSession.isVerified('58'), false, 'Explicitly reselecting the same ID starts a new verification lifetime');
resourceSession.select('59');
assert.equal(resourceSession.isVerified('59'), false, 'Switching identity clears verification');
resourceSession.confirm('59');
authSession.clear();
assert.equal(resourceSession.isVerified('59'), false, 'Logout/account exchange clears verification');

authSession.save(pair('new-account-access', 'new-account-refresh'));
resourceSession.select('58');
let obsoleteSignal;
globalThis.fetch = async (_url, init) => { obsoleteSignal = init.signal; return new Promise(resolve => { finishCheck = resolve; }); };
const obsolete = verifyResourceAccess('58');
resourceSession.select('59');
assert(obsoleteSignal.aborted, 'Switching identity aborts obsolete verification');
finishCheck(json({ sapiens: [{ id: 58 }] }));
await assert.rejects(obsolete);
assert.equal(resourceSession.selectedId, '59');
assert.equal(resourceSession.accessState, 'verified', 'Old failure cannot overwrite the new selection state');
assert.equal(resourceSession.isVerified('59'), false);

// Short deadline with an in-flight refresh: time out this request, not the
// shared refresh. Completing the refresh must not replay an expired request.
resourceSession.select('58');
const originalTimeout = globalThis.setTimeout;
let expireCheck;
globalThis.setTimeout = (callback, delay, ...args) => {
  if (delay === ACCESS_CHECK_TIMEOUT_MS) { expireCheck = callback; return originalTimeout(() => {}, 60_000); }
  return originalTimeout(callback, delay, ...args);
};
let finishSlowRefresh;
let accessRequests = 0;
globalThis.fetch = async url => {
  if (String(url).endsWith('/refresh/')) return new Promise(resolve => { finishSlowRefresh = resolve; });
  accessRequests++;
  return json({}, 401);
};
const deadline = verifyResourceAccess('58');
await new Promise(resolve => originalTimeout(resolve, 0));
assert(finishSlowRefresh, 'Refresh is in flight');
expireCheck();
await assert.rejects(deadline, /verify access/);
assert.equal(resourceSession.accessState, 'failed');
assert.equal(resourceSession.isVerified('58'), false);
assert.equal(resourceSession.selectedId, '58', 'Temporary failure does not delete the selected identity');
finishSlowRefresh(json(pair('after-timeout-access', 'after-timeout-refresh')));
await new Promise(resolve => originalTimeout(resolve, 0));
assert.equal(accessRequests, 1, 'An expired access request is not replayed after token refresh');
globalThis.setTimeout = originalTimeout;
globalThis.fetch = async () => json({ sapiens: [{ id: 58, name: 'Sample' }] });
await verifyResourceAccess('58');
assert(resourceSession.isVerified('58'), 'Explicit retry can recover after a timeout');

// A later resource failure bypasses successful navigation verification.
checks = 0;
globalThis.fetch = async url => { if (String(url).endsWith('/get-all-sapiens')) { checks++; return json({ sapiens: [] }); } return json({}, 404); };
await assert.rejects(authenticatedFetch('https://api.example.test/api/sapien/58/chats/missing'), /not available/);
assert.equal(checks, 1);
assert.equal(resourceSession.selectedId, null);
assert(!resourceSession.isVerified('58'));
console.log('Access lifecycle checks passed: shared verification, selection/account invalidation, cancellation, deadline during refresh, retry and forced revalidation.');
