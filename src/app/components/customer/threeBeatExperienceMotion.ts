// Alternate choreography. The classic sequence remains in useExperienceMotion.
type Cue = { delay: number; duration: number; frames: Keyframe[]; easing: string };

const poses: Record<string, [number, number, number]> = {
  attention: [8, -14, 1.12], understanding: [5, 10, 1.13],
  goals: [3, 0, 1.16], memory: [6, -12, 1.12],
  people: [10, -8, 1.12], information: [10, 14, 1.12],
  tools: [14, 24, 1.12], outcome: [10, -7, 1.12], sleep: [0, -16, 1.08],
};
const internal = new Set(['attention', 'understanding', 'goals', 'memory']);
const outward: Record<string, number> = { people: 2200, information: 2600, tools: 3000 };
// Both branches meet at 3.85s. A small overlap keeps the junction illuminated;
// the shared pulse and the Tools result finish together at 5.3s.
const feedbackMerge: Record<string, [number, number, number]> = {
  'people-feedback': [3050, 800, 46],
  'information-feedback': [3500, 350, 46],
  'shared-feedback': [3750, 1550, 18],
};

function gesture(part: string, desktop: boolean, color: string): Keyframe[] {
  const [lift, tilt, growth] = poses[part] ?? [6, 0, 1.08];
  const strength = desktop ? 1 : .65;
  return [
    { transform: 'translateY(0) rotate(0deg) scale(1)', filter: 'drop-shadow(0 0 0 transparent)', offset: 0 },
    { transform: `translateY(${-lift * strength}px) rotate(${tilt * strength}deg) scale(${1 + (growth - 1) * strength})`, filter: `drop-shadow(0 3px 10px ${color})`, offset: .38 },
    { transform: `translateY(${-lift * strength * .25}px) rotate(${-tilt * strength * .25}deg) scale(1.02)`, filter: `drop-shadow(0 2px 4px ${color})`, offset: .72 },
    { transform: 'translateY(0) rotate(0deg) scale(1)', filter: 'drop-shadow(0 0 0 transparent)', offset: 1 },
  ];
}

function connection(color: string, travel: boolean, pulseLength = 46): Keyframe[] {
  const base = { stroke: color, strokeDasharray: travel ? `${pulseLength} 150` : 'none', filter: `drop-shadow(0 0 5px ${color})` };
  return [
    { ...base, opacity: 0, strokeDashoffset: travel ? `${pulseLength}` : '0', offset: 0 },
    { ...base, opacity: 1, offset: .18 },
    { ...base, opacity: 1, offset: .7 },
    { ...base, opacity: 0, strokeDashoffset: travel ? '-100' : '0', offset: 1 },
  ];
}

