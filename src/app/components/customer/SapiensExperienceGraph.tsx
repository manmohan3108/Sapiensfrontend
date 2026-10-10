import { useId } from 'react';
import identity from '../../../assets/landing/identity-480.webp';
import person from '../../../assets/landing/person.webp';
import information from '../../../assets/landing/information.webp';
import tool from '../../../assets/landing/tool.webp';
import goal from '../../../assets/landing/goal.webp';
import question from '../../../assets/landing/question.webp';
import outcome from '../../../assets/landing/outcome.webp';
import '../../../styles/experience-graph.css';

const qualities = [
  { title: 'Attention & curiosity', lines: ['Notices what matters and asks', 'what’s missing.'] },
  { title: 'Understanding & experience', lines: ['Connects new situations with', 'what it has encountered.'] },
  { title: 'Goals & reflection', lines: ['Chooses what to pursue and', 'considers what happened.'] },
];

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
      <desc id={`${id}-description`}>The whole central boundary represents Sapiens, one AI individual. Inside are attention and curiosity, understanding and experience, and goals and reflection. Goals and questions prompt initiative. Sapiens reaches out to people, gathers information and uses permitted tools. Outcomes and feedback return to the individual to inform its next approach. These are aspects of the long-term vision, not separate technical modules.</desc>
      <defs>
        <marker id={`${id}-outward`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" className="experience-outward-marker" /></marker>
        <marker id={`${id}-returning`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" className="experience-return-marker" /></marker>
      </defs>
      <rect className="experience-boundary" x="300" y="218" width="380" height="510" rx="28" />
      <text className="experience-individual-title" x="490" y="258" textAnchor="middle">Sapiens</text>
      <text className="experience-individual-subtitle" x="490" y="282" textAnchor="middle">An AI individual</text>
      <image href={identity} x="446" y="298" width="88" height="88" />
      {qualities.map((quality, index) => <g className="experience-quality" key={quality.title} transform={`translate(334 ${416 + index * 94})`}>
        <text className="experience-quality-title">{quality.title}</text>
        <text y="26">{quality.lines.map((line, lineIndex) => <tspan key={line} x="0" dy={lineIndex ? 22 : 0}>{line}</tspan>)}</text>
      </g>)}

      <g className="experience-outward-paths" fill="none">
        <path d="M370 149C370 180 400 185 400 218" markerEnd={outward} />
        <path d="M630 149C630 180 580 185 580 218" markerEnd={outward} />
        <path d="M300 320C260 290 230 275 193 292" markerEnd={outward} />
        <path d="M300 440C260 440 230 460 193 466" markerEnd={outward} />
        <path d="M680 335C730 325 765 330 807 351" markerEnd={outward} />
      </g>
      <g className="experience-return-paths" fill="none">
        <path d="M68 295H44Q24 295 24 315V740Q24 760 44 760H840Q860 760 860 740V717" markerEnd={returning} />
        <path d="M68 470H24" />
        <path d="M870 417V548Q870 570 860 584" markerEnd={returning} />
        <path d="M794 650H680" markerEnd={returning} />
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
        <text className="experience-feedback-label" x="745" y="626" textAnchor="middle">Reflect and learn</text>
        <text className="experience-group-title" x="65" y="603">Learn from what happens</text>
        <text x="65" y="632"><tspan x="65">Feedback and mistakes can</tspan><tspan x="65" dy="23">inform the next approach.</tspan></text>
      </g>

      <Node x={370} y={95} image={goal} label="Goals" radius={54} />
      <Node x={630} y={95} image={question} label="Questions" radius={54} />
      <Node x={130} y={295} image={person} label="People" />
      <Node x={130} y={470} image={information} label="Information" />
      <Node x={870} y={355} image={tool} label="Tools" />
      <Node x={860} y={650} image={outcome} label="Outcomes" second="& feedback" radius={66} />
    </svg>

    <div className="experience-mobile">
      <section className="experience-mobile-group">
        <h3>Reasons to take initiative</h3>
        <p>Goals and unanswered questions give it something to pursue.</p>
        <div className="experience-mini-row"><MiniNode image={goal} label="Goals" /><MiniNode image={question} label="Questions" /></div>
      </section>
      <p className="experience-mobile-link"><span aria-hidden="true">↓</span> Choose what to pursue</p>
      <section className="experience-mobile-individual" aria-label="Sapiens, an AI individual">
        <h3>Sapiens</h3><p>An AI individual</p>
        <img src={identity} width="88" height="88" alt="" loading="lazy" />
        {qualities.map(quality => <div className="experience-mobile-quality" key={quality.title}><h4>{quality.title}</h4><p>{quality.lines.join(' ')}</p></div>)}
      </section>
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
        <div className="experience-mini-row"><MiniNode image={outcome} label="Outcomes & feedback" /></div>
      </section>
      <p className="experience-mobile-return"><span aria-hidden="true">↶</span> Experience stays with Sapiens, informing what it considers next.</p>
    </div>
  </div>;
}
