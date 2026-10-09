import { Navigate, Outlet, useLocation } from 'react-router';
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
  const { pathname } = useLocation();
  const [verified, setVerified] = useState('');
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [accessState, setAccessState] = useState(resourceSession.accessState);
  const mountedKey = useRef('');
  const location = useLocation();
  const { user } = useAuth();
  const key = `${selectedId}:${pathname}`;
  useEffect(() => {
    const changed = () => setAccessState(resourceSession.accessState);
    window.addEventListener(resourceSession.accessEvent, changed);
    return () => window.removeEventListener(resourceSession.accessEvent, changed);
  }, []);
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    // Verify only when the selected resource or protected route changes.
    // Individual API responses remain authoritative if access later changes.
    setVerified('');
    setError(false);
    const check = async () => {
      setError(false);
      try {
        const list = await sapiensService.listSapiens();
        if (!active) return;
        const selected = list.find(item => item.id === selectedId);
        if (!selected) {
          setSavedId(null);
          window.dispatchEvent(new Event(resourceSession.unavailableEvent));
        } else {
          if (!useSapiensStore.getState().currentSapiens) {
            useSapiensStore.getState().setCurrentSapiens(selected);
          }
          setSavedId(null);
          setVerified(key);
          resourceSession.access('verified');
        }
      } catch { if (active) setError(true); }
    };
    void check();
    return () => { active = false; };
  }, [selectedId, key, attempt]);
  const blocked = Boolean(selectedId && (verified !== key || accessState !== 'verified'));
  if (!blocked) mountedKey.current = key;
  const failed = error || accessState === 'failed';
  const createdName = (location.state as { createdName?: string } | null)?.createdName;
  return <>
    {blocked && <div className="grid min-h-screen place-items-center bg-background text-foreground p-6"><div role="status" className="text-center max-w-md"><p>{failed ? createdName ? `${createdName} was created, but we couldn’t open it.` : 'We couldn’t verify access to this Sapiens.' : 'Checking Sapiens access…'}</p>{failed && <><button className="mt-4 rounded-lg border px-4 py-3" onClick={() => { setAccessState('checking'); setAttempt(value => value + 1); }}>Try opening again</button><p className="mt-4"><a href={user?.role === 'admin' ? '/admin' : '/home'}>Back to your Sapiens</a></p></>}</div></div>}
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
  return <div className="grid min-h-screen place-items-center bg-[#060a15] px-4 text-white"><div className="max-w-md text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-400/10 ring-1 ring-red-300/20"><ShieldX className="size-6 text-red-300" /></span><h1 className="mt-5 text-xl font-semibold">Access denied</h1><p className="mt-2 text-sm leading-6 text-white/45">This area is not available to your {user?.role ?? 'current'} account. Backend permissions remain authoritative for every request.</p><a href={user?.role === 'admin' ? '/admin' : '/home'} className="mt-6 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">Return to your home</a></div></div>;
}
