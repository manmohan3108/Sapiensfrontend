export type AppArea = 'directory' | 'workspace' | 'connections' | 'analyse' | 'simulations';
export const appDestinations = (admin: boolean, analysisAccess: boolean) => [
  { id: 'directory' as AppArea, label: 'Your Sapiens', path: admin ? '/admin' : '/home', needsSapien: false },
  { id: 'workspace' as AppArea, label: 'Workspace', path: '/workspace', needsSapien: true },
  { id: 'connections' as AppArea, label: 'Connections', path: '/connections', needsSapien: true },
  ...(analysisAccess ? [
    { id: 'analyse' as AppArea, label: 'Analyse', path: '/admin/analyse', needsSapien: true },
    { id: 'simulations' as AppArea, label: 'Simulations', path: '/admin/simulations', needsSapien: false },
  ] : []),
];

export function appArea(path: string): AppArea | null {
  if (path === '/admin' || path === '/home') return 'directory';
  if (path === '/workspace') return 'workspace';
  if (path === '/connections') return 'connections';
  if (/^\/admin\/analyse(?:\/|$)/.test(path)) return 'analyse';
  if (/^\/admin\/simulations(?:\/|$)/.test(path)) return 'simulations';
  return null;
}

// Preserve Sapien-scoped pages while dropping record-specific query state. A run
// belongs to its original Sapien, so switching from a world returns to the new
// Sapien's Simulation Lab instead of trying to reuse the run.
export function destinationAfterSwitch(path: string, id?: string, name?: string): string {
  if (appArea(path) === 'analyse' || path === '/connections' || path === '/workspace') return path;
  if (appArea(path) === 'simulations') return simulationLabPath(id, name);
  return '/workspace';
}

export function simulationLabPath(id?: string, name?: string, returnTo = '/workspace') {
  if (!id) return '/admin/simulations';
  const params = new URLSearchParams({ sapienId: id, sapienName: name || 'Sapiens', returnTo });
  return `/admin/simulations?${params}`;
}
