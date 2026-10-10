import { useEffect, useRef } from 'react';

// Set false to restore the completely static diagram, retaining all motion code.
export const EXPERIENCE_ANIMATION_ENABLED = true;

const timings: Record<string, number> = {
  attention: 600, understanding: 2000, goals: 3400, memory: 4800,
  people: 6200, information: 8400, tools: 10600, outcome: 12800, return: 15000, sleep: 16200,
};

// Whole-image gestures. Keep the circles and labels still, and rotate images
// around their own centres (not the SVG canvas origin).
const gestures: Record<string, { lift: number; tilt: number; scale: number }> = {
  attention: { lift: 8, tilt: -12, scale: 1.06 },
  understanding: { lift: 3, tilt: 8, scale: 1.1 },
  memory: { lift: 4, tilt: -10, scale: 1.07 },
  goals: { lift: 2, tilt: 0, scale: 1.13 },
  people: { lift: 7, tilt: -6, scale: 1.04 },
  information: { lift: 7, tilt: 12, scale: 1.06 },
  tools: { lift: 10, tilt: 20, scale: 1.04 },
  outcome: { lift: 8, tilt: -5, scale: 1.06 },
  sleep: { lift: 0, tilt: -12, scale: 1.05 },
};
const internalParts = new Set(['attention', 'understanding', 'memory', 'goals']);
const outwardParts = new Set(['people', 'information', 'tools', 'outcome']);
const travelDuration = 900;
const arrivalDelay = 800;
const cyclePause = 1800;

// Put the wait inside each iteration. WAAPI's delay/endDelay would only wait
// before/after the entire animation, allowing individual gestures to drift.
function cycleFrames(frames: Keyframe[], delay: number, duration: number, cycleDuration: number, easing: string): Keyframe[] {
  return [
    { ...frames[0], offset: 0, easing: 'linear' },
    ...frames.map((frame, index) => ({
      ...frame,
      offset: (delay + (frame.offset ?? index / (frames.length - 1)) * duration) / cycleDuration,
      easing: frame.easing ?? easing,
    })),
    { ...frames[frames.length - 1], offset: 1, easing: 'linear' },
  ];
}

function imageFrames(part: string, desktop: boolean, glow: string): Keyframe[] {
  const gesture = gestures[part] ?? { lift: 5, tilt: 0, scale: 1.04 };
  const strength = desktop ? 1 : .65;
  const lift = gesture.lift * strength;
  const tilt = gesture.tilt * strength;
  const scale = 1 + (gesture.scale - 1) * strength;
  return [
    { transform: 'translateY(0) rotate(0deg) scale(1)', filter: 'drop-shadow(0 0 0 transparent)', offset: 0 },
    { transform: `translateY(${-lift}px) rotate(${tilt}deg) scale(${scale})`, filter: `drop-shadow(0 3px 9px ${glow})`, offset: .4 },
    { transform: `translateY(${-lift * .3}px) rotate(${-tilt * .25}deg) scale(${1 + (scale - 1) * .3})`, filter: `drop-shadow(0 2px 4px ${glow})`, offset: .7 },
    { transform: 'translateY(0) rotate(0deg) scale(1)', filter: 'drop-shadow(0 0 0 transparent)', offset: 1 },
  ];
}

