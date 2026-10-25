import { useEffect, useRef } from 'react';

const radius = 27;
const angleAt = (y: number, phase: number) => (y - 20) * Math.PI / 80 + phase;
const rungs = Array.from({ length: 21 }, (_, i) => 20 + i * 16);
function strand(phase: number, side: number) {
  return Array.from({ length: 81 }, (_, i) => {
    const y = 20 + i * 4;
    return `${i ? 'L' : 'M'}${(45 + side * radius * Math.sin(angleAt(y, phase))).toFixed(2)} ${y}`;
  }).join(' ');
}

/** Both backbones and every rung use the same helix projection. */
export function ScienceDnaFigure() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const paths = svg.querySelectorAll<SVGPathElement>('.study-dna-strand');
    const links = svg.querySelectorAll<SVGGElement>('.study-dna-rung');
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, frame = 0, last = 0, phase = 0;
    const draw = () => {
      paths[0].setAttribute('d', strand(phase, 1));
      paths[1].setAttribute('d', strand(phase, -1));
      links.forEach((link, i) => {
        const angle = angleAt(rungs[i], phase);
        link.setAttribute('transform', `translate(45 ${rungs[i]}) scale(${Math.sin(angle).toFixed(4)} 1)`);
        link.setAttribute('opacity', String(.35 + .45 * Math.abs(Math.sin(angle))));
      });
    };
    const tick = (now: number) => {
      if (!last) last = now;
      if (now - last >= 1000 / 30) {
        phase = (phase + Math.min(now - last, 100) * Math.PI * 2 / 14000) % (Math.PI * 2);
        last = now;
        draw();
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame); frame = 0; last = 0;
      if (preference.matches) { phase = 0; draw(); }
      else if (visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(svg);
    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    draw();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect();
      preference.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);
  return <svg ref={ref} className="study-helix" viewBox="0 0 90 360" focusable="false" aria-hidden="true">
    {rungs.map(y => <g key={y} className="study-dna-rung" opacity=".6" transform={`translate(45 ${y}) scale(${Math.sin(angleAt(y, 0))} 1)`}>
      <path d="M-27 0H0"/><path className="study-copper" d="M0 0H27"/>
    </g>)}
    <path className="study-dna-strand" d={strand(0, 1)}/>
    <path className="study-dna-strand study-copper" d={strand(0, -1)}/>
  </svg>;
}
