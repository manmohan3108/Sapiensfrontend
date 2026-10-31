import { useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSapiensStore } from '../core/state/sapiensStore';
import { sapiensService } from '../core/services/sapiensService';
import {
  CreateSapiensRequest,
  Sapiens,
  UserSignalType,
  UserSignalPayload,
  DebugInfo,
} from '../types/sapiensTypes';
import { logger } from '../utils/logger';
import { generateId } from '../utils/formatters';
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

  // ── Send chat message ────────────────────────────────────────────────────────
  const sendTextInput = useCallback(
    async (text: string) => {
      if (!currentSapiens) {
        logger.warn('No current Sapiens for text input');
        return;
      }

      const now = () => new Date().toISOString();
      const version = resourceSession.version;

      // 1. Add user message immediately
      const userMsgId = generateId('user');
      addChatMessage({
        id: userMsgId,
        role: 'user',
        content: text,
        timestamp: now(),
      });

      // 2. Add loading assistant placeholder
      const assistantMsgId = generateId('assistant');
      addChatMessage({
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: now(),
        isLoading: true,
      });

      // Capture the request body for debug panel
      const sessionId = useSapiensStore.getState().chatSessionId ?? null;
      const rawRequest = {
        sapien_id: parseInt(currentSapiens.id, 10),
        session_id: sessionId,
        message: text,
      };

      try {
        setStatus('processing');

        const chatResponse = await sapiensService.sendTextInput({
          sapiensId: currentSapiens.id,
          text,
          sessionId: sessionId,
        });

        // ── Persist thread_id for next turn (sent back as session_id) ──
        if (chatResponse.thread_id) {
          setChatSessionId(chatResponse.thread_id);
        }

        // ── Build augmented DebugInfo ──
        const debugInfo: DebugInfo = {
          ...(chatResponse.debug_info ?? { latency: {}, engine_flow: [] }),
          raw_request: rawRequest,
          raw_response: chatResponse,
        };
        setLastDebugInfo(debugInfo);

        // ── Persist memory units ──
        const memoryUnits = chatResponse.memory_units ?? [];
        setLastMemoryUnits(memoryUnits);

        // ── Overload signal ──
        if (chatResponse.overloaded !== undefined) {
          setOverloaded(chatResponse.overloaded);
        }

        // 3. Replace the loading placeholder with a completed response. An empty
        // reply is a completed-but-invalid state, not a blank chat message.
        const reply = chatResponse.reply ?? '';
        const emptyResponse = reply.trim().length === 0;
        updateChatMessage(assistantMsgId, {
          content: emptyResponse ? 'No response text was returned. Check this conversation before sending your message again.' : reply,
          isError: emptyResponse,
          emptyResponse,
          isLoading: false,
          timestamp: now(),
          memoryUnits,
          contextUsed: chatResponse.context_used ?? 0,
          sessionId: chatResponse.thread_id,
          overloaded: chatResponse.overloaded,
        });

        setStatus('idle');
        return true;
      } catch (error) {
        logger.error('Failed to send chat message', error);
        if (resourceSession.version !== version) return false;
        updateChatMessage(assistantMsgId, {
          content: user?.role === 'admin' ? 'An error occurred while processing your request. Please try again.' : 'We couldn’t confirm the result. Your message may have been saved. Check this conversation before sending it again; we haven’t resent it.',
          isError: true,
          isLoading: false,
          timestamp: now(),
        });
        setStatus('error');
        return false;
      }
    },
    [
      currentSapiens,
      setStatus,
      addChatMessage,
      updateChatMessage,
      setChatSessionId,
      setLastMemoryUnits,
      setLastDebugInfo,
      setOverloaded,
      user?.role,
    ]
  );

  const loadChat = useCallback(async (threadId: string) => {
    if (!currentSapiens) return;
    const detail = await sapiensService.getChatDetail(currentSapiens.id, threadId);
    const seen = new Set<string>();
    const messages = [...detail.messages]
      .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
      .filter((message) => !seen.has(message.id) && seen.add(message.id))
      .map((message) => {
        const content = typeof message.content === 'string' ? message.content : '';
        const emptyResponse = message.role === 'assistant' && !content.trim();
        return {
          id: message.id,
          role: message.role,
          content: emptyResponse ? 'No response text was recorded. Check this conversation before sending your message again.' : content,
          timestamp: message.occurred_at,
          sessionId: detail.thread_id,
          isError: emptyResponse,
          emptyResponse,
        };
      });
    setChatMessages(messages);
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
