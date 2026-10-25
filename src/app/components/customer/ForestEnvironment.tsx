import { useEffect, useRef } from 'react';

export function ForestEnvironment() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const layer = ref.current;
    const page = layer?.parentElement;
    if (!layer || !page) return;
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let travel = 1;
    const update = () => {
      frame = 0;
      if (document.hidden) return;
      const progress = reducedMotion.matches ? 0 : Math.max(0, Math.min(1, window.scrollY / travel));
      layer.style.setProperty('--forest-distance', `${-progress * 65}px`);
      layer.style.setProperty('--forest-trees', `${-progress * 190}px`);
      layer.style.setProperty('--forest-ferns', `${-progress * 310}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const measure = () => {
      travel = Math.max(1, page.scrollHeight - window.innerHeight);
      schedule();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(page);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    document.addEventListener('visibilitychange', schedule);
    reducedMotion.addEventListener('change', schedule);
    measure();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      document.removeEventListener('visibilitychange', schedule);
      reducedMotion.removeEventListener('change', schedule);
    };
  }, []);
  return <div className="forest-environment" ref={ref} aria-hidden="true">
    <img className="forest-distance" src="/concepts/forest-clearing.webp" alt="" width="1536" height="1024" fetchPriority="high"/>
    <div className="forest-reading-light"/>
    <img className="forest-tree-plane" src="/concepts/forest-trees.webp" alt="" width="1536" height="1024"/>
    <img className="forest-fern-plane" src="/concepts/forest-ferns.webp" alt="" width="1536" height="1024"/>
  </div>;
}
