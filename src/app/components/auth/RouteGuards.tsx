import { Navigate, Outlet, useLocation } from 'react-router';
import { Loader2, ShieldX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/authTypes';
import { useEffect, useState } from 'react';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { sapiensService } from '../../core/services/sapiensService';
import { resourceSession } from '../../core/auth/authSession';

function SelectionGuard() {
  const selectedId = useSapiensStore(state => state.currentSapiens?.id);
  const { pathname } = useLocation();
  const [verified, setVerified] = useState('');
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const key = `${selectedId}:${pathname}`;
  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    const check = async () => {
      setVerified(''); setError(false);
      try {
        const list = await sapiensService.listSapiens();
        if (!active) return;
        if (!list.some(item => item.id === selectedId)) {
          window.dispatchEvent(new Event(resourceSession.unavailableEvent));
        } else setVerified(key);
      } catch { if (active) setError(true); }
    };
    void check();
    window.addEventListener('focus', check);
    return () => { active = false; window.removeEventListener('focus', check); };
  }, [selectedId, key, attempt]);
  if (selectedId && verified !== key) return <div className="grid min-h-screen place-items-center bg-background text-foreground"><div role="status" className="text-center"><p>{error ? 'Could not verify access to this Sapiens.' : 'Checking Sapiens access…'}</p>{error && <button className="mt-4 rounded-lg border px-4 py-2" onClick={() => setAttempt(value => value + 1)}>Retry</button>}</div></div>;
  return <Outlet key={selectedId ?? 'picker'} />;
}

function SessionLoading() {
  return <div className="grid min-h-screen place-items-center bg-background text-muted-foreground"><div className="flex items-center gap-3 text-sm"><Loader2 className="size-5 animate-spin text-violet-500" />Restoring your session…</div></div>;
}

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <SessionLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/access-denied" replace />;
  return <SelectionGuard key={user.user_id} />;
}

export function GuestRoute() {
  const { status, user } = useAuth();
  if (status === 'loading') return <SessionLoading />;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  return <Outlet />;
}

export function AccessDeniedPage() {
  const { user } = useAuth();
  return <div className="grid min-h-screen place-items-center bg-[#060a15] px-4 text-white"><div className="max-w-md text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-400/10 ring-1 ring-red-300/20"><ShieldX className="size-6 text-red-300" /></span><h1 className="mt-5 text-xl font-semibold">Access denied</h1><p className="mt-2 text-sm leading-6 text-white/45">This area is not available to your {user?.role ?? 'current'} account. Backend permissions remain authoritative for every request.</p><a href={user?.role === 'admin' ? '/admin' : '/'} className="mt-6 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500">Return to your home</a></div></div>;
}
