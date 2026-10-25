import { useLandingMotion } from './useLandingMotion';
import '../../../styles/science-detail.css';

/** Decorative notebook figures; never a metric or an interactive control. */
export function ScienceDetail({ variant = 'wave' }: { variant?: 'wave' | 'auth' | 'surround' }) {
  const motion = useLandingMotion();
  const wave = variant === 'wave';
  const auth = variant === 'auth';
  return <div ref={motion} className={`science-detail science-detail--${variant}`} aria-hidden="true">
    <svg data-motion-scene viewBox={wave ? '0 0 200 70' : auth ? '0 0 360 300' : '0 0 360 160'} fill="none" focusable="false">
      {wave ? <>
        <path className="science-detail-guide" d="M10 35H190M20 12V58M60 31V39M100 31V39M140 31V39M180 31V39" />
        <path className="science-detail-curve" d="M20 35C40 -1 60 -1 80 35S120 71 140 35S170 8 186 25" />
        <circle className="science-detail-tracer" cx="20" cy="35" r="3" />
      </> : <>
        <g className="science-detail-construction" transform={auth ? 'translate(14 20)' : 'translate(22 30)'}>
          <circle cx="38" cy="38" r="32" /><path d="M6 38H70M38 6V70M10 62L38 6L66 62ZM10 62H66" />
          <path className="science-detail-guide" d="M-2 78H78M38 -4V0" />
          <circle className="science-detail-dot" cx="38" cy="6" r="3" />
        </g>
        <g transform={auth ? 'translate(313 48)' : 'translate(303 25)'}>
          <path className="science-detail-guide" d="M-24 0H24M-16 -5L-20 0M-4 -5L-8 0M8 -5L4 0M20 -5L16 0M0 5V100M-29 92Q0 107 29 92" />
          <g className="science-detail-swing"><path d="M0 0V88" /><circle className="science-detail-bob" cy="88" r="8" /></g>
          <circle className="science-detail-dot" r="3" />
        </g>
        {auth && <g transform="translate(58 235)">
          <path className="science-detail-guide" d="M0 28H244M12 0V53" />
          <path className="science-detail-curve" d="M12 28C36 -2 60 -2 84 28S132 58 156 28S204 -2 232 28" />
        </g>}
      </>}
    </svg>
  </div>;
}