export function startThreeBeatExperience(element: HTMLElement | SVGElement, root: HTMLElement) {
  const scene = element.dataset.experienceScene;
  const desktop = scene === 'desktop';
  const style = getComputedStyle(root);
  const violet = style.getPropertyValue('--cx-violet').trim();
  const warm = style.getPropertyValue('--experience-warm').trim();
  const cues = new Map<Element, Cue[]>();
  const add = (target: Element, delay: number, duration: number, frames: Keyframe[], easing = 'ease-in-out') => {
    const list = cues.get(target) ?? [];
    list.push({ delay, duration, frames, easing });
    cues.set(target, list);
  };

  element.querySelectorAll<HTMLElement | SVGElement>('[data-experience-motion]').forEach(target => {
    if (target.closest('[data-experience-scene]') !== element) return;
    const part = target.dataset.experiencePart ?? '';
    const motion = target.dataset.experienceMotion;
    if (part === 'core') {
      const strength = desktop ? 1 : .6;
      // One coordinated core track: expand, engage, receive, then gently rest.
      const pose = (lift: number, tilt: number, scale: number, glow: number, offset: number): Keyframe => ({
        transform: `translateY(${-lift * strength}px) rotate(${tilt * strength}deg) scale(${1 + (scale - 1) * strength})`,
        filter: `drop-shadow(0 0 ${glow}px ${violet})`, offset,
      });
      add(target, 0, 10000, [
        pose(0, 0, 1, 0, 0), pose(8, -7, 1.12, 16, .08),
        pose(2, 3, 1.025, 4, .2), pose(7, -4, 1.08, 12, .32),
        pose(2, 2, 1.025, 3, .46), pose(5, -3, 1.07, 15, desktop ? .65 : .61),
        pose(1, 2, 1.02, 4, .78), pose(3, -1, 1.025, 3, .9),
        pose(0, 0, 1, 0, 1),
      ]);
      return;
    }
    if (motion === 'halo') {
      const frames = [
        { opacity: 0, transform: 'scale(.65)' },
        { opacity: desktop ? .65 : .35, transform: 'scale(1.12)' },
        { opacity: 0, transform: 'scale(1.28)' },
      ];
      add(target, 0, 1900, frames);
      add(target, desktop ? 6000 : 5400, 1700, frames);
      return;
    }
    if (internal.has(part)) {
      if (motion === 'connection') {
        // Illuminate the four associations together instead of four tiny pulses.
        add(target, 350, 1350, connection(violet, false));
        if (part === 'memory') add(target, desktop ? 6500 : 6100, 1100, connection(warm, false));
      } else {
        add(target, 450, 1300, gesture(part, desktop, violet));
        if (part === 'memory') add(target, desktop ? 6650 : 6250, 1150, gesture(part, desktop, warm));
      }
      return;
    }
    if (part in outward) {
      const delay = outward[part] - (scene === 'world' ? 2200 : 0);
      if (motion === 'connection') add(target, delay, 750, connection(violet, true), 'linear');
      else add(target, delay + (desktop ? 550 : 0), 1200, gesture(part, desktop, violet));
      return;
    }
    if (desktop && part in feedbackMerge) {
      const [delay, duration, pulseLength] = feedbackMerge[part];
      add(target, delay, duration, connection(warm, true, pulseLength), 'linear');
      return;
    }
    if (part === 'outcome') {
      const delay = scene === 'feedback' ? 0 : 4500;
      if (motion === 'connection') add(target, delay, 800, connection(warm, true), 'linear');
      else add(target, delay + (desktop ? 700 : 0), 1200, gesture(part, desktop, warm));
      return;
    }
    if (part === 'return') {
      add(target, 5700, 800, connection(warm, true), 'linear');
      return;
    }
    if (part === 'sleep') {
      const delay = scene === 'sleep' ? 0 : desktop ? 7300 : 6900;
      const duration = scene === 'sleep' ? 2000 : 1500;
      if (motion === 'wash') {
        add(target, delay, duration, [
          { opacity: 0, transform: 'scale(.8)' },
          { opacity: .24, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(1.04)' },
        ]);
      } else add(target, delay, duration, gesture(part, desktop, violet));
    }
  });

  // Preserve mobile's independent reveals. A short section does not need to
  // wait through off-screen parts of the desktop story before repeating.
  const sequenceEnd = desktop ? 8800 : scene === 'inside' ? 8400 : 2200;
  const cycleDuration = desktop || scene === 'inside' ? 10000 : 4000;
  const startTime = document.timeline.currentTime;
  const animations: Animation[] = [];
  cues.forEach((list, target) => {
    list.sort((a, b) => a.delay - b.delay);
    const frames: Keyframe[] = [{ ...list[0].frames[0], offset: 0, easing: 'linear' }];
    list.forEach(cue => {
      cue.frames.forEach((frame, index) => frames.push({
        ...frame,
        offset: (cue.delay + (frame.offset ?? index / (cue.frames.length - 1)) * cue.duration) / cycleDuration,
        easing: frame.easing ?? cue.easing,
      }));
    });
    const last = list[list.length - 1];
    frames.push({ ...last.frames[last.frames.length - 1], offset: 1, easing: 'linear' });
    const animation = target.animate(frames, { duration: cycleDuration, iterations: Infinity, easing: 'linear' });
    if (typeof startTime === 'number') animation.startTime = startTime;
    animations.push(animation);
  });
  return { animations, clock: animations[0] ?? null, cycleDuration, sequenceEnd };
}
