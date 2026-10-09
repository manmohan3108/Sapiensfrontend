import { useEffect, useRef } from 'react';

export function LandingCursorTrail() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    const page = layer?.parentElement;
    if (!layer || !page) return;
    const blobs = Array.from(layer.querySelectorAll<HTMLElement>('[data-cursor-blob]'));
    const preference = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const positions = blobs.map(() => ({ x: 0, y: 0 }));
    let target = { x: 0, y: 0 };
    let frame = 0;
    let lastTime = 0;
    let visible = false;

    const hide = () => {
      visible = false;
      layer.dataset.visible = 'false';
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    };
    const animate = (time: number) => {
      frame = 0;
      const delta = lastTime ? Math.min(time - lastTime, 64) : 16;
      lastTime = time;
      let moving = false;
      blobs.forEach((blob, index) => {
        // Time-based smoothing keeps the delay consistent across refresh rates.
        const amount = 1 - Math.exp(-delta / (index === 0 ? 190 : 85));
        const point = positions[index];
        point.x += (target.x - point.x) * amount;
        point.y += (target.y - point.y) * amount;
        blob.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
        moving ||= Math.abs(target.x - point.x) + Math.abs(target.y - point.y) > .2;
      });
      if (moving) frame = requestAnimationFrame(animate);
      else lastTime = 0;
    };
    const move = (event: PointerEvent) => {
      if (!preference.matches || event.pointerType !== 'mouse') { hide(); return; }
      target = { x: event.clientX, y: event.clientY };
      if (!visible) {
        positions.forEach((point, index) => {
          point.x = target.x;
          point.y = target.y;
          blobs[index].style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
        });
        visible = true;
        layer.dataset.visible = 'true';
      }
      if (!frame) frame = requestAnimationFrame(animate);
    };
    const onVisibility = () => { if (document.hidden) hide(); };
    page.addEventListener('pointermove', move, { passive: true });
    page.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', onVisibility);
    preference.addEventListener('change', hide);
    return () => {
      hide();
      page.removeEventListener('pointermove', move);
      page.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
      document.removeEventListener('visibilitychange', onVisibility);
      preference.removeEventListener('change', hide);
    };
  }, []);

  return <div ref={ref} className="landing-cursor-trail" aria-hidden="true">
    <span className="landing-cursor-blob landing-cursor-blob-large" data-cursor-blob />
    <span className="landing-cursor-blob landing-cursor-blob-small" data-cursor-blob />
  </div>;
}
