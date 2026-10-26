import type { ReactNode } from 'react';
import { RefreshCw, SlidersHorizontal } from 'lucide-react';

/** Keep applied scope and refresh visible while secondary controls stay folded.
 * Native details keeps form values mounted and supports keyboard interaction. */
export function AnalyseControls({ children, summary, onRefresh, busy = false, label = 'Filters & search' }: {
  children: ReactNode; summary: string; onRefresh?: () => void; busy?: boolean; label?: string;
}) {
  return <section className={`analyse-controls${onRefresh ? ' has-refresh' : ''}`} aria-label={label}>
    <details>
      <summary><SlidersHorizontal size={15} aria-hidden="true" /><strong>{label}</strong><span title={summary}>{summary}</span></summary>
      <div className="analyse-controls-body">{children}</div>
    </details>
    {onRefresh && <button type="button" className="analyse-controls-refresh" onClick={onRefresh} disabled={busy}><RefreshCw size={15} aria-hidden="true" className={busy ? 'animate-spin' : ''} /><span>Refresh</span></button>}
  </section>;
}
