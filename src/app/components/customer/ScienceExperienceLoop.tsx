import { useEffect, useRef } from 'react';

export function ScienceExperienceLoop() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let visible = false;
    const sync = () => element.classList.toggle('science-loop-active', visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);
  return <figure className="science-experience-loop" ref={ref}>
    <figcaption><span className="science-experience-notation" aria-hidden="true">E<sub>0</sub> → E<sub>1</sub> → E<sub>2</sub> → ···</span>Experience informs the next decision.</figcaption>
    <div className="science-loop-stages">
      {['Experience','Anticipate','Act or wait','Reflect'].map(label => <span key={label}><i aria-hidden="true"/>{label}</span>)}
      <span className="science-loop-trace" aria-hidden="true"/>
    </div>
    <div className="science-loop-return"><span>Learning carries forward</span></div>
  </figure>;
}
