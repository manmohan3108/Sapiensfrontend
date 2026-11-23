import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router';
import { Pause, Play } from 'lucide-react';
import { useWorkspaceActivity } from '../../hooks/useWorkspaceActivity';
import type { WorkspaceActivityItem } from '../../core/services/workspaceActivityService';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../ui/dialog';
import '../../../styles/workspace-activity.css';

const shortTime = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const fullTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function detailPath(sapienId: string, item: WorkspaceActivityItem): string {
  if (item.kind === 'awareness') {
    return '/admin/analyse/awareness?' + new URLSearchParams({ awarenessFor: sapienId, awarenessRun: item.reference.id });
  }
  const params = new URLSearchParams({ motorFor: sapienId, motorRecord: item.reference.id });
  if (item.scope) params.set('motor_scope', item.scope);
  return '/admin/analyse/motor?' + params;
}

export function ActivityTicker({ sapienId }: { sapienId: string }) {
  const { data, error, visible } = useWorkspaceActivity(sapienId);
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [items, setItems] = useState<WorkspaceActivityItem[]>([]);
  const signature = useRef('');
  const frozen = paused || open || hovered || focused;

  useEffect(() => {
    if (!data || (frozen && items.length > 0)) return;
    const next = JSON.stringify(data.items);
    if (next !== signature.current) {
      signature.current = next;
      setItems(data.items);
    }
  }, [data, frozen, items.length]);

  const text = items.map(item => (item.scope ? 'Simulation: ' : '') + item.headline + ' · ' + shortTime.format(new Date(item.occurred_at))).join('   •   ');
  const stopped = frozen || !visible || error;
  const style = { '--activity-duration': Math.max(35, text.length / 5) + 's' } as CSSProperties;
  const empty = error ? 'Activity updates unavailable' : data ? 'No recorded activity yet' : 'Loading recent activity…';

  return <Dialog open={open} onOpenChange={setOpen}>
    <div className="workspace-activity" data-paused={stopped} style={style}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <span className="workspace-activity-label">{error ? 'Unavailable' : 'Recent'}</span>
      <DialogTrigger asChild>
        <button type="button" className="workspace-activity-open" aria-label="Open recent recorded activity">
          {items.length > 0 ? <span className="workspace-activity-track" aria-hidden="true">
            <span>{text}<span className="workspace-activity-separator"> • </span></span>
            <span>{text}<span className="workspace-activity-separator"> • </span></span>
          </span> : <span className="workspace-activity-empty">{empty}</span>}
        </button>
      </DialogTrigger>
      {items.length > 0 && <button type="button" className="workspace-activity-pause"
        aria-label={paused ? 'Resume headline scrolling' : 'Pause headline scrolling'} aria-pressed={paused}
        onClick={() => setPaused(value => !value)}>
        {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
      </button>}
    </div>
    <DialogContent className="product-surface science-product-theme workspace-activity-dialog">
      <DialogTitle>Recent activity</DialogTitle>
      <DialogDescription>Saved actions and updates. These do not indicate what is running right now.</DialogDescription>
      {error && <p role="status" className="workspace-activity-notice">Updates are unavailable. Any entries below are from the last successful refresh.</p>}
      {items.length === 0 ? <p>{empty}</p> : <ul>
        {items.map(item => <li key={item.id}>
          <Link to={detailPath(sapienId, item)}>{item.headline}</Link>
          <small><time dateTime={item.occurred_at}>{fullTime.format(new Date(item.occurred_at))}</time>
            {item.scope ? ' · Simulation' : ''}{item.kind === 'awareness' ? ' · Recorded interpretation' : ''}
            {item.headline_shortened ? ' · Shortened; open the record for more' : ''}
          </small>
        </li>)}
      </ul>}
      {data && <p className="workspace-activity-updated">Last refreshed {fullTime.format(new Date(data.as_of))}</p>}
    </DialogContent>
  </Dialog>;
}