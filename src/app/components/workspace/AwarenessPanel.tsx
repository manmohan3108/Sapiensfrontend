import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Clock3, Eye, Loader2, Orbit, Sparkles } from 'lucide-react';
import { sapiensService } from '../../core/services/sapiensService';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { ApiError } from '../../types/apiTypes';
import { AwarenessAlsoOnMindItem, AwarenessHistoryItem, AwarenessResponse } from '../../types/sapiensTypes';

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    user: 'From user input',
    stream: 'From recent activity',
    chat: 'From a conversation',
    memory: 'From memory',
    engine: 'From reflection',
  };
  return labels[source.toLowerCase()] ?? `From ${source.replace(/[_-]+/g, ' ')}`;
}

function recordedTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Time unavailable';
  return date.toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
}
function AlsoOnMind({ items }: { items: AwarenessAlsoOnMindItem[] }) {
  return (
    <section>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-sp-muted">Also on my mind</p>
      <div className="space-y-1.5">
        {items.slice(0, 3).map((item, index) => (
          <div key={`${item.content}-${index}`} className="flex gap-2 rounded-lg border border-sp-accent/10 bg-sp-accent/[0.05] px-2.5 py-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sp-accent" />
            <div className="min-w-0"><p className="text-sm leading-relaxed text-sp-muted">{item.content}</p><p className="mt-1 text-xs text-sp-muted">{sourceLabel(item.source)}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentFocus({ history }: { history: AwarenessHistoryItem[] }) {
  return (
    <section>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-sp-muted">Recent understanding</p>
      {history.length === 0 ? <p className="text-sm text-sp-muted">No earlier understanding yet.</p> : (
        <div className="space-y-0">
          {history.slice(0, 10).map((entry, index) => (
            <div key={entry.id ?? index} className="flex gap-2.5">
              <div className="flex w-3 flex-col items-center">
                <span className="mt-1.5 h-2 w-2 rounded-full border border-sp-accent/40 bg-sp-accent/30" />
                {index < Math.min(history.length, 10) - 1 && <span className="mt-1 min-h-5 w-px flex-1 bg-sp-ink/[0.07]" />}
              </div>
              <div className="min-w-0 flex-1 pb-3">
                <details className="workspace-memory-detail"><summary className="cursor-pointer text-xs text-sp-muted">View understanding<span className="workspace-preview block mt-1 line-clamp-2 text-sm leading-relaxed text-sp-ink">{entry.understanding || entry.focus}</span></summary></details>
                <p className="mt-0.5 text-xs text-sp-muted">Assessment source: {entry.source} · {recordedTimestamp(entry.assessed_at || entry.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function AwarenessPanel({ active = true }: { active?: boolean }) {
  const activeRef = useRef(active);
  activeRef.current = active;
  const wasActive = useRef(active);
  const currentSapiens = useSapiensStore((state) => state.currentSapiens);
  const status = useSapiensStore((state) => state.status);
  const previousStatus = useRef(status);
  const requestId = useRef(0);
  const [data, setData] = useState<AwarenessResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!currentSapiens || !activeRef.current) return;
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

  useEffect(() => { if (active && !wasActive.current) void refresh(); wasActive.current = active; }, [active, refresh]);

  const current = data?.current;
  return (
    <div className="workspace-awareness relative flex h-full flex-col overflow-hidden rounded-2xl" style={{ background: 'rgb(var(--sp-panel-rgb, 8 12 22) / 0.85)', border: '1px solid rgb(var(--sp-accent-rgb, 34 211 238) / 0.18)', boxShadow: '0 0 0 1px rgb(var(--sp-accent-rgb, 34 211 238) / 0.05), inset 0 1px 0 rgb(var(--sp-accent-rgb, 34 211 238) / 0.1), 0 30px 60px rgb(var(--sp-shadow-rgb, 0 0 0) / var(--sp-shadow-opacity, 0.5))', backdropFilter: 'blur(24px)' }}>
      <div className="h-px flex-shrink-0 bg-gradient-to-r from-sp-accent via-sp-accent to-sp-accent" />
      <header className="flex flex-shrink-0 items-center gap-3 border-b border-sp-accent/10 bg-sp-accent/[0.05] px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-sp-accent/25 bg-sp-accent/10"><Eye className="h-4 w-4 text-sp-accent" /></div>
        <div className="min-w-0 flex-1"><p className="text-sm text-sp-ink">On my mind</p><p className="truncate text-xs text-sp-accent">Latest recorded understanding</p></div>
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-sp-accent" />}
      </header>

      {error && <div className="mx-3 mt-3 flex items-start gap-2 rounded-lg border border-red-400/20 bg-red-400/[0.07] px-3 py-2 text-xs text-sp-danger"><AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" /><span>{error}{data ? ' Showing the last successful view.' : ''} <button onClick={() => void refresh()} className="underline">Retry</button></span></div>}

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {!data && loading ? (
          <div className="flex h-full items-center justify-center text-xs text-sp-muted">Loading awareness…</div>
        ) : !current ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sp-line bg-sp-ink/[0.03]"><Orbit className="h-6 w-6 text-sp-muted" /></div>
            <p className="max-w-56 text-xs leading-relaxed text-sp-muted">{error ? 'Understanding is unavailable. Please retry.' : 'Sapiens has not retained an understanding yet.'}</p>
          </div>
        ) : (
          <div className="space-y-5">
            <article className="rounded-xl bg-sp-ink/[0.03] p-4">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-sp-accent"><Sparkles className="h-3 w-3" /> Latest understanding</div>
              <details className="workspace-memory-detail"><summary className="cursor-pointer text-xs text-sp-muted">Read full understanding<span className="workspace-preview block mt-2 line-clamp-4 text-sm leading-relaxed text-sp-ink">{current.understanding || current.focus}</span></summary></details>
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-sp-muted">
                {current.state && <span className="rounded-md border border-sp-line bg-sp-ink/[0.04] px-2 py-1 capitalize">Assessment: {current.state}</span>}

                <span className="flex items-center gap-1 rounded-md border border-sp-line bg-sp-ink/[0.04] px-2 py-1"><Clock3 className="h-2.5 w-2.5" />{recordedTimestamp(current.assessed_at || current.created_at)}</span>
              </div>
              {current.remaining && <p className="mt-3 text-xs leading-relaxed text-sp-warning"><span className="text-sp-muted">Still unresolved: </span>{current.remaining}</p>}
            </article>
            {typeof current.confidence === 'number' && <details><summary className="text-xs text-sp-muted cursor-pointer">Assessment details</summary><p className="mt-2 text-sm text-sp-muted">Self-reported confidence: {Math.round(current.confidence * 100)}%. This is an assessment, not confirmation of an outcome.</p></details>}
            {current.subject && <article className="rounded-xl border border-sp-accent/10 bg-sp-accent/[0.04] p-3"><p className="text-xs font-medium uppercase tracking-[0.14em] text-sp-accent">Prompted by</p><p className="mt-2 text-sm leading-relaxed text-sp-muted">{current.subject.content}</p><p className="mt-1 text-xs text-sp-muted">{sourceLabel(current.subject.source)}{current.subject.event_at ? ` · ${recordedTimestamp(current.subject.event_at)}` : ''}</p></article>}
            {(current.also_on_mind?.length ?? 0) > 0 && <AlsoOnMind items={current.also_on_mind ?? []} />}
            <RecentFocus history={(data?.history ?? []).filter(entry => !current.id || entry.id !== current.id)} />
          </div>
        )}
      </div>
    </div>
  );
}
