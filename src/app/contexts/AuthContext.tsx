import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authenticatedFetch, authSession, HttpError, parseAuthResponse, resourceSession } from '../core/auth/authSession';
import { toast } from 'sonner';
import type { AuthCredentials, AuthUser, RegistrationCredentials, TokenPair } from '../types/authTypes';
import { useSapiensStore } from '../core/state/sapiensStore';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  notice: string;
  login: (credentials: AuthCredentials) => Promise<AuthUser>;
  register: (credentials: RegistrationCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadMe() {
  return parseAuthResponse<AuthUser>(await authenticatedFetch(authSession.url('me/'), { signal: AbortSignal.timeout(30_000) }));
}

async function exchange(path: 'login/' | 'register/', credentials: AuthCredentials | RegistrationCredentials) {
  authSession.clear();
  useSapiensStore.getState().reset();
  const response = await fetch(authSession.url(path), {
    method: 'POST',
    credentials: 'omit',
    signal: AbortSignal.timeout(30_000),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  const tokens = await parseAuthResponse<TokenPair>(response);
  authSession.save(tokens);
  try { return await loadMe(); }
  catch (error) { authSession.clear(); throw error; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [notice, setNotice] = useState('');
  const restored = useRef(false);

  const clearSession = useCallback(() => {
    authSession.clear();
    useSapiensStore.getState().reset();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (!authSession.tokens) { setStatus('unauthenticated'); return; }
    loadMe().then(value => { setUser(value); setStatus('authenticated'); }).catch(() => {
      clearSession();
      setNotice('Your session could not be restored. Please sign in again.');
    });
  }, [clearSession]);

  useEffect(() => {
    const unavailable = () => {
      useSapiensStore.getState().reset();
      toast.error('Sapiens unavailable', { description: 'It may have been reassigned or deleted. Choose from your accessible Sapiens.' });
    };
    window.addEventListener(resourceSession.unavailableEvent, unavailable);
    return () => window.removeEventListener(resourceSession.unavailableEvent, unavailable);
  }, []);

  useEffect(() => {
    const expired = () => { clearSession(); setNotice('Your session has expired. Please sign in again.'); };
    window.addEventListener(authSession.expiredEvent, expired);
    return () => window.removeEventListener(authSession.expiredEvent, expired);
  }, [clearSession]);

  const complete = useCallback(async (request: Promise<AuthUser>) => {
    setNotice('');
    try {
      const value = await request;
      setUser(value); setStatus('authenticated');
      return value;
    } catch (error) {
      setStatus('unauthenticated');
      if (error instanceof TypeError) throw new Error('Unable to reach the server. Check your connection and try again.');
      throw error;
    }
  }, []);

  const login = useCallback((credentials: AuthCredentials) => complete(exchange('login/', credentials)), [complete]);
  const register = useCallback((credentials: RegistrationCredentials) => complete(exchange('register/', credentials)), [complete]);
  const logout = useCallback(async () => {
    const refresh = authSession.tokens?.refresh;
    clearSession();
    setNotice('You have been signed out.');
    try {
      if (refresh) await fetch(authSession.url('logout/'), { method: 'POST', credentials: 'omit', signal: AbortSignal.timeout(30_000), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh }) });
    } catch { setNotice('Signed out on this device. The server could not be reached to revoke the session.'); }
  }, [clearSession]);

  const value = useMemo(() => ({ status, user, notice, login, register, logout }), [status, user, notice, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

export function authErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    if (error.status === 401) return 'The username or password is incorrect.';
    if (error.status === 403) return 'Your account does not have access to this area.';
    return error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}
