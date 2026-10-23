import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowRight, Check, Clock3, Compass, History, Moon, Network, Plus, RotateCcw, ScanSearch } from 'lucide-react';
import { SapiensBrandMark } from './SapiensBrandMark';
import '../../../styles/sapiens-world.css';

const interactions = [
  { id: 'people', title: 'People', action: 'Ask. Listen. Wait.', index: 0, color: '#a94130', tint: '#ffe4d5', out: 'Questions', back: 'Replies', why: 'When someone else knows more.', from: 'Sapiens asks Maya', example: '“What time can you join?”', after: 'It waits for her answer before deciding.', aspect: 'understanding' },
  { id: 'information', title: 'Information', action: 'Seek. Check. Connect.', index: 1, color: '#80601a', tint: '#fff0ba', out: 'Seek context', back: 'Evidence', why: 'When its picture is incomplete.', from: 'Sapiens checks a source', example: 'Forecast: rain during the planned outing.', after: 'New evidence changes its understanding.', aspect: 'attention' },
  { id: 'tools', title: 'Tools', action: 'Act with permission.', index: 2, color: '#286957', tint: '#d9ecdf', out: 'Actions', back: 'Results', why: 'When understanding needs to become action.', from: 'You approve a calendar update', example: 'Sapiens sends it, then checks the result.', after: 'A tool result tells it what actually happened.', aspect: 'goals' },
  { id: 'feedback', title: 'Outcomes & feedback', action: 'Observe. Reconsider. Remember.', index: 3, color: '#a63d5c', tint: '#f9dfe7', out: 'Follow up', back: 'Experience', why: 'When reality differs from what it expected.', from: 'Maya describes the outcome', example: '“The café was too noisy.”', after: 'Next time, Sapiens checks quiet seating first.', aspect: 'memory' },
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
  const [reply, setReply] = useState(false);
  const [entered, setEntered] = useState(false);
  const [geometry, setGeometry] = useState({ width: 1200, height: 600, wires: [] as Wire[], outcome: '', outcomeX: 0, outcomeY: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '');
  const current = interactions.find(item => item.id === selected);

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
        const outY = y - 16;
        const backY = y + 16;
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
      animate('.world-core-ripple-return', pulse, 1500, 3100);
      const signal = [{ strokeDashoffset: '100', opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .85 }, { strokeDashoffset: '0', opacity: 0 }];
      interactions.filter(item => !selected || item.id === selected).forEach((item, index) => {
        const delay = index * 140;
        animate(`[data-wire="${item.id}"] .world-signal:not(.world-signal-back)`, signal, 1100, 400 + delay);
        animate(`[data-wire="${item.id}"] .world-signal-back`, signal, 1100, 2100 + delay);
        animate(`.world-node-${item.id} .world-art`, [
          { transform: 'translateY(0) rotate(0) scale(1)' },
          { transform: 'translateY(-10px) rotate(-3deg) scale(1.055)', offset: .4 },
          { transform: 'translateY(0) rotate(0) scale(1)' },
        ], 1800, 1000 + delay);
        animate(`[data-inner-wire="${item.aspect}"] .world-inner-signal`, signal, 1000, 3300 + delay);
        animate(`.world-aspect-${item.aspect} .world-aspect-icon`, [
          { transform: 'scale(1)', boxShadow: '0 0 0 0 transparent' },
          { transform: 'scale(1.16)', boxShadow: `0 0 0 8px ${item.color}22`, offset: .45 },
          { transform: 'scale(1)', boxShadow: '0 0 0 0 transparent' },
        ], 1000, 3300 + delay);
      });
      if (!selected || selected === 'tools' || selected === 'feedback') animate('.world-outcome-signal', signal, 1100, 1700);
      animate('.world-node.is-selected .world-mobile-exchange svg', [
        { transform: 'translateX(0)', opacity: .5 }, { transform: 'translateX(5px)', opacity: 1 }, { transform: 'translateX(0)', opacity: 1 },
      ], 1600, 500);
    };
    play();
    preference.addEventListener('change', play);
    document.addEventListener('visibilitychange', play);
    return () => { stop(); preference.removeEventListener('change', play); document.removeEventListener('visibilitychange', play); };
  }, [entered, selected, reply]);

  const select = (key: string) => { setSelected(value => value === key ? null : key); setReply(false); };
  const detail = current && <>
    <span className="world-detail-why">{current.why}</span>
    <span className="world-detail-from">{selected === 'people' && reply ? 'Maya replies' : current.from}</span>
    <strong>{selected === 'people' && reply ? '“After three works.”' : current.example}</strong>
    <p>{selected === 'people' && reply ? 'Her answer becomes part of its understanding.' : current.after}</p>
    {selected === 'people' && <button type="button" className="world-reply" onClick={() => setReply(value => !value)}>{reply ? <Check size={14}/> : <Clock3 size={14}/>} {reply ? 'Back to waiting' : 'See her reply'}</button>}
  </>;

  return <div className={`sapiens-world${entered ? ' has-entered' : ''}`} ref={ref} onKeyDown={event => { if (event.key === 'Escape') { setSelected(null); setReply(false); } }}>
    <svg className="world-links" viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true">
      <defs>{interactions.map(item => <marker key={item.id} id={`${id}-${item.id}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M1 1 6 3.5 1 6" fill="none" stroke={item.color} strokeWidth="1.5"/></marker>)}</defs>
      {geometry.wires.map(wire => <g key={wire.id} data-wire={wire.id} className={`world-link-pair${selected === wire.id ? ' is-active' : ''}`} style={{ '--wire-color': wire.color } as CSSProperties}>
        <path d={wire.out} markerEnd={`url(#${id}-${wire.id})`}/><path d={wire.back} className="world-return" markerEnd={`url(#${id}-${wire.id})`}/>
        <path d={wire.out} className="world-signal" pathLength="100"/><path d={wire.back} className="world-signal world-signal-back" pathLength="100"/>
      </g>)}
      <path className="world-outcome-link" d={geometry.outcome} markerEnd={`url(#${id}-feedback)`}/>
      <path className="world-outcome-signal" d={geometry.outcome} pathLength="100"/>
    </svg>
    {geometry.wires.map(wire => { const item = interactions.find(entry => entry.id === wire.id)!; return <div key={wire.id} className="world-edge-label" style={{ left: wire.x, top: wire.y, color: wire.color }} aria-hidden="true"><span>{item.out}</span><span>{item.back}</span></div>; })}
    <span className="world-outcome-label" style={{ left: geometry.outcomeX, top: geometry.outcomeY }} aria-hidden="true">What happened?</span>

    <section className="world-individual" aria-label="Inside Sapiens: one persistent individual">
      <header><span>ONE CONTINUING INDIVIDUAL</span><h3>Sapiens</h3></header>
      <div className="world-inner">
        {aspects.map(aspect => <div key={aspect.id} style={{ '--aspect-color': aspect.color, '--aspect-tint': aspect.tint } as CSSProperties} className={`world-aspect world-aspect-${aspect.id}${current?.aspect === aspect.id ? ' is-active' : ''}`}><span className="world-aspect-icon" aria-hidden="true"><aspect.icon size={20} strokeWidth={1.6}/></span><h4>{aspect.title}</h4><p>{aspect.text}</p></div>)}
        <div className="world-core-space">
          {/* Connections occupy only this corridor, never the text rows. */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {aspects.map(aspect => <g key={aspect.id} data-inner-wire={aspect.id} className={`world-inner-wire${current?.aspect === aspect.id ? ' is-active' : ''}`} style={{ '--aspect-color': aspect.color } as CSSProperties}>
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
        <span className="world-node-title">{item.title}<Plus size={16}/></span><span className="world-node-action">{item.action}</span>
      </button>
      <div className="world-mobile-exchange"><span>Sapiens <ArrowRight size={12}/> {item.out}</span><span>{item.back} <ArrowRight size={12}/> Sapiens</span></div>
      <div className="world-mobile-detail" id={`${id}-${item.id}-mobile`} aria-live="polite" aria-atomic="true">{selected === item.id && detail}</div>
    </section>)}
    <div className="world-mobile-loop"><RotateCcw size={18}/> Back to the same individual <ArrowDown size={16}/></div>
  </div>;
}
