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
        };
        setCurrentSapiens(newSapiens);
        setStatus('idle');
        navigate(user?.role === 'admin' ? '/admin/analyse' : '/workspace');
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
        setCurrentSapiens(sapiens);
        setStatus('idle');
        navigate(user?.role === 'admin' ? '/admin/analyse' : '/workspace');
        return sapiens;
      } catch (error) {
        logger.error('Failed to load Sapiens', error);
        setStatus('error');
        throw error;
      }
    },
    [setStatus, setCurrentSapiens, navigate, user?.role]
  );

  // ── Save ────────────────────────────────────────────────────────────────────
  const saveSapiens = useCallback(async () => {
    if (!currentSapiens) {
      logger.warn('No current Sapiens to save');
      return;
    }
    try {
      setStatus('loading');
      await sapiensService.saveSapiens({ sapiensId: currentSapiens.id });
      setStatus('idle');
    } catch (error) {
      logger.error('Failed to save Sapiens', error);
      setStatus('error');
    }
  }, [currentSapiens, setStatus]);

  // ── Upload files ─────────────────────────────────────────────────────────────
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!currentSapiens) {
        logger.warn('No current Sapiens for file upload');
        return;
      }
      try {
        setStatus('processing');
        await sapiensService.uploadFolder({ sapiensId: currentSapiens.id, files });
        setStatus('idle');
      } catch (error) {
        logger.error('Failed to upload files', error);
        setStatus('error');
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

        // 3. Replace loading placeholder with real response + metadata
        updateChatMessage(assistantMsgId, {
          content: chatResponse.reply ?? '',
          isLoading: false,
          timestamp: now(),
          memoryUnits,
          contextUsed: chatResponse.context_used ?? 0,
          sessionId: chatResponse.thread_id,
          overloaded: chatResponse.overloaded,
        });

        setStatus('idle');
      } catch (error) {
        logger.error('Failed to send chat message', error);
        updateChatMessage(assistantMsgId, {
          content: 'An error occurred while processing your request. Please try again.',
          isLoading: false,
          timestamp: now(),
        });
        setStatus('error');
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
    ]
  );

  const loadChat = useCallback(async (threadId: string) => {
    if (!currentSapiens) return;
    const detail = await sapiensService.getChatDetail(currentSapiens.id, threadId);
    const seen = new Set<string>();
    const messages = [...detail.messages]
      .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime())
      .filter((message) => !seen.has(message.id) && seen.add(message.id))
      .map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: message.occurred_at,
        sessionId: detail.thread_id,
      }));
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

  // ── Send query (legacy /api/query) ───────────────────────────────────────────
  const sendQuery = useCallback(
    async (text: string) => {
      if (!currentSapiens) {
        logger.warn('No current Sapiens for query');
        return;
      }

      const now = () => new Date().toISOString();

      // 1. User message
      const userMsgId = generateId('user');
      addChatMessage({
        id: userMsgId,
        role: 'user',
        content: text,
        timestamp: now(),
        apiMode: 'query',
      });

      // 2. Loading placeholder
      const assistantMsgId = generateId('assistant');
      addChatMessage({
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: now(),
        isLoading: true,
        apiMode: 'query',
      });

      try {
        setStatus('processing');

        const reply = await sapiensService.sendQuery(currentSapiens.id, text);

        updateChatMessage(assistantMsgId, {
          content: reply,
          isLoading: false,
          timestamp: now(),
          apiMode: 'query',
        });

        setStatus('idle');
      } catch (error) {
        logger.error('Failed to send query', error);
        updateChatMessage(assistantMsgId, {
          content: 'An error occurred while processing your query. Please try again.',
          isLoading: false,
          timestamp: now(),
          apiMode: 'query',
        });
        setStatus('error');
      }
    },
    [
      currentSapiens,
      setStatus,
      addChatMessage,
      updateChatMessage,
    ]
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

  // ── Return to home ───────────────────────────────────────────────────────────
  const returnToHome = useCallback(() => {
    reset();
    navigate(user?.role === 'admin' ? '/admin' : '/');
  }, [reset, navigate, user?.role]);

  return {
    currentSapiens,
    chatSessionId,
    createSapiens,
    loadSapiens,
    saveSapiens,
    uploadFiles,
    sendTextInput,
    sendQuery,
    sendUserSignal,
    loadChat,
    startNewChat,
    runEngine,
    returnToHome,
  };
}
