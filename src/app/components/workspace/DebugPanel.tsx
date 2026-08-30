import { useState } from 'react';
import { Bug, Clock, Zap, Code2, X, ArrowRight, Hash } from 'lucide-react';
import { useSapiensStore } from '../../core/state/sapiensStore';

type DebugTab = 'flow' | 'latency' | 'raw';

const DEFAULT_FLOW = ['Conversation', 'Memory Search', 'Context Build', 'LLM Generation', 'Response'];

// ─── Engine flow step ─────────────────────────────────────────────────────────
function FlowStep({
  label, index, total, isActive,
}: {
  label: string; index: number; total: number; isActive?: boolean;
}) {
  const isLast = index === total - 1;
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300"
        style={
          isActive
            ? {
                background: 'rgba(6,182,212,0.15)',
                border: '1px solid rgba(6,182,212,0.4)',
                boxShadow: '0 0 16px rgba(6,182,212,0.15)',
              }
            : {
                background: 'rgba(6,182,212,0.06)',
                border: '1px solid rgba(6,182,212,0.18)',
              }
        }
      >
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono flex-shrink-0"
          style={
            isActive
              ? { background: 'rgba(6,182,212,0.3)', color: '#67e8f9', boxShadow: '0 0 8px rgba(6,182,212,0.4)' }
              : { background: 'rgba(6,182,212,0.12)', color: 'rgba(103,232,249,0.6)' }
          }
        >
          {index + 1}
        </span>
        <span
          className="text-[11px] whitespace-nowrap"
          style={{ color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)' }}
        >
          {label}
        </span>
      </div>
      {!isLast && (
        <ArrowRight
          className="w-3 h-3 flex-shrink-0"
          style={{ color: 'rgba(6,182,212,0.25)' }}
        />
      )}
    </div>
  );
}

// ─── Latency bar ──────────────────────────────────────────────────────────────
function LatencyRow({ label, ms, maxMs }: { label: string; ms: number; maxMs: number }) {
  const pct = maxMs > 0 ? (ms / maxMs) * 100 : 100;
  const color = ms > 3000 ? '#f87171' : ms > 1000 ? '#fbbf24' : '#34d399';
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-[10px] text-white/40 flex-shrink-0 w-28 truncate font-mono capitalize">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}50` }}
        />
      </div>
      <span className="text-[10px] font-mono flex-shrink-0 tabular-nums w-14 text-right" style={{ color }}>
        {ms.toLocaleString()}ms
      </span>
    </div>
  );
}

