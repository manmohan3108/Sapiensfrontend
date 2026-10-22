import { IntelligenceStory } from './IntelligenceStory';
import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowDown, ArrowUpRight, ArrowRight } from 'lucide-react';
import '../../../styles/layered-direction.css';

export function LayeredStudy({ cta, onOpenGraph }: { cta: ReactNode; onOpenGraph: () => void }) {
  const hero = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const still = reduced;
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] });
  const backY = useTransform(scrollYProgress, [0, 1], [0, 135]);
  const middleY = useTransform(scrollYProgress, [0, 1], [0, -65]);
  const frontY = useTransform(scrollYProgress, [0, 1], [0, -190]);
  const turn = useTransform(scrollYProgress, [0, 1], [-8, 4]);
  return <div className={`layered-study${still ? ' layered-still' : ''}`}>
    <section className="layered-hero" ref={hero}>
      <div className="layered-hero-top"><span>AN AI INDIVIDUAL. SHAPED BY EXPERIENCE.</span></div>
      <div className="layered-hero-grid">
        <div className="layered-hero-copy"><h1>Big ideas.<br/>{' '}Small questions.<br/>{' '}<em>Your Sapiens.</em></h1><p>An individual you can return to, around the ideas, interests and goals that matter to you.</p><div className="layered-actions">{cta}<a href="#layered-chapters" className="layered-secondary">Explore the idea <ArrowDown size={18}/></a></div><span className="layered-scroll-note">SCROLL TO EXPLORE <span aria-hidden="true">↓</span></span>
</div>
        <div className="layered-scene concept-hero-scene" aria-label="An illustrated collection of ideas and conversations">
          <motion.figure className="layered-art-sheet" style={{y:still?0:backY,rotate:still?-4:turn}}><img src="/concepts/sapiens-curiosity.png" alt="A paper collage of an open notebook, a hand, a sun and growing leaves" width="1536" height="1024"/><figcaption>A little curiosity goes a long way.</figcaption></motion.figure>
          <motion.div className="layered-note-sheet" style={{y:still?0:middleY}}><span>AN IDEA TO RETURN TO</span><p>What if we<br/>{' '}<em>started here?</em></p><div className="layered-note-line"/><div className="layered-note-line short"/></motion.div>
          <motion.button className="sapiens-explore-core" style={{y:still?0:frontY}} onClick={onOpenGraph} aria-haspopup="dialog" aria-label="Explore how Sapiens works">
            <span className="explore-core-orbit" aria-hidden="true"/>
            <img src="/concepts/sapiens-amber.png" width="240" height="240" alt=""/>
            <span>Explore how Sapiens works <ArrowUpRight size={20}/></span>
          </motion.button>
        </div>
      </div>
    </section>
    <div className="layered-ribbon" aria-hidden="true"><span>NOTICE</span><b>✳</b><span>ASK</span><b>✳</b><span>UNDERSTAND</span><b>✳</b><span>RETURN</span><b>✳</b></div>
    <IntelligenceStory onOpenGraph={onOpenGraph}/>
  </div>;
}
