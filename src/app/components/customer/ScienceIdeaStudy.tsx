import { useEffect, useRef, type CSSProperties } from 'react';
import '../../../styles/science-idea-study.css';

const distribution = (mean: number, spread: number) => Array.from({ length: 181 }, (_, i) => {
  const x = i * 5;
  return `${i ? 'L' : 'M'}${x},${190 - 150 * Math.exp(-.5 * ((x - mean) / spread) ** 2)}`;
}).join(' ');
const curves = [distribution(280, 145), distribution(430, 105), distribution(560, 65)];

/** Restores the experience study, isolated from the homepage and other directions. */
export function ScienceIdeaStudy() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    let visible = false;
    const sync = () => section.classList.toggle('science-idea-active', visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(section);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);
  return <section ref={ref} className="experience-thesis science-idea-study" aria-labelledby="experience-vision-title">
    <span>THE IDEA WE’RE BUILDING</span>
    <h2 id="experience-vision-title">An AI individual<br/><em>that behaves more like a human.</em></h2>
    <div><p>We’re building an AI individual that learns from experience, anticipates what’s next, and takes initiative—acting quickly when needed, without always waiting to be asked.</p></div>
    <figure className="science-idea-evidence">
      <figcaption><span>EXPERIENCE</span><strong>New evidence <br/>changes expectations.</strong><small>Probability distributions · a visual metaphor</small></figcaption>
      <div className="science-idea-plot">
        <svg viewBox="0 0 900 215" role="img" aria-label="Three illustrative curves shift from prior experience toward a new expectation as evidence arrives. This is a visual metaphor, not measured data.">
          <path className="science-idea-axis" d="M15 190H885M80 190V25"/>
          {curves.map((d, i) => <path key={i} d={d} className={`science-idea-curve science-idea-curve-${i}`} style={{ '--study-delay': `${i * -3}s` } as CSSProperties}/>)}
          {[150,225,315,385,460,525,610,700,790].map(x => <circle key={x} cx={x} cy="204" r="3" className="science-idea-evidence-dot"/>)}
        </svg>
        <div className="science-idea-plot-labels"><span>Prior experience</span><span className="science-idea-evidence-arrow" aria-hidden="true">→</span><span>+ New evidence</span></div>
      </div>
    </figure>
    <figure className="science-idea-loop">
      <figcaption><span className="science-idea-notation" aria-hidden="true">E<sub>0</sub> → E<sub>1</sub> → E<sub>2</sub> → ···</span>Experience informs the next decision.</figcaption>
      <div className="science-idea-cycle">
        <ol>{['Experience', 'Anticipate', 'Act or wait', 'Reflect'].map((stage, i) => <li key={stage}><i aria-hidden="true" style={{ '--study-delay': `${i * 2}s` } as CSSProperties}/>{stage}</li>)}</ol>
        <span className="science-idea-trace" aria-hidden="true"/>
        <div className="science-idea-return"><span>Learning carries forward</span></div>
      </div>
    </figure>
  </section>;
}
