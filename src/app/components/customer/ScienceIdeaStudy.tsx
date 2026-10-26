import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import '../../../styles/science-idea-study.css';

const distribution = (mean: number, spread: number) => Array.from({ length: 181 }, (_, i) => {
  const x = i * 5;
  return `${i ? 'L' : 'M'}${x},${190 - 106 * Math.exp(-.5 * ((x - mean) / spread) ** 2)}`;
}).join(' ');
const priorCurve = distribution(340, 120);
const evidenceOptions = [
  { id: 'supports', label: 'Supports it', shift: 0, spread: .7, result: 'The expectation stays; uncertainty narrows.' },
  { id: 'challenges', label: 'Challenges it', shift: 180, spread: .88, result: 'A different outcome now seems more likely.' },
  { id: 'mixed', label: 'Mixed signals', shift: 0, spread: 1.3, result: 'More possibilities remain open; uncertainty grows.' },
] as const;

/** Shared science landing study; the graph is an illustration, not a model readout. */
export function ScienceIdeaStudy() {
  const ref = useRef<HTMLElement>(null);
  const plotId = useId().replaceAll(':', '');
  const [evidence, setEvidence] = useState<(typeof evidenceOptions)[number]>(evidenceOptions[1]);
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
      <figcaption><span>SHAPED BY EXPERIENCE</span><strong>Experience changes <br/>what Sapiens expects.</strong><p>New information can reinforce an expectation—or change it.</p><small>Concept illustration · not live data</small></figcaption>
      <div className="science-idea-plot">
        <div className="science-idea-legend"><span><i/>Earlier expectation</span><span><i/>With new evidence</span></div>
        <span className="science-idea-axis-label" aria-hidden="true">More likely ↑</span>
        <svg viewBox="0 15 900 180" preserveAspectRatio="none" role="img" aria-label={`Illustrative likelihood curves. ${evidence.result} The dashed curve shows the earlier expectation; the solid curve shows the update. The horizontal axis represents possible outcomes and height represents relative likelihood. This is not measured data.`}>
          <defs><clipPath id={plotId}><rect x="10" y="15" width="880" height="176"/></clipPath></defs>
          <path className="science-idea-axis" d="M15 190H885"/>
          <g clipPath={`url(#${plotId})`}>
            <path d={priorCurve} className="science-idea-prior"/>
            <g className="science-idea-update" style={{ transform: `translateX(${evidence.shift}px) scale(${evidence.spread}, ${1 / evidence.spread})` }}>
              <path d={`${priorCurve}L900,190L0,190Z`} className="science-idea-area"/>
              <path d={priorCurve} className="science-idea-posterior"/>
            </g>
          </g>
        </svg>
        <span className="science-idea-axis-label science-idea-outcomes-label" aria-hidden="true">Possible outcomes</span>
        <div className="science-idea-evidence-controls" role="group" aria-label="Try different kinds of new evidence"><span>New evidence</span>{evidenceOptions.map(option => <button key={option.id} type="button" aria-pressed={evidence.id === option.id} onClick={() => setEvidence(option)}>{option.label}</button>)}</div>
        <p className="science-idea-result" aria-live="polite" aria-atomic="true">{evidence.result}</p>
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
