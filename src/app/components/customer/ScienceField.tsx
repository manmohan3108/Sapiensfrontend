import { useEffect, useRef, type CSSProperties } from 'react';

type Study = 'signals' | 'learning' | 'connections';
const captions: Record<Study, [string, string, string]> = {
  signals: ['01 / SIGNALS', 'Many signals. New patterns.', 'Wave interference'],
  learning: ['02 / EXPERIENCE', 'New evidence changes expectations.', 'Probability distributions'],
  connections: ['03 / POSSIBILITIES', 'One connection opens another.', 'Recursive branching'],
};
const wave = (phase: number, amplitude: number) => Array.from({ length: 181 }, (_, i) => {
  const x = i * 5;
  return `${i ? 'L' : 'M'}${x},${120 + Math.sin(x / 160 * Math.PI * 2 + phase) * amplitude * Math.sin(x / 900 * Math.PI)}`;
}).join(' ');
const distribution = (mean: number, sigma: number) => Array.from({ length: 181 }, (_, i) => {
  const x = i * 5;
  return `${i ? 'L' : 'M'}${x},${195 - 160 * Math.exp(-.5 * ((x - mean) / sigma) ** 2)}`;
}).join(' ');
const branches: { path: string; x: number; y: number; depth: number }[] = [];
function grow(x: number, y: number, angle: number, length: number, depth: number) {
  const nx = x + Math.cos(angle) * length;
  const ny = y + Math.sin(angle) * length;
  branches.push({ path: `M${x},${y}L${nx},${ny}`, x: nx, y: ny, depth });
  if (depth < 4) {
    grow(nx, ny, angle - .52, length * .67, depth + 1);
    grow(nx, ny, angle + .52, length * .67, depth + 1);
  }
}
grow(70, 120, 0, 240, 0);

// Mathematical visual studies, not measured product performance or architecture.
export function ScienceField({ study }: { study: Study }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let visible = false;
    const sync = () => element.classList.toggle('science-field-active', visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);
  const [index, title, name] = captions[study];
  return <figure className={`science-field science-field-${study}`} ref={ref}>
    <figcaption><span>{index}</span><strong>{title}</strong><small>{name} · a visual metaphor</small></figcaption>
    <div className="science-field-drawing" aria-hidden="true">
      <svg viewBox={study === 'connections' ? '0 -190 850 620' : '0 0 900 240'} fill="none">
        {study === 'signals' && <>
          <path d="M0 120H900" className="science-field-axis"/>
          {Array.from({ length: 9 }, (_, i) => <path key={i} d={wave(i * .34, 82)} className={`science-field-wave science-field-tone-${i % 3}`} style={{ '--phase': `${i * -.6}s` } as CSSProperties} pathLength="100"/>)}
          <path d={wave(.6, 82)} className="science-field-pulse" pathLength="100"/>
          <text x="25" y="220">f(t) + g(t)</text><text x="710" y="220">→ new patterns</text>
        </>}
        {study === 'learning' && <>
          <path d="M20 195H880M80 195V25" className="science-field-axis"/>
          {[280, 430, 560].map((mean, i) => <path key={mean} d={distribution(mean, 145 - i * 40)} pathLength="100" className={`science-field-distribution science-field-tone-${i}`} style={{ '--phase': `${i * -2}s` } as CSSProperties}/>)}
          {[150, 225, 315, 385, 460, 525, 610, 700, 790].map((x, i) => <circle key={x} cx={x} cy={207} r="3" className="science-field-evidence" style={{ '--phase': `${i * -.7}s` } as CSSProperties}/>)}
          <text x="120" y="235">prior experience</text><text x="640" y="235">+ new evidence</text>
        </>}
        {study === 'connections' && <>
          {branches.map((branch, i) => <g key={i} style={{ '--depth': branch.depth } as CSSProperties}>
            <path d={branch.path} className="science-field-branch-base"/>
            <path d={branch.path} pathLength="100" className={`science-field-branch science-field-tone-${branch.depth % 3}`}/>
            <circle cx={branch.x} cy={branch.y} r={branch.depth === 4 ? 5 : 7} className="science-field-junction"/>
          </g>)}
          <circle cx="70" cy="120" r="11" className="science-field-origin"/>
          <text x="28" y="175">n</text><text x="745" y="120">2ⁿ</text>
        </>}
      </svg>
    </div>
  </figure>;
}
