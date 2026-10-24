import { useEffect, type RefObject } from 'react';

/** Only the hero sculpture responds; its outer scroll depth and inner float stay intact. */
export function useCorePointerResponse(scene: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const area = scene.current;
    const core = area?.querySelector<HTMLElement>('.experience-hero-core');
    const response = area?.querySelector<HTMLElement>('.experience-core-response');
    if (!area || !core || !response) return;
    const preference = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      ['--core-pointer-x', '--core-pointer-y', '--core-presence'].forEach(name => response.style.removeProperty(name));
    };
    const move = (event: PointerEvent) => {
      if (!preference.matches || event.pointerType !== 'mouse' || document.hidden) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        // Read the stationary parent, not the turning sculpture, to avoid feedback jitter.
        const bounds = core.getBoundingClientRect();
        const dx = pointerX - bounds.left - bounds.width / 2;
        const dy = pointerY - bounds.top - bounds.height / 2;
        const reach = Math.max(260, bounds.width * .7);
        const presence = Math.max(0, Math.min(1, (reach - Math.hypot(dx, dy)) / 120));
        const clamp = (value: number) => Math.max(-1, Math.min(1, value));
        response.style.setProperty('--core-pointer-x', String(clamp(dx / (reach * .65)) * presence));
        response.style.setProperty('--core-pointer-y', String(clamp(dy / (reach * .65)) * presence));
        response.style.setProperty('--core-presence', String(presence));
      });
    };
    area.addEventListener('pointermove', move, { passive: true });
    area.addEventListener('pointerleave', reset);
    area.addEventListener('pointercancel', reset);
    window.addEventListener('scroll', reset, { passive: true });
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', reset);
    preference.addEventListener('change', reset);
    return () => {
      reset();
      area.removeEventListener('pointermove', move);
      area.removeEventListener('pointerleave', reset);
      area.removeEventListener('pointercancel', reset);
      window.removeEventListener('scroll', reset);
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', reset);
      preference.removeEventListener('change', reset);
    };
  }, [scene]);
}
