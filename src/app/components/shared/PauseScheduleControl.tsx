import { useId, useState } from 'react';
import { Button } from '../ui/button';

const pauseTime = (value: string) => new Intl.DateTimeFormat(undefined, {
  day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
}).format(new Date(value));

/** Presentation only: each runtime owns its persisted schedule and pause behavior. */
export function PauseScheduleControl({ label, scheduledAt, disabled, onSchedule }: {
  label: string; scheduledAt?: string | null; disabled: boolean;
  onSchedule: (minutes: number | null) => void;
}) {
  const id = useId();
  const [minutes, setMinutes] = useState(60);
  const validTime = scheduledAt && Number.isFinite(Date.parse(scheduledAt)) ? scheduledAt : null;
  return <details className="w-full min-w-0 text-sm">
    <summary className="w-fit cursor-pointer rounded-sm py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
      {validTime ? <>Pause scheduled: <time dateTime={validTime}>{pauseTime(validTime)}</time></> : 'Pause later…'}
    </summary>
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <label htmlFor={id}>Pause after</label>
      <select id={id} name="pause_after_minutes" value={minutes} disabled={disabled}
        aria-label={`Pause ${label} after`} aria-describedby={`${id}-help`}
        onChange={event => setMinutes(Number(event.target.value))}
        className="min-h-10 rounded-md border border-input bg-background px-2 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50">
        {[1, 2, 4, 8].map(hours => <option key={hours} value={hours * 60}>{hours} {hours === 1 ? 'hour' : 'hours'}</option>)}
      </select>
      <Button type="button" variant="outline" size="sm" disabled={disabled} className="min-h-10 transition-colors"
        onClick={() => onSchedule(minutes)}>{validTime ? 'Replace timer' : 'Schedule pause'}</Button>
      {validTime && <Button type="button" variant="ghost" size="sm" disabled={disabled} className="min-h-10 transition-colors"
        onClick={() => onSchedule(null)}>Cancel timer</Button>}
    </div>
    <p id={`${id}-help`} className="pt-2 text-muted-foreground">Real time, even when this page is closed.</p>
    <span className="sr-only" role="status" aria-live="polite">{validTime && <>Scheduled pause: <time dateTime={validTime}>{pauseTime(validTime)}</time></>}</span>
  </details>;
}
