import type { ReactNode } from 'react';
import { useId, useState } from 'react';
import { RefreshCw, SlidersHorizontal } from 'lucide-react';

/** Primary controls stay available. Only less frequent controls belong in children.
 * Hidden advanced controls stay mounted, including unapplied form edits. */
export function AnalyseControls({ children, primary, filters = [], summary, onRefresh, busy = false, label = 'More filters' }: {
  children?: ReactNode; primary?: ReactNode; filters?: { label: string; onRemove: () => void }[];
  summary: string; onRefresh?: () => void; busy?: boolean; label?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const controlsId = useId();
  return <section className="analyse-controls" aria-label="View controls">
    <div className="analyse-controls-primary">
      {primary}
      {children && <button type="button" className="analyse-controls-more" aria-expanded={expanded} aria-controls={controlsId} onClick={() => setExpanded(value => !value)}><SlidersHorizontal size={15} aria-hidden="true" />{label}{filters.length > 0 && <span>({filters.length})</span>}</button>}
      {onRefresh && <button type="button" className="analyse-controls-refresh" onClick={onRefresh} disabled={busy}><RefreshCw size={15} aria-hidden="true" className={busy ? 'animate-spin' : ''} /><span>Refresh</span></button>}
    </div>
    <div className="analyse-controls-scope"><span>{summary}</span>{filters.map(filter => <button type="button" key={filter.label} className="analyse-filter-chip" aria-label={`Remove ${filter.label} filter`} onClick={filter.onRemove}>{filter.label}<span aria-hidden="true">×</span></button>)}</div>
    {children && <div id={controlsId} hidden={!expanded} className="analyse-controls-body" onInvalidCapture={event => { setExpanded(true); const field = event.target as HTMLElement; requestAnimationFrame(() => field.focus()); }}>{children}</div>}
  </section>;
}
