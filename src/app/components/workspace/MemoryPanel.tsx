import { useState } from 'react';
import {
  Brain, Pin, PinOff, EyeOff, Eye, ChevronDown, ChevronUp,
  Database, Sparkles, Clock,
} from 'lucide-react';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { MemoryUnit } from '../../types/sapiensTypes';
import { formatTime } from '../../utils/formatters';

// ─── Relevance pill ───────────────────────────────────────────────────────────
function RelevancePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const { color, bg, label } =
    pct >= 80 ? { color: '#34d399', bg: 'rgba(52,211,153,0.12)', label: 'High' } :
    pct >= 60 ? { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'Med'  } :
    pct >= 40 ? { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'Low'  } :
                { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Weak' };

  return (
    <div className="flex items-center gap-2 mt-2.5">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}50` }}
        />
      </div>
      <span
        className="flex-shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded-full"
        style={{ color, background: bg }}
      >
        {label} {pct}%
      </span>
    </div>
  );
}

// ─── Memory card ──────────────────────────────────────────────────────────────
function MemoryCard({
  unit, isPinned, onPin, onIgnore,
}: {
  unit: MemoryUnit;
  isPinned: boolean;
  onPin: () => void;
  onIgnore: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const preview = unit.content.length > 110 && !expanded
    ? unit.content.slice(0, 110) + '…'
    : unit.content;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-150 group/card"
      style={{
        background: isPinned ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${isPinned ? 'rgba(245,158,11,0.28)' : 'rgba(245,158,11,0.1)'}`,
      }}
    >
      {/* Card top bar */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      >
        {/* ID chip */}
        <span
          className="text-[9px] font-mono px-2 py-0.5 rounded-full flex-shrink-0"
          style={{
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.18)',
            color: 'rgba(252,211,77,0.7)',
          }}
        >
          {unit.id.slice(0, 14)}
        </span>

        {isPinned && (
          <span className="flex items-center gap-1 text-[9px]" style={{ color: 'rgba(245,158,11,0.7)' }}>
            <Pin className="w-2 h-2" /> pinned
          </span>
        )}

        <div className="flex-1" />

        {/* Timestamp */}
        <span className="flex items-center gap-1 text-[9px] font-mono flex-shrink-0" style={{ color: 'rgba(255,255,255,0.18)' }}>
          <Clock className="w-2 h-2" />
          {formatTime(unit.timestamp)}
        </span>

        {/* Actions — show on hover */}
        <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
          <button
            onClick={onPin}
            title={isPinned ? 'Unpin' : 'Pin'}
            className="w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{ color: isPinned ? '#fbbf24' : 'rgba(255,255,255,0.25)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.15)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            {isPinned ? <PinOff className="w-2.5 h-2.5" /> : <Pin className="w-2.5 h-2.5" />}
          </button>
          <button
            onClick={onIgnore}
            title="Ignore"
            className="w-5 h-5 rounded flex items-center justify-center transition-all"
            style={{ color: 'rgba(255,255,255,0.25)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = '#f87171';
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)';
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <EyeOff className="w-2.5 h-2.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pt-2.5 pb-3">
        <p className="text-[11px] leading-relaxed break-words" style={{ color: 'rgba(255,255,255,0.62)' }}>
          {preview}
        </p>

        {unit.content.length > 110 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-1.5 text-[10px] transition-colors"
            style={{ color: 'rgba(245,158,11,0.5)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fbbf24'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(245,158,11,0.5)'; }}
          >
            {expanded ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
            {expanded ? 'Collapse' : 'View full'}
          </button>
        )}

        <RelevancePill score={unit.relevance_score} />
      </div>
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 px-1 mb-2">
      <span style={{ color: 'rgba(245,158,11,0.45)' }}>{icon}</span>
      <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: 'rgba(245,158,11,0.45)' }}>
        {text}
      </span>
      <div className="flex-1 h-px ml-1" style={{ background: 'rgba(245,158,11,0.08)' }} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function MemoryPanel() {
  const lastMemoryUnits = useSapiensStore((s) => s.lastMemoryUnits);
  const pinnedMemoryIds = useSapiensStore((s) => s.pinnedMemoryIds);
  const ignoredMemoryIds = useSapiensStore((s) => s.ignoredMemoryIds);
  const togglePinnedMemory = useSapiensStore((s) => s.togglePinnedMemory);
  const toggleIgnoredMemory = useSapiensStore((s) => s.toggleIgnoredMemory);
  const clearIgnoredMemories = useSapiensStore((s) => s.clearIgnoredMemories);

  const pinned  = lastMemoryUnits.filter((u) =>  pinnedMemoryIds.includes(u.id) && !ignoredMemoryIds.includes(u.id));
  const regular = lastMemoryUnits.filter((u) => !pinnedMemoryIds.includes(u.id) && !ignoredMemoryIds.includes(u.id));
  const ignoredCount = ignoredMemoryIds.length;
  const totalVisible = pinned.length + regular.length;

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(8,12,22,0.85)',
        border: '1px solid rgba(245,158,11,0.2)',
        boxShadow: '0 0 0 1px rgba(245,158,11,0.06), inset 0 1px 0 rgba(245,158,11,0.1), 0 30px 60px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Amber top accent */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #92400e, #f59e0b, #92400e)', flexShrink: 0 }} />

      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{ background: 'rgba(245,158,11,0.05)', borderBottom: '1px solid rgba(245,158,11,0.1)' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(245,158,11,0.18)', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <Database className="w-4 h-4" style={{ color: '#fbbf24' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/85">Memory Units</p>
          <p className="text-[10px]" style={{ color: 'rgba(245,158,11,0.45)' }}>
            Referenced in latest response
          </p>
        </div>
        {lastMemoryUnits.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: '#f59e0b', boxShadow: '0 0 6px rgba(245,158,11,0.6)' }}
            />
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums"
              style={{
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.2)',
                color: '#fcd34d',
              }}
            >
              {totalVisible} / {lastMemoryUnits.length}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2">
        {lastMemoryUnits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 select-none text-center px-6">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}
            >
              <Brain className="w-5 h-5" style={{ color: 'rgba(245,158,11,0.3)' }} />
            </div>
            <div>
              <p className="text-[11px] text-white/30">No memory units yet</p>
              <p className="text-[10px] mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.14)' }}>
                Memory references appear here after each AI response.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Pinned */}
            {pinned.length > 0 && (
              <div>
                <SectionLabel icon={<Pin className="w-2.5 h-2.5" />} text="Pinned" />
                <div className="space-y-2">
                  {pinned.map((u) => (
                    <MemoryCard
                      key={u.id}
                      unit={u}
                      isPinned
                      onPin={() => togglePinnedMemory(u.id)}
                      onIgnore={() => toggleIgnoredMemory(u.id)}
                    />
                  ))}
                </div>
                {regular.length > 0 && (
                  <div className="my-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                )}
              </div>
            )}

            {/* Retrieved */}
            {regular.length > 0 && (
              <div>
                <SectionLabel icon={<Sparkles className="w-2.5 h-2.5" />} text="Retrieved" />
                <div className="space-y-2">
                  {regular.map((u) => (
                    <MemoryCard
                      key={u.id}
                      unit={u}
                      isPinned={false}
                      onPin={() => togglePinnedMemory(u.id)}
                      onIgnore={() => toggleIgnoredMemory(u.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Restore ignored */}
            {ignoredCount > 0 && (
              <button
                onClick={clearIgnoredMemories}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] transition-all mt-2"
                style={{ color: 'rgba(255,255,255,0.22)', border: '1px dashed rgba(255,255,255,0.08)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.18)';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.22)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <Eye className="w-3 h-3" />
                Restore {ignoredCount} hidden unit{ignoredCount !== 1 ? 's' : ''}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
