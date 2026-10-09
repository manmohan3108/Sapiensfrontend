// Only known application destinations survive authentication. Never accept an
// external URL, encoded path separator, or arbitrary return-to value.
export function authDestination(role: string, requested: unknown): string {
  const fallback = role === 'admin' ? '/admin' : '/home';
  if (typeof requested !== 'string' || !requested.startsWith('/') || /[\\\s]/.test(requested) || requested.startsWith('//')) return fallback;
  const [path, query = ''] = requested.split('?');
  if (path.includes('%') || path.includes('#')) return fallback;
  if (['/', '/workspace', '/connections'].includes(path) && !query) return path;
  if (role === 'admin') {
    if (['/engram', '/engine-bus'].includes(path) && !query) return path;
    return /^\/admin(?:\/analyse(?:\/[^/?#]+)?|\/simulations(?:\/[^/?#]+\/world(?:\/[^?#]*)?)?)?$/.test(path) ? requested : fallback;
  }
  if (path === '/home') return query === 'create=1' ? '/home?create=1' : '/home';
  return fallback;
}

export function readAuthIntent(search: string, state: unknown): unknown {
  return new URLSearchParams(search).get('next') ?? (state as { from?: unknown } | null)?.from;
}

export function authLink(path: '/login' | '/register', requested: unknown) {
  return typeof requested === 'string' ? `${path}?next=${encodeURIComponent(requested)}` : path;
}
