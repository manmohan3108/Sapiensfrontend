import { useId, useState } from 'react';
import { RateLimitButton } from './RateLimitButton';
import type { RateLimitBucket } from '../../core/api/rateLimits';
import * as Popover from '@radix-ui/react-popover';
import { Clock3, ChevronDown, X } from 'lucide-react';
import '../../../styles/pause-schedule.css';

const pauseTime = (value: string) => new Intl.DateTimeFormat(undefined, {
  day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
}).format(new Date(value));

/** Presentation only: each runtime owns its persisted schedule and pause behavior. */
export function PauseScheduleControl({ label, scheduledAt, disabled, onSchedule, rateLimitBucket = 'api_write' }: {
  label: string; scheduledAt?: string | null; disabled: boolean;
  onSchedule: (minutes: number | null) => void;
  rateLimitBucket?: RateLimitBucket;
}) {
  const id = useId();
  const [minutes, setMinutes] = useState(60);
  const validTime = scheduledAt && Number.isFinite(Date.parse(scheduledAt)) ? scheduledAt : null;
  return <div className="pause-schedule">
    <Popover.Root>
      <Popover.Trigger asChild>
        <button type="button" className="pause-schedule-trigger" data-scheduled={Boolean(validTime)} disabled={disabled}>
          <Clock3 size={17} aria-hidden="true" />
          <span className="pause-schedule-trigger-copy">
            <span>{validTime ? 'Pause scheduled' : 'Schedule pause'}</span>
            {validTime && <time dateTime={validTime}>{pauseTime(validTime)}</time>}
          </span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </Popover.Trigger>
      {/* Inline Radix content inherits this screen's theme; its fixed positioning avoids header reflow. */}
      <Popover.Content className="pause-schedule-panel" align="end" sideOffset={8} collisionPadding={12}
        aria-labelledby={`${id}-title`} aria-describedby={`${id}-help`}>
        <div className="pause-schedule-heading">
          <h2 id={`${id}-title`}>{validTime ? 'Manage pause timer' : 'Schedule a pause'}</h2>
          <Popover.Close className="pause-schedule-close" aria-label="Close pause timer"><X size={18} aria-hidden="true" /></Popover.Close>
        </div>
        <p id={`${id}-help`}>Pause {label} automatically. The timer uses real time and works even when this page is closed.</p>
        {validTime && <p className="pause-schedule-current">Scheduled for <time dateTime={validTime}>{pauseTime(validTime)}</time></p>}
        <fieldset className="pause-schedule-options" disabled={disabled}>
          <legend>{validTime ? 'Replace with a new timer' : 'Pause after'}</legend>
          <div className="pause-schedule-durations">
            {[1, 2, 4, 8].map(hours => <label key={hours}>
              <input type="radio" name={id} value={hours * 60} checked={minutes === hours * 60}
                onChange={() => setMinutes(hours * 60)} />
              <span>{hours} {hours === 1 ? 'hour' : 'hours'}</span>
            </label>)}
          </div>
        </fieldset>
        <p className="pause-schedule-caption">Starts when you save the timer.</p>
        <div className="pause-schedule-actions">
          <RateLimitButton rateLimitBucket={rateLimitBucket} type="button" className="pause-schedule-save" disabled={disabled} onClick={() => onSchedule(minutes)}>
            {validTime ? 'Update timer' : 'Schedule pause'}
          </RateLimitButton>
          {validTime && <RateLimitButton rateLimitBucket={rateLimitBucket} type="button" className="pause-schedule-cancel" disabled={disabled} onClick={() => onSchedule(null)}>Cancel timer</RateLimitButton>}
        </div>
      </Popover.Content>
    </Popover.Root>
    <span className="sr-only" role="status" aria-live="polite">{validTime && <>Scheduled pause: <time dateTime={validTime}>{pauseTime(validTime)}</time></>}</span>
  </div>;
}