type Scene = {
  element: HTMLElement | SVGElement;
  visible: boolean;
  played: boolean;
  animations: Animation[];
  clock: Animation | null;
  cycleDuration: number;
  sequenceEnd: number;
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
      .map(element => ({ element, visible: false, played: false, animations: [], clock: null, cycleDuration: 0, sequenceEnd: 0 }));
    const clear = (scene: Scene) => {
      scene.animations.forEach(animation => animation.cancel());
      scene.animations = [];
      scene.clock = null;
    };
    const start = (scene: Scene) => {
      clear(scene);
      scene.played = true;
      let end = 0;
      const sequence: { target: Element; frames: Keyframe[]; duration: number; delay: number; easing: string }[] = [];
      const desktop = scene.element.dataset.experienceScene === 'desktop';
      const violet = getComputedStyle(root).getPropertyValue('--cx-violet').trim();
      const warm = getComputedStyle(root).getPropertyValue('--experience-warm').trim();
      const corePulses = new Set<number>([0]);
      scene.element.querySelectorAll<HTMLElement | SVGElement>('[data-experience-motion]').forEach(target => {
        if (target.closest('[data-experience-scene]') !== scene.element) return;
        const part = target.dataset.experiencePart || 'core';
        if (part === 'core') return; // Separate movement and glow timelines below.
        const motion = target.dataset.experienceMotion;
        let delay = timings[part] ?? 0;
        // Mobile sections reveal independently rather than playing below the fold.
        if (scene.element.dataset.experienceScene === 'world') delay -= timings.people;
        if (scene.element.dataset.experienceScene === 'feedback' || scene.element.dataset.experienceScene === 'sleep') delay = 0;
        // Internal images initiate an exchange; external images respond when
        // its travelling highlight arrives. Mobile has no outer graph paths.
        if (motion === 'connection' && internalParts.has(part)) delay += 250;
        if (motion === 'icon' && desktop && outwardParts.has(part)) delay += arrivalDelay;
        const duration = part === 'sleep' ? 2400 : motion === 'connection' ? travelDuration : 1300;
        const glow = part === 'outcome' || part === 'return' ? warm : violet;
        let frames: Keyframe[];
        switch (motion) {
          case 'connection':
            frames = [
              { opacity: 0, strokeDashoffset: '32', offset: 0 },
              { opacity: 1, offset: .12 },
              { opacity: 1, offset: .85 },
              { opacity: 0, strokeDashoffset: '-100', offset: 1 },
            ];
            break;
          case 'wash':
            frames = [
              { opacity: 0, transform: 'scale(.88)' },
              { opacity: .18, transform: 'scale(1)' },
              { opacity: 0, transform: 'scale(1.03)' },
            ];
            break;
          default:
            frames = imageFrames(part, desktop, glow);
        }
        sequence.push({ target, frames, duration, delay, easing: motion === 'connection' ? 'linear' : 'ease-in-out' });
        if (motion === 'connection' && (internalParts.has(part) || part === 'return')) corePulses.add(delay + arrivalDelay);
        if (motion === 'connection' && outwardParts.has(part) && part !== 'outcome') corePulses.add(delay);
        end = Math.max(end, delay + duration);
      });
      const core = scene.element.querySelector('[data-experience-part="core"]');
      if (core) {
        const lift = desktop ? 8 : 5;
        const tilt = desktop ? 4 : 2.5;
        // Transform-only idle motion never overrides the separate response glow.
        scene.animations.push(core.animate([
          { transform: 'translateY(0) rotate(0deg) scale(1)', offset: 0 },
          { transform: `translateY(${-lift}px) rotate(${-tilt}deg) scale(1.035)`, offset: .35 },
          { transform: `translateY(${-lift * .4}px) rotate(${tilt}deg) scale(1.015)`, offset: .7 },
          { transform: 'translateY(0) rotate(0deg) scale(1)', offset: 1 },
        ], { duration: 6400, iterations: Infinity, easing: 'ease-in-out' }));
        const glowFrames: Keyframe[] = [];
        const pulseDuration = 700;
        const glowEnd = Math.max(end, ...Array.from(corePulses, time => time + pulseDuration));
        const orderedPulses = Array.from(corePulses).sort((a, b) => a - b);
        orderedPulses.forEach((time, index) => {
          // Leave room for a closely following outward interaction; keyframe
          // offsets must remain ordered when two response glows are adjacent.
          const available = (orderedPulses[index + 1] ?? glowEnd + 50) - time - 50;
          const duration = Math.min(pulseDuration, available);
          glowFrames.push(
            { filter: 'drop-shadow(0 0 0 transparent)', offset: time / glowEnd, easing: 'ease-in-out' },
            { filter: `drop-shadow(0 0 13px ${violet})`, offset: (time + duration * .4) / glowEnd, easing: 'ease-in-out' },
            { filter: 'drop-shadow(0 0 0 transparent)', offset: (time + duration) / glowEnd },
          );
        });
        glowFrames.push({ filter: 'drop-shadow(0 0 0 transparent)', offset: 1 });
        sequence.push({ target: core, frames: glowFrames, duration: glowEnd, delay: 0, easing: 'linear' });
        end = Math.max(end, glowEnd);
      }
      scene.sequenceEnd = end;
      scene.cycleDuration = end + cyclePause;
      const cycleStart = document.timeline.currentTime;
      sequence.forEach(({ target, frames, duration, delay, easing }) => {
        const animation = target.animate(cycleFrames(frames, delay, duration, scene.cycleDuration, easing), {
          duration: scene.cycleDuration, iterations: Infinity, easing: 'linear',
        });
        if (typeof cycleStart === 'number') animation.startTime = cycleStart;
        scene.animations.push(animation);
        scene.clock ??= animation;
      });
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
        // Hover/focus/tap must not keep restarting a sequence already in motion.
        const time = scene.clock?.currentTime;
        const busy = typeof time === 'number' && time % scene.cycleDuration < scene.sequenceEnd;
        if (!busy) start(scene);
      });
    };
    const onPointerEnter = () => { if (finePointer.matches) replay(); };
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || target.closest('a, button, input, select, textarea, summary')) return;
      if (window.getSelection()?.isCollapsed === false) return;
      replay();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target !== root || event.repeat || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault();
      replay();
    };
    scenes.forEach(scene => observer.observe(scene.element));
    root.addEventListener('pointerenter', onPointerEnter);
    root.addEventListener('focus', replay);
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', onKeyDown);
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      scenes.forEach(clear);
      root.removeEventListener('pointerenter', onPointerEnter);
      root.removeEventListener('focus', replay);
      root.removeEventListener('click', onClick);
      root.removeEventListener('keydown', onKeyDown);
      reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [enabled]);

  return ref;
}
