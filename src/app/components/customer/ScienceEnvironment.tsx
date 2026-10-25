import { useEffect, useRef } from 'react';

// Static notebook marks keep the hero distinct from the system diagram below.
export function ScienceScene() {
  return <div className="science-scene" aria-hidden="true">
    <svg viewBox="0 0 600 730" preserveAspectRatio="none">
      <g className="science-plot-ruler">
        <path d="M16 65V675H584"/>
        {Array.from({ length: 13 }, (_, i) =>
          <path key={'y'+i} d={'M16 '+(75+i*48)+'h'+(i%3===0?10:5)}/>
        )}
        {Array.from({ length: 13 }, (_, i) =>
          <path key={'x'+i} d={'M'+(25+i*45)+' 675v'+(i%3===0?-10:-5)}/>
        )}
      </g>
    </svg>
  </div>;
}

export function ScienceEnvironment() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const layer = ref.current;
    if (!layer) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      if (document.hidden) return;
      const y = preference.matches ? 0 : Math.min(scrollY, 12000);
      layer.style.setProperty('--science-near', `${-y * .075}px`);
      layer.style.setProperty('--science-far', `${-y * .025}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    window.addEventListener('scroll', schedule, { passive: true });
    document.addEventListener('visibilitychange', schedule);
    preference.addEventListener('change', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      document.removeEventListener('visibilitychange', schedule);
      preference.removeEventListener('change', schedule);
    };
  }, []);
  return <div className="science-environment" ref={ref} aria-hidden="true">
    <div className="science-grid"/>
    <svg className="science-wire-sphere" viewBox="0 0 340 340" fill="none">
      <circle cx="170" cy="170" r="150"/>
      {[40, 80, 120].map(r => <ellipse key={r} cx="170" cy="170" rx={r} ry="150"/>)}
      {[40, 80, 120].map(r => <ellipse key={r} cx="170" cy="170" rx="150" ry={r}/>)}
    </svg>
    <svg className="science-wave" viewBox="0 0 240 600" fill="none">
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${10+i*15} 0C${220+i*5} 150 ${-100+i*13} 300 ${65+i*15} 430S${110+i*8} 540 ${15+i*16} 600`}/>)}
    </svg>
    <div className="science-axis"><span>+</span><span>+</span><span>+</span><span>+</span></div>
  </div>;
}
