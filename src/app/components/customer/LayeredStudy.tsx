import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUpRight, Check } from 'lucide-react';
import { ApproachComparison } from './ApproachComparison';
import { SapiensWorldDiagram } from './SapiensWorldDiagram';
import { useCorePointerResponse } from './useCorePointerResponse';
import { BreathingCore } from './BreathingCore';
import '../../../styles/layered-direction.css';
import '../../../styles/layered-experience.css';

const capabilities = [
  { label: 'Interacts with people, listens, and understands.', image: '/concepts/sapiens-world-3d.png', position: '0% 0%', size: '200% 200%' },
  { label: 'Explores what interests it and asks questions.', image: '/concepts/sapiens-hero-curiosity-3d.png', position: 'center', size: 'contain' },
  { label: 'Seeks information to understand what it doesn’t know.', image: '/concepts/sapiens-world-3d.png', position: '100% 0%', size: '200% 200%' },
  { label: 'Takes initiative and uses tools to act.', image: '/concepts/sapiens-world-3d.png', position: '0% 100%', size: '200% 200%' },
  { label: 'Considers when to act and when to wait.', image: '/concepts/sapiens-hero-waiting-3d.png', position: 'center', size: 'contain' },
  { label: 'Reflects on what happens and learns for next time.', image: '/concepts/sapiens-world-3d.png', position: '100% 100%', size: '200% 200%' },
];

function ExperienceOpening({ cta }: { cta: ReactNode }) {
  const scene = useRef<HTMLDivElement>(null);
  useCorePointerResponse(scene);
  useEffect(() => {
    const node = scene.current;
    if (!node) return;
    let inView = false;
    let frame = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateDepth = () => {
      frame = 0;
      if (reducedMotion.matches) {
        node.style.setProperty('--scene-scroll', '0');
        return;
      }
      if (!inView || document.hidden) return;
      const bounds = node.getBoundingClientRect();
      const progress = (window.innerHeight / 2 - bounds.top - bounds.height / 2) / window.innerHeight;
      node.style.setProperty('--scene-scroll', String(Math.max(-1, Math.min(1, progress))));
    };
    const scheduleDepth = () => {
      if (!frame) frame = window.requestAnimationFrame(updateDepth);
    };
    const sync = () => {
      node.classList.toggle('is-visible', inView && !document.hidden);
      scheduleDepth();
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }, { threshold: .15 });
    observer.observe(node);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('scroll', scheduleDepth, { passive: true });
    window.addEventListener('resize', scheduleDepth);
    reducedMotion.addEventListener('change', scheduleDepth);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('scroll', scheduleDepth);
      window.removeEventListener('resize', scheduleDepth);
      reducedMotion.removeEventListener('change', scheduleDepth);
    };
  }, []);
  return <section className="experience-opening" aria-labelledby="experience-title">
    <div className="experience-opening-copy">
      <span className="experience-kicker"><i/> Meet Sapiens</span>
      <h1 id="experience-title">An AI individual.<br/>Shaped by<br/><span>experience.</span></h1>
      <p>We’re building AI that carries its experiences into what it notices, says, and does next.</p>
      <div className="experience-actions">{cta}<a href="#layered-chapters">Explore the idea <ArrowDown size={17}/></a></div>
      <small>Experimental architecture · in development</small>
      <a className="experience-scroll-cue" href="#direction-idea">Scroll to explore <ArrowDown size={16} aria-hidden="true"/></a>
    </div>
    <div className="experience-scene experience-capability-scene" ref={scene}>
      <div className="experience-scene-top"><span>ONE INDIVIDUAL / MANY CONNECTIONS</span><span>Concept preview</span></div>
      <div className="experience-hero-core" aria-hidden="true"><span className="experience-core-response"><BreathingCore/></span></div>
      <ul className="experience-capabilities" aria-label="The behaviours we are building toward">{capabilities.map((item) => <li key={item.label}><span className="experience-art-depth" aria-hidden="true"><span className="experience-art-surface"/><span className="experience-capability-art" style={{ backgroundImage: `url(${item.image})`, backgroundPosition: item.position, backgroundSize: item.size }}/></span><span>{item.label}</span></li>)}</ul>
      <div className="experience-scene-caption"><p>One continuing identity connects it all.</p></div>
    </div>
  </section>;
}

export function LayeredStudy({ cta, onOpenGraph }: { cta: ReactNode; onOpenGraph: () => void }) {
  const layers = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);
  useEffect(() => {
    const root = layers.current;
    if (!root) return;
    const opening = root.querySelector<HTMLElement>('.experience-opening-sheet')!;
    const idea = root.querySelector<HTMLElement>('.experience-thesis')!;
    const system = root.querySelector<HTMLElement>('.world-section')!;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const coverage = (element: HTMLElement) => Math.max(0, Math.min(1, (viewport - element.getBoundingClientRect().top) / viewport));
      root.style.setProperty('--opening-recede', preference.matches ? '0' : String(coverage(idea)));
      root.style.setProperty('--idea-recede', preference.matches ? '0' : String(coverage(system)));
      const readingLine = Math.max(100, viewport * .3);
      setActiveSection(system.getBoundingClientRect().top <= readingLine ? 2 : idea.getBoundingClientRect().top <= readingLine ? 1 : 0);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const measure = () => {
      // Tall layouts scroll completely into view before their bottom edge pins.
      root.style.setProperty('--opening-sheet-height', `${opening.offsetHeight}px`);
      root.style.setProperty('--idea-sheet-height', `${idea.offsetHeight}px`);
      schedule();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(opening);
    observer.observe(idea);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    preference.addEventListener('change', schedule);
    measure();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      preference.removeEventListener('change', schedule);
    };
  }, []);
  return <div className="layered-experience experience-scroll-stack" ref={layers}>
    <nav className="experience-section-nav" aria-label="Explore Sapiens sections">
      {[['direction-product', 'Meet Sapiens'], ['direction-idea', 'The idea'], ['layered-chapters', 'The system']].map(([target, label], index) => <a key={target} href={`#${target}`} aria-current={activeSection === index ? 'location' : undefined}><span aria-hidden="true">0{index + 1}</span>{label}</a>)}
    </nav>
    <span className="experience-scroll-target" id="direction-product" aria-hidden="true"/>
    <div className="experience-opening-sheet"><ExperienceOpening cta={cta}/></div>
    <span className="experience-scroll-target" id="direction-idea" aria-hidden="true"/>
    <section className="experience-thesis" aria-labelledby="experience-vision-title"><span>THE IDEA WE’RE BUILDING</span><h2 id="experience-vision-title">An AI individual<br/><em>that behaves more like a human.</em></h2><div><p>We’re building an AI individual that learns from experience, anticipates what’s next, and takes initiative—acting quickly when needed, without always waiting to be asked.</p></div></section>
    <section className="world-section" id="layered-chapters" aria-labelledby="world-title">
      <header className="world-heading"><div><span className="experience-kicker">EXPLORE THE SYSTEM</span><h2 id="world-title">One individual.<br/>In conversation with the world.</h2></div><p>Explore how Sapiens connects with people,<br/>information, tools, and feedback.</p></header>
      <SapiensWorldDiagram/>
      <div className="experience-system-footer"><span><Check size={14}/> Concept in development · illustrative exchanges</span><button type="button" onClick={onOpenGraph} aria-haspopup="dialog">Full architecture <ArrowUpRight size={16}/></button></div>
      <details className="experience-technical"><summary>How does this approach compare with other AI?</summary><ApproachComparison/></details>
    </section>
  </div>;
}
