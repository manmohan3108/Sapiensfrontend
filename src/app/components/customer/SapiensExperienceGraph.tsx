import { useId } from 'react';
import identity from '../../../assets/landing/identity-480.webp';
import person from '../../../assets/landing/person.webp';
import information from '../../../assets/landing/information.webp';
import tool from '../../../assets/landing/tool.webp';
import goal from '../../../assets/landing/goal.webp';
import question from '../../../assets/landing/question.webp';
import outcome from '../../../assets/landing/outcome.webp';
import experience from '../../../assets/landing/experience.webp';
import '../../../styles/experience-graph.css';

function Node({ x, y, image, label, second, radius = 62 }: { x: number; y: number; image: string; label: string; second?: string; radius?: number }) {
  return <g className="experience-node" transform={`translate(${x} ${y})`}>
    <circle r={radius} />
    <image href={image} x="-32" y={second ? -48 : -44} width="64" height="64" />
    <text y={second ? 29 : 35} textAnchor="middle">{label}{second && <tspan x="0" dy="19">{second}</tspan>}</text>
  </g>;
}

function MiniNode({ image, label }: { image: string; label: string }) {
  return <div className="experience-mini-node"><img src={image} width="56" height="56" alt="" loading="lazy" /><span>{label}</span></div>;
}

export function SapiensExperienceGraph() {
  const id = useId().replace(/:/g, '');
  const outward = `url(#${id}-outward)`;
  const returning = `url(#${id}-returning)`;
  return <div className="experience-graph">
    <div className="landing-section-heading experience-heading">
      <span className="customer-eyebrow">The idea we’re building toward</span>
      <h2 id="how-title">An individual that notices, acts and learns.</h2>
      <p>Our ambition: Sapiens draws on experience to pursue goals, seek answers and reconsider what it understands.</p>
    </div>
    <svg className="experience-desktop" viewBox="0 0 1000 800" role="img" aria-labelledby={`${id}-title ${id}-description`}>
      <title id={`${id}-title`}>Initiative, interaction and reflection around one Sapiens</title>
      <desc id={`${id}-description`}>Goals and questions prompt Sapiens to choose what to pursue. It can reach out to people, investigate information and act through permitted tools. Interactions produce outcomes and feedback. Reflection connects those outcomes with experience within Sapiens, informing its next choices. This graph illustrates the long-term ambition.</desc>
      <defs>
        <marker id={`${id}-outward`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" className="experience-outward-marker" /></marker>
        <marker id={`${id}-returning`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" className="experience-return-marker" /></marker>
      </defs>
      <rect className="experience-boundary" x="275" y="218" width="400" height="510" rx="110" />
      <text className="experience-boundary-label" x="545" y="706" textAnchor="middle">Within Sapiens</text>

      <g className="experience-outward-paths" fill="none">
        <path d="M370 149C370 195 455 185 472 239" markerEnd={outward} />
        <path d="M630 149C630 195 545 185 528 239" markerEnd={outward} />
        <path d="M401 320C325 285 260 275 193 292" markerEnd={outward} />
        <path d="M415 388C330 410 260 450 193 466" markerEnd={outward} />
        <path d="M600 335C680 325 745 330 807 351" markerEnd={outward} />
      </g>
      <g className="experience-return-paths" fill="none">
        <path d="M68 295H44Q24 295 24 315V740Q24 760 44 760H740Q760 760 760 740V717" markerEnd={returning} />
        <path d="M68 470H24" />
        <path d="M870 417V548Q870 584 817 616" markerEnd={returning} />
        <path d="M694 650H457" markerEnd={returning} />
        <path d="M390 584C390 522 500 510 500 436" markerEnd={returning} />
      </g>

      <g className="experience-graph-copy">
        <text className="experience-group-title" x="55" y="58">Reasons to act</text>
        <text x="55" y="85"><tspan x="55">Goals and unanswered questions</tspan><tspan x="55" dy="23">give it reasons to take initiative.</tspan></text>
        <text className="experience-edge-label" x="500" y="192" textAnchor="middle">Choose what to pursue</text>
        <text className="experience-edge-label" x="282" y="263" textAnchor="middle">Reach out and ask</text>
        <text className="experience-edge-label" x="270" y="423" textAnchor="middle">Seek information</text>
        <text className="experience-edge-label" x="704" y="303" textAnchor="middle">Act with available access</text>
        <text className="experience-group-title" x="736" y="70">Engage with the world</text>
        <text x="736" y="97"><tspan x="736">Ask people, gather context</tspan><tspan x="736" dy="23">and use supported tools.</tspan></text>
        <text className="experience-feedback-label" x="880" y="505" textAnchor="middle">See what happened</text>
        <text className="experience-feedback-label" x="575" y="626" textAnchor="middle">Reflect and learn</text>
        <text className="experience-feedback-label" x="525" y="535" textAnchor="middle">Inform what comes next</text>
        <text className="experience-group-title" x="65" y="603">Learn from what happens</text>
        <text x="65" y="632"><tspan x="65">Outcomes, feedback and mistakes</tspan><tspan x="65" dy="23">can inform the next approach.</tspan></text>
      </g>

      <Node x={370} y={95} image={goal} label="Goals" radius={54} />
      <Node x={630} y={95} image={question} label="Questions" radius={54} />
      <Node x={130} y={295} image={person} label="People" />
      <Node x={130} y={470} image={information} label="Information" />
      <Node x={870} y={355} image={tool} label="Tools" />
      <Node x={760} y={650} image={outcome} label="Outcomes" second="& feedback" radius={66} />
      <Node x={390} y={650} image={experience} label="Experience" radius={66} />
      <g className="experience-core" transform="translate(500 335)">
        <circle r="100" /><image href={identity} x="-54" y="-75" width="108" height="108" />
        <text y="54" textAnchor="middle">Sapiens</text><text className="experience-core-subtitle" y="76" textAnchor="middle">An AI individual</text>
      </g>
    </svg>

    <div className="experience-mobile">
      <section className="experience-mobile-group">
        <h3>Reasons to take initiative</h3>
        <p>Goals and unanswered questions give it something to pursue.</p>
        <div className="experience-mini-row"><MiniNode image={goal} label="Goals" /><MiniNode image={question} label="Questions" /></div>
      </section>
      <p className="experience-mobile-link"><span aria-hidden="true">↓</span> Choose what to pursue</p>
      <div className="experience-mobile-core"><img src={identity} width="88" height="88" alt="" loading="lazy" /><h3>Sapiens</h3><p>An AI individual</p></div>
      <p className="experience-mobile-link"><span aria-hidden="true">↓</span> Reach out, investigate and act</p>
      <section className="experience-mobile-group">
        <h3>Engage with the world</h3>
        <p>Ask people, gather information and act through supported tools with available access.</p>
        <div className="experience-mini-row"><MiniNode image={person} label="People" /><MiniNode image={information} label="Information" /><MiniNode image={tool} label="Tools" /></div>
      </section>
      <p className="experience-mobile-link experience-warm"><span aria-hidden="true">↓</span> See what happened</p>
      <section className="experience-mobile-group">
        <h3>Reflect and learn</h3>
        <p>Outcomes, feedback and mistakes can add to Sapiens’ experience and inform its next approach.</p>
        <div className="experience-mini-row"><MiniNode image={outcome} label="Outcomes & feedback" /><span className="experience-warm" aria-hidden="true">→</span><MiniNode image={experience} label="Experience" /></div>
      </section>
      <p className="experience-mobile-return"><span aria-hidden="true">↶</span> Experience stays with Sapiens, informing what it considers next.</p>
    </div>
  </div>;
}
