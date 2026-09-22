// Persist only an account-scoped ID; resource data is fetched and verified on reload.
const key = 'sapiens.selection';
let owner: string | null = null;
export const selectionStorage = {
  setOwner(userId: string) { owner = userId; },
  read(): string | null {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || 'null');
      return owner && saved?.userId === owner && typeof saved.id === 'string' && saved.id ? saved.id : null;
    } catch { return null; }
  },
  save(id: string | null) {
    try {
      if (id && owner) localStorage.setItem(key, JSON.stringify({ userId: owner, id }));
      else localStorage.removeItem(key);
    } catch { /* Selection remains usable when browser storage is unavailable. */ }
  },
};
