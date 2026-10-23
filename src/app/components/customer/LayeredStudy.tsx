import { useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowDown, ArrowUpRight, ArrowRight, Check, Leaf, Search, Volume2, CalendarDays, MessageCircle, SlidersHorizontal } from 'lucide-react';
import { ApproachComparison } from './ApproachComparison';
import '../../../styles/layered-direction.css';
import '../../../styles/sapiens-journey.css';

function Identity({ small = false }: { small?: boolean }) {
  return <span className={`journey-identity${small ? ' journey-identity-small' : ''}`}><img src="/concepts/sapiens-amber.png" alt="" width="72" height="72"/><span>Sapiens<small>The same individual, throughout.</small></span></span>;
}

function TableScene() {
  return <svg viewBox="0 0 480 290" role="img" aria-label="A table set for three friends, with vegetarian dishes and flowers">
    <path d="M80 210l-12 65m324-65 12 65" stroke="#693e30" strokeWidth="16"/>
    <ellipse cx="240" cy="163" rx="213" ry="109" fill="#a83d36"/>
    <ellipse cx="240" cy="152" rx="213" ry="103" fill="#eb8973"/>
    <path d="M51 115q190 85 378 0M64 198q175-75 352 0" fill="none" stroke="#f8b79b" strokeWidth="3"/>
    {[112, 368].map(x => <g key={x}><ellipse cx={x} cy="152" rx="53" ry="36" fill="#fff4d4"/><ellipse cx={x} cy="152" rx="38" ry="25" fill="#e9d88a"/><path d={`M${x-18} 150q20-30 36 0-18 30-36 0`} fill="#47704a"/><path d={`M${x-64} 127v49m-6-49v15q6 8 12 0v-15`} stroke="#633e2a" strokeWidth="3" fill="none"/></g>)}
    <ellipse cx="240" cy="215" rx="53" ry="28" fill="#fff4d4"/><ellipse cx="240" cy="215" rx="36" ry="17" fill="#e9d88a"/>
    <path d="M220 131l-6-48h52l-6 48z" fill="#fff0b0"/><path d="M240 87V28m0 33q-37 0-29-23 26 0 29 23m0-14q34 0 31-20-27-3-31 20" stroke="#2b603e" fill="#2b603e" strokeWidth="3"/>
    <circle cx="241" cy="20" r="17" fill="#bb354a"/><circle cx="241" cy="20" r="6" fill="#f6d257"/>
    <path d="M180 180l9-27h20l9 27zM298 194l8-27h20l8 27z" fill="#f9edc9" stroke="#996d48" strokeWidth="2"/>
  </svg>;
}

