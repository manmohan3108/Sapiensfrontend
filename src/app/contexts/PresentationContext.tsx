import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { canAnalyzeAndSimulate } from '../core/auth/permissions';

type Preview = { customer: boolean; analysis: boolean };
const initial: Preview = { customer: false, analysis: false };
const Context = createContext({ adminView: false, customerPreview: false, analysisAccess: false,
  customerAnalysis: false, setPreview: (_value: Preview) => {} });

export function PresentationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return <PresentationSession key={`${user?.user_id}:${user?.role}`} >{children}</PresentationSession>;
}

function PresentationSession({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const admin = user?.role === 'admin';
  const storageKey = `sapiens:admin-preview:${user?.user_id}`;
  const [preview, setPreviewState] = useState<Preview>(() => {
    if (admin) try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      if (saved && typeof saved.customer === 'boolean' && typeof saved.analysis === 'boolean') return saved;
    } catch { /* Storage is optional. */ }
    return initial;
  });
  useEffect(() => {
    if (!admin) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(preview)); } catch {}
    return () => { try { sessionStorage.removeItem(storageKey); } catch {} };
  }, [admin, storageKey, preview]);
  const setPreview = (next: Preview) => {
    if (!admin) return;
    setPreviewState(next);
  };
  const customerPreview = admin && preview.customer;
  return <Context.Provider value={{ adminView: admin && !customerPreview, customerPreview,
    customerAnalysis: admin && preview.analysis,
    analysisAccess: customerPreview ? preview.analysis : canAnalyzeAndSimulate(user), setPreview }}>{children}</Context.Provider>;
}

/** UI preview only. Authentication and API authorization must use the real AuthContext. */
export const usePresentation = () => useContext(Context);
