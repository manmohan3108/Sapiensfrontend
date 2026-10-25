import { useEffect, useRef } from 'react';

const wave = (phase: number) => Array.from({ length: 121 },(_,i) => {
  const x = i * 4;
  return `${i?'L':'M'}${x},${90 + Math.sin(x / 80 * Math.PI * 2 + phase) * 37}`;
}).join(' ');
const bell = (mean: number, sigma: number) => Array.from({ length: 91 },(_,i) => {
  const x = i * 3;
  return `${i?'L':'M'}${x},${155 - 120 * Math.exp(-.5 * ((x - mean) / sigma) ** 2)}`;
}).join(' ');

// Marginal studies decorate the notebook; they do not represent product metrics.
export function SciencePageAnnotations() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const elements = [...(ref.current?.querySelectorAll('svg') ?? [])];
    const visible = new Set<Element>();
    const sync = () => elements.forEach(element => element.classList.toggle('science-note-active',visible.has(element) && !document.hidden));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
      sync();
    });
    elements.forEach(element => observer.observe(element));
    document.addEventListener('visibilitychange',sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange',sync); };
  }, []);
  return <div className="science-page-annotations" ref={ref} aria-hidden="true">
    <svg className="science-margin-wave" viewBox="0 0 300 180" fill="none">
      <path d="M0 90H300" className="science-note-axis"/>
      <g className="science-wave-phase"><path d={wave(0)}/><path d={wave(Math.PI*.7)} className="science-note-secondary"/></g>
    </svg>
    <svg className="science-margin-branch" viewBox="0 0 240 280" fill="none">
      <path d="M120 270V205M120 205L65 153M120 205L175 153M65 153L30 100M65 153L95 100M175 153L145 100M175 153L210 100M30 100L12 50M30 100L47 50M95 100L76 50M95 100L114 50M145 100L126 50M145 100L164 50M210 100L191 50M210 100L229 50"/>
      {[[30,100],[95,100],[145,100],[210,100],[65,153],[175,153],[120,205]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="4" className="science-note-node"/>)}
    </svg>
    <svg className="science-margin-probability" viewBox="0 0 280 180" fill="none">
      <path d="M5 155H275M15 160V20" className="science-note-axis"/>
      <path d={bell(115,48)} className="science-note-secondary"/>
      <path d={bell(155,26)} className="science-probability-trace" pathLength="100"/>
      <path d="M155 155V35" className="science-note-axis"/>
    </svg>
  </div>;
}
