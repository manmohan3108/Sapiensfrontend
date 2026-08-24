import { useEffect, useState, useRef, useCallback } from 'react';
import { Cpu, RefreshCw, Share2, ChevronDown, ChevronRight, Zap, TrendingUp } from 'lucide-react';
import { engramService } from '../../core/services/engramService';
import type { WMResponse, WMEntry } from '../../types/engramTypes';
import { fmtId } from './EngramUnitDetail';

const POLL_INTERVAL = 30_000;

const MEMORY_TYPE_COLORS: Record<string, string> = {
  episodic:   '#818cf8',
  semantic:   '#34d399',
  procedural: '#f97316',
  working:    '#22d3ee',
  entity:     '#e879f9',
  summary:    '#4ade80',
};

const SOURCE_COLORS: Record<string, string> = {
  memory_unit:  '#c4b5fd',
  goal:         '#34d399',
  conversation: '#22d3ee',
  emotion:      '#f97316',
  reflection:   '#fbbf24',
  default:      '#94a3b8',
};

interface WMEntryRowProps {
  entry: WMEntry;
  isFocus: boolean;
  isNew: boolean;
  onOpenInGraph?: (id: string) => void;
}

function WMEntryRow({ entry, isFocus, isNew, onOpenInGraph }: WMEntryRowProps) {
  const [expanded, setExpanded] = useState(false);
  if (!entry) return null;
  const score = entry.activation ?? entry.score ?? 0;
  const pct = Math.min(100, Math.round(score * 100));
  const scoreColor = pct > 70 ? '#34d399' : pct > 40 ? '#fbbf24' : '#94a3b8';
  const mtColor  = entry.memory_type ? (MEMORY_TYPE_COLORS[entry.memory_type] ?? '#94a3b8') : '#94a3b8';
  const srcColor = SOURCE_COLORS[entry.memory_source] ?? SOURCE_COLORS.default;
  const hasContent = Boolean(entry.content);

  return (
    <div
      className="rounded-lg overflow-hidden transition-all duration-300"
      style={{
        background: isFocus
          ? 'rgba(124,58,237,0.12)'
          : isNew
          ? 'rgba(52,211,153,0.06)'
          : 'rgba(255,255,255,0.025)',
        border: `1px solid ${
          isFocus
            ? 'rgba(124,58,237,0.4)'
            : isNew
            ? 'rgba(52,211,153,0.4)'
            : 'rgba(255,255,255,0.07)'
        }`,
        boxShadow: isFocus
          ? '0 0 12px rgba(124,58,237,0.15)'
          : isNew
          ? '0 0 8px rgba(52,211,153,0.12)'
          : 'none',
      }}
    >
      {/* Top row */}
      <div className="flex items-center gap-1.5 px-2 pt-2 pb-1">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: mtColor, boxShadow: `0 0 4px ${mtColor}80` }}
        />
        {hasContent ? (
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex-1 text-left flex items-center gap-1 min-w-0"
          >
            {expanded
              ? <ChevronDown className="w-2.5 h-2.5 text-white/25 flex-shrink-0" />
              : <ChevronRight className="w-2.5 h-2.5 text-white/25 flex-shrink-0" />}
            <span className="text-[9px] font-mono text-white/30 truncate">{fmtId(entry.id)}</span>
          </button>
        ) : (
          <span className="flex-1 text-[9px] font-mono text-white/30 truncate">{fmtId(entry.id)}</span>
        )}

        {isFocus && (
          <span className="flex items-center gap-0.5 text-[8px] px-1 py-0.5 rounded font-mono flex-shrink-0"
            style={{ color: '#c4b5fd', background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)' }}>
            <Zap className="w-2 h-2" />focus
          </span>
        )}
        {isNew && !isFocus && (
          <span className="text-[8px] px-1 py-0.5 rounded font-mono flex-shrink-0"
            style={{ color: '#34d399', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
            new
          </span>
        )}
        {onOpenInGraph && (
          <button
            onClick={() => onOpenInGraph(entry.id)}
            className="flex-shrink-0 text-white/20 hover:text-orange-400 transition-colors"
            title="Open in Graph Explorer"
          >
            <Share2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Content preview (collapsed) */}
      {hasContent && !expanded && (
        <button onClick={() => setExpanded(true)} className="w-full text-left px-2 pb-1.5">
          <p className="text-[9px] text-white/45 leading-relaxed line-clamp-2">
            {entry.content}
          </p>
        </button>
      )}

      {/* Content (expanded) */}
      {hasContent && expanded && (
        <div className="px-2 pb-2">
          <p className="text-[9px] text-white/55 leading-relaxed whitespace-pre-wrap break-words">
            {(entry.content ?? '').length > 500
              ? (entry.content ?? '').slice(0, 500) + '…'
              : entry.content}
          </p>
        </div>
      )}

      {!hasContent && (
        <div className="px-2 pb-1.5">
          <span className="text-[8px] text-white/20 italic">
            {entry.memory_source} — no content preview
          </span>
        </div>
      )}

      {/* Score bar + metadata */}
      <div className="px-2 pb-2 space-y-1.5">
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: isFocus
                ? 'linear-gradient(90deg, #7c3aed, #a78bfa)'
                : `linear-gradient(90deg, ${scoreColor}88, ${scoreColor})`,
            }}
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {entry.memory_type && (
            <span
              className="px-1 py-0.5 rounded text-[8px] font-mono flex-shrink-0"
              style={{ color: mtColor, background: `${mtColor}15`, border: `1px solid ${mtColor}25` }}
            >
              {entry.memory_type}
            </span>
          )}
          <span
            className="px-1 py-0.5 rounded text-[8px] font-mono flex-shrink-0"
            style={{ color: srcColor, background: `${srcColor}12`, border: `1px solid ${srcColor}20` }}
          >
            {entry.memory_source}
          </span>
          {entry.has_embedding && (
            <span className="text-[8px] font-mono text-emerald-400/50">vec✓</span>
          )}
          <span className="text-[9px] font-mono tabular-nums ml-auto flex-shrink-0" style={{ color: scoreColor }}>
            {score.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function EngramWMSidebar({
  sapienId,
  onOpenInGraph,
}: {
  sapienId: number;
  onOpenInGraph?: (id: string) => void;
}) {
  const [wm, setWm]             = useState<WMResponse | null>(null);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);
  const [pulsing, setPulsing]   = useState(false);
  const [countdown, setCountdown] = useState(POLL_INTERVAL / 1000);
  const [newIds, setNewIds]     = useState<Set<string>>(new Set());
  const [evictedCount, setEvictedCount] = useState(0);

  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevIdsRef      = useRef<Set<string>>(new Set());
  const newIdTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poll = useCallback(() => {
    engramService.getWorkingMemory(sapienId, { sort: 'activation', order: 'desc', limit: 100, includeContent: true })
      .then(r => {
        // Client-side delta detection (backend didn't implement ?since=)
        const prevIds = prevIdsRef.current;
        const nextIds = new Set((r.wm?.entries ?? []).filter(Boolean).map((e: WMEntry) => e.id));
        const added   = [...nextIds].filter(id => !prevIds.has(id));
        const evicted = [...prevIds].filter(id => !nextIds.has(id));
        prevIdsRef.current = nextIds;

        if (added.length > 0) {
          setNewIds(new Set(added));
          if (newIdTimerRef.current) clearTimeout(newIdTimerRef.current);
          newIdTimerRef.current = setTimeout(() => setNewIds(new Set()), 4000);
        }
        if (evicted.length > 0) {
          setEvictedCount(evicted.length);
          setTimeout(() => setEvictedCount(0), 4000);
        }

        setWm(r);
        setLastPoll(new Date());
        setPulsing(true);
        setTimeout(() => setPulsing(false), 800);
        setCountdown(POLL_INTERVAL / 1000);
      })
      .catch(() => {});
  }, [sapienId]);

  useEffect(() => {
    poll();
    timerRef.current = setInterval(poll, POLL_INTERVAL);
    return () => {
      if (timerRef.current)    clearInterval(timerRef.current);
      if (newIdTimerRef.current) clearTimeout(newIdTimerRef.current);
    };
  }, [poll]);

  useEffect(() => {
    countdownRef.current = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  // wm.wm always has entries + focus_id now (empty state: { focus_id: null, entries: [] })
  const entries  = (wm?.wm?.entries ?? []).filter((e): e is WMEntry => e != null);
  const focusId  = wm?.wm?.focus_id ?? null;
  const capacity = wm?.capacity ?? { global: 0, by_source: {} };

  // Sort: focus first, then score desc
  const sorted = [...entries].sort((a, b) => {
    if (a.id === focusId) return -1;
    if (b.id === focusId) return 1;
    return (b.activation ?? b.score ?? 0) - (a.activation ?? a.score ?? 0);
  });

  // Per-source current counts
  const sourceCounts: Record<string, number> = {};
  entries.forEach(e => { sourceCounts[e.memory_source] = (sourceCounts[e.memory_source] ?? 0) + 1; });

  const maxScore = sorted.length > 0 ? (sorted[0].activation ?? sorted[0].score ?? 0) : 1;
  const globalUsedPct = capacity.global > 0 ? Math.round((entries.length / capacity.global) * 100) : 0;

  return (
    <div
      className="flex flex-col h-full rounded-xl overflow-hidden"
      style={{
        background: 'rgba(8,12,22,0.9)',
        border: '1px solid rgba(124,58,237,0.2)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Animated top accent */}
      <div style={{
        height: '2px',
        background: pulsing
          ? 'linear-gradient(90deg, #34d399, #7c3aed, #34d399)'
          : 'linear-gradient(90deg, #5b21b6, #7c3aed, #5b21b6)',
        transition: 'background 0.4s',
        flexShrink: 0,
      }} />

      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
        style={{ background: 'rgba(124,58,237,0.07)', borderBottom: '1px solid rgba(124,58,237,0.12)' }}
      >
        <Cpu className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#c4b5fd' }} />
        <span className="text-[11px] text-white/70 flex-1">Working Memory</span>
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300"
          style={{
            background: pulsing ? '#34d399' : entries.length > 0 ? '#c4b5fd' : 'rgba(255,255,255,0.2)',
            boxShadow: pulsing ? '0 0 8px #34d399' : entries.length > 0 ? '0 0 5px rgba(196,181,253,0.6)' : 'none',
          }}
        />
        <button onClick={poll} className="w-5 h-5 flex items-center justify-center rounded text-white/25 hover:text-white/60 transition-colors" title="Refresh now">
          <RefreshCw className={`w-3 h-3 ${pulsing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Capacity bar */}
      <div className="px-3 py-2 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[9px] font-mono tabular-nums" style={{ color: '#c4b5fd' }}>
            {entries.length}
            {capacity.global > 0 && ` / ${capacity.global}`}
          </span>
          <span className="text-[8px] text-white/20">slots</span>
          {evictedCount > 0 && (
            <span className="ml-auto text-[8px] font-mono text-amber-400/70 animate-pulse">
              −{evictedCount} evicted
            </span>
          )}
          {capacity.global > 0 && (
            <span className="ml-auto text-[8px] font-mono text-white/20">{globalUsedPct}%</span>
          )}
        </div>
        {capacity.global > 0 && (
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${globalUsedPct}%`,
                background: globalUsedPct > 80
                  ? 'linear-gradient(90deg, #ef4444, #f97316)'
                  : globalUsedPct > 50
                  ? 'linear-gradient(90deg, #fbbf24, #34d399)'
                  : 'linear-gradient(90deg, #7c3aed, #c4b5fd)',
              }}
            />
          </div>
        )}

        {/* Per-source breakdown */}
        {Object.keys(capacity.by_source).length > 0 && (
          <div className="mt-2 flex flex-col gap-0.5">
            {Object.entries(capacity.by_source).map(([src, max]) => {
              const used = sourceCounts[src] ?? 0;
              const pct  = max > 0 ? Math.min(100, (used / max) * 100) : 0;
              const color = SOURCE_COLORS[src] ?? SOURCE_COLORS.default;
              return (
                <div key={src} className="flex items-center gap-1.5">
                  <span className="text-[7px] font-mono w-14 flex-shrink-0 truncate" style={{ color: `${color}99` }}>{src}</span>
                  <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <span className="text-[7px] font-mono text-white/20 tabular-nums w-6 text-right">{used}/{max}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Activation histogram */}
      {sorted.length > 0 && (
        <div className="px-3 pt-2 pb-1 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-2.5 h-2.5 text-white/20" />
            <span className="text-[8px] font-mono text-white/20">activation</span>
          </div>
          <div className="flex gap-0.5 items-end" style={{ height: '12px' }}>
            {sorted.map(e => {
              const score = e.activation ?? e.score ?? 0;
              const rel = maxScore > 0 ? score / maxScore : 0;
              const isFocus = e.id === focusId;
              return (
                <div
                  key={e.id}
                  className="flex-1 rounded-sm transition-all duration-700"
                    title={`${fmtId(e.id)}: ${score.toFixed(2)}`}
                  style={{
                    background: isFocus
                      ? `rgba(196,181,253,${0.3 + rel * 0.7})`
                      : newIds.has(e.id)
                      ? `rgba(52,211,153,${0.3 + rel * 0.6})`
                      : `rgba(148,163,184,${0.15 + rel * 0.55})`,
                    height: `${Math.max(25, rel * 100)}%`,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1.5">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 gap-2">
            <Cpu className="w-5 h-5 text-white/10" />
            <p className="text-[10px] text-white/20 text-center">No active units</p>
          </div>
        ) : (
          sorted.map(e => (
            <WMEntryRow
              key={e.id}
              entry={e}
              isFocus={e.id === focusId}
              isNew={newIds.has(e.id)}
              onOpenInGraph={onOpenInGraph}
            />
          ))
        )}
      </div>

      {/* Footer — countdown */}
      <div
        className="flex-shrink-0 px-3 py-2 flex items-center gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${(countdown / (POLL_INTERVAL / 1000)) * 100}%`,
              background: 'rgba(124,58,237,0.5)',
            }}
          />
        </div>
        <span className="text-[8px] font-mono text-white/15 tabular-nums flex-shrink-0">{countdown}s</span>
        {lastPoll && (
          <span className="text-[8px] font-mono text-white/12 flex-shrink-0">
            {lastPoll.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
