import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Clock3, Eye, Loader2, Orbit, Sparkles } from 'lucide-react';
import { sapiensService } from '../../core/services/sapiensService';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { ApiError } from '../../types/apiTypes';
import { AwarenessAlsoOnMindItem, AwarenessHistoryItem, AwarenessResponse } from '../../types/sapiensTypes';

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    user: 'From you',
    stream: 'From recent activity',
    chat: 'From your conversation',
    memory: 'From memory',
    engine: 'From reflection',
  };
  return labels[source.toLowerCase()] ?? `From ${source.replace(/[_-]+/g, ' ')}`;
}

function relativeTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000], ['month', 2_592_000], ['week', 604_800],
    ['day', 86_400], ['hour', 3_600], ['minute', 60],
  ];
  for (const [unit, size] of ranges) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(seconds, 'second');
}

function AlsoOnMind({ items }: { items: AwarenessAlsoOnMindItem[] }) {
  return (
    <section>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">Also on my mind</p>
      <div className="space-y-1.5">
        {items.slice(0, 3).map((item, index) => (
          <div key={`${item.content}-${index}`} className="flex gap-2 rounded-lg border border-violet-300/10 bg-violet-400/[0.05] px-2.5 py-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-violet-400" />
            <div className="min-w-0"><p className="text-[11px] leading-relaxed text-white/60">{item.content}</p><p className="mt-1 text-[9px] text-white/25">{sourceLabel(item.source)}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentFocus({ history }: { history: AwarenessHistoryItem[] }) {
  return (
    <section>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">Recent focus</p>
      {history.length === 0 ? <p className="text-[11px] text-white/20">No earlier focus yet.</p> : (
        <div className="space-y-0">
          {history.slice(0, 10).map((entry, index) => (
            <div key={entry.id ?? index} className="flex gap-2.5">
              <div className="flex w-3 flex-col items-center">
                <span className="mt-1.5 h-2 w-2 rounded-full border border-cyan-300/40 bg-cyan-400/30" />
                {index < Math.min(history.length, 10) - 1 && <span className="mt-1 min-h-5 w-px flex-1 bg-white/[0.07]" />}
              </div>
              <div className="min-w-0 flex-1 pb-3">
                <p className="truncate text-[11px] text-white/55">{entry.focus}</p>
                <p className="mt-0.5 text-[9px] text-white/20">{sourceLabel(entry.source)} · {relativeTimestamp(entry.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AwarenessPanel() {
  const currentSapiens = useSapiensStore((state) => state.currentSapiens);
  const status = useSapiensStore((state) => state.status);
  const previousStatus = useRef(status);
  const requestId = useRef(0);
  const [data, setData] = useState<AwarenessResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentSapiens) return;
    const id = ++requestId.current;
    setLoading(true);
    try {
      const next = await sapiensService.getAwareness(currentSapiens.id, 10);
      if (id === requestId.current) {
        setData(next);
        setError(null);
      }
    } catch (caught) {
      if (id === requestId.current) setError((caught as ApiError).message || 'Could not refresh awareness.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [currentSapiens]);

  useEffect(() => {
    setData(null);
    setError(null);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (previousStatus.current === 'processing' && status !== 'processing') void refresh();
    previousStatus.current = status;
  }, [status, refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const current = data?.current;
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl" style={{ background: 'rgba(8,12,22,0.85)', border: '1px solid rgba(34,211,238,0.18)', boxShadow: '0 0 0 1px rgba(34,211,238,0.05), inset 0 1px 0 rgba(34,211,238,0.1), 0 30px 60px rgba(0,0,0,0.5)', backdropFilter: 'blur(24px)' }}>
      <div className="h-[3px] flex-shrink-0 bg-gradient-to-r from-cyan-700 via-cyan-400 to-violet-600" />
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-cyan-400/10 bg-cyan-400/[0.05] px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10"><Eye className="h-4 w-4 text-cyan-300" /></div>
        <div className="min-w-0 flex-1"><p className="text-sm text-white/85">Awareness</p><p className="truncate text-[10px] text-cyan-300/45">What {currentSapiens?.name} is focused on now</p></div>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300/50" />}
      </header>

      {error && <div className="mx-3 mt-3 flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/[0.07] px-3 py-2 text-[10px] text-red-300/80"><AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" /><span>{error} Showing the last successful view.</span></div>}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {!data && loading ? (
          <div className="flex h-full items-center justify-center text-xs text-white/25">Loading awareness…</div>
        ) : !current ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]"><Orbit className="h-6 w-6 text-white/15" /></div>
            <p className="max-w-56 text-xs leading-relaxed text-white/30">Sapiens has not formed an awareness focus yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <article className="rounded-xl border border-cyan-300/15 bg-gradient-to-br from-cyan-400/[0.09] to-violet-500/[0.06] p-3.5">
              <div className="mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.14em] text-cyan-200/50"><Sparkles className="h-3 w-3" /> Current focus</div>
              <p className="text-sm leading-relaxed text-white/85">{current.focus}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[9px] text-white/35">
                <span className="rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-1">{sourceLabel(current.source)}</span>
                <span className="flex items-center gap-1 rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-1"><Clock3 className="h-2.5 w-2.5" />{relativeTimestamp(current.created_at)}</span>
              </div>
            </article>
            {current.also_on_mind.length > 0 && <AlsoOnMind items={current.also_on_mind} />}
            <RecentFocus history={data?.history ?? []} />
          </div>
        )}
      </div>
    </div>
  );
}
