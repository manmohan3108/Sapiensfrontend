import { useRef, type CSSProperties } from 'react';
import { motion, useInView, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { ArrowUpRight, Check, Leaf } from 'lucide-react';
import '../../../styles/intelligence-story.css';

const steps = [
  { name: 'Notice', title: 'Notice the missing booking.', text: 'It could connect your Friday dinner plan with the fact that you haven’t reserved a table.', concept: 'Attention & curiosity', explanation: 'Notice a gap and find out what is needed.' },
  { name: 'Remember', title: 'Remember their preferences.', text: 'You’ve told Sapiens that Maya and Alex are vegetarian. That detail could guide which restaurants it suggests.', concept: 'Memory & experience', explanation: 'Bring useful information from the past into the present.' },
  { name: 'Think ahead', title: 'Consider the risk of waiting.', text: 'Friday might be busy. Sapiens could suggest checking tables early, rather than assume there will be space.', concept: 'Understanding & prediction', explanation: 'Connect the facts and consider what could happen next.' },
  { name: 'Follow through', title: 'Offer help. Use feedback.', text: 'Sapiens could offer to find suitable places, then use what you say after dinner to improve a future suggestion.', concept: 'Goals & reflection', explanation: 'Work toward an outcome, then review what happened.' },
];

function DinnerIllustration() {
  return <svg className="dinner-illustration" viewBox="0 0 520 250" aria-hidden="true">
    <ellipse cx="260" cy="155" rx="228" ry="83" fill="#b85239"/>
    <ellipse cx="260" cy="140" rx="228" ry="83" fill="#ed997d"/>
    <path d="M60 122Q259 181 458 122M99 90Q260 135 421 90M99 190Q260 150 421 190" fill="none" stroke="#f7c5a9" strokeWidth="2"/>
    {[125, 390].map(x => <g key={x}><ellipse cx={x} cy="145" rx="58" ry="40" fill="#fff5d5"/><ellipse cx={x} cy="145" rx="43" ry="28" fill="none" stroke="#bd713a" strokeWidth="2"/><path d={`M${x-72} 119v53m-7-53v19q7 8 14 0v-19m137 0v53`} fill="none" stroke="#624a30" strokeWidth="3" strokeLinecap="round"/></g>)}
    <ellipse cx="260" cy="193" rx="42" ry="25" fill="#fff5d5"/><ellipse cx="260" cy="193" rx="31" ry="17" fill="none" stroke="#bd713a" strokeWidth="2"/>
    <path d="M245 142l-7-48h44l-7 48z" fill="#f7d26b"/><path d="M258 98V39m0 35q-40-4-32-27 29-1 32 27m0-12q40-2 32-25-29 0-32 25" fill="#386346" stroke="#386346" strokeWidth="3"/>
    <circle cx="259" cy="31" r="17" fill="#b94144"/><circle cx="258" cy="30" r="6" fill="#ffe692"/>
    <ellipse cx="210" cy="171" rx="15" ry="9" fill="#486a3f"/><ellipse cx="301" cy="161" rx="15" ry="9" fill="#486a3f"/>
  </svg>;
}

function ExampleScene({ step, progress, reduced }: { step: number; progress: MotionValue<number>; reduced: boolean }) {
  const drift = useTransform(progress, [0, 1], [14 + step * 2, -8 - step * 2]);
  return <div className="dinner-scene" data-step={step}>
    <motion.div className="dinner-evidence" style={{ y: reduced ? 0 : drift }} whileHover={reduced ? undefined : { rotate: 2, scale: 1.025 }} transition={{ type: 'spring', stiffness: 160, damping: 22 }}>
      {step === 0 && <div className="dinner-plan"><span className="dinner-paper-label">YOUR PLAN SO FAR</span><h4>Dinner with Maya & Alex</h4><p><Check size={18}/> Friday, 7 pm</p><p><Check size={18}/> Three people</p><p className="dinner-missing"><span aria-hidden="true">○</span> Restaurant not booked</p></div>}
      {step === 1 && <div className="dinner-memory"><span className="dinner-paper-label">SOMETHING YOU SHARED EARLIER</span><blockquote>“Maya and Alex are vegetarian.”</blockquote><div><Leaf size={22}/><p>Look for a place with<br/><strong>good vegetarian options.</strong></p></div></div>}
      {step === 2 && <div className="dinner-outcomes"><span className="dinner-paper-label">TWO POSSIBLE NEXT STEPS</span><div><strong>Check tables now</strong><span>More time to find a suitable place.</span></div><div><strong>Wait until Friday</strong><span>Suitable places might be full.</span></div><p>A possibility to check, not a fact about availability.</p></div>}
      {step === 3 && <div className="dinner-dialogue"><div><span className="dinner-paper-label">SAPIENS COULD ASK</span><blockquote>“Want me to find vegetarian-friendly places for Friday?”</blockquote></div><div><span className="dinner-paper-label">YOUR FEEDBACK AFTER DINNER</span><p>“The food was great. A quieter place next time.”</p><span className="dinner-takeaway">Next time: consider noise, too.</span></div></div>}
    </motion.div>
  </div>;
}

function StoryStep({ step, index }: { step: typeof steps[number]; index: number }) {
  const element = useRef<HTMLLIElement>(null);
  const reduced = Boolean(useReducedMotion());
  const entered = useInView(element, { once: true, amount: 0.18 });
  const { scrollYProgress } = useScroll({ target: element, offset: ['start 90%', 'end 45%'] });
  const flow = useTransform(scrollYProgress, value => Math.max(0, Math.min(1, value * 1.6 - index * 0.15)));
  const position = useTransform(flow, value => `${value * 100}%`);
  return <li ref={element} className={`story-step${entered ? ' is-revealed' : ''}`} style={{ '--step-delay': `${index * 0.16}s` } as CSSProperties}>
    <span className="story-flow story-flow-horizontal" aria-hidden="true"><motion.span className="story-flow-fill" style={{ scaleX: reduced ? 1 : flow }}/><motion.span className="story-flow-dot" style={{ left: reduced ? '100%' : position }}/></span>
    <span className="story-flow story-flow-vertical" aria-hidden="true"><motion.span className="story-flow-fill" style={{ scaleY: reduced ? 1 : flow }}/><motion.span className="story-flow-dot" style={{ top: reduced ? '100%' : position }}/></span>
    <div className="story-waypoint"><span className="story-step-count">0{index + 1}</span><span>{step.name}</span></div>
    <h3>{step.title}</h3><p className="story-step-description">{step.text}</p>
    <ExampleScene step={index} progress={scrollYProgress} reduced={reduced}/>
    <div className="story-concept"><span>{step.concept}</span><p>{step.explanation}</p></div>
  </li>;
}

export function IntelligenceStory({ onOpenGraph }: { onOpenGraph: () => void }) {
  return <section className="intelligence-story story-open" id="layered-chapters" aria-labelledby="intelligence-title">
    <header className="story-heading"><div><span className="intelligence-eyebrow">THE IDEA, IN EVERYDAY LIFE</span><h2 id="intelligence-title">One dinner.<br/><em>Four connected steps.</em></h2><p>Here’s how Sapiens could help you plan dinner with friends.</p></div><div className="story-context"><DinnerIllustration/><div><span className="intelligence-eyebrow">YOUR FRIDAY DINNER</span><p>You’ve shared the plan and your friends’ food preferences. You haven’t booked a restaurant yet.</p></div></div></header>
    <p className="story-status">Concept example · The behavior we’re developing, using information and permissions you provide.</p>
    <ol className="story-sequence" aria-label="Four connected steps in the dinner example">{steps.map((step, index) => <StoryStep key={step.name} step={step} index={index}/>)}</ol>
    <footer className="story-outro"><p>See how these parts connect<br/><strong>inside the Sapiens concept.</strong></p><button onClick={onOpenGraph} aria-haspopup="dialog">Open the full picture <ArrowUpRight size={22}/></button></footer>
  </section>;
}
