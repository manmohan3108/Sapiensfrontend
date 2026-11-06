import { useEffect, useRef, useState } from 'react';

type LiveSimulatedTimeProps = {
  value: string;
  endAt: string;
  speed: number;
  advancing: boolean;
  variant?: 'full' | 'compact';
};

const format = (value: Date, variant: 'full' | 'compact') =>
  value.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: variant === 'full' ? 'long' : 'short',
    day: 'numeric',
    month: 'short',
    ...(variant === 'full' ? { year: 'numeric' as const } : {}),
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }) + ' IST';

export function LiveSimulatedTime({
  value,
  endAt,
  speed,
  advancing,
  variant = 'full',
}: LiveSimulatedTimeProps) {
  const anchor = useRef({
    value,
    endAt,
    speed,
    advancing,
    receivedAt: Date.now(),
  });
  const current = anchor.current;
  if (
    current.value !== value ||
    current.endAt !== endAt ||
    current.speed !== speed ||
    current.advancing !== advancing
  )
    anchor.current = { value, endAt, speed, advancing, receivedAt: Date.now() };

  const [, tick] = useState(0);
  useEffect(() => {
    if (!advancing) return;
    const timer = window.setInterval(() => tick(count => count + 1), 250);
    return () => window.clearInterval(timer);
  }, [advancing]);

  const snapshot = anchor.current;
  const base = new Date(snapshot.value).getTime();
  const projected = snapshot.advancing
    ? base + (Date.now() - snapshot.receivedAt) * snapshot.speed
    : base;
  const displayed = new Date(
    Math.min(projected, new Date(snapshot.endAt).getTime()),
  );

  return <time className="tabular-nums" dateTime={displayed.toISOString()}>{format(displayed, variant)}</time>;
}
