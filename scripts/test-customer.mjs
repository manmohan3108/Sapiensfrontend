import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';
const compile = async path => {
  const source = await readFile(new URL(path, import.meta.url), 'utf8');
  const { code } = await transformWithEsbuild(source, path, { loader: 'ts' });
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
};
const { authDestination, authLink, readAuthIntent } = await compile('../src/app/core/auth/navigation.ts');
for (const invalid of ['https://evil.test', '//evil.test', '/\\evil.test', '/%2f%2fevil.test', '/admin', '/unknown', '/workspace?next=https://evil.test', null]) assert.equal(authDestination('customer', invalid), '/home');
assert.equal(authDestination('customer', '/workspace'), '/workspace');
assert.equal(authDestination('customer', '/connections'), '/connections');
assert.equal(authDestination('customer', '/home?create=1'), '/home?create=1');
const url = new URL(authLink('/register', '/home?create=1'), 'http://localhost');
assert.equal(authDestination('customer', readAuthIntent(url.search, null)), '/home?create=1');
assert.equal(authDestination('admin', '/admin/analyse/engram'), '/admin/analyse/engram');
assert.equal(authDestination('admin', '/admin/simulations/42/world/messages'), '/admin/simulations/42/world/messages');
assert.equal(authDestination('admin', '/home?create=1'), '/admin');
for (const destination of ['/', '/workspace', '/connections', '/engram', '/engine-bus']) assert.equal(authDestination('admin', destination), destination);
assert.equal(authDestination('customer', '/'), '/');
const { validateCreation, creationFailureIsDefinitive } = await compile('../src/app/core/customer/creation.ts');
assert.ok(validateCreation('   ', '').name);
assert.deepEqual(validateCreation('  Atlas  ', ''), {});
assert.deepEqual(validateCreation('🌱'.repeat(255), ''), {});
assert.ok(validateCreation('a'.repeat(256), '').name);
assert.ok(validateCreation('Atlas', 'a'.repeat(256)).focus);
for (const status of [undefined, 408, 409, 500, 502, 503, 504]) assert.equal(creationFailureIsDefinitive({ status }), false);
assert.equal(creationFailureIsDefinitive({ status: 400 }), true);
console.log('Customer checks passed: bounded navigation, creation intent, admin destinations, validation, and ambiguous outcomes.');

// Exercise service contracts entirely in memory: no browser or network uploads.
const servicePath = '../src/app/core/services/sapiensService.ts';
const serviceSource = (await readFile(new URL(servicePath, import.meta.url), 'utf8'))
  .replace("import { apiClient } from '../api/apiClient';", 'const apiClient = globalThis.customerContractClient;')
  .replace("import { API_ENDPOINTS } from '../config/apiConfig';", 'const API_ENDPOINTS = {};')
  .replace("import { logger } from '../../utils/logger';", 'const logger = { error() {}, info() {}, debug() {} };');
const calls = [];
let response;
let failure;
globalThis.customerContractClient = {
  async post(endpoint, body) { calls.push(body); if (failure) throw failure; return { data: response }; },
  async postFormData(endpoint, body) { calls.push(body); if (failure) throw failure; return { data: response }; },
};
const { code: serviceCode } = await transformWithEsbuild(serviceSource, servicePath, { loader: 'ts' });
const { sapiensService } = await import(`data:text/javascript;base64,${Buffer.from(serviceCode).toString('base64')}`);
response = { id: 73, name: 'Atlas', role: 'generalist' };
assert.equal((await sapiensService.createSapiens({ name: 'Atlas' })).sapiensId, '73');
assert.deepEqual(calls.pop(), { name: 'Atlas' });
await sapiensService.createSapiens({ name: 'Atlas', role: 'Reading' });
assert.deepEqual(calls.pop(), { name: 'Atlas', role: 'Reading' });
response = {};
await assert.rejects(sapiensService.createSapiens({ name: 'Atlas' }), /confirm an identity/);
failure = { status: 503 };
calls.length = 0;
await assert.rejects(sapiensService.createSapiens({ name: 'Atlas' }), error => error === failure);
assert.equal(calls.length, 1, 'An ambiguous create must not retry');
calls.length = 0;
await assert.rejects(sapiensService.uploadFolder({ sapiensId: '73', files: [] }), error => error === failure);
assert.equal(calls.length, 1, 'An ambiguous upload must not retry');
failure = undefined;
response = { status: 'accepted', documents: [{ document_id: 'example' }] };
assert.equal((await sapiensService.uploadFolder({ sapiensId: '73', files: [] })).status, 'accepted');
for (const invalid of [{}, { status: 'accepted', documents: [] }, { status: 'complete', documents: [{}] }]) {
  response = invalid;
  await assert.rejects(sapiensService.uploadFolder({ sapiensId: '73', files: [] }), /did not confirm/);
}
delete globalThis.customerContractClient;
console.log('Service checks passed: role omission, confirmed ID, unknown outcomes, acceptance-only uploads, failure propagation, and no automatic retries.');
