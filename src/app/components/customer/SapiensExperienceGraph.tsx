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
import { EXPERIENCE_ANIMATION_ENABLED, useExperienceMotion } from './useExperienceMotion';
import '../../../styles/experience-graph.css';
import '../../../styles/experience-motion.css';

const aspects = [
  { title: 'Attention & curiosity', position: 'attention', image: question, x: 385, y: 210,
    lines: ['Notices what matters, asks', 'questions and seeks answers.'] },
  { title: 'Understanding', position: 'understanding', image: context, x: 615, y: 210,
    lines: ['Connects information to make', 'sense of a situation.'] },
  { title: 'Memory & experience', position: 'memory', image: experience, x: 385, y: 568,
    lines: ['Carries relevant context', 'and outcomes forward.'] },
  { title: 'Goals & reflection', position: 'goals', image: goal, x: 615, y: 568,
    lines: ['Guides what to pursue and', 'reconsiders the approach.'] },
];

const sleepMoon = 'M21 12.8A9 9 0 1 1 11.2 3A7 7 0 0 0 21 12.8Z';
const sleepDescription = 'Connects experiences and strengthens what matters.';
const initiativeDescription = 'Notices a reason to act, asks questions and seeks what’s needed.';

const internalConnections = [
  { part: 'attention', d: 'M385 332C385 392 500 372 500 432' },
  { part: 'understanding', d: 'M615 332C615 392 500 372 500 432' },
  { part: 'memory', d: 'M385 532C385 472 500 492 500 432' },
  { part: 'goals', d: 'M615 532C615 472 500 492 500 432' },
];
const outwardConnections = [
  { part: 'people', d: 'M250 295C218 268 185 268 163 287' },
  { part: 'information', d: 'M250 510C218 510 190 520 163 520' },
  { part: 'tools', d: 'M750 310C789 286 818 300 838 324' },
];
const feedbackConnections = [
  { part: 'outcome', d: 'M900 392C936 465 929 534 900 593' },
  { part: 'return', d: 'M834 660C803 671 780 671 750 660' },
];

function MotionConnection({ part, d }: { part: string; d: string }) {
  return EXPERIENCE_ANIMATION_ENABLED ? <path className="experience-motion-connection" d={d} pathLength="100" data-experience-motion="connection" data-experience-part={part} aria-hidden="true" /> : null;
}

function Node({ x, y, image, label, second, part, radius = 62 }: { x: number; y: number; image: string; label: string; second?: string; part: string; radius?: number }) {
  return <g className="experience-node" transform={`translate(${x} ${y})`}>
    <circle r={radius} />
    <image href={image} x="-32" y={second ? -48 : -44} width="64" height="64" data-experience-motion="icon" data-experience-part={part} />
    <text y={second ? 29 : 35} textAnchor="middle">{label}{second && <tspan x="0" dy="19">{second}</tspan>}</text>
  </g>;
}

