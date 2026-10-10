import { useEffect, useRef } from 'react';

// Set false to restore the completely static diagram, retaining all motion code.
export const EXPERIENCE_ANIMATION_ENABLED = true;

const timings: Record<string, number> = {
  core: 0, attention: 400, understanding: 1400, goals: 2400, memory: 3400,
  people: 4400, information: 5400, tools: 6400, outcome: 7400, return: 8400, sleep: 9400,
};

type Scene = {
  element: HTMLElement | SVGElement;
  visible: boolean;
  played: boolean;
  animations: Animation[];
};

// Decorative only: no timers, application state, API calls or simulated status.
export function useExperienceMotion(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!enabled || !root || !('IntersectionObserver' in window) || !Element.prototype.animate) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const scenes: Scene[] = Array.from(root.querySelectorAll<HTMLElement | SVGElement>('[data-experience-scene]'))
      .map(element => ({ element, visible: false, played: false, animations: [] }));
    const clear = (scene: Scene) => {
      scene.animations.forEach(animation => animation.cancel());
      scene.animations = [];
    };
    const start = (scene: Scene) => {
      clear(scene);
      scene.played = true;
      let end = 0;
      const violet = getComputedStyle(root).getPropertyValue('--cx-violet').trim();
      const warm = getComputedStyle(root).getPropertyValue('--experience-warm').trim();
      scene.element.querySelectorAll<HTMLElement | SVGElement>('[data-experience-motion]').forEach(target => {
        if (target.closest('[data-experience-scene]') !== scene.element) return;
        const part = target.dataset.experiencePart || 'core';
        let delay = timings[part] ?? 0;
        // Mobile sections reveal independently rather than playing below the fold.
        if (scene.element.dataset.experienceScene === 'world') delay -= timings.people;
        if (scene.element.dataset.experienceScene === 'feedback' || scene.element.dataset.experienceScene === 'sleep') delay = 0;
        const duration = part === 'sleep' ? 1800 : target.dataset.experienceMotion === 'connection' ? 900 : 1100;
        const glow = part === 'outcome' || part === 'return' ? warm : violet;
        let frames: Keyframe[];
        switch (target.dataset.experienceMotion) {
          case 'connection':
            frames = [
              { opacity: 0, strokeDashoffset: '18', offset: 0 },
              { opacity: .9, offset: .15 },
              { opacity: .9, offset: .8 },
              { opacity: 0, strokeDashoffset: '-100', offset: 1 },
            ];
            break;
          case 'wash':
            frames = [{ opacity: 0 }, { opacity: .09 }, { opacity: 0 }];
            break;
          case 'glow':
            frames = [{ filter: 'drop-shadow(0 0 0 transparent)' }, { filter: `drop-shadow(0 0 7px ${glow})` }, { filter: 'drop-shadow(0 0 0 transparent)' }];
            break;
          default:
            frames = [
              { transform: 'translateY(0)', filter: 'drop-shadow(0 0 0 transparent)' },
              { transform: `translateY(${scene.element.dataset.experienceScene === 'desktop' ? -4 : -2}px)`, filter: `drop-shadow(0 3px 6px ${glow})` },
              { transform: 'translateY(0)', filter: 'drop-shadow(0 0 0 transparent)' },
            ];
        }
        scene.animations.push(target.animate(frames, { duration, delay, easing: 'ease-in-out' }));
        end = Math.max(end, delay + duration);
      });
      const core = scene.element.querySelector('[data-experience-part="core"]');
      if (core) {
        scene.animations.push(core.animate([
          { transform: 'translateY(0)', filter: 'drop-shadow(0 0 0 transparent)' },
          { transform: 'translateY(-2px)', filter: `drop-shadow(0 2px 5px ${violet})` },
          { transform: 'translateY(0)', filter: 'drop-shadow(0 0 0 transparent)' },
        ], { duration: 7000, delay: end + 1000, iterations: Infinity, easing: 'ease-in-out' }));
      }
    };
    const sync = () => scenes.forEach(scene => {
      if (reduced.matches) {
        clear(scene);
        scene.played = false;
      } else if (scene.visible && !document.hidden) {
        if (!scene.played) start(scene);
        else scene.animations.forEach(animation => { if (animation.playState === 'paused') animation.play(); });
      } else {
        scene.animations.forEach(animation => { if (animation.playState === 'running') animation.pause(); });
      }
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const scene = scenes.find(item => item.element === entry.target);
        if (scene) scene.visible = entry.isIntersecting && entry.intersectionRatio >= .2;
      });
      sync();
    }, { threshold: [0, .2] });
    const replay = () => {
      if (reduced.matches || document.hidden) return;
      scenes.filter(scene => scene.visible).forEach(scene => {
        const busy = scene.animations.some(animation => animation.playState === 'running' && animation.effect?.getTiming().iterations !== Infinity);
        if (!busy) start(scene);
      });
    };
    const onPointerEnter = () => { if (finePointer.matches) replay(); };
    scenes.forEach(scene => observer.observe(scene.element));
    root.addEventListener('pointerenter', onPointerEnter);
    root.addEventListener('focus', replay);
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      scenes.forEach(clear);
      root.removeEventListener('pointerenter', onPointerEnter);
      root.removeEventListener('focus', replay);
      reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [enabled]);

  return ref;
}
