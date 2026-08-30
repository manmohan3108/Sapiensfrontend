import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';

// Compile the production module with only its public API URL configuration stubbed.
// Network, browser events and tab storage are isolated; no real account is touched.
const source = (await readFile(new URL('../src/app/core/auth/authSession.ts', import.meta.url), 'utf8'))
  .replace("import { apiConfig } from '../config/apiConfig';", "const apiConfig = { baseUrl: 'https://api.example.test/api' };");
const compiled = await transformWithEsbuild(source, 'authSession.ts', { loader: 'ts' });
const storage = new Map();
globalThis.sessionStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
const events = new EventTarget();
globalThis.window = { location: { origin: 'https://app.example.test' }, dispatchEvent: event => events.dispatchEvent(event) };
const { authSession, authenticatedFetch } = await import(`data:text/javascript;base64,${Buffer.from(compiled.code).toString('base64')}`);
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
