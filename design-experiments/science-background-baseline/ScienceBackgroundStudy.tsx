import { useEffect, useRef } from 'react';
import '../../../styles/science-background-study.css';

/** Optional, decorative science-preview layer. Remove its single mount to revert. */
export function ScienceBackgroundStudy() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    // Anchor to actual whitespace rather than a percentage hidden under a panel.
    const page = layer.parentElement;
    const opening = page?.querySelector('.experience-opening');
    const placeCurve = () => {
      if (!page || !opening) return;
      const top = opening.getBoundingClientRect().bottom - page.getBoundingClientRect().top - 58;
      layer.style.setProperty('--study-curve-top', `${top}px`);
    };
    const resize = new ResizeObserver(placeCurve);
    if (page) resize.observe(page);
    if (opening) resize.observe(opening);
    placeCurve();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('is-in-view', entry.isIntersecting));
    });
    layer.querySelectorAll('svg').forEach(element => observer.observe(element));
    const visibility = () => layer.classList.toggle('is-paused', document.hidden);
    document.addEventListener('visibilitychange', visibility);
    visibility();
    return () => { resize.disconnect(); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  return <div ref={ref} className="science-background-study" aria-hidden="true">
    <svg className="science-background-study__construction" viewBox="0 0 300 360" focusable="false">
      <circle cx="115" cy="165" r="98"/>
      <circle cx="115" cy="165" r="64" strokeDasharray="3 7"/>
      <path d="M17 165H260M115 36V300M17 165L184 96L213 165ZM184 96L250 30M184 96L250 162"/>
      <path d="M170 110L184 124L198 110M115 145A20 20 0 0 1 135 165"/>
      <g className="science-background-study__points"><circle cx="115" cy="165" r="3"/><circle cx="184" cy="96" r="3"/><circle cx="213" cy="165" r="3"/></g>
    </svg>
    <svg className="science-background-study__conic" viewBox="0 0 280 420" focusable="false">
      <path strokeDasharray="3 8" d="M140 15V405M15 210H265"/>
      {[48, 78, 108].map(r => <ellipse key={r} cx="140" cy="210" rx={r} ry={r * 1.65}/>)}
      <path d="M55 50L230 370M50 280L240 150"/>
    </svg>
    <svg className="science-background-study__contours" viewBox="0 0 280 620" focusable="false">
      {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${20+i*19} -20C${240+i*12} 130 ${-150+i*22} 280 ${40+i*22} 410S${230+i*9} 550 ${60+i*20} 650`}/>)}
    </svg>
    <svg className="science-background-study__curve" viewBox="0 0 900 110" focusable="false">
      <path strokeDasharray="2 9" d="M0 55H900"/>
      {[0, 1, 2].map(i => <path key={i} d={`M-50 ${55+i*9}C100 ${-12+i*9} 180 ${122-i*9} 300 55S490 ${-12+i*9} 600 55S790 ${122-i*9} 950 ${55-i*9}`}/>)}
    </svg>
    <svg className="science-background-study__footer" viewBox="0 0 620 180" focusable="false">
      {Array.from({ length: 5 }, (_, i) => <path key={i} d={`M-20 ${35+i*22}C120 ${-15+i*18} 230 ${195-i*16} 380 ${95+i*8}S550 ${25+i*13} 650 ${80+i*17}`}/>)}
    </svg>
  </div>;
}
