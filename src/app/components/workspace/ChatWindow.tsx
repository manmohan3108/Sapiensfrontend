import { useState, useRef, useEffect } from 'react';
import {
  Send, Trash2, Brain, User, AlertCircle, Loader2, ChevronDown, Sparkles,
} from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { useSapiens } from '../../hooks/useSapiens';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { formatTime } from '../../utils/formatters';
import { ChatMessage } from '../../types/sapiensTypes';

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 180, 360].map((d) => (
        <span
          key={d}
          className="w-1.5 h-1.5 rounded-full bg-violet-400/70 animate-bounce"
          style={{ animationDelay: `${d}ms`, animationDuration: '1.2s' }}
        />
      ))}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isError =
    !message.isLoading &&
    message.role === 'assistant' &&
    message.content.startsWith('An error occurred');

  return (
    <div className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/30">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
        ) : isError ? (
          <div className="w-7 h-7 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 flex items-center justify-center shadow-sm">
            <Brain className="w-3.5 h-3.5 text-violet-300/80" />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-1 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        {isUser ? (
          <div className="px-4 py-2.5 rounded-2xl rounded-tr-sm bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-sm leading-relaxed shadow-lg shadow-violet-500/20">
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          </div>
        ) : (
          <div
            className={`px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed border
              ${isError
                ? 'bg-red-500/10 border-red-500/20 text-red-300'
                : 'border-white/10 text-white/85'
              }`}
            style={!isError ? { background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' } : {}}
          >
            {message.isLoading ? (
              <TypingIndicator />
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
          </div>
        )}
        <span className="text-[10px] text-white/20 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ─── Empty / welcome state ────────────────────────────────────────────────────
function EmptyState({ sapiensName, onHint }: { sapiensName: string; onHint: (h: string) => void }) {
  const hints = [
    'What have you learned so far?',
    'Summarize the uploaded documents.',
    'What patterns do you see?',
    'Explain your current understanding.',
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 select-none">
      {/* Animated brain icon */}
      <div className="relative mb-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center border border-violet-500/20 shadow-xl shadow-violet-500/10"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(79,70,229,0.15) 100%)' }}
        >
          <Brain className="w-8 h-8 text-violet-300" />
        </div>
        {/* Outer ring */}
        <div className="absolute inset-[-6px] rounded-[18px] border border-violet-500/10 animate-ping opacity-40" />
        {/* Online dot */}
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#080d1a] flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </div>
      </div>

      <h3 className="text-white/80 mb-1">
        Talk to{' '}
        <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
          {sapiensName}
        </span>
      </h3>
      <p className="text-xs text-white/30 mb-6 max-w-xs">
        Ask questions, explore knowledge, or trigger the cognitive engine to process what's been uploaded.
      </p>

      {/* Hint chips */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {hints.map((hint) => (
          <button
            key={hint}
            onClick={() => onHint(hint)}
            className="px-3 py-2.5 rounded-xl text-left text-[11px] text-white/40 hover:text-white/80 border border-white/[0.07] hover:border-violet-500/30 transition-all duration-200 group"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <Sparkles className="w-3 h-3 mb-1 text-violet-400/40 group-hover:text-violet-400/70 transition-colors" />
            {hint}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Scroll-to-bottom pill ────────────────────────────────────────────────────
function ScrollPill({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-3 right-3 z-10 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs text-white/60 hover:text-white border border-white/10 hover:border-violet-500/40 shadow-lg transition-all"
      style={{ background: 'rgba(10,14,28,0.85)', backdropFilter: 'blur(12px)' }}
    >
      <ChevronDown className="w-3 h-3" />
      Latest
    </button>
  );
}

// ─── Main ChatWindow ──────────────────────────────────────────────────────────
export function ChatWindow() {
  const [input, setInput] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { sendTextInput } = useSapiens();
  const chatMessages = useSapiensStore((s) => s.chatMessages);
  const clearChatMessages = useSapiensStore((s) => s.clearChatMessages);
  const currentSapiens = useSapiensStore((s) => s.currentSapiens);
  const status = useSapiensStore((s) => s.status);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isAtBottomRef = useRef(true);

  const isProcessing = status === 'processing';
  const hasMessages = chatMessages.length > 0;

  const scrollToBottom = (smooth = true) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    isAtBottomRef.current = dist < 80;
    setShowScrollBtn(dist > 120);
  };

  useEffect(() => {
    if (isAtBottomRef.current) scrollToBottom();
    else setShowScrollBtn(true);
  }, [chatMessages]);

  useEffect(() => {
    if (chatMessages.length === 1) scrollToBottom(false);
  }, [chatMessages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isProcessing) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    isAtBottomRef.current = true;
    setShowScrollBtn(false);
    await sendTextInput(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  };

  const handleHint = (hint: string) => {
    setInput(hint);
    textareaRef.current?.focus();
  };

  const userMsgCount = chatMessages.filter((m) => m.role === 'user').length;

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/40"
      style={{ background: 'rgba(10,14,28,0.75)', backdropFilter: 'blur(20px)' }}
    >
      {/* ── Header ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/[0.07]"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/30 to-indigo-500/20 border border-violet-500/25 flex items-center justify-center">
              <Brain className="w-4 h-4 text-violet-300" />
            </div>
          </div>
          <div>
            <p className="text-sm text-white/80 leading-none">
              {currentSapiens?.name ?? 'Sapiens'}
            </p>
            <p className="text-[10px] text-white/25 mt-0.5">Cognitive Chat Interface</p>
          </div>

          {hasMessages && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/30 tabular-nums">
              {userMsgCount} {userMsgCount === 1 ? 'message' : 'messages'}
            </span>
          )}

          {isProcessing && (
            <span className="flex items-center gap-1.5 text-[11px] text-violet-300">
              <Loader2 className="w-3 h-3 animate-spin" />
              Thinking…
            </span>
          )}
        </div>

        {hasMessages && (
          <button
            onClick={clearChatMessages}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] text-white/30 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 min-h-0 relative">
        {/* Fade at top when scrolled */}
        <div
          className="absolute top-0 left-0 right-0 h-6 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(10,14,28,0.6), transparent)' }}
        />
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-5 py-5 space-y-5"
        >
          {!hasMessages ? (
            <EmptyState sapiensName={currentSapiens?.name ?? 'Sapiens'} onHint={handleHint} />
          ) : (
            <>
              {chatMessages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              <div className="h-1" />
            </>
          )}
        </div>
        {showScrollBtn && (
          <ScrollPill onClick={() => { isAtBottomRef.current = true; setShowScrollBtn(false); scrollToBottom(); }} />
        )}
      </div>

      {/* ── Input ── */}
      <div
        className="flex-shrink-0 px-3 pt-3 pb-3 border-t border-white/[0.07]"
        style={{ background: 'rgba(0,0,0,0.2)' }}
      >
        {/* Input container with glow ring */}
        <div
          className={`flex items-end gap-2 rounded-xl border p-1 transition-all duration-200 ${
            isFocused
              ? 'border-violet-500/50 shadow-lg shadow-violet-500/10'
              : 'border-white/10'
          }`}
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isProcessing ? 'Waiting for response…' : 'Ask Sapiens anything…'}
            disabled={isProcessing}
            rows={1}
            className="flex-1 resize-none overflow-hidden bg-transparent border-none outline-none min-h-[36px] max-h-[140px] px-2 py-2 text-sm text-white/85 placeholder:text-white/25 leading-relaxed disabled:opacity-50"
            style={{ height: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
              bg-gradient-to-br from-violet-500 to-indigo-600
              hover:from-violet-400 hover:to-indigo-500
              shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50
              text-white transition-all duration-200
              disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed
              active:scale-95"
          >
            {isProcessing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-[10px] text-white/15 mt-1.5 px-1">
          Ctrl+Enter to send · backend responses may take a few minutes
        </p>
      </div>
    </div>
  );
}
