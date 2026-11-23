import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { transformWithEsbuild } from 'vite';

const compile = async (source, file) => {
  const { code } = await transformWithEsbuild(source, file, { loader: file.endsWith('tsx') ? 'tsx' : 'ts', jsx: 'automatic' });
  const resolved = code.replace(/from (["'])(react(?:\/jsx-runtime)?)\1/g, (_, quote, name) => `from ${quote}${import.meta.resolve(name)}${quote}`);
  return import(`data:text/javascript;base64,${Buffer.from(resolved).toString('base64')}`);
};
const read = path => readFile(new URL('../src/app/' + path, import.meta.url), 'utf8');
globalThis.previewAuth = { user: null };
globalThis.previewPermissions = await compile(await read('core/auth/permissions.ts'), 'permissions.ts');
const contextSource = (await read('contexts/PresentationContext.tsx'))
  .replace("import { useAuth } from './AuthContext';", 'const useAuth = () => globalThis.previewAuth;')
  .replace("import { canAnalyzeAndSimulate } from '../core/auth/permissions';", 'const { canAnalyzeAndSimulate } = globalThis.previewPermissions;');
const context = await compile(contextSource, 'PresentationContext.tsx');
globalThis.previewContext = context;
const controlsSource = (await read('components/navigation/AdminPreviewControls.tsx'))
  .replace("import { useAuth } from '../../contexts/AuthContext';", 'const useAuth = () => globalThis.previewAuth;')
  .replace("import { usePresentation } from '../../contexts/PresentationContext';", 'const { usePresentation } = globalThis.previewContext;');
const { AdminPreviewControls } = await compile(controlsSource, 'AdminPreviewControls.tsx');
let observed;
function Probe() { observed = context.usePresentation(); return React.createElement(AdminPreviewControls); }
let saved = null;
globalThis.sessionStorage = { getItem: () => saved, setItem: () => assert.fail('Rendering must not write preferences') };
const render = user => {
  globalThis.previewAuth.user = user;
  return renderToStaticMarkup(React.createElement(context.PresentationProvider, null, React.createElement(Probe)));
};
const admin = { user_id: 'a', role: 'admin' };
assert.match(render(admin), /View as/);
assert.equal(observed.adminView, true);
assert.equal(observed.analysisAccess, true);
for (const analysis of [false, true]) {
  saved = JSON.stringify({ customer: true, analysis });
  assert.match(render(admin), /Customer Analyse access/);
  assert.equal(observed.customerPreview, true);
  assert.equal(observed.analysisAccess, analysis);
  assert.equal(admin.role, 'admin', 'Preview never mutates authentication');
  assert.equal(render({ user_id: 'c', role: 'customer', analysis_simulation_access: analysis }), '');
  assert.equal(observed.customerPreview, false);
  assert.equal(observed.analysisAccess, analysis);
  observed.setPreview({ customer: true, analysis: !analysis }); // Must be a no-op for customers.
}
saved = 'invalid JSON';
render(admin);
assert.equal(observed.adminView, true);
assert.equal(render(null), '');
assert.equal(observed.analysisAccess, false);
const guardFile = await read('components/auth/RouteGuards.tsx');
const guardSource = guardFile.slice(guardFile.indexOf('export function ProtectedRoute'), guardFile.indexOf('export function GuestRoute'));
globalThis.previewGuard = { user: admin, presentation: { adminView: false, customerPreview: true, analysisAccess: false }, path: '/admin/analyse' };
const guardPrelude = `
const useAuth = () => ({status:'authenticated',user:globalThis.previewGuard.user});
const usePresentation = () => globalThis.previewGuard.presentation;
const useLocation = () => ({pathname:globalThis.previewGuard.path,search:'?record=3',hash:''});
const {canAnalyzeAndSimulate} = globalThis.previewPermissions;
const Navigate=()=>null, SessionLoading=()=>null, AppNavigationFrame=()=>null, SelectionGuard=()=>null, Outlet=()=>null;
const authLink=()=>'/login';
`;
const { ProtectedRoute } = await compile(guardPrelude + guardSource, 'guard.tsx');
assert.equal(ProtectedRoute({ analysis: true }).props.to, '/home');
globalThis.previewGuard.presentation.analysisAccess = true;
assert.equal(ProtectedRoute({ analysis: true }).props.to, '/analyse?record=3');
assert.equal(ProtectedRoute({ roles: ['admin'] }).props.to, '/home');
globalThis.previewGuard.presentation = { adminView: true, customerPreview: false, analysisAccess: true };
globalThis.previewGuard.path = '/analyse';
assert.equal(ProtectedRoute({ analysis: true }).props.to, '/admin/analyse?record=3');
globalThis.previewGuard.user = { user_id:'c', role:'customer', analysis_simulation_access:false };
assert.equal(ProtectedRoute({ analysis: true }).props.to, '/access-denied', 'Preview state cannot override real permissions');
assert.equal(ProtectedRoute({ roles:['admin'] }).props.to, '/access-denied');
// Even inconsistent preview state must neither grant nor remove customer access.
for (const access of [undefined, false, true, 'true']) {
  globalThis.previewGuard.user = { user_id:'c', role:'customer', analysis_simulation_access:access };
  for (const previewAccess of [false, true]) {
    globalThis.previewGuard.presentation = { adminView:true, customerPreview:true, analysisAccess:previewAccess };
    globalThis.previewGuard.path = '/analyse';
    const result = ProtectedRoute({ analysis:true });
    assert.equal(result.props.to, access === true ? undefined : '/access-denied');
    assert.equal(ProtectedRoute({ roles:['admin'] }).props.to, '/access-denied');
    assert.equal(render(globalThis.previewGuard.user), '', 'Customer must never render preview controls');
    assert.equal(observed.analysisAccess, access === true);
  }
}
console.log('Admin preview checks passed: admin-only controls, tab preference restore, malformed storage, real customer permissions and unchanged authentication.');
