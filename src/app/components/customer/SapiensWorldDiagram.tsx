import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { ArrowDown, ArrowRight, Compass, History, Moon, Network, RotateCcw, ScanSearch } from 'lucide-react';
import { SapiensBrandMark } from './SapiensBrandMark';
import '../../../styles/sapiens-world.css';

const interactions = [
  { id: 'people', title: 'People', action: '', index: 0, color: '#a94130', tint: '#ffe4d5', out: 'Interacts with people', back: 'Listens and understands', aspect: 'understanding' },
  { id: 'information', title: 'Information', action: 'Fill gaps in understanding.', index: 1, color: '#356e4c', tint: '#e2edce', out: 'Look for evidence', back: 'Check what it finds', aspect: 'understanding' },
  { id: 'tools', title: 'Tools', action: 'Turn intent into action.', index: 2, color: '#80601a', tint: '#fff0ba', out: 'Act with permission', back: 'Check the result', aspect: 'goals' },
  { id: 'feedback', title: 'Outcomes & feedback', action: '', index: 3, color: '#a63d5c', tint: '#f9dfe7', out: 'Checks the outcome', back: 'Reflects and learns', aspect: 'memory' },
] as const;

const aspects = [
  { id: 'attention', title: 'Attention & curiosity', text: 'Notices gaps', icon: ScanSearch, color: '#a66a1c', tint: '#ffedc6', x: 25, y: 2, path: 'M25 2 C25 29 50 23 50 50' },
  { id: 'understanding', title: 'Understanding', text: 'Connects evidence', icon: Network, color: '#357762', tint: '#e1efe3', x: 75, y: 2, path: 'M75 2 C75 29 50 23 50 50' },
  { id: 'memory', title: 'Memory & experience', text: 'Carries learning forward', icon: History, color: '#ab536a', tint: '#f8e3e7', x: 25, y: 98, path: 'M25 98 C25 71 50 77 50 50' },
  { id: 'goals', title: 'Goals & reflection', text: 'Guides & reconsiders', icon: Compass, color: '#b46535', tint: '#ffe6d4', x: 75, y: 98, path: 'M75 98 C75 71 50 77 50 50' },
];

type Wire = { id: string; out: string; back: string; x: number; y: number; color: string };

