import { useEffect, useRef, useState } from 'react';

// Connections follow the actual artwork positions, including responsive layouts.
export function ScienceScene() {
  const ref = useRef<SVGSVGElement>(null);
  const [drawing, setDrawing] = useState({ width: 600, height: 730, paths: [] as string[] });
  useEffect(() => {
    const svg = ref.current;
    const scene = svg?.closest('.experience-capability-scene');
    if (!svg || !scene) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = svg.getBoundingClientRect();
        const core = scene.querySelector('.experience-hero-core')?.getBoundingClientRect();
        if (!core || !bounds.width || !bounds.height) return;
        const x = core.left + core.width / 2 - bounds.left;
        const y = core.top + core.height / 2 - bounds.top;
        const paths = [...scene.querySelectorAll('.experience-capability-art')].map(element => {
          const art = element.getBoundingClientRect();
          const endX = art.left + art.width / 2 - bounds.left;
          const endY = art.top + art.height / 2 - bounds.top;
          const midX = x + (endX - x) * .6;
          return `M${x} ${y}C${midX} ${y} ${midX} ${endY} ${endX} ${endY}`;
        });
        setDrawing({ width: bounds.width, height: bounds.height, paths });
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(scene);
    scene.querySelectorAll('.experience-capabilities li').forEach(element => observer.observe(element));
    measure();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  return <div className="science-scene" aria-hidden="true"><svg ref={ref} viewBox={`0 0 ${drawing.width} ${drawing.height}`}>
    <g className="science-plot-ruler">
      <path d={`M16 65V${drawing.height-55}H${drawing.width-16}`}/>
      {Array.from({ length: 13 }, (_, i) => {
        const y = 75 + i * (drawing.height - 140) / 12;
        return <path key={`y${i}`} d={`M16 ${y}h${i % 3 === 0 ? 10 : 5}`}/>;
      })}
      {Array.from({ length: 13 }, (_, i) => {
        const x = 25 + i * (drawing.width - 50) / 12;
        return <path key={`x${i}`} d={`M${x} ${drawing.height-55}v${i % 3 === 0 ? -10 : -5}`}/>;
      })}
    </g>
    {drawing.paths.map((d,index) => <g key={index}>
      <path className="science-connection" d={d}/>
      <path className="science-connection-signal" d={d} pathLength="100" style={{ animationDelay: `${index * -.8}s`, animationDirection: index % 2 ? 'reverse' : 'normal' }}/>
    </g>)}
  </svg><span className="science-map-note">CONNECTION MAP</span></div>;
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
