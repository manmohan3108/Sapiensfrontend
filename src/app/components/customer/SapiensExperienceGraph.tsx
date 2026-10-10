import { useId } from 'react';
import identity from '../../../assets/landing/identity-480.webp';
import person from '../../../assets/landing/person.webp';
import information from '../../../assets/landing/information.webp';
import tool from '../../../assets/landing/tool.webp';
import goal from '../../../assets/landing/goal.webp';
import question from '../../../assets/landing/question.webp';
import outcome from '../../../assets/landing/outcome.webp';
import experience from '../../../assets/landing/experience.webp';
import context from '../../../assets/landing/context.webp';
import '../../../styles/experience-graph.css';

const aspects = [
  { title: 'Attention & curiosity', label: 'Attention', second: '& curiosity', image: question, x: 385, y: 340,
    lines: ['Notices what matters, asks', 'questions and seeks answers.'] },
  { title: 'Understanding', label: 'Understanding', image: context, x: 615, y: 340,
    lines: ['Connects information to make', 'sense of a situation.'] },
  { title: 'Memory & experience', label: 'Memory', second: '& experience', image: experience, x: 385, y: 585,
    lines: ['Carries relevant context', 'and outcomes forward.'] },
  { title: 'Goals & reflection', label: 'Goals', second: '& reflection', image: goal, x: 615, y: 585,
    lines: ['Guides what to pursue and', 'reconsiders the approach.'] },
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
      <span className="customer-eyebrow">The idea behind Sapiens</span>
      <h2 id="how-title">An individual that notices, acts and learns.</h2>
      <p>The Sapiens concept connects experience, goals and curiosity with action and reflection.</p>
    </div>
    <svg className="experience-desktop" viewBox="0 0 1000 830" role="img" aria-labelledby={`${id}-title ${id}-description`}>
      <title id={`${id}-title`}>Initiative, interaction and reflection around one Sapiens</title>
      <desc id={`${id}-description`}>The rounded boundary is Sapiens, one AI individual. Attention and curiosity notice what matters, ask questions and seek answers. Understanding connects information to make sense of a situation. Memory and experience carry relevant context and outcomes forward. Goals and reflection guide what to pursue and reconsider the approach. Outside are people, information, tools, and outcomes and feedback. Sapiens reaches out, seeks information and takes permitted actions; feedback returns to the individual, while experience informs its next interaction. This graph explains the Sapiens concept.</desc>
      <defs>
        <marker id={`${id}-outward`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" className="experience-outward-marker" /></marker>
        <marker id={`${id}-returning`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" className="experience-return-marker" /></marker>
      </defs>
      <rect className="experience-boundary" x="250" y="30" width="500" height="750" rx="110" />
      <text className="experience-individual-title" x="500" y="76" textAnchor="middle">Sapiens</text>
      <text className="experience-individual-subtitle" x="500" y="100" textAnchor="middle">An AI individual</text>
      <image href={identity} x="430" y="112" width="140" height="140" />
      <g className="experience-internal-links" fill="none">
        <path d="M452 220C413 227 390 251 385 276M548 220C587 227 610 251 615 276" />
      </g>

      <g className="experience-outward-paths" fill="none">
        <path d="M250 295C218 268 185 268 163 287" markerEnd={outward} />
        <path d="M250 510C218 510 190 520 163 520" markerEnd={outward} />
        <path d="M750 310C789 286 818 300 838 324" markerEnd={outward} />
      </g>
      <g className="experience-return-paths" fill="none">
        <path d="M38 295H24Q12 295 12 310V790Q12 808 30 808H882Q900 808 900 790V727" markerEnd={returning} />
        <path d="M38 520H12" />
        <path d="M900 392C936 465 929 534 900 593" markerEnd={returning} />
        <path d="M834 660C803 671 780 671 750 660" markerEnd={returning} />
        <path className="experience-memory-return" d="M450 585C480 585 500 564 500 528V285Q500 267 500 253" markerEnd={returning} />
      </g>

      <g className="experience-graph-copy">
        <text className="experience-edge-label" x="198" y="228" textAnchor="middle"><tspan x="198">Ask and</tspan><tspan x="198" dy="20">reach out</tspan></text>
        <text className="experience-edge-label" x="197" y="464" textAnchor="middle"><tspan x="197">Seek relevant</tspan><tspan x="197" dy="20">information</tspan></text>
        <text className="experience-edge-label" x="803" y="260" textAnchor="middle"><tspan x="803">Take permitted</tspan><tspan x="803" dy="20">actions</tspan></text>
        <text className="experience-feedback-label" x="909" y="486" textAnchor="middle"><tspan x="909">See what</tspan><tspan x="909" dy="20">happened</tspan></text>
        <text className="experience-feedback-label" x="790" y="608" textAnchor="middle"><tspan x="790">Reflect and</tspan><tspan x="790" dy="20">carry forward</tspan></text>
      </g>

      <Node x={100} y={295} image={person} label="People" />
      <Node x={100} y={520} image={information} label="Information" />
      <Node x={900} y={330} image={tool} label="Tools" />
      <Node x={900} y={660} image={outcome} label="Outcomes" second="& feedback" radius={66} />
      {aspects.map(aspect => <g key={aspect.title}>
        <Node x={aspect.x} y={aspect.y} image={aspect.image} label={aspect.label} second={aspect.second} radius={64} />
        <text className="experience-aspect-description" x={aspect.x} y={aspect.y + 93} textAnchor="middle">
          {aspect.lines.map((line, index) => <tspan key={line} x={aspect.x} dy={index ? 22 : 0}>{line}</tspan>)}
        </text>
      </g>)}
    </svg>

    <div className="experience-mobile">
      <section className="experience-mobile-individual" aria-label="Sapiens, an AI individual">
        <h3>Sapiens</h3><p>An AI individual</p>
        <img src={identity} width="128" height="128" alt="" loading="lazy" />
        <div className="experience-mobile-aspects">
          {aspects.map(aspect => <div className="experience-mobile-aspect" key={aspect.title}>
            <MiniNode image={aspect.image} label={aspect.title} />
            <p>{aspect.lines.join(' ')}</p>
          </div>)}
        </div>
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
