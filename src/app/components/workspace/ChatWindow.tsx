import { ConversationHistory } from './ConversationHistory';
import { useRememberedState } from '../navigation/NavigationState';
import { ScienceDetail } from '../customer/ScienceDetail';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Brain, User, AlertCircle,
  Loader2, ChevronDown, Sparkles, Copy, Check,
  ThumbsUp, ThumbsDown, Star, BookMarked, MinusCircle,
  Database, ChevronRight,
  History, Plus, PanelLeftOpen,
  Paperclip, X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { resourceSession } from '../../core/auth/authSession';
import { useSapiens } from '../../hooks/useSapiens';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { sapiensService } from '../../core/services/sapiensService';
import { formatTime } from '../../utils/formatters';
import { ChatHistoryItem, ChatMessage, UserSignalType } from '../../types/sapiensTypes';
import { ApiError } from '../../types/apiTypes';
import { CombinedInputPanel } from './CombinedInputPanel';
import { SapiensPresence } from '../customer/SapiensPresence';

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-0.5">
      {[0, 160, 320].map((d) => (
        <span key={d} className="w-1.5 h-1.5 rounded-full bg-sp-accent/70 animate-bounce"
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
      className="opacity-100 transition-opacity flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px]
        text-sp-muted hover:text-sp-ink hover:bg-sp-ink/10 border border-transparent hover:border-sp-line"
    >
      {copied ? <Check className="w-2.5 h-2.5 text-sp-success" /> : <Copy className="w-2.5 h-2.5" />}
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
          <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--sp-warning, rgba(245,158,11,0.7))' }}>
            <Database className="w-2.5 h-2.5" />
            {memCount} memor{memCount !== 1 ? 'ies' : 'y'} used
          </span>
        )}
        {ctxCount > 0 && (
          <>
            {memCount > 0 && <span style={{ color: 'var(--sp-muted, rgb(var(--sp-ink-rgb, 255 255 255) / 0.1))' }}>·</span>}
            <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--sp-accent, rgb(var(--sp-accent-rgb, 6 182 212) / 0.65))' }}>
              <Brain className="w-2.5 h-2.5" />
              {ctxCount} context
            </span>
          </>
        )}
        {memCount > 0 && (
          <button
            onClick={() => setShowIds(!showIds)}
            className="flex items-center gap-0.5 text-[9px] ml-auto transition-colors"
            style={{ color: 'var(--sp-warning, rgba(245,158,11,0.4))' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--sp-warning, rgba(245,158,11,0.75))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--sp-warning, rgba(245,158,11,0.4))'; }}
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
                color: 'var(--sp-warning, rgba(252,211,77,0.65))',
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
  { id: 'thumbs_up',    icon: <ThumbsUp   className="w-3 h-3" />, label: 'Helpful',      color: 'var(--sp-success, #34d399)' },
  { id: 'thumbs_down',  icon: <ThumbsDown  className="w-3 h-3" />, label: 'Not helpful',  color: 'var(--sp-danger, #f87171)' },
  { id: 'important',    icon: <Star        className="w-3 h-3" />, label: 'Important',    color: 'var(--sp-warning, #fbbf24)' },
  { id: 'remember',     icon: <BookMarked  className="w-3 h-3" />, label: 'Remember',     color: 'var(--sp-accent, #a78bfa)' },
  { id: 'not_relevant', icon: <MinusCircle className="w-3 h-3" />, label: 'Not relevant', color: 'var(--sp-muted, #64748b)' },
];

function SignalControls({ msg, onSignal }: { msg: ChatMessage; onSignal: (s: UserSignalType) => void }) {
  const active = msg.userSignal;

  return (
    <div className="flex items-center gap-1 mt-0.5 opacity-100 transition-opacity">
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
                    background: `color-mix(in srgb, ${s.color} 9.41%, transparent)`,
                    border: `1px solid color-mix(in srgb, ${s.color} 27.06%, transparent)`,
                    color: s.color,
                  }
                : {
                    padding: '3px 6px',
                    background: 'transparent',
                    border: '1px solid transparent',
                    color: 'var(--sp-muted, rgb(var(--sp-ink-rgb, 255 255 255) / 0.22))',
                  }
            }
            onMouseEnter={e => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = `color-mix(in srgb, ${s.color} 7.06%, transparent)`;
                (e.currentTarget as HTMLElement).style.borderColor = `color-mix(in srgb, ${s.color} 20.78%, transparent)`;
                (e.currentTarget as HTMLElement).style.color = s.color;
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--sp-muted, rgb(var(--sp-ink-rgb, 255 255 255) / 0.22))';
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

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({
  msg, onSignal, isHighlighted,
}: {
  msg: ChatMessage;
  onSignal: (id: string, s: UserSignalType) => void;
  isHighlighted: boolean;
}) {
  const { user } = useAuth();
  const isUser = msg.role === 'user';
  const isError = !msg.isLoading && msg.role === 'assistant' && (msg.isError || (msg.content ?? '').startsWith('An error occurred'));

  return (
    <div
      data-message-id={msg.id}
      className={`flex gap-3 group transition-all duration-500 rounded-2xl ${isUser ? 'flex-row-reverse' : ''}`}
      style={
        isHighlighted
          ? { background: 'rgb(var(--sp-accent-rgb, 124 58 237) / 0.08)', padding: '8px', margin: '-8px', boxShadow: '0 0 0 1px rgb(var(--sp-accent-rgb, 124 58 237) / 0.2)' }
          : undefined
      }
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {isUser ? (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'var(--sp-action, #7434ce)', boxShadow: 'none' }}
          >
            <User className="w-3.5 h-3.5 text-sp-on-action" />
          </div>
        ) : isError ? (
          <div className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <AlertCircle className="w-3.5 h-3.5 text-sp-danger" />
          </div>
        ) : (
          <SapiensPresence size={28} tone="orange" />
        )}
      </div>

      {/* Bubble + metadata */}
      <div className={`flex flex-col gap-1 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        {isUser ? (
          <div
            className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed text-sp-ink"
            style={{ background: 'var(--sp-recessed)', border: '1px solid var(--sp-line)' }}
          >
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
          </div>
        ) : (
          <>
            <div
              role={isError ? 'alert' : undefined}
              className={`px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed ${isError ? 'text-sp-danger' : 'text-sp-ink'}`}
              style={isError
                ? { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }
                : { background: 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.05)', border: '1px solid rgb(var(--sp-ink-rgb, 255 255 255) / 0.1)', backdropFilter: 'blur(8px)' }
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
                  color: 'var(--sp-warning, rgba(251,191,36,0.75))',
                }}
              >
                <span style={{ fontSize: 13 }}>⏳</span>
                Sapien is a bit overworked right now — give it a moment before introducing new goals.
              </div>
            )}

            {user?.role === 'admin' && !msg.isLoading && !isError && (
              <SignalControls msg={msg} onSignal={(s) => onSignal(msg.id, s)} />
            )}
          </>
        )}

        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-sp-muted font-mono opacity-100 transition-opacity">
            {formatTime(msg.timestamp)}
          </span>
          {!msg.isLoading && !isUser && msg.content && <CopyBtn text={msg.content} />}
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ name, onHint, recent, onResume, loading }: { name: string; onHint: (h: string) => void; recent?: ChatHistoryItem; onResume: () => void; loading: boolean }) {
  const hints = [
    'I have an idea I’d like to explore.',
    'Help me think through a question.',
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-5 py-5 text-center">
      <div className="workspace-welcome-art"><ScienceDetail variant="surround" /><SapiensPresence tone="orange" size={70} animated /></div>

      <p className="workspace-welcome-title">{recent ? 'Continue with' : 'Talk with'}{' '}
        <span style={{ background: 'linear-gradient(90deg, var(--sp-accent, #c4b5fd), var(--sp-accent, #a5b4fc))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {name}
        </span>
      </p>
      <p className="text-sm text-sp-muted mb-5 max-w-[340px] leading-relaxed">
        {recent ? "Pick up a conversation, or start with something new." : "Share an idea, ask a question, or tell your Sapien what matters to you."}
      </p>

      {recent && <button className="workspace-resume" onClick={onResume} disabled={loading}><span>Continue your last conversation <span aria-hidden="true">→</span></span><small>{recent.title || 'Untitled conversation'}</small></button>}
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {hints.map((h) => (
          <button key={h} onClick={() => onHint(h)}
            className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-left text-sm leading-relaxed text-sp-muted
              hover:text-sp-ink transition-all duration-200 group"
            style={{ background: 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.03)', border: '1px solid rgb(var(--sp-ink-rgb, 255 255 255) / 0.07)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--sp-accent-rgb, 124 58 237) / 0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.07)'; }}
          >
            <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0 text-sp-accent group-hover:text-sp-accent transition-colors" />
            {h}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function ChatWindow() {
  const { user } = useAuth();
  const sending = useRef(false);
  const draftSapienId = useSapiensStore(state => state.currentSapiens?.id);
  const [input, setInput] = useRememberedState(`conversation:${draftSapienId}:draft`, '');
  const [focused, setFocused] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyCollapsed, setHistoryCollapsed] = useRememberedState(`conversation:${draftSapienId}:collapsed`, false);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);

  const { sendTextInput, sendUserSignal, loadChat, startNewChat } = useSapiens();
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
        if (user?.role === 'admin') startNewChat();
        setHistory((items) => items.filter((item) => item.thread_id !== threadId));
        setHistoryError(user?.role === 'admin' ? 'That chat is no longer available. A new chat is ready.' : 'That conversation is unavailable. Your current conversation is unchanged.');
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

  const send = async () => {
    const t = input.trim();
    if (!t || isProcessing || sending.current) return;
    sending.current = true;
    const version = resourceSession.version;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    atBottomRef.current = true;
    setShowScroll(false);
    const sent = await sendTextInput(t);
    if (resourceSession.version === version) {
      if (sent === false && user?.role !== 'admin') setInput(t);
      await refreshHistory();
    }
    sending.current = false;
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
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

  const latestChat = [...history].sort((a,b) => (Date.parse(b.updated_at) || 0) - (Date.parse(a.updated_at) || 0))[0];

  return (
    <div className="workspace-conversation h-full flex rounded-2xl overflow-hidden relative"
      style={{
        background: 'rgb(var(--sp-panel-rgb, 8 12 22) / 0.85)',
        border: '1px solid rgb(var(--sp-accent-rgb, 124 58 237) / 0.22)',
        boxShadow: '0 0 0 1px rgb(var(--sp-accent-rgb, 124 58 237) / 0.08), inset 0 1px 0 rgb(var(--sp-accent-rgb, 124 58 237) / 0.15), 0 30px 60px rgb(var(--sp-shadow-rgb, 0 0 0) / var(--sp-shadow-opacity, 0.5))',
        backdropFilter: 'blur(24px)',
      }}
    >
      <aside className={`workspace-history ${historyCollapsed ? 'is-collapsed' : ''}`}>
        {historyCollapsed ? (
          <div className="flex h-full flex-col items-center gap-2 py-3">
            <button onClick={() => setHistoryCollapsed(false)} title="Expand chat history" aria-label="Expand chat history" className="p-2.5 rounded-xl text-sp-accent bg-sp-accent/10 hover:bg-sp-accent/20 border border-sp-accent/20">
              <PanelLeftOpen className="w-4 h-4" />
            </button>
            <button onClick={startNewChat} disabled={isProcessing || detailLoading} title="New chat" aria-label="New chat" className="p-2.5 rounded-xl text-sp-ink hover:text-sp-ink hover:bg-sp-ink/[0.08]">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : <ConversationHistory history={history} historyLoading={historyLoading} historyError={historyError}
          detailLoading={detailLoading} isProcessing={isProcessing} chatSessionId={chatSessionId}
          onRefresh={() => void refreshHistory()} onNewChat={startNewChat} onSelectChat={(id) => void selectChat(id)} onCollapse={() => setHistoryCollapsed(true)} />}
      </aside>
      <div className="min-w-0 flex-1 flex flex-col relative">
      <div className="workspace-chat-heading">
        <div><h2>Conversation</h2><p>With {currentSapiens?.name ?? 'Sapiens'}</p></div>
        <div className="flex items-center gap-2">
          {isProcessing && <span className="text-sm text-sp-muted"><Loader2 size={14} className="inline animate-spin" /> Processing…</span>}
          <button onClick={() => setHistoryOpen(open => !open)} aria-expanded={historyOpen} className="workspace-history-toggle"><History size={16} />History</button>
        </div>
        {historyOpen && <div className="workspace-history-popover" onKeyDown={e => { if (e.key === 'Escape') { setHistoryOpen(false); e.currentTarget.parentElement?.querySelector<HTMLButtonElement>('.workspace-history-toggle')?.focus(); } }}>
          <ConversationHistory history={history} historyLoading={historyLoading} historyError={historyError} detailLoading={detailLoading} isProcessing={isProcessing} chatSessionId={chatSessionId} onRefresh={() => void refreshHistory()} onNewChat={() => { startNewChat(); setHistoryOpen(false); }} onSelectChat={id => void selectChat(id)} onCollapse={() => setHistoryOpen(false)} />
        </div>}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute top-0 left-0 right-0 h-8 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgb(var(--sp-panel-rgb, 8 12 22) / 0.6), transparent)' }} />
        <div ref={scrollRef} onScroll={handleScroll}
          className="workspace-scrollbar h-full overflow-y-auto px-5 py-5 space-y-5">
          {msgs.length === 0
            ? <EmptyState name={currentSapiens?.name ?? 'Sapiens'} recent={latestChat} onResume={() => latestChat && void selectChat(latestChat.thread_id)} loading={detailLoading || isProcessing} onHint={(h) => { setInput(h); textareaRef.current?.focus(); }} />
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
            style={{ background: 'rgb(var(--sp-panel-rgb, 8 12 22) / 0.9)', border: '1px solid rgb(var(--sp-accent-rgb, 124 58 237) / 0.3)', color: 'var(--sp-accent, #c4b5fd)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgb(var(--sp-shadow-rgb, 0 0 0) / var(--sp-shadow-opacity, 0.4))' }}>
            <ChevronDown className="w-3 h-3" /> Latest
          </button>
        )}
      </div>

      {/* ── Input area ── */}
      <div className="flex-shrink-0 relative p-3" style={{ background: 'var(--sp-recessed, rgba(0,0,0,0.25))', borderTop: '1px solid rgb(var(--sp-ink-rgb, 255 255 255) / 0.05)' }}>
        {attachmentsOpen && (
          <div
            className="absolute z-30 bottom-[calc(100%-4px)] left-3 right-3 sm:right-auto sm:w-[390px] h-[min(30rem,70vh)] rounded-2xl"
            style={{ boxShadow: '0 22px 60px rgb(var(--sp-shadow-rgb, 0 0 0) / var(--sp-shadow-opacity, 0.65))' }}
          >
            <button
              onClick={() => setAttachmentsOpen(false)}
              title="Close attachments"
              aria-label="Close attachments"
              className="absolute z-40 right-3 top-3 w-7 h-7 rounded-lg flex items-center justify-center text-sp-muted hover:text-sp-ink hover:bg-sp-ink/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <CombinedInputPanel />
          </div>
        )}
        <div className="flex items-end gap-2 rounded-xl p-1.5 transition-all duration-200"
          style={{
            background: 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.03)',
            border: `1px solid ${focused ? 'rgb(var(--sp-accent-rgb, 124 58 237) / 0.45)' : 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.07)'}`,
            boxShadow: focused ? '0 0 0 3px rgb(var(--sp-accent-rgb, 124 58 237) / 0.07)' : 'none',
          }}>
          <button
            onClick={() => setAttachmentsOpen((open) => !open)}
            disabled={isProcessing}
            title="Attach files or a folder"
            aria-label="Attach files or a folder"
            aria-expanded={attachmentsOpen}
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-35"
            style={{
              background: attachmentsOpen ? 'rgba(16,185,129,0.14)' : 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.04)',
              border: `1px solid ${attachmentsOpen ? 'rgba(16,185,129,0.35)' : 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.07)'}`,
              color: attachmentsOpen ? 'var(--sp-success, #6ee7b7)' : 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.38)',
            }}
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea ref={textareaRef} value={input} onChange={onInputChange} onKeyDown={onKey}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            placeholder={isProcessing ? 'Waiting for response…' : `Message ${currentSapiens?.name ?? 'Sapiens'}…`}
            aria-label={`Message ${currentSapiens?.name ?? 'Sapiens'}`}
            disabled={isProcessing} rows={1}
            className="flex-1 resize-none overflow-y-auto bg-transparent border-none outline-none
              min-h-[36px] max-h-[140px] px-2 py-2 text-sm text-sp-ink placeholder:text-sp-muted
              leading-relaxed disabled:opacity-40"
            style={{ height: 'auto' }}
          />

          {/* Chat button — /api/chat */}
          <button
            onClick={() => send()}
            disabled={!input.trim() || isProcessing}
            title="Send message (Enter)" aria-label="Send message"
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-95 disabled:cursor-not-allowed"
            style={{
              background: input.trim() && !isProcessing ? 'var(--sp-action, #7434ce)' : 'rgb(var(--sp-ink-rgb, 255 255 255) / 0.05)',
              boxShadow: input.trim() && !isProcessing ? '0 0 20px rgb(var(--sp-accent-rgb, 124 58 237) / 0.35)' : 'none',
              opacity: !input.trim() || isProcessing ? 0.3 : 1,
            }}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 text-sp-muted animate-spin" /> : <Send className={input.trim() ? 'w-4 h-4 text-sp-on-action' : 'w-4 h-4 text-sp-muted'} />}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
