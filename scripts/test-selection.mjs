import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';
import { create } from 'zustand';

const storage = new Map();
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
globalThis.selectionTestCreate = create;
globalThis.selectionTestResource = { select() {} };
const compile = async (source, name) => (await transformWithEsbuild(source, name, { loader: 'ts' })).code;
const selectionSource = await readFile(new URL('../src/app/core/auth/selectionStorage.ts', import.meta.url), 'utf8');
const storeSource = (await readFile(new URL('../src/app/core/state/sapiensStore.ts', import.meta.url), 'utf8'))
  .replace("import { create } from 'zustand';", 'const create = globalThis.selectionTestCreate;')
  .replace("import { resourceSession } from '../auth/authSession';", 'const resourceSession = globalThis.selectionTestResource;')
  .replace("import { selectionStorage } from '../auth/selectionStorage';", 'const selectionStorage = globalThis.selectionTestStorage;');
let version = 0;
async function reload(userId) {
  const selection = await import('data:text/javascript;base64,' + Buffer.from(await compile(selectionSource, 'selection.ts')).toString('base64') + '#' + version++);
  globalThis.selectionTestStorage = selection.selectionStorage;
  selection.selectionStorage.setOwner(userId);
  const store = await import('data:text/javascript;base64,' + Buffer.from(await compile(storeSource, 'store.ts')).toString('base64') + '#' + version++);
  return { saved: selection.selectionStorage, store: store.useSapiensStore };
}
let session = await reload('alice');
session.store.getState().setCurrentSapiens({ id: '12', name: 'Example' });
for (let i = 0; i < 3; i++) {
  session = await reload('alice');
  assert.equal(session.store.getState().currentSapiens, null, 'cached resource data is not trusted');
  assert.equal(session.saved.read(), '12', 'selection survives repeated fresh module loads');
  session.store.getState().setCurrentSapiens({ id: session.saved.read(), name: 'Verified resource' });
}
session = await reload('bob');
assert.equal(session.saved.read(), null, 'another account cannot restore the selection');
session = await reload('alice');
assert.equal(session.saved.read(), '12');
session.store.getState().reset();
assert.equal((await reload('alice')).saved.read(), null, 'logout or resource revocation clears persistence');
session.store.getState().setCurrentSapiens({ id: '13' });
session.store.getState().setCurrentSapiens(null);
assert.equal(session.saved.read(), null, 'explicit deselection clears persistence');
storage.set('sapiens.selection', '{bad json');
assert.equal(session.saved.read(), null);
globalThis.localStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } };
assert.equal(session.saved.read(), null);
assert.doesNotThrow(() => session.store.getState().setCurrentSapiens({ id: '14' }));
assert.doesNotThrow(() => session.store.getState().reset());
console.log('Selection checks passed: repeated reload, account isolation, reset, deselection, malformed and unavailable storage.');
