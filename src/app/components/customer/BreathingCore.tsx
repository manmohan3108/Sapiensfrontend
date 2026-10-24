import { useEffect, useId, useRef } from 'react';

/** Deform the existing artwork locally, rather than scaling its rectangular image. */
export function BreathingCore() {
  const id = `core-breath-${useId().replace(/:/g, '')}`;
  const surface = useRef<SVGSVGElement>(null);
  const displacement = useRef<SVGFEDisplacementMapElement>(null);
  const fieldOffset = useRef<SVGFEOffsetElement>(null);

  useEffect(() => {
    const node = surface.current;
    const warp = displacement.current;
    const field = fieldOffset.current;
    if (!node || !warp || !field) return;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    const tick = (now: number) => {
      if (!previous) previous = now;
      const delta = now - previous;
      // This small SVG filter updates at most 30 times/second, with no React renders.
      if (delta >= 1000 / 30) {
        elapsed += Math.min(delta, 100);
        previous = now;
        const phase = elapsed / 7200 * Math.PI * 2;
        const breath = (1 - Math.cos(phase)) / 2;
        warp.setAttribute('scale', (54 * breath).toFixed(2));
        // Drift only the displacement field, not the artwork. Different parts of
        // the folds flex each breath without zooming or translating the core.
        field.setAttribute('dx', (14 * Math.sin(phase * .37)).toFixed(2));
        field.setAttribute('dy', (10 * Math.sin(phase * .51)).toFixed(2));
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      if (preference.matches) {
        elapsed = 0;
        warp.setAttribute('scale', '0');
        field.setAttribute('dx', '0');
        field.setAttribute('dy', '0');
      } else if (visible && !document.hidden) {
        frame = requestAnimationFrame(tick);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { threshold: .1 });
    observer.observe(node);
    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      preference.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  return <svg ref={surface} className="experience-core-sculpture" viewBox="0 0 440 440" width="440" height="440" aria-hidden="true" focusable="false">
    <defs>
      <filter id={id} x="-32" y="-32" width="504" height="504" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        {/* One static, low-frequency field moves broad folds instead of rippling the texture. */}
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.008" numOctaves="1" seed="8" result="folds"/>
        <feOffset ref={fieldOffset} in="folds" dx="0" dy="0" result="breathing-folds"/>
        <feDisplacementMap ref={displacement} in="SourceGraphic" in2="breathing-folds" scale="0" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
    </defs>
    <image href="/concepts/sapiens-core-orange.png" width="440" height="440" filter={`url(#${id})`}/>
  </svg>;
}
