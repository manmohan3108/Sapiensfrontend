import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowDown, ArrowUpRight, ArrowRight, Check, Clock3, Leaf, MessageCircle, SlidersHorizontal, Sun } from 'lucide-react';
import { ApproachComparison } from './ApproachComparison';
import '../../../styles/layered-direction.css';
import '../../../styles/sapiens-journey.css';

const gardenScenes = [
  { stop: 'Notice', time: 'A HOT AFTERNOON', title: 'Something needs attention.', alt: 'Maya photographs drooping plants in a sunny community garden.', note: 'Sapiens connects the forecast with Maya’s photo.', speaker: 'Sapiens · a first possibility', message: '“Could the soil be too dry?”', evidence: 'Forecast: 38°C + drooping leaves', transition: 'A photo cannot answer everything. Ask someone there.' },
  { stop: 'Ask', time: 'BEFORE TAKING ACTION', title: 'Ask. Then wait.', alt: 'Maya reads her phone beside the garden. A watering can remains unused.', note: 'It needs an answer before suggesting more water.', speaker: 'Sapiens → Maya', message: '“Is the soil dry?”', evidence: 'Waiting for Maya · no action yet', transition: 'Maya checks the soil and replies.' },
  { stop: 'Rethink', time: 'NEW INFORMATION', title: 'The answer changes the plan.', alt: 'Maya checks dark, moist soil in her hand beneath the plants.', note: 'The first idea no longer fits the evidence.', speaker: 'Maya → Sapiens', message: '“No, still wet.”', evidence: 'Sapiens: “Try shade first?”', transition: 'With permission, a revised idea becomes a coordinated action.' },
  { stop: 'Act', time: 'WITH YOUR APPROVAL', title: 'Bring the right people in.', alt: 'Maya and another gardener put a shade cloth over the garden bed.', note: 'Sapiens coordinates. The gardeners set up the shade.', speaker: 'You → Sapiens', message: '“Yes, arrange it with Maya.”', evidence: 'Maya: “We’ll set it up.”', transition: 'The action is not the end. What happened afterward?' },
  { stop: 'Learn', time: 'THE NEXT DAY', title: 'Observe. Keep the experience.', alt: 'Maya photographs perkier plants beneath the shade cloth the next morning.', note: 'A useful observation, not proof that shade always works.', speaker: 'Maya → Sapiens', message: '“They’re looking better today.”', evidence: 'Remembered: shade helped here', transition: 'That experience travels with the same Sapiens.' },
  { stop: 'Next time', time: 'THE NEXT HOT SPELL', title: 'A different initiative.', alt: 'Before the plants wilt, Maya and another gardener check soil and prepare a rolled shade cloth.', note: 'It raises the question earlier, before the plants wilt.', speaker: 'Sapiens → Maya', message: '“Check the soil and prepare shade early?”', evidence: 'Past experience → an earlier suggestion' },
];

function Identity() {
  return <span className="garden-identity"><img src="/concepts/sapiens-amber.png" alt="" width="64" height="64"/><span>Sapiens<small>The same individual, throughout.</small></span></span>;
}

function GardenImage({ index, hero = false }: { index: number; hero?: boolean }) {
  return <div className="garden-image" role="img" aria-label={gardenScenes[index].alt} style={{ '--garden-x': `${index % 2 * 100}%`, '--garden-y': `${Math.floor(index / 2) * 50}%` } as CSSProperties}>
    <img src="/concepts/sapiens-garden-story.png" alt="" width="1254" height="1254" loading={hero ? 'eager' : 'lazy'} fetchPriority={hero ? 'high' : 'auto'} decoding="async"/>
  </div>;
}

