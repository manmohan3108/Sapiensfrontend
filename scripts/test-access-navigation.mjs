import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';

const load = async (source, file, extra = {}) => {
  const { code } = await transformWithEsbuild(source, file, { loader: file.endsWith('tsx') ? 'tsx' : 'ts', ...extra });
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
};
// Inspect the production route definitions without mounting pages or starting a server.
// Page imports are inert; route paths, wrappers and their props remain unchanged.
let routes = await readFile(new URL('../src/app/routes.tsx', import.meta.url), 'utf8');
routes = routes.replace(/import \{([^}]+)\} from '[^']+';/g, (_match, names) => names.split(',').map(name => `const ${name.trim()} = globalThis.routeStubs.${name.trim()} ?? (() => null);`).join('\n'));
globalThis.routeStubs = { createBrowserRouter: value => value, ProtectedRoute: () => null };
routes = 'function element(type, props, ...children) { return {type, props: props ?? {}, children}; }\n' + routes;
const { router } = await load(routes, 'routes.tsx', { jsx: 'transform', jsxFactory: 'element' });
const guard = path => {
  const group = router.find(route => route.children?.some(child => child.path === path));
  assert(group, `Missing protected route ${path}`);
  if (group.Component === globalThis.routeStubs.ProtectedRoute) return {};
  const wrapper = group.Component();
  assert.equal(wrapper.type, globalThis.routeStubs.ProtectedRoute, `${path} retains authentication`);
  return wrapper.props;
};
for (const path of ['/workspace','/connections','/admin/analyse','/admin/analyse/:section']) assert.notEqual(guard(path).selection, false, `${path} requires a verified selection`);
for (const path of ['/home','/access-denied','/admin','/admin/simulations','/admin/simulations/:runId/world/*','/engram','/engine-bus']) assert.equal(guard(path).selection, false, `${path} must not wait on an unrelated previous selection`);
for (const path of ['/admin','/admin/analyse','/admin/analyse/:section','/admin/simulations','/admin/simulations/:runId/world/*','/engram','/engine-bus']) assert.deepEqual(guard(path).roles, ['admin'], `${path} retains its admin gate`);

// Exercise the real shared link without a server or authentication request.
const navigationSource = await readFile(new URL('../src/app/core/auth/navigation.ts', import.meta.url), 'utf8');
const navigation = await load(navigationSource, 'navigation.ts');
globalThis.directoryLinkTest = { user: { role: 'admin' }, path: navigation.sapiensDirectoryPath };
let linkSource = await readFile(new URL('../src/app/components/navigation/YourSapiensLink.tsx', import.meta.url), 'utf8');
linkSource = linkSource.replace(/^import .*;\r?\n/gm, '');
linkSource = `const Link = 'a', LayoutGrid = 'svg';
const useAuth = () => ({user: globalThis.directoryLinkTest.user});
const sapiensDirectoryPath = globalThis.directoryLinkTest.path;
function element(type, props, ...children) { return {type, props: props ?? {}, children}; }
` + linkSource;
const { YourSapiensLink } = await load(linkSource, 'YourSapiensLink.tsx', { jsx: 'transform', jsxFactory: 'element' });
for (const [role, destination] of [['admin', '/admin'], ['customer', '/home']]) {
  globalThis.directoryLinkTest.user = { role };
  const link = YourSapiensLink({});
  assert.equal(link.type, 'a');
  assert.equal(link.props.to, destination);
  assert.equal(link.props.onClick, undefined, 'Directory navigation must not reset the selection or control a simulation');
  assert.equal(link.children[1].children[0], 'Your Sapiens');
  const collapsed = YourSapiensLink({iconOnly:true});
  assert.equal(collapsed.props['aria-label'], 'Your Sapiens');
  assert.equal(collapsed.props.title, 'Your Sapiens');
}
globalThis.directoryLinkTest.user = null;
assert.equal(YourSapiensLink({}), null, 'Signed-out visitors do not see an account link');
delete globalThis.directoryLinkTest;

let clientSource = await readFile(new URL('../src/app/core/api/apiClient.ts', import.meta.url), 'utf8');
clientSource = clientSource.replace("import { apiConfig } from '../config/apiConfig';", "const apiConfig = { baseUrl:'https://example.test/api', timeout:600000, headers:{} };")
  .replace("import { authenticatedFetch } from '../auth/authSession';", 'const authenticatedFetch = (...args) => globalThis.accessTestFetch(...args);');
const { apiClient } = await load(clientSource, 'apiClient.ts');
let requestSignal;
globalThis.accessTestFetch = async (_url, init) => {
  requestSignal = init.signal;
  return new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason), {once:true}));
};
const caller = new AbortController();
const request = apiClient.get('/get-all-sapiens', {signal:caller.signal});
caller.abort(new DOMException('Short directory deadline', 'TimeoutError'));
await assert.rejects(request, error => error.message === 'Request timeout');
assert(requestSignal.aborted, 'The API client must preserve the caller’s shorter deadline');
globalThis.accessTestFetch = async () => new Response('{"sapiens":[]}', {headers:{'Content-Type':'application/json'}});
assert.deepEqual((await apiClient.get('/get-all-sapiens')).data, {sapiens:[]});
console.log('Access navigation checks passed: role-aware directory links, selection-free directories, protected identity routes, admin gates, short request deadlines and recovery.');
