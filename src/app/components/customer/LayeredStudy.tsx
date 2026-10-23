import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown, ArrowUpRight, Clock3, MessageCircle, Check, RotateCcw } from 'lucide-react';
import { ApproachComparison } from './ApproachComparison';
import '../../../styles/layered-direction.css';
import '../../../styles/sapiens-journey.css';

const moments = [
  { name: 'Notice', title: 'Rain could disrupt your park visit.', caption: 'Sapiens checks indoor options so you can still meet your friends.', color: '#ba482e', tint: '#ffe6d5', aspect: 'Attention & curiosity', speaker: 'Sapiens → you', message: '“Rain is forecast for our park visit. I’ll check indoor options.”', context: 'The goal stays the same: help you spend an afternoon together.', alt: 'A sculpted park scene with Maya, a rain cloud and a calendar.' },
  { name: 'Ask & wait', title: 'Sapiens still needs Maya’s availability.', caption: 'It asks when she can join, then waits rather than guessing a time.', color: '#886017', tint: '#fff0bd', aspect: 'Understanding', speaker: 'Sapiens → Maya', message: '“Before I suggest a café, what time can you join us?”', context: 'Maya has not replied, so Sapiens leaves the time undecided.', alt: 'Maya checks her phone beside a speech bubble and a clock.' },
  { name: 'Reconsider', title: 'Maya’s reply narrows the options.', caption: 'She can meet after three and wants somewhere quiet, so Sapiens looks for a suitable café.', color: '#236b55', tint: '#dceee0', aspect: 'Understanding', speaker: 'Maya → Sapiens', message: '“After three works. Somewhere quiet?”', context: 'The suggestion now needs to fit the weather, her time and her preference.', alt: 'A sculpted café with plants and a clock showing three.' },
  { name: 'Coordinate', title: 'You decide before the plan is shared.', caption: 'Sapiens asks for approval, then sends the details so your friends know where to meet.', color: '#ab3c59', tint: '#ffe0e7', aspect: 'Goals & reflection', speaker: 'Sapiens → you', message: '“This café looks suitable after three. Shall I tell everyone?”', context: 'You approve. Sapiens shares the agreed place and time.', alt: 'Two friends receive the confirmed arrangement on their phones.' },
  { name: 'Reflect', title: 'The café was too noisy to talk.', caption: 'Maya’s feedback gives Sapiens a reason to rethink its choice.', color: '#9b4c20', tint: '#ffe3c4', aspect: 'Goals & reflection', speaker: 'Maya → Sapiens · after the outing', message: '“Nice place, but we could barely hear each other.”', context: 'The café seemed suitable, but the experience revealed a problem.', alt: 'Three friends at a café table lean in to hear over a nearby speaker.' },
  { name: 'Remember', title: 'That feedback changes the next search.', caption: 'To help everyone hear each other, Sapiens checks quiet seating before suggesting a venue.', color: '#356545', tint: '#e3edc7', aspect: 'Memory & experience', speaker: 'Sapiens → you · the next outing', message: '“Last time it was hard to talk. I’ll check for quiet seating first.”', context: 'A previous experience changes what the same Sapiens pays attention to.', alt: 'Maya and a friend sit at a quiet garden terrace, with a golden memory pearl.' },
];

function Scene({ index }: { index: number }) {
  return <span className="outing-art" role="img" aria-label={moments[index].alt} style={{ '--sprite-x': `${index % 3 * 50}%`, '--sprite-y': `${Math.floor(index / 3) * 100}%` } as CSSProperties}/>;
}

