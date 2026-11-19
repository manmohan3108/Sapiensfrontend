import { forwardRef, useId, type ComponentProps } from 'react';
import { secondsRemaining, useRateLimitCountdown, type RateLimitBucket } from '../../core/api/rateLimits';

/** Opt-in admission feedback; handlers and the server still enforce admission. */
export const RateLimitButton = forwardRef<HTMLButtonElement, ComponentProps<'button'> & {
  rateLimitBucket?: RateLimitBucket | false;
}>(function RateLimitButton({ rateLimitBucket = 'api_write', disabled, onClick, children, ...props }, ref) {
  const countdown = useRateLimitCountdown(rateLimitBucket || 'api_write');
  const seconds = rateLimitBucket ? countdown : 0;
  const id = useId();
  return <>
    <button {...props} ref={ref} disabled={disabled || seconds > 0}
      aria-describedby={[props['aria-describedby'], seconds > 0 ? id : null].filter(Boolean).join(' ') || undefined}
      onClick={event => {
        if (disabled || (rateLimitBucket && secondsRemaining(rateLimitBucket) > 0)) { event.preventDefault(); return; }
        onClick?.(event);
      }}>{children}</button>
    {seconds > 0 && <span id={id} role="timer" aria-live="off" className="text-sm tabular-nums">Try again in {seconds} seconds.</span>}
  </>;
});
