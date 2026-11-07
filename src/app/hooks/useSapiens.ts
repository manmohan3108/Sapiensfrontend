import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSapiensStore } from '../core/state/sapiensStore';
import { sapiensService } from '../core/services/sapiensService';
import {
  CreateSapiensRequest,
  Sapiens,
  UserSignalType,
  UserSignalPayload,
} from '../types/sapiensTypes';
import { logger } from '../utils/logger';
import { chatMessages } from '../core/services/chatMessages';
import { resourceSession } from '../core/auth/authSession';
import { useAuth } from '../contexts/AuthContext';

export function useSapiens() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    currentSapiens,
    chatSessionId,
    setCurrentSapiens,
    setStatus,
    addChatMessage,
    updateChatMessage,
    clearChatMessages,
    setChatMessages,
    setChatSessionId,
    setLastMemoryUnits,
    setLastDebugInfo,
    setOverloaded,
    reset,
  } = useSapiensStore();

  // ── Create ──────────────────────────────────────────────────────────────────
  const createSapiens = useCallback(
    async (request: CreateSapiensRequest) => {
      try {
        setStatus('loading');
        const response = await sapiensService.createSapiens(request);
        const newSapiens: Sapiens = {
          id: response.sapiensId,
          name: response.name,
          role: response.role,
          createdAt: response.createdAt,
          lastModified: response.createdAt,
          simulationEnabled: response.simulationEnabled,
        };
        setCurrentSapiens(newSapiens);
        setStatus('idle');
        navigate('/workspace');
        return newSapiens;
      } catch (error) {
        logger.error('Failed to create Sapiens', error);
        setStatus('error');
        throw error;
      }
    },
    [setStatus, setCurrentSapiens, navigate, user?.role]
  );

  // ── Load ────────────────────────────────────────────────────────────────────
  const loadSapiens = useCallback(
    async (sapiens: Sapiens) => {
      try {
        setStatus('loading');
        // Re-check the server-filtered list; a cached picker row is not authority.
        const available = await sapiensService.listSapiens();
        const selected = available.find(item => item.id === sapiens.id);
        if (!selected) { reset(); throw new Error('This Sapiens is no longer available to your account. Refresh the list.'); }
        setCurrentSapiens(selected, true);
        setStatus('idle');
        navigate('/workspace');
        return sapiens;
      } catch (error) {
        logger.error('Failed to load Sapiens', error);
        setStatus('error');
        throw error;
      }
    },
    [setStatus, setCurrentSapiens, navigate, user?.role, reset]
  );

  // ── Upload files ─────────────────────────────────────────────────────────────
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!currentSapiens) {
        throw new Error('Select a Sapiens before uploading.');
      }
      const version = resourceSession.version;
      try {
        setStatus('processing');
        const result = await sapiensService.uploadFolder({ sapiensId: currentSapiens.id, files });
        setStatus('idle');
        return result;
      } catch (error) {
        logger.error('Failed to upload files', error);
        if (resourceSession.version === version) setStatus('error');
        throw error;
      }
    },
    [currentSapiens, setStatus]
  );

  // Acceptance and completion are separate: the chat window follows saved status.
  const sendTextInput = useCallback(async (text: string) => {
    if (!currentSapiens || useSapiensStore.getState().status === 'processing') return false;
    const version = resourceSession.version;
    const requestId = crypto.randomUUID();
    const sessionId = useSapiensStore.getState().chatSessionId;
    const current = () => resourceSession.version === version
      && useSapiensStore.getState().currentSapiens?.id === currentSapiens.id
      && useSapiensStore.getState().chatSessionId === sessionId;
    addChatMessage({ id: requestId, role: 'user', content: text,
      timestamp: new Date().toISOString(), turnStatus: 'sending' });
    setStatus('processing');
    try {
      const response = await sapiensService.sendTextInput({
        sapiensId: currentSapiens.id, text, sessionId, requestId,
      });
      if (!current()) return false;
      if (response.status === 'accepted') {
        if (!response.thread_id || !response.message_id) throw new Error('Acceptance was not confirmed');
        updateChatMessage(requestId, { id: response.message_id, sessionId: response.thread_id, turnStatus: 'queued' });
      } else {
        // Rolling deployment compatibility with the earlier synchronous endpoint.
        updateChatMessage(requestId, { turnStatus: response.reply?.trim() ? 'completed' : 'no_reply' });
        if (response.reply?.trim()) addChatMessage({
          id: `${requestId}:reply`, role: 'assistant', content: response.reply,
          timestamp: new Date().toISOString(), sessionId: response.thread_id,
          memoryUnits: response.memory_units, contextUsed: response.context_used,
        });
      }
      setChatSessionId(response.thread_id);
      setLastDebugInfo({ ...(response.debug_info ?? { latency: {}, engine_flow: [] }),
        raw_request: { sapien_id: Number(currentSapiens.id), session_id: sessionId,
          message: text, async: true, request_id: requestId }, raw_response: response });
      setLastMemoryUnits(response.memory_units ?? []);
      if (response.overloaded !== undefined) setOverloaded(response.overloaded);
      setStatus('idle');
      return true;
    } catch (error) {
      if (!current()) return false;
      logger.error('Chat acceptance could not be confirmed', error);
      const code = (error as { status?: number }).status;
      if (!code || code >= 500) {
        // Read the acceptance receipt; never repeat the POST after an uncertain response.
        const accepted = await sapiensService.findAcceptedTurn(currentSapiens.id, requestId).catch(() => null);
        if (!current()) return false;
        if (accepted?.message_id && accepted.thread_id) {
          updateChatMessage(requestId, { id: accepted.message_id, sessionId: accepted.thread_id, turnStatus: 'queued' });
          setChatSessionId(accepted.thread_id);
          setStatus('idle');
          return true;
        }
      }
      updateChatMessage(requestId, { turnStatus: code && code >= 400 && code < 500 ? 'rejected' : 'unknown' });
      setStatus('error');
      return false;
    }
  }, [currentSapiens, addChatMessage, updateChatMessage, setChatSessionId, setStatus,
      setLastDebugInfo, setLastMemoryUnits, setOverloaded]);

  const loadChat = useCallback(async (threadId: string) => {
    if (!currentSapiens) return;
    const version = resourceSession.version;
    const previousThread = useSapiensStore.getState().chatSessionId;
    const detail = await sapiensService.getChatDetail(currentSapiens.id, threadId);
    if (resourceSession.version !== version || useSapiensStore.getState().chatSessionId !== previousThread) return;
    setChatMessages(chatMessages(detail));
    setChatSessionId(detail.thread_id);
    setLastMemoryUnits([]);
    setLastDebugInfo(null);
    return detail;
  }, [currentSapiens, setChatMessages, setChatSessionId, setLastMemoryUnits, setLastDebugInfo]);

  const startNewChat = useCallback(() => {
    clearChatMessages();
  }, [clearChatMessages]);

  // ── Send user signal ─────────────────────────────────────────────────────────
  const sendUserSignal = useCallback(
    async (messageId: string, signal: UserSignalType, content?: string) => {
      // Optimistically update message in store
      useSapiensStore.getState().updateChatMessage(messageId, {
        userSignal: signal,
        isImportant: signal === 'important' ? true : undefined,
      });

      const payload: UserSignalPayload = {
        session_id: useSapiensStore.getState().chatSessionId ?? undefined,
        message_id: messageId,
        signal,
        content,
        timestamp: new Date().toISOString(),
      };

      await sapiensService.sendUserSignal(payload);
    },
    []
  );

  // ── Run engine ───────────────────────────────────────────────────────────────
  const runEngine = useCallback(async () => {
    if (!currentSapiens) {
      logger.warn('No current Sapiens to run engine');
      return;
    }
    try {
      setStatus('processing');
      await sapiensService.runEngine(currentSapiens.id);
      setStatus('idle');
    } catch (error) {
      logger.error('Failed to run engine', error);
      setStatus('error');
      throw error;
    }
  }, [currentSapiens, setStatus]);

  return {
    currentSapiens,
    chatSessionId,
    createSapiens,
    loadSapiens,
    uploadFiles,
    sendTextInput,
    sendUserSignal,
    loadChat,
    startNewChat,
    runEngine,
  };
}
