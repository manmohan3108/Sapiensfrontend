import { useCallback, useEffect, useState } from 'react';
import { resourceSession } from '../core/auth/authSession';
import { sapiensService } from '../core/services/sapiensService';
import { chatMessages, pendingTurn } from '../core/services/chatMessages';
import { useSapiensStore } from '../core/state/sapiensStore';

/** Read-only polling follows saved work; losing a connection never resends a turn. */
export function useChatUpdates() {
  const sapienId = useSapiensStore(state => state.currentSapiens?.id);
  const threadId = useSapiensStore(state => state.chatSessionId);
  const posting = useSapiensStore(state => state.status === 'processing');
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    setError(null);
    if (!sapienId || !threadId || posting) return;
    const version = resourceSession.version;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false;
    const current = () => !controller.signal.aborted && resourceSession.version === version
      && useSapiensStore.getState().currentSapiens?.id === sapienId
      && useSapiensStore.getState().chatSessionId === threadId
      && useSapiensStore.getState().status !== 'processing';

    async function update() {
      if (!current() || running || document.visibilityState === 'hidden') return;
      clearTimeout(timer);
      running = true;
      let delay: number | undefined;
      try {
        const detail = await sapiensService.getChatDetail(sapienId!, threadId!, AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]));
        if (!current()) return;
        const state = useSapiensStore.getState();
        const saved = chatMessages(detail, state.chatMessages);
        const unknown = state.chatMessages.filter(message => (message.turnStatus === 'unknown' || message.turnStatus === 'rejected')
          && !saved.some(item => item.id === message.id)
          && !detail.turns?.some(turn => turn.request_id === message.id));
        state.setChatMessages([...saved, ...unknown]);
        setError(null);
        if (detail.turns?.some(turn => pendingTurn(turn.status))) delay = 5000;
      } catch (failure) {
        if (!current()) return;
        const status = (failure as { status?: number }).status;
        setError(status === 403 || status === 404
          ? 'This conversation is no longer available. Check your selected Sapien.'
          : 'Couldn’t refresh the conversation. Your message has not been resent.');
        if (status !== 401 && status !== 403 && status !== 404) delay = 10000;
      } finally {
        running = false;
        if (delay && current()) timer = setTimeout(() => void update(), delay);
      }
    }
    const onVisible = () => { if (document.visibilityState === 'visible') void update(); };
    void update();
    window.addEventListener('focus', onVisible);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      controller.abort();
      clearTimeout(timer);
      window.removeEventListener('focus', onVisible);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [sapienId, threadId, posting, revision]);
  return { error, refresh };
}
