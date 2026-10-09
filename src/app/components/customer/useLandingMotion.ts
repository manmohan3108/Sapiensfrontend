import { useEffect, useRef } from 'react';

// Start each scene once, then pause its timeline outside the viewport or tab.
export function useLandingMotion() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || !('IntersectionObserver' in window)) return;
    const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-motion-scene]'));
    const visible = new Set<Element>();
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => scenes.forEach(scene => {
      const active = visible.has(scene) && !document.hidden && !preference.matches;
      if (active) scene.dataset.motionStarted = 'true';
      scene.dataset.motionActive = String(active);
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.15) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      sync();
    }, { threshold: 0.15 });
    scenes.forEach(scene => observer.observe(scene));
    document.addEventListener('visibilitychange', sync);
    preference.addEventListener('change', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      preference.removeEventListener('change', sync);
    };
  }, []);
  return ref;
}