// ─── JSON block ───────────────────────────────────────────────────────────────
function JsonBlock({ label, data }: { label: string; data: unknown }) {
  const text = JSON.stringify(data, null, 2);
  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col">
      <p className="text-[9px] font-mono mb-1 flex-shrink-0 uppercase tracking-widest"
        style={{ color: 'rgba(6,182,212,0.45)' }}>
        {label}
      </p>
      <div
        className="flex-1 min-h-0 overflow-auto rounded-xl p-3 font-mono text-[10px] leading-relaxed"
        style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(6,182,212,0.1)',
          color: 'rgba(110,231,183,0.7)',
          whiteSpace: 'pre',
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ─── Empty placeholder ────────────────────────────────────────────────────────
function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-[11px] italic" style={{ color: 'rgba(255,255,255,0.15)' }}>{text}</p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DebugPanel({ onClose }: { onClose?: () => void } = {}) {
  const [tab, setTab] = useState<DebugTab>('flow');
  const lastDebugInfo = useSapiensStore((s) => s.lastDebugInfo);
  const setShowDebugPanel = useSapiensStore((s) => s.setShowDebugPanel);
  const chatSessionId = useSapiensStore((s) => s.chatSessionId);

  const hasData = lastDebugInfo !== null;

  // Only show flow steps when we have real data; fall back to DEFAULT_FLOW only if
  // backend responded but provided an empty engine_flow array.
  const flow = hasData
    ? (lastDebugInfo.engine_flow?.length ? lastDebugInfo.engine_flow : DEFAULT_FLOW)
    : [];

  const latencyEntries = Object.entries(lastDebugInfo?.latency ?? {});
  const maxMs = latencyEntries.length ? Math.max(...latencyEntries.map(([, v]) => v)) : 0;
  const totalMs = latencyEntries.reduce((s, [, v]) => s + v, 0);

  const TABS: { id: DebugTab; label: string; icon: React.ReactNode }[] = [
    { id: 'flow',    label: 'Engine Flow', icon: <Zap     className="w-3 h-3" /> },
    { id: 'latency', label: 'Latency',     icon: <Clock   className="w-3 h-3" /> },
    { id: 'raw',     label: 'Raw JSON',    icon: <Code2   className="w-3 h-3" /> },
  ];

  return (
    <div
      className="flex-shrink-0 flex flex-col"
      style={{
        height: '232px',
        background: 'rgba(4,8,18,0.98)',
        borderTop: '2px solid rgba(6,182,212,0.2)',
        backdropFilter: 'blur(32px)',
      }}
    >
      {/* Cyan top accent */}
      <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)', flexShrink: 0 }} />

      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-4 py-2"
        style={{ background: 'rgba(6,182,212,0.04)', borderBottom: '1px solid rgba(6,182,212,0.1)' }}
      >
        <div className="flex items-center gap-2 mr-1">
          <Bug className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(6,182,212,0.7)' }} />
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Debug</span>
        </div>

        {/* Session pill */}
        {chatSessionId && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono"
            style={{
              background: 'rgba(6,182,212,0.08)',
              border: '1px solid rgba(6,182,212,0.15)',
              color: 'rgba(6,182,212,0.6)',
            }}
          >
            <Hash className="w-2 h-2" />
            {chatSessionId.slice(0, 14)}…
          </span>
        )}

        {/* Divider */}
        <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.07)' }} />

        {/* Tabs */}
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] transition-all duration-150"
              style={
                tab === t.id
                  ? { background: 'rgba(6,182,212,0.18)', border: '1px solid rgba(6,182,212,0.3)', color: '#67e8f9' }
                  : { background: 'transparent', border: '1px solid transparent', color: 'rgba(255,255,255,0.28)' }
              }
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Total latency badge */}
        {totalMs > 0 && (
          <span
            className="ml-auto mr-2 px-2 py-0.5 rounded-full text-[9px] font-mono tabular-nums"
            style={{
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.15)',
              color: 'rgba(52,211,153,0.6)',
            }}
          >
            {totalMs.toLocaleString()}ms total
          </span>
        )}

        {!totalMs && <div className="flex-1" />}

        <button
          onClick={() => {
            setShowDebugPanel(false);
            onClose?.();
          }}
          className="w-6 h-6 flex items-center justify-center rounded-lg transition-all flex-shrink-0"
          style={{ color: 'rgba(255,255,255,0.2)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = '#f87171';
            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.2)';
            (e.currentTarget as HTMLElement).style.background = 'transparent';
          }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 px-4 py-3 overflow-hidden">

        {/* ── Flow tab ── */}
        {tab === 'flow' && (
          !hasData ? (
            <EmptyHint text="Send a message — engine flow will appear here." />
          ) : (
            <div className="flex items-center gap-1.5 h-full overflow-x-auto pb-1">
              {flow.map((step, i) => (
                <FlowStep
                  key={i}
                  label={step}
                  index={i}
                  total={flow.length}
                  isActive={i === flow.length - 1}
                />
              ))}
            </div>
          )
        )}

        {/* ── Latency tab ── */}
        {tab === 'latency' && (
          !hasData || latencyEntries.length === 0 ? (
            <EmptyHint text="Latency breakdown will appear after a response." />
          ) : (
            <div className="h-full overflow-y-auto space-y-0.5">
              {latencyEntries.map(([key, ms]) => (
                <LatencyRow key={key} label={key} ms={ms} maxMs={maxMs} />
              ))}
              <div className="pt-1.5 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <LatencyRow label="total" ms={totalMs} maxMs={totalMs} />
              </div>
            </div>
          )
        )}

        {/* ── Raw JSON tab ── */}
        {tab === 'raw' && (
          !hasData ? (
            <EmptyHint text="Raw request / response appear here after the first message." />
          ) : (
            <div className="flex gap-3 h-full">
              <JsonBlock label="→ Request"  data={lastDebugInfo.raw_request  ?? {}} />
              <JsonBlock label="← Response" data={lastDebugInfo.raw_response ?? {}} />
            </div>
          )
        )}
      </div>
    </div>
  );
}
