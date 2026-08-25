import { create } from 'zustand';
import {
  Sapiens, ChatMessage,
  MemoryUnit, DebugInfo,
} from '../../types/sapiensTypes';

interface SapiensStore {
  // ── Core state ────────────────────────────────────────────────────────────
  currentSapiens: Sapiens | null;
  chatMessages: ChatMessage[];
  chatSessionId: string | null;
  status: 'idle' | 'loading' | 'processing' | 'error';

  // ── Observability state ───────────────────────────────────────────────────
  /** Memory units from the most recent chat response */
  lastMemoryUnits: MemoryUnit[];
  /** Debug info (+ raw request/response) from the most recent response */
  lastDebugInfo: DebugInfo | null;
  /** Memory unit IDs the user has pinned for reference */
  pinnedMemoryIds: string[];
  /** Memory unit IDs the user has dismissed as irrelevant */
  ignoredMemoryIds: string[];

  // ── Orchestrator / overload state ────────────────────────────────────────
  /** True when the sapien's background queue is over its threshold */
  isOverloaded: boolean;

  // ── UI panel visibility ───────────────────────────────────────────────────
  showDebugPanel: boolean;
  showMemoryTimeline: boolean;
  /** When set, ChatWindow will scroll to + briefly highlight this message */
  jumpToMessageId: string | null;

  // ── Core actions ──────────────────────────────────────────────────────────
  setCurrentSapiens: (sapiens: Sapiens | null) => void;
  setStatus: (status: 'idle' | 'loading' | 'processing' | 'error') => void;

  // ── Chat actions ──────────────────────────────────────────────────────────
  addChatMessage: (msg: ChatMessage) => void;
  updateChatMessage: (id: string, partial: Partial<ChatMessage>) => void;
  clearChatMessages: () => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  setChatSessionId: (id: string | null) => void;

  // ── Observability actions ─────────────────────────────────────────────────
  setLastMemoryUnits: (units: MemoryUnit[]) => void;
  setLastDebugInfo: (info: DebugInfo | null) => void;
  togglePinnedMemory: (id: string) => void;
  toggleIgnoredMemory: (id: string) => void;
  clearIgnoredMemories: () => void;

  // ── Orchestrator actions ──────────────────────────────────────────────────
  setOverloaded: (overloaded: boolean) => void;

  // ── UI panel actions ──────────────────────────────────────────────────────
  setShowDebugPanel: (show: boolean) => void;
  toggleDebugPanel: () => void;
  setShowMemoryTimeline: (show: boolean) => void;
  setJumpToMessageId: (id: string | null) => void;

  reset: () => void;
}

export const useSapiensStore = create<SapiensStore>((set) => ({
  // ── Initial state ─────────────────────────────────────────────────────────
  currentSapiens: null,
  chatMessages: [],
  chatSessionId: null,
  status: 'idle',

  lastMemoryUnits: [],
  lastDebugInfo: null,
  pinnedMemoryIds: [],
  ignoredMemoryIds: [],

  isOverloaded: false,

  showDebugPanel: false,
  showMemoryTimeline: false,
  jumpToMessageId: null,

  // ── Core actions ──────────────────────────────────────────────────────────
  setCurrentSapiens: (sapiens) => set({ currentSapiens: sapiens }),

  setStatus: (status) => set({ status }),

  // ── Chat actions ──────────────────────────────────────────────────────────
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),

  updateChatMessage: (id, partial) =>
    set((state) => ({
      chatMessages: state.chatMessages.map((m) =>
        m.id === id ? { ...m, ...partial } : m
      ),
    })),

  clearChatMessages: () =>
    set({ chatMessages: [], chatSessionId: null, lastMemoryUnits: [], lastDebugInfo: null }),

  setChatMessages: (messages) => set({ chatMessages: messages }),

  setChatSessionId: (id) => set({ chatSessionId: id }),

  // ── Observability actions ─────────────────────────────────────────────────
  setLastMemoryUnits: (units) => set({ lastMemoryUnits: units }),

  setLastDebugInfo: (info) => set({ lastDebugInfo: info }),

  togglePinnedMemory: (id) =>
    set((state) => ({
      pinnedMemoryIds: state.pinnedMemoryIds.includes(id)
        ? state.pinnedMemoryIds.filter((x) => x !== id)
        : [...state.pinnedMemoryIds, id],
    })),

  toggleIgnoredMemory: (id) =>
    set((state) => ({
      ignoredMemoryIds: state.ignoredMemoryIds.includes(id)
        ? state.ignoredMemoryIds.filter((x) => x !== id)
        : [...state.ignoredMemoryIds, id],
    })),

  clearIgnoredMemories: () => set({ ignoredMemoryIds: [] }),

  // ── UI panel actions ──────────────────────────────────────────────────────
  setOverloaded: (overloaded) => set({ isOverloaded: overloaded }),

  setShowDebugPanel: (show) => set({ showDebugPanel: show }),
  toggleDebugPanel: () => set((s) => ({ showDebugPanel: !s.showDebugPanel })),
  setShowMemoryTimeline: (show) => set({ showMemoryTimeline: show }),
  setJumpToMessageId: (id) => set({ jumpToMessageId: id }),

  reset: () =>
    set({
      currentSapiens: null,
      chatMessages: [],
      chatSessionId: null,
      status: 'idle',
      lastMemoryUnits: [],
      lastDebugInfo: null,
      pinnedMemoryIds: [],
      ignoredMemoryIds: [],
      isOverloaded: false,
      showDebugPanel: false,
      showMemoryTimeline: false,
      jumpToMessageId: null,
    }),
}));