export function SapiensExperienceGraph() {
  const motionRef = useExperienceMotion(EXPERIENCE_ANIMATION_ENABLED);
  const id = useId().replace(/:/g, '');
  const outward = `url(#${id}-outward)`;
  const returning = `url(#${id}-returning)`;
  return <div ref={motionRef} className="experience-graph" data-experience-enabled={EXPERIENCE_ANIMATION_ENABLED} tabIndex={EXPERIENCE_ANIMATION_ENABLED ? 0 : undefined} role="group" aria-label="Sapiens concept diagram">
    <div className="landing-section-heading experience-heading">
      <span className="customer-eyebrow">The idea behind Sapiens</span>
      <h2 id="how-title">An individual that notices, acts and learns.</h2>
      <p>The Sapiens concept connects experience, goals and curiosity with action and reflection.</p>
    </div>
    <svg className="experience-desktop" data-experience-scene="desktop" viewBox="0 0 1000 880" role="img" aria-labelledby={`${id}-title ${id}-description`}>
      <title id={`${id}-title`}>Initiative, interaction and reflection around one Sapiens</title>
      <desc id={`${id}-description`}>The rounded boundary is Sapiens, one AI individual. Attention and curiosity notice what matters, ask questions and seek answers. Understanding connects information to make sense of a situation. Memory and experience carry relevant context and outcomes forward. Goals and reflection guide what to pursue and reconsider the approach. Sleep and consolidation is a quiet phase that connects experiences and strengthens what matters. Outside are people, information, tools, and outcomes and feedback. Sapiens takes initiative: noticing a reason to act, asking questions and seeking what is needed. It reaches out, seeks information and takes permitted actions; feedback returns to the individual, while experience informs its next interaction. This graph explains the Sapiens concept.</desc>
      <defs>
        <marker id={`${id}-outward`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" className="experience-outward-marker" /></marker>
        <marker id={`${id}-returning`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1L7 4L1 7" className="experience-return-marker" /></marker>
      </defs>
      <rect className="experience-boundary" x="250" y="30" width="500" height="800" rx="110" />
      <text className="experience-individual-title" x="500" y="76" textAnchor="middle">Sapiens</text>
      <text className="experience-individual-subtitle" x="500" y="100" textAnchor="middle">An AI individual</text>
      {/* Mirror the mobile curves in a 230 × 200 space around (500, 432).
          Top connections begin below the copy; bottom ones meet the images.
          Their joins are hidden behind the artwork, with no exposed stem. */}
      <g className="experience-internal-links" fill="none">
        {internalConnections.map(connection => <path key={connection.part} d={connection.d} />)}
      </g>
      {internalConnections.map(connection => <MotionConnection key={connection.part} {...connection} />)}
      <image href={identity} x="425" y="357" width="150" height="150" data-experience-motion="icon" data-experience-part="core" />

      <g className="experience-outward-paths" fill="none">
        {outwardConnections.map(connection => <path key={connection.part} d={connection.d} markerEnd={outward} />)}
      </g>
      <g className="experience-return-paths" fill="none">
        <path d="M38 295H24Q12 295 12 310V840Q12 858 30 858H882Q900 858 900 840V727" markerEnd={returning} />
        <path d="M38 520H12" />
        {feedbackConnections.map(connection => <path key={connection.part} d={connection.d} markerEnd={returning} />)}
      </g>
      {[...outwardConnections, ...feedbackConnections].map(connection => <MotionConnection key={connection.part} {...connection} />)}

      <g className="experience-graph-copy">
        <text className="experience-group-title" x="35" y="112">Takes initiative</text>
        <text className="experience-initiative-copy" x="35" y="140"><tspan x="35">Notices a reason to act,</tspan><tspan x="35" dy="22">asks questions and seeks</tspan><tspan x="35" dy="22">what’s needed.</tspan></text>
        <text className="experience-edge-label" x="198" y="228" textAnchor="middle"><tspan x="198">Ask and</tspan><tspan x="198" dy="20">reach out</tspan></text>
        <text className="experience-edge-label" x="197" y="464" textAnchor="middle"><tspan x="197">Seek relevant</tspan><tspan x="197" dy="20">information</tspan></text>
        <text className="experience-edge-label" x="803" y="260" textAnchor="middle"><tspan x="803">Take permitted</tspan><tspan x="803" dy="20">actions</tspan></text>
        <text className="experience-feedback-label" x="909" y="486" textAnchor="middle"><tspan x="909">See what</tspan><tspan x="909" dy="20">happened</tspan></text>
        <text className="experience-feedback-label" x="790" y="608" textAnchor="middle"><tspan x="790">Reflect and</tspan><tspan x="790" dy="20">carry forward</tspan></text>
      </g>

      <Node x={100} y={295} image={person} label="People" part="people" />
      <Node x={100} y={520} image={information} label="Information" part="information" />
      <Node x={900} y={330} image={tool} label="Tools" part="tools" />
      <Node x={900} y={660} image={outcome} label="Outcomes" second="& feedback" part="outcome" radius={66} />
      {aspects.map(aspect => <g className="experience-desktop-aspect" key={aspect.title}>
        <circle cx={aspect.x} cy={aspect.y} r="36" />
        <image href={aspect.image} x={aspect.x - 26} y={aspect.y - 26} width="52" height="52" data-experience-motion="icon" data-experience-part={aspect.position} />
        <text className="experience-aspect-title" x={aspect.x} y={aspect.y + 60} textAnchor="middle">{aspect.title}</text>
        <text className="experience-aspect-description" x={aspect.x} y={aspect.y + 88} textAnchor="middle">
          {aspect.lines.map((line, index) => <tspan key={line} x={aspect.x} dy={index ? 22 : 0}>{line}</tspan>)}
        </text>
      </g>)}
      <g className="experience-sleep">
        <rect className="experience-motion-wash" x="300" y="730" width="400" height="82" rx="40" data-experience-motion="wash" data-experience-part="sleep" aria-hidden="true" />
        <path className="experience-sleep-divider" d="M300 718Q500 694 700 718" />
        <path className="experience-sleep-moon" d={sleepMoon} transform="translate(392 746) scale(1.2)" data-experience-motion="glow" data-experience-part="sleep" />
        <text className="experience-aspect-title" x="516" y="768" textAnchor="middle">Sleep &amp; consolidation</text>
        <text className="experience-aspect-description" x="500" y="800" textAnchor="middle">{sleepDescription}</text>
      </g>
    </svg>

    <div className="experience-mobile">
      <section className="experience-mobile-individual" data-experience-scene="inside" aria-label="Sapiens, an AI individual">
        <h3>Sapiens</h3><p>An AI individual</p>
        <div className="experience-mobile-aspects">
          <div className="experience-mobile-core" aria-hidden="true">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
              <path d="M25 0C25 30 50 20 50 50M75 0C75 30 50 20 50 50M25 100C25 70 50 80 50 50M75 100C75 70 50 80 50 50" />
              <MotionConnection part="attention" d="M25 0C25 30 50 20 50 50" />
              <MotionConnection part="understanding" d="M75 0C75 30 50 20 50 50" />
              <MotionConnection part="memory" d="M25 100C25 70 50 80 50 50" />
              <MotionConnection part="goals" d="M75 100C75 70 50 80 50 50" />
            </svg>
            <img src={identity} width="112" height="112" alt="" loading="lazy" data-experience-motion="icon" data-experience-part="core" />
          </div>
          {aspects.map(aspect => <div className={`experience-mobile-aspect experience-aspect-${aspect.position}`} key={aspect.title}>
            <img src={aspect.image} width="48" height="48" alt="" loading="lazy" data-experience-motion="icon" data-experience-part={aspect.position} />
            <h4>{aspect.title}</h4>
            <p>{aspect.lines.join(' ')}</p>
          </div>)}
        </div>
        <div className="experience-mobile-sleep" data-experience-scene="sleep">
          <span className="experience-motion-wash" data-experience-motion="wash" data-experience-part="sleep" aria-hidden="true" />
          <svg className="experience-mobile-sleep-divider" viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path className="experience-sleep-divider" d="M0 14Q150 -10 300 14" /></svg>
          <div className="experience-mobile-sleep-heading">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" data-experience-motion="glow" data-experience-part="sleep"><path className="experience-sleep-moon" d={sleepMoon} /></svg>
            <h4>Sleep &amp; consolidation</h4>
          </div>
          <p>{sleepDescription}</p>
        </div>
      </section>
      <div className="experience-mobile-link" aria-hidden="true">↓</div>
      <section className="experience-mobile-world" data-experience-scene="world">
        <h3>Takes initiative</h3>
        <p className="experience-mobile-initiative">{initiativeDescription}</p>
        <ul>
          <li><img src={person} width="48" height="48" alt="" loading="lazy" data-experience-motion="icon" data-experience-part="people" /><h4>People</h4><p>Ask and exchange ideas.</p></li>
          <li><img src={information} width="48" height="48" alt="" loading="lazy" data-experience-motion="icon" data-experience-part="information" /><h4>Information</h4><p>Seek relevant context.</p></li>
          <li><img src={tool} width="48" height="48" alt="" loading="lazy" data-experience-motion="icon" data-experience-part="tools" /><h4>Tools</h4><p>Take supported, permitted actions.</p></li>
        </ul>
      </section>
      <section className="experience-mobile-feedback" data-experience-scene="feedback">
        <img src={outcome} width="40" height="40" alt="" loading="lazy" data-experience-motion="icon" data-experience-part="outcome" />
        <div><h3>Outcomes & feedback</h3><p>What happens informs Sapiens’ next approach.</p></div>
        <span className="experience-mobile-return"><span aria-hidden="true">↶</span> Back to the same individual</span>
      </section>
    </div>
  </div>;
}
