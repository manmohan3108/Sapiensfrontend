import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ArrowDown } from 'lucide-react';
import '../../../styles/intelligence-story.css';

const chapters = [
  { name: 'Notice', title: 'What matters right now?', text: 'A useful response begins with context. What is happening, what matters to you, and what is still missing?', example: 'The reading group meets on Friday. Nobody has picked a book.', question: 'A meeting is coming. A choice is missing.', detail: 'Connect a goal with the situation around it.' },
  { name: 'Predict', title: 'What might happen next?', text: 'Prediction connects the present to possible futures. It helps weigh a next step—not assume that one outcome is certain.', example: 'Choosing now could give everyone time to read. Waiting could leave the group unprepared.', question: 'Two possible futures. Different consequences.', detail: 'Anticipate possibilities; keep uncertainty visible.' },
  { name: 'Take initiative', title: 'Is there a reason to act?', text: 'Being proactive starts before an instruction: notice a useful next step, ask when something is unclear, and respect the boundaries of permission.', example: '“Would you like to choose a short reading for Friday?” Asking comes before taking action.', question: 'A useful question, before a last-minute problem.', detail: 'Initiative includes knowing when to ask.' },
  { name: 'Learn', title: 'What should carry forward?', text: 'An outcome is more than the end of a task. Reflecting on what happened can help shape the next approach.', example: 'A short reading led to a good discussion. That experience could inform the next suggestion.', question: 'An experience becomes context for next time.', detail: 'Keep relevant experience. Reconsider what did not work.' },
];

export function IntelligenceStory({ onOpenGraph }: { onOpenGraph: () => void }) {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  useEffect(() => {
    const nodes = root.current?.querySelectorAll<HTMLElement>('[data-chapter]');
    if (!nodes) return;
    let frame = 0;
    const sync = () => {
      frame = 0;
      const readingLine = window.innerHeight * (window.innerWidth <= 760 ? .68 : .5);
      let selected = 0;
      nodes.forEach((node, index) => {
        if (node.getBoundingClientRect().top <= readingLine) selected = index;
      });
      setActive(selected);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(sync); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    sync();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);
  return <section ref={root} className="intelligence-story" id="layered-chapters" aria-labelledby="intelligence-title">
    <header className="intelligence-heading"><div><span className="intelligence-eyebrow">THE IDEA WE’RE BUILDING TOWARD</span><h2 id="intelligence-title">What does it take<br/>to act <em>intelligently?</em></h2></div><div><p>For Sapiens, we’re exploring a connected process: notice what matters, anticipate possibilities, take thoughtful initiative, and learn from experience.</p><a href="#intelligence-0">Follow one everyday example <ArrowDown size={18}/></a><small>A concept illustration, not a demonstration of current autonomous capabilities.</small></div></header>
    <div className="intelligence-layout">
      <div className="intelligence-scene" data-stage={active}>
        <div className="intelligence-scene-top"><span>ONE SITUATION, FOUR PERSPECTIVES</span><span>0{active+1} / 04</span></div>
        <div className="intelligence-scene-art">
          <div className="intelligence-calendar"><span>READING GROUP</span><strong>Friday</strong><small>Something to look forward to.</small><div className="calendar-dots">● ● ● ● <b>●</b> ○ ○</div></div>
          <div className="intelligence-book"><img src="/concepts/sapiens-curiosity.png" width="1536" height="1024" alt="Paper collage of a hand holding a book, with growing leaves and colorful ideas" loading="lazy"/></div>
          <svg className="intelligence-connections" viewBox="0 0 500 400" aria-hidden="true"><path d="M110 90C110 220 240 130 250 240S390 280 400 130"/><path className="intelligence-branch" d="M250 240Q190 320 90 330M250 240Q320 320 420 330"/></svg>
          <div className="intelligence-signal" key={active}>
            {active===0 && <><span className="signal-tag">A GAP TO NOTICE</span><strong>Which book?</strong><p>The date is set.<br/>The reading isn’t.</p><span className="signal-mark">?</span></>}
            {active===1 && <><span className="signal-tag">POSSIBLE OUTCOMES</span><div className="intelligence-futures"><div><b>Choose now</b><span>Time to prepare ↗</span></div><div><b>Leave it later</b><span>Less time to read ↘</span></div></div><small>Possibilities, not certainties.</small></>}
            {active===2 && <><span className="signal-tag">A THOUGHTFUL NEXT STEP</span><strong>“Shall we choose<br/>a short reading?”</strong><p>Ask first. Act within permission.</p><span className="signal-mark">↗</span></>}
            {active===3 && <><span className="signal-tag">EXPERIENCE TO CARRY FORWARD</span><strong>A shorter reading.<br/>A better discussion.</strong><p>Something useful to consider next time.</p><span className="signal-mark">↶</span></>}
          </div>
        </div>
        <div className="intelligence-scene-caption"><strong>{chapters[active].question}</strong><span>{chapters[active].detail}</span></div>
        <nav className="intelligence-progress" aria-label="Explore the intelligence concepts">{chapters.map((chapter,i)=><a key={chapter.name} href={`#intelligence-${i}`} aria-current={active===i?'step':undefined} onClick={()=>setActive(i)}><span>0{i+1}</span>{chapter.name}</a>)}</nav>
      </div>
      <div className="intelligence-chapters">{chapters.map((chapter,i)=><article id={`intelligence-${i}`} key={chapter.name} data-chapter={i} className={active===i?'is-current':''}><span className="intelligence-chapter-label">0{i+1} / {chapter.name}</span><h3>{chapter.title}</h3><p>{chapter.text}</p><div className="intelligence-example"><span>IN OUR READING GROUP</span><p>{chapter.example}</p></div></article>)}</div>
    </div>
    <footer className="intelligence-outro"><div><span className="intelligence-eyebrow">THE CONNECTION IS THE IDEA</span><h3>Not isolated abilities.<br/><em>A process that carries forward.</em></h3></div><button onClick={onOpenGraph} aria-haspopup="dialog">Explore the complete Sapiens concept <ArrowUpRight size={22}/></button></footer>
  </section>;
}