export function LayeredStudy({ cta, onOpenGraph }: { cta: ReactNode; onOpenGraph: () => void }) {
  const hero = useRef<HTMLElement>(null);
  const reduced = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] });
  const backY = useTransform(scrollYProgress, [0, 1], [0, 65]);
  const frontY = useTransform(scrollYProgress, [0, 1], [0, -45]);
  const [searched, setSearched] = useState(false);
  const [feedback, setFeedback] = useState<'quiet' | 'lively'>('quiet');
  const reveal = { initial: false as const, whileInView: reduced ? {} : { opacity: [0.65, 1], y: [16, 0] }, viewport: { once: true, amount: 0.2 }, transition: { duration: 0.65 } };
  return <div className="layered-study journey-study">
    <section className="journey-hero" ref={hero} aria-labelledby="journey-title">
      <div className="journey-hero-copy"><span className="journey-kicker">MEET SAPIENS</span><h1 id="journey-title">An AI individual.<br/><em>Shaped by<br/>experience.</em></h1><p>What you share. What it does.<br/>What happens next. Connected over time.</p><div className="layered-actions">{cta}<a className="journey-text-link" href="#layered-chapters">See it through a story <ArrowDown size={18}/></a></div><span className="journey-hero-note">An experimental system, in development.</span></div>
      <div className="journey-hero-art">
        <motion.figure className="journey-dinner-print" style={{ y: reduced ? 0 : backY }}><span>FRIDAY, 7 PM · THREE FRIENDS</span><TableScene/><figcaption>A little dinner.<br/><em>A lot to connect.</em></figcaption></motion.figure>
        <motion.div className="journey-memory-slip" style={{ y: reduced ? 0 : frontY }}><Leaf size={21}/><span>Remembered from you<strong>“Maya is vegetarian.”</strong></span></motion.div>
        <div className="journey-hero-presence"><Identity/><span className="journey-presence-thread" aria-hidden="true"/></div>
      </div>
    </section>

    <section className="journey-story" id="layered-chapters" aria-labelledby="journey-story-title">
      <header className="journey-story-heading"><div><span className="journey-kicker">ONE SAPIENS. ONE UNFOLDING SITUATION.</span><h2 id="journey-story-title">Dinner on Friday.<br/><em>Experience for next time.</em></h2></div><p>Illustrative concept · Try the example below.<br/>No real searches or bookings are made.</p></header>
      <ol className="journey-sequence" aria-label="From a remembered preference to a different suggestion next time">
        <motion.li {...reveal} className="journey-moment journey-remember"><div className="journey-moment-label"><span>01 / MEMORY</span><time>Last week</time></div><h3>A detail worth keeping.</h3><div className="journey-message"><span>You told Sapiens</span><p>“Maya is vegetarian.”</p></div><div className="journey-memory-path" aria-hidden="true"><span/><ArrowDown size={20}/></div><div className="journey-saved"><Leaf size={24}/><div><span>Remembered context</span><strong>Maya · vegetarian</strong></div><Check size={20}/></div><p className="journey-caption">A past conversation becomes useful context.</p></motion.li>
        <motion.li {...reveal} className="journey-moment journey-notice"><div className="journey-moment-label"><span>02 / INITIATIVE</span><time>Thursday</time></div><h3>The plan has a missing piece.</h3><div className="journey-calendar"><CalendarDays size={28}/><div><strong>Dinner with Maya & Alex</strong><span>Friday · 7 pm · 3 people</span></div><span className="journey-open-item">No restaurant yet</span></div><div className="journey-suggestion"><Identity small/><p>“Dinner’s tomorrow. Shall I look for a table with good vegetarian options?”</p></div><p className="journey-caption">The plan and memory give it a reason to offer help.</p></motion.li>
        <motion.li {...reveal} className="journey-moment journey-act"><div className="journey-moment-label"><span>03 / ACTION, WITH YOUR SAY</span><time>Before dinner</time></div><h3>You decide. It follows through.</h3><div className="journey-permission"><span>Find options for 3 · Friday, 7 pm</span><button type="button" onClick={() => setSearched(value => !value)} aria-pressed={searched} aria-controls="journey-results">{searched ? <Check size={18}/> : <Search size={18}/>} {searched ? 'Reset example' : 'Yes, find a table'}{!searched && <ArrowRight size={18}/>}</button></div><div id="journey-results" className={`journey-results${searched ? ' is-found' : ''}`} aria-live="polite" aria-atomic="true">{searched ? <><span className="journey-result-label">ILLUSTRATIVE SEARCH RESULT</span><div className="journey-restaurant"><span className="journey-restaurant-art" aria-hidden="true"><Leaf size={30}/><span>the garden</span></span><div><strong>The Garden Table</strong><span>Vegetarian menu · Table for 3</span><small>Example availability: Friday, 7 pm</small></div><Check size={22}/></div><p>Options found. You choose whether to book.</p></> : <><div className="journey-search-map" aria-hidden="true"><span/><span/><span/><Search size={28}/></div><p>Try the button to see a suggested place.</p></>}</div><p className="journey-caption">Real actions need supported tools and your permission.</p></motion.li>
        <motion.li {...reveal} className="journey-moment journey-learn"><div className="journey-moment-label"><span>04 / EXPERIENCE</span><time>After dinner → next time</time></div><h3>The next suggestion changes.</h3><fieldset className="journey-feedback"><legend>Your feedback after dinner</legend><div><button type="button" aria-pressed={feedback === 'quiet'} onClick={() => setFeedback('quiet')}>“Too noisy.”</button><button type="button" aria-pressed={feedback === 'lively'} onClick={() => setFeedback('lively')}>“Loved the buzz.”</button></div></fieldset><div className="journey-next-time" aria-live="polite" aria-atomic="true"><div><Identity small/><span>Next dinner</span></div><p>{feedback === 'quiet' ? '“A quieter place this time, with vegetarian options for Maya?”' : '“Somewhere lively again, with vegetarian options for Maya?”'}</p><div className="journey-memory-tags"><span><Leaf size={14}/> Vegetarian</span><span><Volume2 size={14}/>{feedback === 'quiet' ? 'Quieter atmosphere' : 'Lively atmosphere'}</span></div></div><p className="journey-caption">New feedback joins earlier memory.</p></motion.li>
      </ol>
      <div className="journey-continuity"><img src="/concepts/sapiens-amber.png" alt="" width="64" height="64"/><p><strong>Same Sapiens. More shared experience.</strong><span>This is the behavior we’re working toward.</span></p><a href="#direction-product">What’s available today <ArrowDown size={18}/></a></div>
      <details className="journey-details"><summary><span>Curious about the architecture or other AI?</span><span aria-hidden="true">+</span></summary><div className="journey-details-intro"><p>The story brings memory, attention, goals and reflection together. These capabilities also exist in other AI systems; this example illustrates our focus, not a proven advantage.</p><button type="button" onClick={onOpenGraph} aria-haspopup="dialog">Explore the architecture <ArrowUpRight size={18}/></button></div><ApproachComparison/></details>
    </section>
    <section className="journey-today" id="direction-product" aria-labelledby="journey-today-title"><div><span className="journey-kicker">TRY SAPIENS TODAY</span><h2 id="journey-today-title">Start your shared history.</h2><p>Create an individual and begin a conversation.</p>{cta}</div><div className="journey-today-features"><div><MessageCircle size={25}/><p><strong>Talk. Return. Continue.</strong><span>Revisit saved conversations. Selected past context may inform replies.</span></p></div><div><SlidersHorizontal size={25}/><p><strong>Connect supported tools.</strong><span>Available actions depend on the provider, setup and permissions.</span></p></div><a className="journey-text-link" href="#layered-chapters">The dinner story is a concept, not a live product demo.</a></div></section>
  </div>;
}