export function LayeredStudy({ cta, onOpenGraph }: { cta: ReactNode; onOpenGraph: () => void }) {
  const [selected, setSelected] = useState(0);
  const [replyArrived, setReplyArrived] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [wires, setWires] = useState({ width: 1200, height: 780, paths: [] as string[], returning: '', core: '' });
  const reduced = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const current = moments[selected];
  const choose = (index: number) => { setSelected(index); setReplyArrived(false); };
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const measure = () => {
      const outer = map.getBoundingClientRect();
      const nodes = Array.from(map.querySelectorAll('.outing-node')).map(node => {
        const box = node.getBoundingClientRect();
        return { left: box.left - outer.left, right: box.right - outer.left, y: box.top - outer.top + box.height / 2, top: box.top - outer.top, bottom: box.bottom - outer.top };
      });
      const [a,b,c,d,e,f] = nodes;
      const hub = map.querySelector('.outing-core')?.getBoundingClientRect();
      if (!f || !hub) return;
      const right = outer.width - 12;
      setWires({ width: outer.width, height: outer.height,
        paths: [`M${a.right + 3} ${a.y}H${b.left - 7}`, `M${b.right + 3} ${b.y}H${c.left - 7}`, `M${c.right + 3} ${c.y}H${right - 12}Q${right} ${c.y} ${right} ${c.y + 12}V${d.y - 12}Q${right} ${d.y} ${right - 12} ${d.y}H${d.right + 7}`, `M${d.left - 3} ${d.y}H${e.right + 7}`, `M${e.left - 3} ${e.y}H${f.right + 7}`],
        returning: `M${f.left - 3} ${f.y}H24Q12 ${f.y} 12 ${f.y - 12}V${a.y + 12}Q12 ${a.y} 24 ${a.y}H${a.left - 7}`,
        core: `M${outer.width / 2} ${b.bottom}V${hub.top - outer.top}M${outer.width / 2} ${hub.bottom - outer.top}V${e.top}` });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(map);
    const hub = map.querySelector('.outing-core');
    if (hub) observer.observe(hub);
    measure();
    return () => observer.disconnect();
  }, []);
  const conversation = <><span className="outing-speaker"><b>0{selected + 1} / 06</b> {selected === 1 && replyArrived ? 'Maya → Sapiens' : current.speaker}</span><p>{selected === 1 && replyArrived ? '“After three works. Somewhere quiet?”' : current.message}</p><span className="outing-conversation-context">{selected === 1 && replyArrived ? 'Now Sapiens can look for an indoor place that fits Maya’s time and preference.' : current.context}</span>{selected === 1 && <button className="outing-reply" type="button" onClick={() => setReplyArrived(value => !value)}>{replyArrived ? <Check size={14}/> : <Clock3 size={14}/>} {replyArrived ? 'Return to waiting' : 'See Maya’s reply'}</button>}</>;

  return <div className="outing-study">
    <section className="outing-intro" aria-labelledby="outing-title"><div><span className="outing-eyebrow">MEET SAPIENS</span><h1 id="outing-title">An AI individual.<br/><em>Shaped by experience.</em></h1></div><div className="outing-intro-side"><p>A persistent AI individual that gathers information, talks to people, and brings what it learns into its next decision.</p><div className="outing-actions"><a href="#layered-chapters">Follow one experience <ArrowDown size={17}/></a>{cta}</div><small>Experimental architecture · in development</small></div></section>
    <section className="outing-experience" id="layered-chapters" aria-labelledby="outing-heading">
      <header className="outing-context"><div><span className="outing-eyebrow">ONE SAPIENS. AN EXPERIENCE THAT CONTINUES.</span><h2 id="outing-heading">You want to spend Sunday with friends.</h2><p>You’ve asked Sapiens to help arrange an afternoon at the park with Maya and a friend. Here’s how it responds when the plan needs to change.</p></div><span className="outing-reading-key"><span>START AT <b>01</b></span>Follow the arrows. Select a scene for its conversation.</span></header>
      <div className="outing-map" ref={mapRef}>
        <svg className="outing-wires" viewBox={`0 0 ${wires.width} ${wires.height}`} preserveAspectRatio="none" aria-hidden="true"><defs><marker id={`${id}-arrow`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1 6 4 1 7" fill="none" stroke="currentColor" strokeWidth="1.5"/></marker></defs><g fill="none" stroke="currentColor" strokeWidth="2" markerEnd={`url(#${id}-arrow)`}>{wires.paths.map((path, index) => <path key={index} d={path}/>)}</g><path className="outing-return-wire" d={wires.returning} fill="none" strokeWidth="2" markerEnd={`url(#${id}-arrow)`}/><path d={wires.core} fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 7"/></svg>
        <span className="outing-return-label"><RotateCcw size={14}/> Experience informs the next decision</span>
        <ol className="outing-nodes" aria-label="Six connected moments; follow 1 to 6, then back to a new decision">
          {moments.map((moment, index) => <li key={moment.name} className={`outing-node outing-node-${index + 1}${selected === index ? ' is-selected' : ''}`} style={{ '--stage-color': moment.color, '--stage-tint': moment.tint } as CSSProperties}>
            <motion.button type="button" className="outing-node-button" onClick={() => choose(index)} aria-pressed={selected === index} aria-controls={`${id}-conversation ${id}-mobile-${index}`} initial={false} whileInView={reduced ? {} : { y: [9, 0] }} viewport={{ once: true, amount: .4 }} transition={{ duration: .45, delay: index % 3 * .08 }}>
              <span className="outing-node-heading"><span className="outing-number">0{index + 1}</span><span>{moment.name}</span><ArrowUpRight size={16}/></span><Scene index={index}/><strong>{moment.title}</strong><span className="outing-node-caption">{moment.caption}</span>
            </motion.button>
            <div id={`${id}-mobile-${index}`} className="outing-mobile-conversation outing-conversation" aria-live="polite" aria-atomic="true">{selected === index && conversation}</div>
            <span className="outing-mobile-connector" aria-hidden="true">{index === 1 ? 'Maya replies with her time and preference' : index === 2 ? 'A suitable option needs your approval' : index === 3 ? 'After meeting, Maya shares feedback' : index === 4 ? 'Sapiens remembers what went wrong' : index === 5 ? '↶ Experience informs the next outing' : 'An indoor plan still needs Maya’s availability'}<ArrowDown size={20}/></span>
          </li>)}
        </ol>
        <div className="outing-core" style={{ '--stage-color': current.color, '--stage-tint': current.tint } as CSSProperties}><div className="outing-identity"><img src="/concepts/sapiens-amber.png" width="100" height="100" alt=""/><div><strong>Sapiens</strong><span>The same individual.</span><small>{current.aspect}</small></div></div><div className="outing-conversation outing-desktop-conversation" id={`${id}-conversation`} aria-live="polite" aria-atomic="true">{conversation}</div></div>
      </div>
      <div className="outing-takeaway"><span><RotateCcw size={19}/> Experience shapes the next decision.</span><p>The same Sapiens carries what happened forward.</p></div>
      <p className="outing-concept-note">Illustrative scenario for the system we’re developing. Communication and actions require supported connections and permission. The loop shows one example; Sapiens can wait, revisit a decision or seek more information.</p>
      <details className="outing-details"><summary>Explore the architecture & comparison <span aria-hidden="true">+</span></summary><button className="outing-architecture" onClick={onOpenGraph} type="button" aria-haspopup="dialog">Open the full architecture <ArrowUpRight size={17}/></button><ApproachComparison/></details>
    </section>
    <section className="outing-product" id="direction-product"><div><span className="outing-eyebrow">WHAT YOU CAN TRY TODAY</span><h2>Start your shared history.</h2><p>Create an individual and begin a conversation.</p>{cta}</div><div><MessageCircle size={26}/><h3>Talk. Return. Continue.</h3><p>Revisit saved conversations. Selected past context may inform replies. Available tool actions depend on your connections and permissions.</p></div></section>
  </div>;
}
