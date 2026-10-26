import { Navigate, Outlet, useLocation } from 'react-router';
import { YourSapiensLink } from '../navigation/YourSapiensLink';
import { Loader2, ShieldX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/authTypes';
import { useEffect, useState, useRef } from 'react';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { sapiensService } from '../../core/services/sapiensService';
import { resourceSession } from '../../core/auth/authSession';
import { selectionStorage } from '../../core/auth/selectionStorage';
import { authDestination, authLink, readAuthIntent } from '../../core/auth/navigation';

function SelectionGuard() {
  const currentId = useSapiensStore(state => state.currentSapiens?.id);
  const [savedId, setSavedId] = useState(() => selectionStorage.read());
  const selectedId = currentId ?? savedId;
  const selectionVersion = resourceSession.version;
  const { pathname } = useLocation();
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [, refreshAccess] = useState(0);
  const mountedKey = useRef('');
  const location = useLocation();
  const key = `${selectedId}:${pathname}`;
  useEffect(() => {
    const changed = () => refreshAccess(value => value + 1);
    const unavailable = () => setSavedId(null);
    window.addEventListener(resourceSession.accessEvent, changed);
    window.addEventListener(resourceSession.unavailableEvent, unavailable);
    return () => { window.removeEventListener(resourceSession.accessEvent, changed); window.removeEventListener(resourceSession.unavailableEvent, unavailable); };
  }, []);
  useEffect(() => {
    if (!selectedId) return;
    setError(false);
    if (currentId && resourceSession.isVerified(selectedId)) { setSavedId(null); return; }
    let active = true;
    // Navigation does not change identity. Share checks across guard remounts;
    // logout, selection changes and resource failures invalidate verification.
    const check = async () => {
      try {
        const selected = await sapiensService.verifyAccess(selectedId);
        if (!active) return;
        if (!useSapiensStore.getState().currentSapiens) {
          useSapiensStore.getState().setCurrentSapiens(selected, true);
        }
        setSavedId(null);
        refreshAccess(value => value + 1);
      } catch { if (active) setError(true); }
    };
    void check();
    return () => { active = false; };
  }, [selectedId, currentId, selectionVersion, attempt]);
  const blocked = Boolean(selectedId && (!currentId || !resourceSession.isVerified(selectedId)));
  if (!blocked) mountedKey.current = key;
  const failed = error || resourceSession.accessState === 'failed';
  const createdName = (location.state as { createdName?: string } | null)?.createdName;
  return <>
    {blocked && <div className="grid min-h-screen place-items-center bg-background text-foreground p-6"><div role="status" className="text-center max-w-md"><p>{failed ? createdName ? `${createdName} was created, but we couldn’t open it.` : 'We couldn’t verify access to this Sapiens.' : 'Checking Sapiens access…'}</p>{failed && <><button className="mt-4 rounded-lg border px-4 py-3" onClick={() => { resourceSession.access('checking'); setError(false); setAttempt(value => value + 1); }}>Try opening again</button></>}<p className="mt-4"><YourSapiensLink className="px-3 underline underline-offset-4" /></p></div></div>}
    {(!blocked || mountedKey.current === key) && <div hidden={blocked}><Outlet key={selectedId ?? 'picker'} /></div>}
  </>;
}

function SessionLoading() {
  return <div className="grid min-h-screen place-items-center bg-background text-muted-foreground"><div className="flex items-center gap-3 text-sm"><Loader2 className="size-5 animate-spin text-violet-500" />Restoring your session…</div></div>;
}

export function ProtectedRoute({ roles, selection = true }: { roles?: UserRole[]; selection?: boolean }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <SessionLoading />;
  if (!user) return <Navigate to={authLink('/login', location.pathname + location.search)} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/access-denied" replace />;
  return selection ? <SelectionGuard key={user.user_id} /> : <Outlet key={user.user_id} />;
}

export function GuestRoute() {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <SessionLoading />;
  if (user) return <Navigate to={authDestination(user.role, readAuthIntent(location.search, location.state))} replace />;
  return <Outlet />;
}

export function AccessDeniedPage() {
  const { user } = useAuth();
  return <div className="grid min-h-screen place-items-center bg-[#060a15] px-4 text-white"><div className="max-w-md text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-400/10 ring-1 ring-red-300/20"><ShieldX className="size-6 text-red-300" /></span><h1 className="mt-5 text-xl font-semibold">Access denied</h1><p className="mt-2 text-sm leading-6 text-white/45">This area is not available to your {user?.role ?? 'current'} account. Backend permissions remain authoritative for every request.</p><YourSapiensLink className="mt-6 border border-white/25 px-4 py-2 text-white hover:bg-white/10" /></div></div>;
}
