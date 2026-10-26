import { useEffect, type RefObject } from 'react';
import { useNavigationMemory } from './NavigationState';

/** Restore only marked page containers, never live chat's own scroll behaviour. */
export function useNavigationScroll(page: RefObject<HTMLDivElement | null>, key: string) {
  const memory = useNavigationMemory();
  useEffect(() => {
    const root = page.current;
    if (!root) return;
    let restoring = true;
    let frame = 0;
    const completed = new Set<string>();
    const restore = () => {
      if (!restoring) return;
      const positions: [string, HTMLElement][] = [['window', document.documentElement], ...Array.from(root.querySelectorAll<HTMLElement>('[data-nav-scroll]')).map(element => [element.dataset.navScroll!, element] as [string, HTMLElement])];
      for (const [name, element] of positions) {
        if (completed.has(name)) continue;
        const y = memory.scroll.get(`${key}:${name}`) || 0;
        const max = element.scrollHeight - (name === 'window' ? window.innerHeight : element.clientHeight);
        if (max >= y) {
          if (name === 'window') window.scrollTo({ top:y, behavior:'instant' });
          else element.scrollTop = y;
          completed.add(name);
        }
      }
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(restore); };
    // Async content may arrive after route mount. Observe only during restoration.
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList:true, subtree:true });
    const stop = () => { restoring = false; observer.disconnect(); cancelAnimationFrame(frame); };
    const timer = window.setTimeout(stop, 3000);
    const remember = (event: Event) => {
      const element = event.target;
      const name = element === document ? 'window' : element instanceof HTMLElement && element.dataset.navScroll;
      if (name && (!restoring || completed.has(name))) memory.scroll.set(`${key}:${name}`, name === 'window' ? window.scrollY : (element as HTMLElement).scrollTop);
    };
    // User input always wins; restoration must never fight scrolling or keyboard use.
    window.addEventListener('wheel', stop, { passive:true });
    window.addEventListener('touchstart', stop, { passive:true });
    window.addEventListener('keydown', stop);
    document.addEventListener('scroll', remember, true);
    schedule();
    return () => {
      stop(); window.clearTimeout(timer);
      window.removeEventListener('wheel', stop); window.removeEventListener('touchstart', stop); window.removeEventListener('keydown', stop);
      document.removeEventListener('scroll', remember, true);
    };
  }, [key, memory, page]);
}
