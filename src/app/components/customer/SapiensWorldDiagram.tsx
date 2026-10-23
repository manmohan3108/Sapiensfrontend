import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowRight, Clock3, Compass, History, Moon, Network, Plus, RotateCcw, ScanSearch } from 'lucide-react';
import { SapiensBrandMark } from './SapiensBrandMark';
import '../../../styles/sapiens-world.css';

const interactions = [
  { id: 'people', title: 'People', action: 'Clarify what’s missing.', index: 0, color: '#a94130', tint: '#ffe4d5', out: 'Ask to clarify', back: 'Listen & understand', why: 'A plan is missing Maya’s availability.', from: 'Sapiens asks Maya', example: '“When are you usually free?”', waiting: 'Waits for Maya. No answer assumed.', reveal: 'See Maya’s reply', source: 'Maya replies', answer: '“Weekdays, after six.”', change: 'Understands her availability.', carry: 'Keeps this context for future plans; checks if it changes.', alternative: 'If her reply is unclear', unclear: '“It depends on the day.”', retry: 'Asks which days work, instead of guessing.', aspect: 'understanding' },
  { id: 'information', title: 'Information', action: 'Fill gaps in understanding.', index: 1, color: '#80601a', tint: '#fff0ba', out: 'Look for evidence', back: 'Check what it finds', why: 'Its information may be out of date.', from: 'Sapiens checks the current source', example: '“Is this place still open on Sunday?”', waiting: 'Checks before relying on old information.', reveal: 'See the evidence', source: 'The current opening hours', answer: '“Closed on Sundays.”', change: 'Revises its understanding.', carry: 'Uses the updated hours when considering options.', alternative: 'If sources disagree', unclear: 'Two sources list different hours.', retry: 'Seeks confirmation before treating either as fact.', aspect: 'understanding' },
  { id: 'tools', title: 'Tools', action: 'Turn intent into action.', index: 2, color: '#286957', tint: '#d9ecdf', out: 'Act with permission', back: 'Check the result', why: 'An agreed plan needs a calendar update.', from: 'With your approval, Sapiens acts', example: 'Sends the agreed time to the calendar.', waiting: 'Waits for confirmation from the tool.', reveal: 'See the tool result', source: 'The calendar confirms', answer: '“Event updated.”', change: 'Knows the action succeeded.', carry: 'Uses the confirmed result to decide what to do next.', alternative: 'If the action fails', unclear: '“Calendar unavailable.”', retry: 'Reports the failure and reconsiders the next step.', aspect: 'goals' },
  { id: 'feedback', title: 'Outcomes & feedback', action: 'Learn from what happened.', index: 3, color: '#a63d5c', tint: '#f9dfe7', out: 'Follow up', back: 'Compare & reflect', why: 'A completed action may not have helped.', from: 'Sapiens follows up with Maya', example: '“Did the reminder arrive at a useful time?”', waiting: 'Asks about the outcome, beyond task completion.', reveal: 'See the feedback', source: 'Maya explains', answer: '“Too late. I had already left.”', change: 'Reconsiders its timing.', carry: 'Remembers to check when a reminder would be useful.', alternative: 'If feedback is unclear', unclear: '“It was fine, I guess.”', retry: 'Asks what helped before changing its approach.', aspect: 'memory' },
] as const;

const aspects = [
  { id: 'attention', title: 'Attention & curiosity', text: 'Notices gaps', icon: ScanSearch, color: '#a66a1c', tint: '#ffedc6', x: 25, y: 2, path: 'M25 2 C25 29 50 23 50 50' },
  { id: 'understanding', title: 'Understanding', text: 'Connects evidence', icon: Network, color: '#357762', tint: '#e1efe3', x: 75, y: 2, path: 'M75 2 C75 29 50 23 50 50' },
  { id: 'memory', title: 'Memory & experience', text: 'Carries learning forward', icon: History, color: '#ab536a', tint: '#f8e3e7', x: 25, y: 98, path: 'M25 98 C25 71 50 77 50 50' },
  { id: 'goals', title: 'Goals & reflection', text: 'Guides & reconsiders', icon: Compass, color: '#b46535', tint: '#ffe6d4', x: 75, y: 98, path: 'M75 98 C75 71 50 77 50 50' },
];

type Wire = { id: string; out: string; back: string; x: number; y: number; color: string };

