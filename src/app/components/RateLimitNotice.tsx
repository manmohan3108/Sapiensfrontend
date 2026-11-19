import { rateLimitLabels, secondsRemaining, useRateLimitCountdown, type RateLimitBucket } from '../core/api/rateLimits';

export function RateLimitNotice() {
  const remaining = useRateLimitCountdown();
  if (!remaining) return null;
  const buckets = (Object.keys(rateLimitLabels) as RateLimitBucket[]).filter(bucket => secondsRemaining(bucket) > 0);
  return <aside className="product-surface science-product-theme fixed bottom-4 left-4 z-[100] max-w-[min(24rem,calc(100vw-2rem)) rounded-xl border border-sp-line bg-sp-panel px-4 py-3 text-sm text-sp-ink shadow-lg">
    <p role="status">Request limit reached. Retry manually when the wait ends.</p>
    {buckets.map(bucket => <p key={bucket} className="mt-1 tabular-nums" role="timer" aria-live="off">
      {rateLimitLabels[bucket]}: try again in {secondsRemaining(bucket)} seconds.
    </p>)}
  </aside>;
}
