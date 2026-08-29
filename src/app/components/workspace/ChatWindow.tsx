import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Brain, User, AlertCircle,
  Loader2, ChevronDown, Sparkles, Copy, Check,
  ThumbsUp, ThumbsDown, Star, BookMarked, MinusCircle,
  Database, ChevronRight, Search,
  History, Plus, RefreshCw,
  Paperclip, X,
} from 'lucide-react';
import { useSapiens } from '../../hooks/useSapiens';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { sapiensService } from '../../core/services/sapiensService';
import { formatTime } from '../../utils/formatters';
import { ChatHistoryItem, ChatMessage, UserSignalType } from '../../types/sapiensTypes';
import { ApiError } from '../../types/apiTypes';
import { CombinedInputPanel } from './CombinedInputPanel';

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-0.5">
      {[0, 160, 320].map((d) => (
        <span key={d} className="w-1.5 h-1.5 rounded-full bg-violet-400/70 animate-bounce"
          style={{ animationDelay: `${d}ms`, animationDuration: '1s' }} />
      ))}
    </span>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px]
        text-white/30 hover:text-white/70 hover:bg-white/10 border border-transparent hover:border-white/10"
    >
      {copied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ─── Transparency strip ───────────────────────────────────────────────────────
function TransparencyStrip({ msg }: { msg: ChatMessage }) {
  const [showIds, setShowIds] = useState(false);
  const memCount = msg.memoryUnits?.length ?? 0;
  const ctxCount = msg.contextUsed ?? 0;

  if (!memCount && !ctxCount) return null;

  return (
    <div
      className="flex flex-col gap-1.5 px-2.5 py-2 rounded-xl mt-1"
      style={{
        background: 'rgba(245,158,11,0.04)',
        border: '1px solid rgba(245,158,11,0.12)',
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        {memCount > 0 && (
          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(245,158,11,0.7)' }}>
            <Database className="w-2.5 h-2.5" />
            {memCount} memor{memCount !== 1 ? 'ies' : 'y'} used
          </span>
        )}
        {ctxCount > 0 && (
          <>
            {memCount > 0 && <span style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>}
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(6,182,212,0.65)' }}>
              <Brain className="w-2.5 h-2.5" />
              {ctxCount} context
            </span>
          </>
        )}
        {memCount > 0 && (
          <button
            onClick={() => setShowIds(!showIds)}
            className="flex items-center gap-0.5 text-[9px] ml-auto transition-colors"
            style={{ color: 'rgba(245,158,11,0.4)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(245,158,11,0.75)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(245,158,11,0.4)'; }}
          >
            <ChevronRight
              className="w-2.5 h-2.5 transition-transform"
              style={{ transform: showIds ? 'rotate(90deg)' : 'none' }}
            />
            IDs
          </button>
        )}
      </div>

      {showIds && msg.memoryUnits && (
        <div className="flex flex-wrap gap-1">
          {msg.memoryUnits.map((u) => (
            <span
              key={u.id}
              className="px-1.5 py-0.5 rounded text-[9px] font-mono"
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.15)',
                color: 'rgba(252,211,77,0.65)',
              }}
            >
              {u.id.slice(0, 14)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Signal controls (icon-only, label on active) ─────────────────────────────
const SIGNALS: {
  id: UserSignalType;
  icon: React.ReactNode;
  label: string;
  color: string;
}[] = [
  { id: 'thumbs_up',    icon: <ThumbsUp   className="w-3 h-3" />, label: 'Helpful',      color: '#34d399' },
  { id: 'thumbs_down',  icon: <ThumbsDown  className="w-3 h-3" />, label: 'Not helpful',  color: '#f87171' },
  { id: 'important',    icon: <Star        className="w-3 h-3" />, label: 'Important',    color: '#fbbf24' },
  { id: 'remember',     icon: <BookMarked  className="w-3 h-3" />, label: 'Remember',     color: '#a78bfa' },
  { id: 'not_relevant', icon: <MinusCircle className="w-3 h-3" />, label: 'Not relevant', color: '#64748b' },
];

function SignalControls({ msg, onSignal }: { msg: ChatMessage; onSignal: (s: UserSignalType) => void }) {
  const active = msg.userSignal;

  return (
    <div className="flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      {SIGNALS.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSignal(s.id)}
            title={s.label}
            className="flex items-center gap-1 rounded-lg transition-all duration-150"
            style={
              isActive
                ? {
                    padding: '3px 8px',
                    background: `${s.color}18`,
                    border: `1px solid ${s.color}45`,
                    color: s.color,
                  }
                : {
                    padding: '3px 6px',
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: 'rgba(255,255,255,0.22)',
                  }
            }
            onMouseEnter={e => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = `${s.color}12`;
                (e.currentTarget as HTMLElement).style.borderColor = `${s.color}35`;
                (e.currentTarget as HTMLElement).style.color = s.color;
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.22)';
              }
            }}
          >
            {s.icon}
            {/* Show label only when active */}
            {isActive && (
              <span className="text-[9px] font-medium">{s.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── API mode badge ───────────────────────────────────────────────────────────
function ApiModeBadge({ mode }: { mode: 'chat' | 'query' }) {
  return mode === 'query' ? (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono flex-shrink-0"
      style={{
        background: 'rgba(6,182,212,0.12)',
        border: '1px solid rgba(6,182,212,0.25)',
        color: '#67e8f9',
      }}
    >
      <Search className="w-2 h-2" />
      /query
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono flex-shrink-0"
      style={{
        background: 'rgba(124,58,237,0.12)',
        border: '1px solid rgba(124,58,237,0.22)',
        color: '#c4b5fd',
      }}
    >
      <Brain className="w-2 h-2" />
      /chat
    </span>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  msg, onSignal, isHighlighted,
}: {
  msg: ChatMessage;
  onSignal: (id: string, s: UserSignalType) => void;
  isHighlighted: boolean;
}) {
  const isUser = msg.role === 'user';
  const isQuery = msg.apiMode === 'query';
  const isError = !msg.isLoading && msg.role === 'assistant' && (msg.content ?? '').startsWith('An error occurred');

  return (
    <div
      data-message-id={msg.id}
      className={`flex gap-3 group transition-all duration-500 rounded-2xl ${isUser ? 'flex-row-reverse' : ''}`}
      style={
        isHighlighted
          ? { background: 'rgba(124,58,237,0.08)', padding: '8px', margin: '-8px', boxShadow: '0 0 0 1px rgba(124,58,237,0.2)' }
          : undefined
      }
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={
              isQuery
                ? { background: 'linear-gradient(135deg, #0e7490, #06b6d4)', boxShadow: '0 0 12px rgba(6,182,212,0.4)' }
                : { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 12px rgba(124,58,237,0.4)' }
            }
          >
            {isQuery
              ? <Search className="w-3.5 h-3.5 text-white" />
              : <User className="w-3.5 h-3.5 text-white" />
            }
          </div>
        ) : isError ? (
          <div className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          </div>
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={
              isQuery
                ? { background: 'rgba(6,182,212,0.2)', border: '1px solid rgba(6,182,212,0.35)', boxShadow: '0 0 10px rgba(6,182,212,0.2)' }
                : { background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)', boxShadow: '0 0 10px rgba(124,58,237,0.2)' }
            }
          >
            {isQuery
              ? <Search className="w-3.5 h-3.5 text-cyan-300" />
              : <Brain className="w-3.5 h-3.5 text-violet-300" />
            }
          </div>
        )}
      </div>

      {/* Bubble + metadata */}
      <div className={`flex flex-col gap-1 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        {isUser ? (
          <div
            className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-white"
            style={
              isQuery
                ? {
                    background: 'linear-gradient(135deg, rgba(6,182,212,0.8), rgba(14,116,144,0.8))',
                    border: '1px solid rgba(6,182,212,0.4)',
                    boxShadow: '0 4px 20px rgba(6,182,212,0.2)',
                  }
                : {
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.85), rgba(79,70,229,0.85))',
                    border: '1px solid rgba(124,58,237,0.4)',
                    boxShadow: '0 4px 20px rgba(124,58,237,0.25)',
                  }
            }
          >
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          </div>
        ) : (
          <>
            {/* API mode badge above assistant bubble */}
            {msg.apiMode && (
              <div className="mb-0.5">
                <ApiModeBadge mode={msg.apiMode} />
              </div>
            )}
            <div
              className={`px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed ${isError ? 'text-red-300' : 'text-white/80'}`}
              style={isError
                ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }
                : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }
              }
            >
              {msg.isLoading
                ? <TypingDots />
                : <p className="whitespace-pre-wrap break-words">{msg.content ?? ''}</p>
              }
            </div>

            {!msg.isLoading && <TransparencyStrip msg={msg} />}

            {/* Overloaded inline hint */}
            {!msg.isLoading && !isUser && msg.overloaded && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] mt-1"
                style={{
                  background: 'rgba(251,191,36,0.07)',
                  border: '1px solid rgba(251,191,36,0.2)',
                  color: 'rgba(251,191,36,0.75)',
                }}
              >
                <span style={{ fontSize: 13 }}>⏳</span>
                Sapien is a bit overworked right now — give it a moment before introducing new goals.
              </div>
            )}

            {!msg.isLoading && !isError && (
              <SignalControls msg={msg} onSignal={(s) => onSignal(msg.id, s)} />
            )}
          </>
        )}

        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-white/18 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(msg.timestamp)}
          </span>
          {!msg.isLoading && !isUser && msg.content && <CopyBtn text={msg.content} />}
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ name, onHint }: { name: string; onHint: (h: string) => void }) {
  const hints = [
    'What have you learned so far?',
    'Summarize uploaded documents.',
    'What patterns do you see?',
    'Explain your understanding.',
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 select-none text-center">
      <div className="relative mb-6">
        <div className="absolute inset-[-20px] rounded-3xl border border-violet-500/15 animate-ping opacity-25"
          style={{ animationDuration: '3.5s' }} />
        <div className="absolute inset-[-10px] rounded-2xl border border-violet-500/20" />
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.18))',
            border: '1px solid rgba(124,58,237,0.35)',
            boxShadow: '0 0 40px rgba(124,58,237,0.2)',
          }}>
          <Brain className="w-8 h-8 text-violet-300" />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: '#060a15', border: '2px solid #060a15' }}>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"
            style={{ boxShadow: '0 0 8px rgba(52,211,153,0.6)' }} />
        </div>
      </div>

      <p className="text-white/75 mb-2">Chat with{' '}
        <span style={{ background: 'linear-gradient(90deg, #c4b5fd, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {name}
        </span>
      </p>
      <p className="text-xs text-white/28 mb-7 max-w-[260px] leading-relaxed">
        Ask questions or trigger the cognitive engine after uploading documents.
      </p>

      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {hints.map((h) => (
          <button key={h} onClick={() => onHint(h)}
            className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-left text-[11px] leading-relaxed text-white/35
              hover:text-white/75 transition-all duration-200 group"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
          >
            <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0 text-violet-400/40 group-hover:text-violet-400/80 transition-colors" />
            {h}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatHistorySidebar({ history, historyLoading, historyError, detailLoading, isProcessing, chatSessionId, onRefresh, onNewChat, onSelectChat }: {
  history: ChatHistoryItem[]; historyLoading: boolean; historyError: string | null; detailLoading: boolean;
  isProcessing: boolean; chatSessionId: string | null; onRefresh: () => void; onNewChat: () => void;
  onSelectChat: (threadId: string) => void;
}) {
  return <>
    <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-white/[0.08]">
      <div><p className="text-sm font-semibold text-white/90">Chat history</p><p className="text-xs text-white/40">Continue a conversation</p></div>
      <button onClick={onRefresh} disabled={historyLoading} title="Refresh history" aria-label="Refresh chat history" className="p-2 rounded-lg text-white/50 hover:text-violet-200 hover:bg-white/[0.08] disabled:opacity-40">
        <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
      </button>
    </div>
    <div className="p-2">
      <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg shadow-violet-950/30">
        <Plus className="w-4 h-4" /> New chat
      </button>
    </div>
    {historyError && <p className="mx-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">{historyError}</p>}
    <div className="flex-1 min-h-0 overflow-y-auto p-2 pt-1">
      {historyLoading && history.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/50"><Loader2 className="w-4 h-4 animate-spin" /> Loading chats…</div>
      ) : history.length === 0 ? (
        <div className="px-3 py-10 text-center"><History className="mx-auto mb-3 h-6 w-6 text-violet-300/60" /><p className="text-sm text-white/60">No saved chats yet.</p><p className="mt-1 text-xs text-white/40">Your conversations will appear here.</p></div>
      ) : history.map((chat) => (
        <button key={chat.thread_id} onClick={() => onSelectChat(chat.thread_id)} disabled={detailLoading || isProcessing}
          className="mb-1 w-full rounded-xl px-3 py-3 text-left hover:bg-violet-500/10 disabled:opacity-50 transition-colors"
          style={chat.thread_id === chatSessionId ? { background: 'rgba(124,58,237,0.16)', border: '1px solid rgba(139,92,246,0.35)' } : { border: '1px solid transparent' }}>
          <span className="block truncate text-sm font-medium text-white/80">{chat.title || 'Untitled chat'}</span>
          <span className="mt-1.5 flex items-center justify-between gap-2 text-xs text-white/40"><span>{new Date(chat.updated_at).toLocaleDateString()}</span><span>{chat.message_count} messages</span></span>
        </button>
      ))}
    </div>
  </>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function ChatWindow() {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);

  const { sendTextInput, sendUserSignal, sendQuery, loadChat, startNewChat } = useSapiens();
  const msgs = useSapiensStore((s) => s.chatMessages);
  const currentSapiens = useSapiensStore((s) => s.currentSapiens);
  const chatSessionId = useSapiensStore((s) => s.chatSessionId);
  const status = useSapiensStore((s) => s.status);
  const jumpToMessageId = useSapiensStore((s) => s.jumpToMessageId);
  const setJumpToMessageId = useSapiensStore((s) => s.setJumpToMessageId);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const atBottomRef = useRef(true);

  const isProcessing = status === 'processing';

  const refreshHistory = useCallback(async () => {
    if (!currentSapiens) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const result = await sapiensService.getChatHistory(currentSapiens.id);
      setHistory(result.chats ?? []);
    } catch (error) {
      setHistoryError((error as ApiError).message || 'Could not load chat history.');
    } finally {
      setHistoryLoading(false);
    }
  }, [currentSapiens]);

  useEffect(() => {
    startNewChat();
    setHistory([]);
    setHistoryOpen(false);
    void refreshHistory();
  }, [currentSapiens?.id]); // Reset the conversation when the selected sapien changes.

  const selectChat = async (threadId: string) => {
    if (detailLoading || isProcessing) return;
    setDetailLoading(true);
    setHistoryError(null);
    try {
      await loadChat(threadId);
      setHistoryOpen(false);
      atBottomRef.current = true;
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 404) {
        startNewChat();
        setHistory((items) => items.filter((item) => item.thread_id !== threadId));
        setHistoryError('That chat is no longer available. A new chat is ready.');
      } else {
        setHistoryError(apiError.message || 'Could not open this chat.');
      }
    } finally {
      setDetailLoading(false);
    }
  };

  const scrollToBottom = useCallback((smooth = true) => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    atBottomRef.current = dist < 80;
    setShowScroll(dist > 120);
  };

  useEffect(() => {
    if (atBottomRef.current) scrollToBottom();
    else setShowScroll(true);
  }, [msgs, scrollToBottom]);

  useEffect(() => {
    if (msgs.length === 1) scrollToBottom(false);
  }, [msgs.length, scrollToBottom]);

  // Jump-to-message from Memory Timeline
  useEffect(() => {
    if (!jumpToMessageId) return;
    const el = scrollRef.current?.querySelector(`[data-message-id="${jumpToMessageId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedId(jumpToMessageId);
      setTimeout(() => setHighlightedId(null), 2500);
    }
    setJumpToMessageId(null);
  }, [jumpToMessageId, setJumpToMessageId]);

  const send = async (mode: 'chat' | 'query' = 'chat') => {
    const t = input.trim();
    if (!t || isProcessing) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    atBottomRef.current = true;
    setShowScroll(false);
    if (mode === 'query') {
      await sendQuery(t);
    } else {
      await sendTextInput(t);
      await refreshHistory();
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send('chat');
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const handleSignal = async (messageId: string, signal: UserSignalType) => {
    const msg = msgs.find((m) => m.id === messageId);
    await sendUserSignal(messageId, signal, msg?.content);
  };

  const userCount = msgs.filter((m) => m.role === 'user').length;

  return (
    <div className="h-full flex rounded-2xl overflow-hidden relative"
      style={{
        background: 'rgba(8,12,22,0.85)',
        border: '1px solid rgba(124,58,237,0.22)',
        boxShadow: '0 0 0 1px rgba(124,58,237,0.08), inset 0 1px 0 rgba(124,58,237,0.15), 0 30px 60px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(24px)',
      }}
    >
      <aside className="hidden lg:flex w-60 xl:w-64 flex-shrink-0 flex-col border-r border-white/[0.08] bg-black/20">
        <ChatHistorySidebar history={history} historyLoading={historyLoading} historyError={historyError}
          detailLoading={detailLoading} isProcessing={isProcessing} chatSessionId={chatSessionId}
          onRefresh={() => void refreshHistory()} onNewChat={startNewChat} onSelectChat={(id) => void selectChat(id)} />
      </aside>
      <div className="min-w-0 flex-1 flex flex-col relative">
      {/* Violet top accent */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #7c3aed, #4f46e5, #7c3aed)', flexShrink: 0 }} />

      {/* ── Header ── */}
      <div className="flex-shrink-0 relative flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(124,58,237,0.07)', borderBottom: '1px solid rgba(124,58,237,0.12)' }}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.35)' }}>
            <Brain className="w-4 h-4 text-violet-300" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white/85">{currentSapiens?.name ?? 'Sapiens'}</p>
            <p className="text-[10px] text-violet-400/50">Cognitive Chat Interface</p>
          </div>
          {msgs.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] tabular-nums flex-shrink-0"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)', color: '#c4b5fd' }}>
              {userCount} msg{userCount !== 1 ? 's' : ''}
            </span>
          )}
          {chatSessionId && (
            <span
              className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono flex-shrink-0"
              style={{
                background: 'rgba(6,182,212,0.07)',
                border: '1px solid rgba(6,182,212,0.15)',
                color: 'rgba(6,182,212,0.55)',
              }}
            >
              #{chatSessionId.slice(0, 10)}…
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isProcessing && (
            <span className="flex items-center gap-1.5 text-[11px] text-violet-300/70">
              <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
            </span>
          )}
          {msgs.length > 0 && (
            <button onClick={startNewChat}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-white/20
                hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/15">
              <Plus className="w-3 h-3" /> New
            </button>
          )}
          <button onClick={() => setHistoryOpen((open) => !open)}
            className="flex lg:hidden items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-white/35 hover:text-violet-300 hover:bg-violet-500/10 transition-all border border-white/[0.06]">
            <History className="w-3 h-3" /> History
          </button>
        </div>

        {historyOpen && (
          <div className="absolute lg:hidden z-30 top-[calc(100%+6px)] right-3 left-3 sm:left-auto sm:w-80 rounded-xl overflow-hidden"
            style={{ background: 'rgba(10,14,26,0.98)', border: '1px solid rgba(124,58,237,0.28)', boxShadow: '0 18px 45px rgba(0,0,0,0.55)', backdropFilter: 'blur(18px)' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
              <span className="text-xs text-white/65">Recent chats</span>
              <div className="flex items-center gap-1">
                <button onClick={() => void refreshHistory()} disabled={historyLoading} title="Refresh history"
                  className="p-1.5 rounded-md text-white/30 hover:text-violet-300 hover:bg-white/[0.06] disabled:opacity-40">
                  <RefreshCw className={`w-3 h-3 ${historyLoading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => { startNewChat(); setHistoryOpen(false); }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-violet-300 bg-violet-500/10 hover:bg-violet-500/20">
                  <Plus className="w-3 h-3" /> New chat
                </button>
              </div>
            </div>
            {historyError && <p className="px-3 py-2 text-[10px] text-red-300/80 border-b border-red-500/10">{historyError}</p>}
            <div className="max-h-72 overflow-y-auto p-1.5">
              {historyLoading && history.length === 0 ? (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-white/30"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading chats…</div>
              ) : history.length === 0 ? (
                <p className="py-8 text-center text-xs text-white/25">No saved chats yet.</p>
              ) : history.map((chat) => (
                <button key={chat.thread_id} onClick={() => void selectChat(chat.thread_id)} disabled={detailLoading || isProcessing}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-violet-500/10 disabled:opacity-50 transition-colors"
                  style={chat.thread_id === chatSessionId ? { background: 'rgba(124,58,237,0.13)', border: '1px solid rgba(124,58,237,0.2)' } : { border: '1px solid transparent' }}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-xs text-white/70">{chat.title || 'Untitled chat'}</span>
                    <span className="flex-shrink-0 text-[9px] text-white/25">{chat.message_count} msgs</span>
                  </div>
                  <p className="mt-1 text-[9px] text-white/25">{new Date(chat.updated_at).toLocaleString()}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(8,12,22,0.6), transparent)' }} />
        <div ref={scrollRef} onScroll={handleScroll}
          className="h-full overflow-y-auto px-5 py-5 space-y-5">
          {msgs.length === 0
            ? <EmptyState name={currentSapiens?.name ?? 'Sapiens'} onHint={(h) => { setInput(h); textareaRef.current?.focus(); }} />
            : (
              <>
                {msgs.map((m) => (
                  <MessageBubble
                    key={m.id}
                    msg={m}
                    onSignal={handleSignal}
                    isHighlighted={highlightedId === m.id}
                  />
                ))}
                <div className="h-2" />
              </>
            )
          }
        </div>
        {showScroll && (
          <button onClick={() => { atBottomRef.current = true; setShowScroll(false); scrollToBottom(); }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105"
            style={{ background: 'rgba(8,12,22,0.9)', border: '1px solid rgba(124,58,237,0.3)', color: '#c4b5fd', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
            <ChevronDown className="w-3 h-3" /> Latest
          </button>
        )}
      </div>

      {/* ── Input area ── */}
      <div className="flex-shrink-0 relative p-3" style={{ background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {attachmentsOpen && (
          <div
            className="absolute z-30 bottom-[calc(100%-4px)] left-3 right-3 sm:right-auto sm:w-[390px] h-[min(30rem,70vh)] rounded-2xl"
            style={{ boxShadow: '0 22px 60px rgba(0,0,0,0.65)' }}
          >
            <button
              onClick={() => setAttachmentsOpen(false)}
              title="Close attachments"
              aria-label="Close attachments"
              className="absolute z-40 right-3 top-3 w-7 h-7 rounded-lg flex items-center justify-center text-white/35 hover:text-white/75 hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <CombinedInputPanel />
          </div>
        )}
        <div className="flex items-end gap-2 rounded-xl p-1.5 transition-all duration-200"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${focused ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.07)'}`,
            boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.07)' : 'none',
          }}>
          <button
            onClick={() => setAttachmentsOpen((open) => !open)}
            disabled={isProcessing}
            title="Attach files or a folder"
            aria-label="Attach files or a folder"
            aria-expanded={attachmentsOpen}
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-35"
            style={{
              background: attachmentsOpen ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${attachmentsOpen ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.07)'}`,
              color: attachmentsOpen ? '#6ee7b7' : 'rgba(255,255,255,0.38)',
            }}
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea ref={textareaRef} value={input} onChange={onInputChange} onKeyDown={onKey}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder={isProcessing ? 'Waiting for response…' : 'Ask Sapiens anything…'}
            disabled={isProcessing} rows={1}
            className="flex-1 resize-none overflow-hidden bg-transparent border-none outline-none
              min-h-[36px] max-h-[140px] px-2 py-2 text-sm text-white/80 placeholder:text-white/20
              leading-relaxed disabled:opacity-40"
            style={{ height: 'auto' }}
          />

          {/* Query button — /api/query */}
          <button
            onClick={() => send('query')}
            disabled={!input.trim() || isProcessing}
            title="Send via /api/query (legacy)"
            className="flex-shrink-0 flex items-center gap-1.5 px-3 h-9 rounded-lg text-[11px] font-medium transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
            style={{
              background: input.trim() && !isProcessing ? 'rgba(6,182,212,0.18)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${input.trim() && !isProcessing ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.07)'}`,
              color: input.trim() && !isProcessing ? '#67e8f9' : 'rgba(255,255,255,0.2)',
              opacity: !input.trim() || isProcessing ? 0.4 : 1,
            }}
          >
            <Search className="w-3.5 h-3.5" />
            Query
          </button>

          {/* Chat button — /api/chat */}
          <button
            onClick={() => send('chat')}
            disabled={!input.trim() || isProcessing}
            title="Send via /api/chat (Enter)"
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
            style={{
              background: input.trim() && !isProcessing ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.05)',
              boxShadow: input.trim() && !isProcessing ? '0 0 20px rgba(124,58,237,0.35)' : 'none',
              opacity: !input.trim() || isProcessing ? 0.3 : 1,
            }}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