export function LayeredStudy({ cta, onOpenGraph }: { cta: ReactNode; onOpenGraph: () => void }) {
  const hero = useRef<HTMLElement>(null);
  const sequence = useRef<HTMLOListElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const reduced = Boolean(useReducedMotion());
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] });
  const artY = useTransform(scrollYProgress, [0, 1], [0, 48]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const moments = Array.from(sequence.current?.children ?? []);
      let current = 0;
      moments.forEach((moment, index) => {
        if (moment.getBoundingClientRect().top <= window.innerHeight * 0.4) current = index;
      });
      setActiveStep(current);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return <div className="layered-study garden-study">
    <section className="garden-hero" ref={hero} aria-labelledby="garden-title">
      <div className="garden-hero-copy"><span className="garden-kicker">MEET SAPIENS</span><h1 id="garden-title">An AI individual.<br/><em>Shaped by<br/>experience.</em></h1><p>It gathers information. Talks to people. Knows when to wait. And carries experience into what comes next.</p><div className="layered-actions"><a className="garden-start" href="#layered-chapters">See the story unfold <ArrowDown size={18}/></a>{cta}</div><small>Experimental architecture · in development</small></div>
      <motion.figure className="garden-hero-art" style={{ y: reduced ? 0 : artY }}><GardenImage index={5} hero/><figcaption><span>ONE GARDEN. ONE SAPIENS.</span><Identity/></figcaption><div className="garden-goal"><Leaf size={20}/><span>Ongoing goal<strong>Keep the community garden healthy.</strong></span></div></motion.figure>
    </section>

    <section className="garden-story" id="layered-chapters" aria-labelledby="garden-story-title">
      <header className="garden-story-heading"><span className="garden-kicker">FOLLOW THE SAME INDIVIDUAL</span><h2 id="garden-story-title">A garden. A heatwave.<br/><em>A reason to think again.</em></h2><p>Maya tends the garden. Sapiens helps her look after it.</p><small>Illustrative concept, not a live demonstration. Actions depend on supported connections and permission.</small></header>
      <nav className="garden-guide" aria-label="Garden story progress">{gardenScenes.map((scene, index) => <a key={scene.stop} href={`#garden-step-${index + 1}`} aria-current={activeStep === index ? 'step' : undefined}><span>0{index + 1}</span>{scene.stop}</a>)}</nav>
      <ol ref={sequence} className="garden-sequence" role="list" aria-label="Six moments in the garden story">
        {gardenScenes.map((scene, index) => <li key={scene.stop} id={`garden-step-${index + 1}`} className={`garden-moment${activeStep === index ? ' is-current' : ''}`}>
          <div className="garden-moment-copy"><span className="garden-number" aria-hidden="true">0{index + 1}</span><span className="garden-kicker">{scene.time}</span><h3>{scene.title}</h3><p>{scene.note}</p><div className="garden-thread-identity"><img src="/concepts/sapiens-amber.png" alt="" width="48" height="48"/><span>Sapiens<span className="garden-experience-dots" aria-hidden="true">{Array.from({ length: index + 1 }, (_, n) => <i key={n}/>)}</span></span></div></div>
          <motion.figure className="garden-scene" initial={false} whileInView={reduced ? {} : { y: [12, 0] }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.5 }}><GardenImage index={index}/><figcaption><span className="garden-speaker">{scene.speaker}</span><blockquote>{scene.message}</blockquote><div className={`garden-evidence garden-evidence-${index}`}>
            {index === 0 ? <Sun size={17} aria-hidden="true"/> : index === 1 ? <Clock3 size={17} aria-hidden="true"/> : index === 2 ? <ArrowRight size={17} aria-hidden="true"/> : index === 3 ? <Check size={17} aria-hidden="true"/> : <Leaf size={17} aria-hidden="true"/>}<span>{scene.evidence}</span>
          </div></figcaption></motion.figure>
          {scene.transition && <div className="garden-transition"><ArrowDown size={16} aria-hidden="true"/><span>{scene.transition}</span></div>}
        </li>)}
      </ol>
      <div className="garden-ending"><Identity/><h3>Same individual.<br/><em>A different next move.</em></h3><p>What happened before helps shape what it chooses to do next.</p></div>
      <details className="garden-details"><summary><span>Explore the architecture & how this compares</span><span aria-hidden="true">+</span></summary><div className="garden-technical"><p>This story illustrates the behavior we’re developing. It is not a claim of unique capabilities or proven performance.</p><button type="button" onClick={onOpenGraph} aria-haspopup="dialog">Open the full architecture <ArrowUpRight size={18}/></button></div><ApproachComparison/></details>
    </section>
    <section className="garden-today" id="direction-product" aria-labelledby="garden-today-title"><div><span className="garden-kicker">WHAT YOU CAN TRY TODAY</span><h2 id="garden-today-title">Start your shared history.</h2><p>Create an individual and begin a conversation.</p>{cta}</div><div className="garden-features"><div><MessageCircle size={25}/><p><strong>Talk. Return. Continue.</strong><span>Revisit saved conversations. Selected past context may inform replies.</span></p></div><div><SlidersHorizontal size={25}/><p><strong>Connect supported tools.</strong><span>Available actions depend on the provider, setup and permissions.</span></p></div></div></section>
  </div>;
}
