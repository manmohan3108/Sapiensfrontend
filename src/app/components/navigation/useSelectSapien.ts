import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { resourceSession } from '../../core/auth/authSession';
import { sapiensService } from '../../core/services/sapiensService';

export function useSelectSapien() {
  const navigate = useNavigate();
  const lifetime = useRef(0);
  const pending = useRef(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => () => { lifetime.current += 1; }, []);
  const select = async (id: string, destination: string) => {
    if (pending.current) return false;
    pending.current = true;
    const requestLifetime = lifetime.current;
    const version = resourceSession.version;
    setBusy(id); setError('');
    try {
      const available = await sapiensService.listSapiens();
      if (requestLifetime !== lifetime.current || version !== resourceSession.version) return false;
      const selected = available.find(item => item.id === id);
      if (!selected) throw new Error('This Sapiens is no longer available. Refresh the list and choose another.');
      const store = useSapiensStore.getState();
      if (store.currentSapiens?.id !== id) store.setCurrentSapiens(selected, true);
      else resourceSession.confirm(id); // Keep this Sapien's conversation intact.
      navigate(destination);
      return true;
    } catch (problem) {
      if (requestLifetime === lifetime.current && version === resourceSession.version) setError(problem instanceof Error ? problem.message : 'Could not open this Sapiens. Try again.');
      return false;
    } finally {
      pending.current = false;
      if (requestLifetime === lifetime.current) setBusy(null);
    }
  };
  return { select, busy, error, clearError: () => setError('') };
}