export function SapiensWorldDiagram() {
  const [entered, setEntered] = useState(false);
  const [flowing, setFlowing] = useState<string | null>(null);
  const [geometry, setGeometry] = useState({ width: 1200, height: 600, wires: [] as Wire[], outcome: '', outcomeX: 0, outcomeY: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, '');

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
    map.querySelectorAll('.world-individual, .world-node-card').forEach(node => resize.observe(node));
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
    let ambient: Animation[] = [];
    let timer: ReturnType<typeof setTimeout> | undefined;
    let beat = 0;
    const stopCycle = () => { clearTimeout(timer); animations.forEach(animation => animation.cancel()); animations = []; };
    const stop = () => { stopCycle(); ambient.forEach(animation => animation.cancel()); ambient = []; };
    const play = () => {
      stopCycle();
      if (preference.matches || document.hidden) return;
      const animate = (selector: string, frames: Keyframe[], duration: number, delay = 0) => {
        map.querySelectorAll(selector).forEach(element => animations.push(element.animate(frames, { duration, delay, easing: 'ease-in-out' })));
      };
      // Cycle through the connections; there are no click-through examples.
      const route = interactions[beat++ % interactions.length].id;
      setFlowing(route);
      const pulse = [{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { opacity: .65, offset: .2 }, { transform: 'translate(-50%,-50%) scale(1.45)', opacity: 0 }];
      animate('.world-core-ripple:not(.world-core-ripple-return)', pulse, 1600, 100);
      animate('.world-core-ripple-return', pulse, 1500, 3100);
      const signal = [{ strokeDashoffset: '100', opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .85 }, { strokeDashoffset: '0', opacity: 0 }];
      interactions.filter(item => item.id === route).forEach((item, index) => {
        const delay = index * 140;
        animate(`[data-wire="${item.id}"] .world-signal:not(.world-signal-back)`, signal, 1100, 400 + delay);
        animate(`[data-wire="${item.id}"] .world-signal-back`, signal, 1100, 2100 + delay);
        animate(`.world-node-${item.id} .world-art`, [
          { transform: 'translateY(0) rotate(0) scale(1)' },
          { transform: 'translateY(-15px) rotate(-5deg) scale(1.08)', offset: .4 },
          { transform: 'translateY(0) rotate(0) scale(1)' },
        ], 1800, 1000 + delay);
        const aspect = item.aspect;
        animate(`[data-inner-wire="${aspect}"] .world-inner-signal`, signal, 1000, 3300 + delay);
        animate(`.world-aspect-${aspect} .world-aspect-icon`, [
          { transform: 'scale(1)', boxShadow: '0 0 0 0 transparent' },
          { transform: 'scale(1.16)', boxShadow: `0 0 0 8px ${item.color}22`, offset: .45 },
          { transform: 'scale(1)', boxShadow: '0 0 0 0 transparent' },
        ], 1000, 3300 + delay);
      });
      if (route === 'tools' || route === 'feedback') animate('.world-outcome-signal', signal, 1100, 1700);
      animate(`.world-node-${route} .world-mobile-exchange svg`, [
        { transform: 'translateX(0)', opacity: .5 }, { transform: 'translateX(5px)', opacity: 1 }, { transform: 'translateX(0)', opacity: 1 },
      ], 1600, 500);
      timer = setTimeout(play, 5000);
    };
    const start = () => {
      stop();
      setFlowing(null);
      if (preference.matches || document.hidden) return;
      const loop = (selector: string, frames: Keyframe[], duration: number, delay = 0) => {
        map.querySelectorAll(selector).forEach(element => ambient.push(element.animate(frames, {duration, delay, iterations: Infinity, easing: 'ease-in-out'})));
      };
      loop('.world-core-brand img', [
        {transform:'translateY(0) rotate(-4deg) scale(1)'},
        {transform:'translateY(-10px) rotate(7deg) scale(1.12)',offset:.45},
        {transform:'translateY(0) rotate(-4deg) scale(1)'},
      ], 6000);
      loop('.world-core-halo', [
        {transform:'translate(-50%,-50%) scale(.9)',opacity:.6},
        {transform:'translate(-50%,-50%) scale(1.5)',opacity:1},
        {transform:'translate(-50%,-50%) scale(.9)',opacity:.6},
      ], 4500);
      // The artwork floats; the card and all text remain stationary.
      interactions.forEach((item,index) => loop(`.world-node-${item.id} .world-art`, [
        {translate:'0 0'},
        {translate:'0 -7px'},
        {translate:'0 0'},
      ], 5600, -index * 1100));
      play();
    };
    start();
    preference.addEventListener('change', start);
    document.addEventListener('visibilitychange', start);
    return () => { stop(); preference.removeEventListener('change', start); document.removeEventListener('visibilitychange', start); };
  }, [entered]);

  return <div className={`sapiens-world${entered ? ' has-entered' : ''}`} data-flow-node={entered ? flowing ?? undefined : undefined} ref={ref}>
    <svg className="world-links" viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true">
      <defs>{interactions.map(item => <marker key={item.id} id={`${id}-${item.id}`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M1 1 6 3.5 1 6" fill="none" stroke={`var(--world-${item.id}-color, ${item.color})`} strokeWidth="1.5"/></marker>)}</defs>
      {geometry.wires.map(wire => <g key={wire.id} data-wire={wire.id} className="world-link-pair" style={{ '--wire-color': `var(--world-${wire.id}-color, ${wire.color})` } as CSSProperties}>
        <path d={wire.out} markerEnd={`url(#${id}-${wire.id})`}/><path d={wire.back} className="world-return" markerEnd={`url(#${id}-${wire.id})`}/>
        <path d={wire.out} className="world-signal" pathLength="100"/><path d={wire.back} className="world-signal world-signal-back" pathLength="100"/>
      </g>)}
      <path className="world-outcome-link" d={geometry.outcome} markerEnd={`url(#${id}-feedback)`}/>
      <path className="world-outcome-signal" d={geometry.outcome} pathLength="100"/>
    </svg>
    {geometry.wires.map(wire => { const item = interactions.find(entry => entry.id === wire.id)!; return <div key={wire.id} className="world-edge-label" style={{ left: wire.x, top: wire.y, color: `var(--world-${wire.id}-color, ${wire.color})` }} aria-hidden="true"><span>{item.out}</span><span>{item.back}</span></div>; })}
    <span className="world-outcome-label" style={{ left: geometry.outcomeX, top: geometry.outcomeY }} aria-hidden="true">What happened?</span>

    <section className="world-individual" aria-label="Inside Sapiens: one persistent individual">
      <header><span>ONE CONTINUING INDIVIDUAL</span><h3>Sapiens</h3></header>
      <div className="world-inner">
        {aspects.map(aspect => <div key={aspect.id} style={{ '--aspect-color': `var(--world-${aspect.id}-color, ${aspect.color})`, '--aspect-tint': `var(--world-${aspect.id}-tint, ${aspect.tint})` } as CSSProperties} className={`world-aspect world-aspect-${aspect.id}`}><span className="world-aspect-icon" aria-hidden="true"><aspect.icon size={20} strokeWidth={1.6}/></span><h4>{aspect.title}</h4><p>{aspect.text}</p></div>)}
        <div className="world-core-space">
          {/* Connections occupy only this corridor, never the text rows. */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {aspects.map(aspect => <g key={aspect.id} data-inner-wire={aspect.id} className="world-inner-wire" style={{ '--aspect-color': `var(--world-${aspect.id}-color, ${aspect.color})` } as CSSProperties}>
              <path d={aspect.path}/>
              <path key={aspect.id} className="world-inner-signal" d={aspect.path} pathLength="100"/>
              <ellipse cx={aspect.x} cy={aspect.y} rx=".85" ry="1.8"/>
            </g>)}
          </svg>
          <span className="world-core-halo" aria-hidden="true"/>
          <span className="world-core-ripple" aria-hidden="true"/><span className="world-core-ripple world-core-ripple-return" aria-hidden="true"/>
          <SapiensBrandMark className="world-core-brand"/>
        </div>
      </div>
      <div className="world-consolidation">
        <h4><Moon size={20} aria-hidden="true"/>Sleep-like consolidation</h4>
        <p>Connects experiences and strengthens what matters while Sapiens remains active.</p>
      </div>
    </section>

    {interactions.map(item => <section key={item.id} className={`world-node world-node-${item.id}`} style={{ '--node-color': `var(--world-${item.id}-color, ${item.color})`, '--node-tint': `var(--world-${item.id}-tint, ${item.tint})` } as CSSProperties}>
      <div className={`world-node-card${item.action ? '' : ' has-no-caption'}`} data-world-node={item.id}>
        <span className="world-art" aria-hidden="true" style={{ backgroundPosition: `${item.index % 2 * 100}% ${Math.floor(item.index / 2) * 100}%` }}/>
        <span className="world-node-title">{item.title}</span>{item.action && <span className="world-node-action">{item.action}</span>}
      </div>
      <div className="world-mobile-exchange"><span>Sapiens <ArrowRight size={12}/> {item.out}</span><span>{item.back} <ArrowRight size={12}/> Sapiens</span></div>
    </section>)}
    <div className="world-mobile-loop"><RotateCcw size={18}/> Back to the same individual <ArrowDown size={16}/></div>
  </div>;
}
