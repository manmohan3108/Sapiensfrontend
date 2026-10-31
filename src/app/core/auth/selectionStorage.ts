// Persist only an account-scoped ID; resource data is fetched and verified on reload.
// The tab value keeps open tabs independent. The local value is only a last-used
// fallback for a new tab that does not have its own selection yet.
const localKey = 'sapiens.selection';
const tabKey = 'sapiens.selection.tab';
let owner: string | null = null;

function readFrom(getStorage: () => Storage, key: string): string | null {
  try {
    const storage = getStorage();
    const saved = JSON.parse(storage.getItem(key) || 'null');
    return owner && saved?.userId === owner && typeof saved.id === 'string' && saved.id ? saved.id : null;
  } catch { return null; }
}

function writeTo(getStorage: () => Storage, key: string, id: string | null) {
  try {
    const storage = getStorage();
    if (id && owner) storage.setItem(key, JSON.stringify({ userId: owner, id }));
    else storage.removeItem(key);
  } catch { /* Selection remains usable when browser storage is unavailable. */ }
}

export const selectionStorage = {
  setOwner(userId: string) { owner = userId; },
  read(): string | null {
    return readFrom(() => sessionStorage, tabKey) ?? readFrom(() => localStorage, localKey);
  },
  save(id: string | null) {
    writeTo(() => sessionStorage, tabKey, id);
    writeTo(() => localStorage, localKey, id);
  },
};
