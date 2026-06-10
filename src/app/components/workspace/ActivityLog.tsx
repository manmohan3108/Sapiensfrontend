import { useEffect, useRef } from 'react';
import { Activity, AlertCircle, CheckCircle2, Info, AlertTriangle, Radio } from 'lucide-react';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { formatTime } from '../../utils/formatters';
import { ActivityLog as ActivityLogType } from '../../types/sapiensTypes';

type LogType = 'success' | 'error' | 'warning' | 'info';

interface TypeConfig {
  dot: string;
  dotBg: string;
  dotBorder: string;
  label: string;
  labelColor: string;
  labelBg: string;
  labelBorder: string;
  msgColor: string;
  rowBorder: string;
  rowBg: string;
}

const TYPE_CFG: Record<LogType, TypeConfig> = {
  success: {
    dot: '#34d399', dotBg: 'rgba(52,211,153,0.2)', dotBorder: 'rgba(52,211,153,0.4)',
    label: 'OK', labelColor: '#6ee7b7', labelBg: 'rgba(52,211,153,0.12)', labelBorder: 'rgba(52,211,153,0.25)',
    msgColor: 'rgba(255,255,255,0.75)',
    rowBorder: 'rgba(52,211,153,0.12)', rowBg: 'rgba(52,211,153,0.04)',
  },
  error: {
    dot: '#f87171', dotBg: 'rgba(248,113,113,0.2)', dotBorder: 'rgba(248,113,113,0.4)',
    label: 'ERR', labelColor: '#fca5a5', labelBg: 'rgba(248,113,113,0.12)', labelBorder: 'rgba(248,113,113,0.25)',
    msgColor: 'rgba(252,165,165,0.9)',
    rowBorder: 'rgba(248,113,113,0.15)', rowBg: 'rgba(248,113,113,0.05)',
  },
  warning: {
    dot: '#fbbf24', dotBg: 'rgba(251,191,36,0.2)', dotBorder: 'rgba(251,191,36,0.4)',
    label: 'WARN', labelColor: '#fcd34d', labelBg: 'rgba(251,191,36,0.12)', labelBorder: 'rgba(251,191,36,0.25)',
    msgColor: 'rgba(253,212,77,0.85)',
    rowBorder: 'rgba(251,191,36,0.12)', rowBg: 'rgba(251,191,36,0.04)',
  },
  info: {
    dot: '#60a5fa', dotBg: 'rgba(96,165,250,0.2)', dotBorder: 'rgba(96,165,250,0.4)',
    label: 'INFO', labelColor: '#93c5fd', labelBg: 'rgba(96,165,250,0.12)', labelBorder: 'rgba(96,165,250,0.25)',
    msgColor: 'rgba(255,255,255,0.6)',
    rowBorder: 'rgba(96,165,250,0.1)', rowBg: 'rgba(96,165,250,0.03)',
  },
};

function LogTypeIcon({ type }: { type: LogType }) {
  const cls = 'w-3.5 h-3.5';
  if (type === 'success') return <CheckCircle2 className={cls} />;
  if (type === 'error')   return <AlertCircle  className={cls} />;
  if (type === 'warning') return <AlertTriangle className={cls} />;
  return <Info className={cls} />;
}

function LogEntry({ log, isLast }: { log: ActivityLogType; isLast: boolean }) {
  const type = (log.type as LogType) in TYPE_CFG ? (log.type as LogType) : 'info';
  const c = TYPE_CFG[type];

  return (
    <div className="flex gap-3 group">
      {/* Timeline column */}
      <div className="flex flex-col items-center flex-shrink-0 pt-2" style={{ width: '20px' }}>
        <div
          className="w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center"
          style={{
            background: c.dotBg,
            border: `1.5px solid ${c.dotBorder}`,
            boxShadow: `0 0 8px ${c.dot}50`,
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
        </div>
        {!isLast && (
          <div className="w-px flex-1 mt-1.5" style={{ background: 'rgba(255,255,255,0.06)' }} />
        )}
      </div>

      {/* Entry card */}
      <div className="flex-1 min-w-0 pb-3">
        <div
          className="rounded-xl p-3 transition-all duration-150 group-hover:brightness-110"
          style={{ background: c.rowBg, border: `1px solid ${c.rowBorder}` }}
        >
          {/* Top row */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span style={{ color: c.labelColor }}>
                <LogTypeIcon type={type} />
              </span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{ color: c.labelColor, background: c.labelBg, border: `1px solid ${c.labelBorder}` }}
              >
                {c.label}
              </span>
            </div>
            <span className="text-[9px] text-white/20 font-mono flex-shrink-0">
              {formatTime(log.timestamp)}
            </span>
          </div>
          {/* Message */}
          <p className="text-[11px] leading-relaxed break-words" style={{ color: c.msgColor }}>
            {log.message}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ActivityLog() {
  const logs = useSapiensStore((s) => s.activityLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  const lastType = logs.length > 0
    ? ((logs[logs.length - 1].type as LogType) in TYPE_CFG ? (logs[logs.length - 1].type as LogType) : 'info')
    : 'info';
  const liveDot = TYPE_CFG[lastType].dot;

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden relative"
      style={{
        background: 'rgba(8,12,22,0.85)',
        border: '1px solid rgba(96,165,250,0.2)',
        boxShadow: '0 0 0 1px rgba(96,165,250,0.07), inset 0 1px 0 rgba(96,165,250,0.12), 0 30px 60px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(24px)',
      }}
    >
      {/* Blue top accent */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, #1d4ed8, #3b82f6, #1d4ed8)', flexShrink: 0 }} />

      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
        style={{ background: 'rgba(96,165,250,0.06)', borderBottom: '1px solid rgba(96,165,250,0.1)' }}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.35)' }}
        >
          <Activity className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-white/85">Activity Log</p>
          <p className="text-[10px] text-blue-400/50">System events &amp; processing</p>
        </div>
        {logs.length > 0 && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: liveDot, boxShadow: `0 0 8px ${liveDot}80` }}
              />
              <span className="text-[9px] text-white/25 font-mono">live</span>
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono tabular-nums"
              style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.22)', color: '#93c5fd' }}
            >
              {logs.length}
            </span>
          </div>
        )}
      </div>

      {/* Entries */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-3">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 select-none">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <Radio className="w-6 h-6 text-white/15" />
            </div>
            <div className="text-center">
              <p className="text-xs text-white/25">Awaiting system events…</p>
              <p className="text-[10px] text-white/14 mt-1">Logs appear as Sapiens processes data.</p>
            </div>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => (
              <LogEntry key={log.id} log={log} isLast={i === logs.length - 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
