import { useRef, useEffect } from 'react';
import {
  X, Clock, Brain, User, Star, MessageSquare, Database,
} from 'lucide-react';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { ChatMessage } from '../../types/sapiensTypes';
import { formatTime } from '../../utils/formatters';

// ─── Single timeline entry ────────────────────────────────────────────────────
function TimelineEntry({
  msg, isLast, onJump,
}: {
  msg: ChatMessage;
  isLast: boolean;
  onJump: (id: string) => void;
}) {
  const isUser = msg.role === 'user';
  const hasMemory = (msg.memoryUnits?.length ?? 0) > 0;
  const isImportant = msg.isImportant;
  const hasSignal = !!msg.userSignal;

  const SIGNAL_LABELS: Record<string, string> = {
    thumbs_up: '👍 Helpful',
    thumbs_down: '👎 Not helpful',
    important: '⭐ Important',
    remember: '🧠 Remember',
    not_relevant: '🚫 Not relevant',
  };

  return (
    <div className="flex gap-3 group/entry">
      {/* Timeline column */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: '28px' }}>
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={
            isUser
              ? { background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.35)' }
              : isImportant
              ? { background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)' }
              : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }
          }
        >
          {isUser ? (
            <User className="w-3 h-3" style={{ color: '#c4b5fd' }} />
          ) : isImportant ? (
            <Star className="w-3 h-3" style={{ color: '#fbbf24' }} />
          ) : (
            <Brain className="w-3 h-3 text-white/30" />
          )}
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
        )}
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 pb-4">
        <button
          onClick={() => onJump(msg.id)}
          className="w-full text-left rounded-xl p-3 transition-all duration-150 group-hover/entry:brightness-110"
          style={{
            background: isUser
              ? 'rgba(124,58,237,0.05)'
              : isImportant
              ? 'rgba(245,158,11,0.05)'
              : 'rgba(255,255,255,0.02)',
            border: `1px solid ${
              isUser
                ? 'rgba(124,58,237,0.15)'
                : isImportant
                ? 'rgba(245,158,11,0.2)'
                : 'rgba(255,255,255,0.06)'
            }`,
          }}
        >
          {/* Row 1: role + time + badges */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="text-[10px] font-mono"
              style={{ color: isUser ? '#c4b5fd' : 'rgba(255,255,255,0.4)' }}
            >
              {isUser ? 'You' : 'Sapiens'}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Clock className="w-2.5 h-2.5" style={{ color: 'rgba(255,255,255,0.2)' }} />
              <span className="text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {formatTime(msg.timestamp)}
              </span>
            </div>
            {hasMemory && (
              <span
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px]"
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.2)',
                  color: '#fcd34d',
                }}
              >
                <Database className="w-2 h-2" />
                {msg.memoryUnits!.length} mem
              </span>
            )}
            {isImportant && (
              <span
                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px]"
                style={{
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  color: '#fbbf24',
                }}
              >
                <Star className="w-2 h-2" />
                Important
              </span>
            )}
            {hasSignal && msg.userSignal && (
              <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {SIGNAL_LABELS[msg.userSignal] ?? msg.userSignal}
              </span>
            )}
          </div>

          {/* Row 2: content preview */}
          <p
            className="text-[11px] leading-relaxed break-words line-clamp-2"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            {msg.content || <span className="italic opacity-50">…loading…</span>}
          </p>

          {/* Jump hint */}
          <div className="flex items-center gap-1 mt-2 opacity-0 group-hover/entry:opacity-100 transition-opacity">
            <MessageSquare className="w-2.5 h-2.5" style={{ color: 'rgba(124,58,237,0.6)' }} />
            <span className="text-[9px]" style={{ color: 'rgba(124,58,237,0.6)' }}>
              Jump to message
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function MemoryTimeline() {
  const messages = useSapiensStore((s) => s.chatMessages);
  const chatSessionId = useSapiensStore((s) => s.chatSessionId);
  const currentSapiens = useSapiensStore((s) => s.currentSapiens);
  const setShowMemoryTimeline = useSapiensStore((s) => s.setShowMemoryTimeline);
  const setJumpToMessageId = useSapiensStore((s) => s.setJumpToMessageId);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const onBackdrop = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) setShowMemoryTimeline(false);
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMemoryTimeline(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setShowMemoryTimeline]);

  const importantCount = messages.filter((m) => m.isImportant).length;
  const memoryRefCount = messages.filter((m) => (m.memoryUnits?.length ?? 0) > 0).length;
  const turnCount = messages.filter((m) => m.role === 'user').length;

  const handleJump = (id: string) => {
    setJumpToMessageId(id);
    setShowMemoryTimeline(false);
  };

  return (
    <div
      ref={overlayRef}
      onClick={onBackdrop}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(4,8,18,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden"
        style={{
          width: '520px',
          maxHeight: '80vh',
          background: 'rgba(8,12,22,0.97)',
          border: '1px solid rgba(124,58,237,0.25)',
          boxShadow: '0 0 0 1px rgba(124,58,237,0.08), 0 40px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Violet accent */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, #5b21b6, #7c3aed, #5b21b6)', flexShrink: 0 }} />

        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-5 py-4"
          style={{ background: 'rgba(124,58,237,0.07)', borderBottom: '1px solid rgba(124,58,237,0.12)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)' }}
          >
            <Clock className="w-4.5 h-4.5" style={{ color: '#c4b5fd' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/90">Memory Timeline</p>
            <p className="text-[10px]" style={{ color: 'rgba(124,58,237,0.6)' }}>
              {currentSapiens?.name} · {chatSessionId ? `session ${chatSessionId.slice(0, 10)}…` : 'no session'}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2">
            {[
              { label: `${turnCount} turns`, color: 'rgba(124,58,237,0.5)' },
              { label: `${memoryRefCount} memory refs`, color: 'rgba(245,158,11,0.6)' },
              { label: `${importantCount} marked`, color: 'rgba(251,191,36,0.7)' },
            ].map((s) => (
              <span
                key={s.label}
                className="px-2 py-0.5 rounded-full text-[9px] font-mono"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: s.color,
                }}
              >
                {s.label}
              </span>
            ))}
          </div>

          <button
            onClick={() => setShowMemoryTimeline(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = '#f87171';
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-3 select-none">
              <MessageSquare className="w-8 h-8 text-white/10" />
              <p className="text-xs text-white/25">No messages in this session yet.</p>
            </div>
          ) : (
            <div>
              {messages
                .filter((m) => !m.isLoading)
                .map((msg, i, arr) => (
                  <TimelineEntry
                    key={msg.id}
                    msg={msg}
                    isLast={i === arr.length - 1}
                    onJump={handleJump}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div
          className="flex-shrink-0 px-5 py-3 text-[10px] text-white/20"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          Click any entry to jump to that message in the chat.
        </div>
      </div>
    </div>
  );
}