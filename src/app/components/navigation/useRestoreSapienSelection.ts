import { useCallback, useEffect, useState } from 'react';
import { resourceSession } from '../../core/auth/authSession';
import { selectionStorage } from '../../core/auth/selectionStorage';
import { sapiensService } from '../../core/services/sapiensService';
import { useSapiensStore } from '../../core/state/sapiensStore';
import type { Sapiens } from '../../types/sapiensTypes';

type RestoreOptions = {
  available?: Sapiens[];
  ready?: boolean;
};

type RestoreState = {
  candidateId: string | null;
  status: 'idle' | 'restoring' | 'ready' | 'error';
  error: string;
};

const initialState: RestoreState = { candidateId: null, status: 'idle', error: '' };

/**
 * Restores a route-provided or persisted Sapien only after confirming it is in
 * the account-filtered directory. A late response cannot replace a newer manual
 * selection. Pages may provide a directory they already loaded to avoid another
 * backend request.
 */
export function useRestoreSapienSelection(candidateId: string | null, options: RestoreOptions = {}) {
  const currentId = useSapiensStore(state => state.currentSapiens?.id);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<RestoreState>(initialState);
  const ready = options.ready ?? true;
  const available = options.available;

  useEffect(() => {
    if (!candidateId) {
      setState(initialState);
      return;
    }
    if (currentId === candidateId && resourceSession.isVerified(candidateId)) {
      setState({ candidateId, status: 'ready', error: '' });
      return;
    }
    if (!ready) {
      setState({ candidateId, status: 'restoring', error: '' });
      return;
    }

    let active = true;
    const selectionVersion = resourceSession.version;
    setState({ candidateId, status: 'restoring', error: '' });

    const restore = async () => {
      try {
        const directory = available ?? await sapiensService.listSapiens();
        if (!active || resourceSession.version !== selectionVersion) return;
        const selected = directory.find(item => item.id === candidateId);
        if (!selected) {
          const store = useSapiensStore.getState();
          if (selectionStorage.read() === candidateId) {
            selectionStorage.save(store.currentSapiens?.id === candidateId ? null : store.currentSapiens?.id ?? null);
          }
          if (store.currentSapiens?.id === candidateId && !resourceSession.isVerified(candidateId)) {
            store.setCurrentSapiens(null);
          }
          setState({
            candidateId,
            status: 'error',
            error: `Sapiens ID ${candidateId} is not available to this account. Choose another Sapiens.`,
          });
          return;
        }

        const store = useSapiensStore.getState();
        if (store.currentSapiens?.id === candidateId) {
          // Establish a verified resource session without clearing an existing chat.
          resourceSession.select(candidateId);
          resourceSession.confirm(candidateId);
        } else {
          store.setCurrentSapiens(selected, true);
        }
        if (active) setState({ candidateId, status: 'ready', error: '' });
      } catch {
        if (active && resourceSession.version === selectionVersion) {
          setState({
            candidateId,
            status: 'error',
            error: 'We couldn’t restore the selected Sapiens. Refresh this page or choose it again.',
          });
        }
      }
    };

    void restore();
    return () => { active = false; };
  }, [candidateId, currentId, ready, available, attempt]);

  const retry = useCallback(() => setAttempt(value => value + 1), []);
  return { ...state, retry };
}
