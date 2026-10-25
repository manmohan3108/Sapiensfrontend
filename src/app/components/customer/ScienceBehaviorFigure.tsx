import { useId, type CSSProperties } from 'react';

// Mathematical visual metaphors for the adjacent behaviors, not performance plots.
const people = [[80,26],[34,50],[126,50],[48,102],[112,102],[80,68]];
const edges = [[0,1],[0,2],[1,3],[2,4],[3,4],[0,5],[1,5],[2,5],[3,5],[4,5]];
const observations = [[30,33],[47,96],[67,27],[88,89],[112,38],[132,75]];
const branches: { d: string; depth: number }[] = [];
function branch(x: number, y: number, angle: number, length: number, depth: number) {
  const endX = x + Math.cos(angle) * length;
  const endY = y + Math.sin(angle) * length;
  branches.push({ d: `M${x} ${y}L${endX} ${endY}`, depth });
  if (depth < 3) {
    branch(endX,endY,angle-.55,length*.7,depth+1);
    branch(endX,endY,angle+.55,length*.7,depth+1);
  }
}
branch(80,113,-Math.PI/2,39,0);

export function ScienceBehaviorFigure({ index }: { index: number }) {
  const id = useId().replace(/:/g,'');
  return <span className={`science-behavior science-behavior-${index}`}>
    <svg viewBox="0 0 160 130" fill="none" aria-hidden="true">
      {index === 0 && <>
        {edges.map(([a,b],i) => <g key={i}>
          <path d={`M${people[a]}L${people[b]}`} className="math-line"/>
          <path d={`M${people[a]}L${people[b]}`} pathLength="100" className="math-exchange math-motion" style={{ animationDelay:`${i*-.6}s`,animationDirection:i%2?'reverse':'normal' }}/>
        </g>)}
        {people.map(([x,y],i) => <g key={i} className="math-person"><circle cx={x} cy={y} r={i===5?11:8} className="math-node"/><circle cx={x} cy={y-2} r="2.2" className="math-person-mark"/><path d={`M${x-3} ${y+4}Q${x} ${y} ${x+3} ${y+4}`} className="math-person-outline"/></g>)}
      </>}
      {index === 1 && <>
        {branches.map(({d,depth},i) => <path key={i} d={d} pathLength="100" className="math-branch math-motion" style={{ '--branch-depth':depth } as CSSProperties}/>)}
        <circle cx="80" cy="113" r="4" className="math-point"/>
        <circle cx="80" cy="74" r="5" className="math-node"/>
      </>}
      {index === 2 && <>
        <path d="M20 110H145M20 110V17" className="math-axis"/>
        <path d="M28 100L137 31" className="math-fit math-motion" pathLength="100"/>
        {observations.map(([x,y],i) => <g key={i}>
          <path d={`M${x} ${y}V${118-x*.63}`} className="math-observation-guide"/>
          <circle cx={x} cy={y} r="4.5" className="math-observation math-motion" style={{ '--converge':`${118-x*.63-y}px`,animationDelay:`${i*-.14}s` } as CSSProperties}/>
        </g>)}
      </>}
      {index === 3 && <>
        <defs><marker id={`arrow-${id}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="currentColor"/></marker></defs>
        <path d="M27 105L113 105L137 28L51 28Z" className="math-vector-plane"/>
        <path d="M27 105L113 105L137 28" className="math-vector" markerEnd={`url(#arrow-${id})`}/>
        <path d="M27 105L137 28" className="math-result" markerEnd={`url(#arrow-${id})`}/>
        <circle cx="27" cy="105" r="5" className="math-vector-traveller math-motion"/>
        <text x="67" y="122">u</text><text x="138" y="73">v</text><text x="64" y="60">u + v</text>
      </>}
      {index === 4 && <>
        <circle cx="80" cy="65" r="43" className="math-axis"/>
        <path d="M80 22A43 43 0 0 1 123 65" className="math-wait-window"/>
        <path d="M30 65H130M80 15V115" className="math-observation-guide"/>
        <g className="math-wait-orbit math-motion"><path d="M80 65V22" className="math-line"/><circle cx="80" cy="22" r="6" className="math-point"/></g>
        <circle cx="80" cy="65" r="12" className="math-node"/>
        <path d="M77 60V70M83 60V70" className="math-pause-mark"/>
      </>}
      {index === 5 && <>
        <path d="M20 110H145M20 110V17" className="math-axis"/>
        <path d="M28 100Q60 97 72 67T136 29" className="math-history"/>
        <path d="M28 100Q60 97 72 67T136 29" pathLength="100" className="math-learning math-motion"/>
        {[[28,100],[58,87],[80,52],[110,32],[136,29]].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="4" className="math-learned-point math-motion" style={{ animationDelay:`${i*.7}s` }}/>) }
      </>}
    </svg>
  </span>;
}
