import { Navigate, Outlet, useLocation } from 'react-router';
import { Loader2, ShieldX } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/authTypes';

function SessionLoading() {
  return <div className="grid min-h-screen place-items-center bg-background text-muted-foreground"><div className="flex items-center gap-3 text-sm"><Loader2 className="size-5 animate-spin text-violet-500" />Restoring your session…</div></div>;
}

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <SessionLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/access-denied" replace />;
  return <Outlet />;
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
