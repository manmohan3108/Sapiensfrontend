import { useEffect, useRef } from 'react';
import { Activity, AlertCircle, CheckCircle, Info, AlertTriangle, Radio } from 'lucide-react';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { formatTime } from '../../utils/formatters';
import { ActivityLog as ActivityLogType } from '../../types/sapiensTypes';

interface LogCfg {
  icon: React.ReactNode;
  bar: string;
  glow: string;
  badge: string;
  text: string;
}

function getCfg(type: ActivityLogType['type']): LogCfg {
  switch (type) {
    case 'success':
      return {
        icon: <CheckCircle className="w-3 h-3" />,
        bar: 'bg-emerald-500',
        glow: 'shadow-emerald-500/30',
        badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
        text: 'text-emerald-300/80',
      };
    case 'error':
      return {
        icon: <AlertCircle className="w-3 h-3" />,
        bar: 'bg-red-500',
        glow: 'shadow-red-500/30',
        badge: 'bg-red-500/15 text-red-400 border-red-500/25',
        text: 'text-red-300/80',
      };
    case 'warning':
      return {
        icon: <AlertTriangle className="w-3 h-3" />,
        bar: 'bg-amber-500',
        glow: 'shadow-amber-500/30',
        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
        text: 'text-amber-300/80',
      };
    default:
      return {
        icon: <Info className="w-3 h-3" />,
        bar: 'bg-blue-500',
        glow: 'shadow-blue-500/30',
        badge: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
        text: 'text-blue-200/60',
      };
  }
}

export function ActivityLog() {
  const activityLogs = useSapiensStore((s) => s.activityLogs);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activityLogs]);

  const hasLogs = activityLogs.length > 0;
  const lastType = hasLogs ? activityLogs[activityLogs.length - 1].type : null;
  const liveColor = lastType === 'error' ? 'bg-red-400' : lastType === 'warning' ? 'bg-amber-400' : lastType === 'success' ? 'bg-emerald-400' : 'bg-blue-400';

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl shadow-black/40"
      style={{ background: 'rgba(10,14,28,0.75)', backdropFilter: 'blur(20px)' }}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.07]" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/20 border border-blue-500/25 flex items-center justify-center">
          <Activity className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-white/80 leading-none">Activity Log</p>
          <p className="text-[10px] text-white/25 mt-0.5">System events &amp; processing</p>
        </div>
        {hasLogs && (
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${liveColor} animate-pulse`} />
              <span className="text-[10px] text-white/25">live</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/10 text-white/30 tabular-nums">
              {activityLogs.length}
            </span>
          </div>
        )}
      </div>

      {/* Log entries */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-2.5 space-y-1.5">
        {!hasLogs ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[80px] select-none gap-2">
            <Radio className="w-5 h-5 text-white/10" />
            <p className="text-xs text-white/15">Awaiting system events…</p>
          </div>
        ) : (
          activityLogs.map((log) => {
            const cfg = getCfg(log.type);
            return (
              <div
                key={log.id}
                className="flex items-start gap-2 py-2 px-2.5 rounded-xl border border-white/[0.05] hover:border-white/[0.10] transition-all group"
                style={{ background: 'rgba(255,255,255,0.025)' }}
              >
                {/* Colored side bar */}
                <div className={`flex-shrink-0 w-0.5 self-stretch rounded-full opacity-80 ${cfg.bar}`} />

                {/* Icon badge */}
                <div className={`flex-shrink-0 mt-px w-5 h-5 rounded-md flex items-center justify-center border shadow-sm ${cfg.glow} ${cfg.badge}`}>
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-px">
                  <p className="text-[11px] leading-relaxed text-white/65 break-words">{log.message}</p>
                  <p className="text-[10px] text-white/20 mt-0.5 font-mono">{formatTime(log.timestamp)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
