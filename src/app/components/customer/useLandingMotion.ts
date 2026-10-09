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
      const image = scene.querySelector('img');
      const artworkReady = !image || (image.complete && image.naturalWidth > 0);
      const active = visible.has(scene) && artworkReady && !document.hidden && !preference.matches;
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
    root.addEventListener('load', sync, true);
    document.addEventListener('visibilitychange', sync);
    preference.addEventListener('change', sync);
    return () => {
      observer.disconnect();
      root.removeEventListener('load', sync, true);
      document.removeEventListener('visibilitychange', sync);
      preference.removeEventListener('change', sync);
    };
  }, []);
  return ref;
}
