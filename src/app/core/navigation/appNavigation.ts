export type AppArea = 'directory' | 'workspace' | 'connections' | 'analyse' | 'simulations';
export const appDestinations = (admin: boolean) => [
  { id: 'directory' as AppArea, label: 'Your Sapiens', path: admin ? '/admin' : '/home', needsSapien: false },
  { id: 'workspace' as AppArea, label: 'Workspace', path: '/workspace', needsSapien: true },
  { id: 'connections' as AppArea, label: 'Connections', path: '/connections', needsSapien: true },
  ...(admin ? [
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

// Preserve the section, never carry record IDs or another Sapien's query state
// into a switch. Runs are bound to their original identity and cannot be switched.
export function destinationAfterSwitch(path: string): string {
  if (appArea(path) === 'analyse' || path === '/connections') return path;
  return '/workspace';
}

export function simulationLabPath(id?: string, name?: string, returnTo = '/workspace') {
  if (!id) return '/admin/simulations';
  const params = new URLSearchParams({ sapienId: id, sapienName: name || 'Sapiens', returnTo });
  return `/admin/simulations?${params}`;
}