export function SapiensWorldDiagram() {
  const [selected, setSelected] = useState<string | null>(null);
  const [response, setResponse] = useState<'pending' | 'received' | 'unclear'>('pending');
  const [entered, setEntered] = useState(false);
  const [geometry, setGeometry] = useState({ width: 1200, height: 600, wires: [] as Wire[], outcome: '', outcomeX: 0, outcomeY: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '');
  const current = interactions.find(item => item.id === selected);
  const activeAspect = current ? response === 'pending' ? 'attention' : current.aspect : null;
  const waiting = !!current && response === 'pending';

  useEffect(() => {
    const map = ref.current;
    if (!map) return;
    const measure = () => {
      const box = map.getBoundingClientRect();
      const core = map.querySelector('.world-individual')!.getBoundingClientRect();
      const wires = interactions.map(item => {
        const node = map.querySelector(`[data-world-node="${item.id}"]`)!.getBoundingClientRect();
        const left = item.id === 'people' || item.id === 'information';
        const y = node.top - box.top + node.height * .48;
        const start = (left ? core.left : core.right) - box.left;
        const end = (left ? node.right : node.left) - box.left;
        const sign = left ? -1 : 1;
        const outY = y - 22;
        const backY = y + 22;
        return { id: item.id, color: item.color, x: (start + end) / 2, y,
          out: `M${start} ${outY}H${end - sign * 7}`,
          back: `M${end} ${backY}H${start + sign * 7}` };
      });
      const tools = map.querySelector('[data-world-node="tools"]')!.getBoundingClientRect();
      const feedback = map.querySelector('[data-world-node="feedback"]')!.getBoundingClientRect();
      const outcomeX = tools.left - box.left + tools.width / 2;
      setGeometry({ width: box.width, height: box.height, wires,
        outcome: `M${outcomeX} ${tools.bottom - box.top + 4}V${feedback.top - box.top - 9}`,
        outcomeX, outcomeY: (tools.bottom + feedback.top) / 2 - box.top });
    };
    const resize = new ResizeObserver(measure);
    resize.observe(map);
    map.querySelectorAll('.world-individual, .world-node-button').forEach(node => resize.observe(node));
    const entrance = new IntersectionObserver(entries => {
      setEntered(entries.some(entry => entry.isIntersecting));
    }, { threshold: .2 });
    entrance.observe(map);
    measure();
    return () => { resize.disconnect(); entrance.disconnect(); };
  }, []);

  useEffect(() => {
    const map = ref.current;
    if (!map || !entered) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let animations: Animation[] = [];
    const stop = () => { animations.forEach(animation => animation.cancel()); animations = []; };
    const play = () => {
      stop();
      if (preference.matches || document.hidden) return;
      const animate = (selector: string, frames: Keyframe[], duration: number, delay = 0) => {
        map.querySelectorAll(selector).forEach(element => animations.push(element.animate(frames, { duration, delay, easing: 'ease-in-out' })));
      };
      // One finite sequence: initiate, exchange, then absorb the experience.
      // Only artwork moves; labels, hit targets and SVG endpoints stay fixed.
      animate('.world-core-brand img', [
        { transform: 'translateY(0) rotate(-2deg) scale(1)' },
        { transform: 'translateY(-7px) rotate(5deg) scale(1.09)', offset: .28 },
        { transform: 'translateY(3px) rotate(-4deg) scale(1.02)', offset: .65 },
        { transform: 'translateY(0) rotate(0) scale(1)' },
      ], 4800);
      animate('.world-core-halo', [
        { transform: 'translate(-50%,-50%) scale(.85)', opacity: .4 },
        { transform: 'translate(-50%,-50%) scale(1.35)', opacity: 1, offset: .35 },
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      ], 4600);
      const pulse = [{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { opacity: .65, offset: .2 }, { transform: 'translate(-50%,-50%) scale(1.45)', opacity: 0 }];
      animate('.world-core-ripple:not(.world-core-ripple-return)', pulse, 1600, 100);
      if (!selected || response !== 'pending') animate('.world-core-ripple-return', pulse, 1500, 3100);
      const signal = [{ strokeDashoffset: '100', opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .85 }, { strokeDashoffset: '0', opacity: 0 }];
      interactions.filter(item => !selected || item.id === selected).forEach((item, index) => {
        const delay = index * 140;
        if (!selected || response === 'pending') animate(`[data-wire="${item.id}"] .world-signal:not(.world-signal-back)`, signal, 1100, 400 + delay);
        if (!selected || response !== 'pending') animate(`[data-wire="${item.id}"] .world-signal-back`, signal, 1100, (selected ? 500 : 2100) + delay);
        animate(`.world-node-${item.id} .world-art`, [
          { transform: 'translateY(0) rotate(0) scale(1)' },
          { transform: 'translateY(-10px) rotate(-3deg) scale(1.055)', offset: .4 },
          { transform: 'translateY(0) rotate(0) scale(1)' },
        ], 1800, 1000 + delay);
        const aspect = selected && response === 'pending' ? 'attention' : item.aspect;
        animate(`[data-inner-wire="${aspect}"] .world-inner-signal`, signal, 1000, (selected ? 1800 : 3300) + delay);
        if (selected && response === 'received' && aspect !== 'memory') animate('[data-inner-wire="memory"] .world-inner-signal', signal, 1000, 3200);
        animate(`.world-aspect-${aspect} .world-aspect-icon`, [
          { transform: 'scale(1)', boxShadow: '0 0 0 0 transparent' },
          { transform: 'scale(1.16)', boxShadow: `0 0 0 8px ${item.color}22`, offset: .45 },
          { transform: 'scale(1)', boxShadow: '0 0 0 0 transparent' },
        ], 1000, 3300 + delay);
      });
      if (!selected || (response !== 'pending' && (selected === 'tools' || selected === 'feedback'))) animate('.world-outcome-signal', signal, 1100, 1700);
      animate('.world-node.is-selected .world-mobile-exchange svg', [
        { transform: 'translateX(0)', opacity: .5 }, { transform: 'translateX(5px)', opacity: 1 }, { transform: 'translateX(0)', opacity: 1 },
      ], 1600, 500);
    };
    play();
    preference.addEventListener('change', play);
    document.addEventListener('visibilitychange', play);
    return () => { stop(); preference.removeEventListener('change', play); document.removeEventListener('visibilitychange', play); };
  }, [entered, selected, response]);

  const select = (key: string) => { setSelected(value => value === key ? null : key); setResponse('pending'); };
  const detail = current && <>
    <div className="world-exchange-reason"><ScanSearch size={15} aria-hidden="true"/><span>{current.why}</span></div>
    <div className="world-exchange-message">
      <span>{response === 'pending' ? current.from : current.source}</span>
      <strong>{response === 'pending' ? current.example : response === 'unclear' ? current.unclear : current.answer}</strong>
    </div>
    {response === 'pending' ? <div className="world-wait-state"><Clock3 size={16} aria-hidden="true"/><span>{current.waiting}</span></div> :
      <div className={`world-change${response === 'unclear' ? ' is-uncertain' : ''}`}>
        {response === 'unclear' ? <ScanSearch size={18} aria-hidden="true"/> : <History size={18} aria-hidden="true"/>}
        <div><strong>{response === 'unclear' ? selected === 'tools' ? 'The action did not succeed.' : 'Still uncertain. Ask or check again.' : current.change}</strong><p>{response === 'unclear' ? current.retry : current.carry}</p></div>
      </div>}
    <div className="world-exchange-controls">
      <button type="button" className="world-reply" onClick={() => setResponse(value => value === 'pending' ? 'received' : 'pending')}>
        {response === 'pending' ? <ArrowRight size={14}/> : <RotateCcw size={14}/>} {response === 'pending' ? current.reveal : 'Back to the request'}
      </button>
      {response !== 'pending' && <button type="button" className="world-alternative" onClick={() => setResponse(value => value === 'unclear' ? 'received' : 'unclear')}>{response === 'unclear' ? 'Show the original response' : current.alternative}</button>}
    </div>
  </>;

  return <div className={`sapiens-world${entered ? ' has-entered' : ''}`} data-exchange-state={current ? response : 'overview'} ref={ref} onKeyDown={event => { if (event.key === 'Escape') { setSelected(null); setResponse('pending'); } }}>
    <svg className="world-links" viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true">
      <defs>{interactions.map(item => <marker key={item.id} id={`${id}-${item.id}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M1 1 6 3.5 1 6" fill="none" stroke={item.color} strokeWidth="1.5"/></marker>)}</defs>
      {geometry.wires.map(wire => <g key={wire.id} data-wire={wire.id} className={`world-link-pair${selected === wire.id ? ` is-active${waiting ? ' is-waiting' : ''}` : ''}`} style={{ '--wire-color': wire.color } as CSSProperties}>
        <path d={wire.out} markerEnd={`url(#${id}-${wire.id})`}/><path d={wire.back} className="world-return" markerEnd={`url(#${id}-${wire.id})`}/>
        <path d={wire.out} className="world-signal" pathLength="100"/><path d={wire.back} className="world-signal world-signal-back" pathLength="100"/>
      </g>)}
      <path className="world-outcome-link" d={geometry.outcome} markerEnd={`url(#${id}-feedback)`}/>
      <path className="world-outcome-signal" d={geometry.outcome} pathLength="100"/>
    </svg>
    {geometry.wires.map(wire => { const item = interactions.find(entry => entry.id === wire.id)!; return <div key={wire.id} className="world-edge-label" style={{ left: wire.x, top: wire.y, color: wire.color }} aria-hidden="true"><span>{item.out}</span><span>{selected === item.id && waiting ? 'Awaiting response' : item.back}</span></div>; })}
    <span className="world-outcome-label" style={{ left: geometry.outcomeX, top: geometry.outcomeY }} aria-hidden="true">What happened?</span>

    <section className="world-individual" aria-label="Inside Sapiens: one persistent individual">
      <header><span>ONE CONTINUING INDIVIDUAL</span><h3>Sapiens</h3></header>
      <div className="world-inner">
        {aspects.map(aspect => <div key={aspect.id} style={{ '--aspect-color': aspect.color, '--aspect-tint': aspect.tint } as CSSProperties} className={`world-aspect world-aspect-${aspect.id}${activeAspect === aspect.id || (!!current && response === 'received' && aspect.id === 'memory') ? ' is-active' : ''}`}><span className="world-aspect-icon" aria-hidden="true"><aspect.icon size={20} strokeWidth={1.6}/></span><h4>{aspect.title}</h4><p>{aspect.text}</p></div>)}
        <div className="world-core-space">
          {/* Connections occupy only this corridor, never the text rows. */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {aspects.map(aspect => <g key={aspect.id} data-inner-wire={aspect.id} className={`world-inner-wire${activeAspect === aspect.id || (!!current && response === 'received' && aspect.id === 'memory') ? ' is-active' : ''}`} style={{ '--aspect-color': aspect.color } as CSSProperties}>
              <path d={aspect.path}/>
              <path key={`${aspect.id}-${selected}`} className="world-inner-signal" d={aspect.path} pathLength="100"/>
              <ellipse cx={aspect.x} cy={aspect.y} rx=".85" ry="1.8"/>
            </g>)}
          </svg>
          <span className="world-core-halo" aria-hidden="true"/>
          <span className="world-core-ripple" aria-hidden="true"/><span className="world-core-ripple world-core-ripple-return" aria-hidden="true"/>
          <SapiensBrandMark className="world-core-brand"/>
        </div>
      </div>
      <div className="world-rest"><Moon size={15}/><span>Pause to reflect & consolidate experience.</span></div>
      <div className={`world-core-detail${current ? ' is-open' : ''}`} id={`${id}-detail`} aria-live="polite" aria-atomic="true">
        {current ? detail : <><RotateCcw size={21}/><strong>Experience changes<br/>{' '}what it notices next.</strong><span>Explore the exchanges around Sapiens.</span></>}
      </div>
    </section>

    {interactions.map(item => <section key={item.id} className={`world-node world-node-${item.id}${selected === item.id ? ' is-selected' : ''}`} style={{ '--node-color': item.color, '--node-tint': item.tint } as CSSProperties}>
      <button type="button" className="world-node-button" data-world-node={item.id} aria-pressed={selected === item.id} aria-controls={`${id}-detail ${id}-${item.id}-mobile`} onClick={() => select(item.id)}>
        <span className="world-art" aria-hidden="true" style={{ backgroundPosition: `${item.index % 2 * 100}% ${Math.floor(item.index / 2) * 100}%` }}/>
        {selected === item.id && waiting && <span className="world-node-wait"><Clock3 size={13} aria-hidden="true"/> Awaiting response</span>}
        <span className="world-node-title">{item.title}<Plus size={16}/></span><span className="world-node-action">{item.action}</span>
      </button>
      <div className="world-mobile-exchange"><span>Sapiens <ArrowRight size={12}/> {item.out}</span><span>{selected === item.id && waiting ? 'Awaiting response' : item.back} <ArrowRight size={12}/> Sapiens</span></div>
      <div className="world-mobile-detail" id={`${id}-${item.id}-mobile`} aria-live="polite" aria-atomic="true">{selected === item.id && detail}</div>
    </section>)}
    <div className="world-mobile-loop"><RotateCcw size={18}/> Back to the same individual <ArrowDown size={16}/></div>
  </div>;
}
