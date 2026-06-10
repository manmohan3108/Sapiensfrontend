import { Hash, Clock, MessageSquare } from 'lucide-react';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { formatTime } from '../../utils/formatters';

export function SessionSummary() {
  const chatMessages = useSapiensStore((s) => s.chatMessages);
  const chatSessionId = useSapiensStore((s) => s.chatSessionId);
  const currentSapiens = useSapiensStore((s) => s.currentSapiens);

  const turnCount = chatMessages.filter((m) => m.role === 'user').length;
  const lastMsg = chatMessages.filter((m) => !m.isLoading).at(-1);

  const firstUserMsg = chatMessages.find((m) => m.role === 'user');
  const sessionTitle = firstUserMsg
    ? firstUserMsg.content.slice(0, 40) + (firstUserMsg.content.length > 40 ? '…' : '')
    : currentSapiens?.name ?? 'New Session';

  const hasActivity = turnCount > 0;

  return (
    <div
      className="flex-shrink-0 rounded-xl px-3 py-2.5 select-none"
      style={{
        background: 'rgba(124,58,237,0.05)',
        border: '1px solid rgba(124,58,237,0.14)',
      }}
    >
      {/* Status dot + title */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{
            background: hasActivity ? '#c4b5fd' : 'rgba(255,255,255,0.15)',
            boxShadow: hasActivity ? '0 0 6px rgba(196,181,253,0.5)' : 'none',
          }}
        />
        <p className="text-[11px] text-white/65 leading-snug truncate">{sessionTitle}</p>
      </div>

      {/* Meta pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {chatSessionId ? (
          <span
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
            style={{
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.18)',
            }}
          >
            <Hash className="w-2 h-2" style={{ color: 'rgba(196,181,253,0.6)' }} />
            <span className="text-[9px] font-mono" style={{ color: 'rgba(196,181,253,0.6)' }}>
              {chatSessionId.slice(0, 10)}…
            </span>
          </span>
        ) : (
          <span
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <span className="text-[9px] font-mono text-white/20">no session</span>
          </span>
        )}

        <span className="flex items-center gap-1">
          <MessageSquare className="w-2 h-2" style={{ color: 'rgba(255,255,255,0.18)' }} />
          <span className="text-[9px] font-mono text-white/22">
            {turnCount} turn{turnCount !== 1 ? 's' : ''}
          </span>
        </span>

        {lastMsg && (
          <span className="flex items-center gap-1">
            <Clock className="w-2 h-2" style={{ color: 'rgba(255,255,255,0.18)' }} />
            <span className="text-[9px] font-mono text-white/22">
              {formatTime(lastMsg.timestamp)}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
