import { useId } from 'react';

export type ComparisonTopic = 'Memory' | 'Initiative' | 'Goals' | 'Feedback' | 'Architecture';

type NodeProps = { x: number; y: number; lines: string[]; width?: number; tone?: 'warm' | 'green' | 'rose'; primary?: boolean };
function Node({ x, y, lines, width = 86, tone = 'warm', primary = false }: NodeProps) {
  return <g className={`comparison-node node-${tone}${primary ? ' node-primary' : ''}`}>
    <rect x={x - width / 2} y={y - 23} width={width} height={46} rx={10}/>
    <text x={x} y={y} textAnchor="middle">{lines.map((line, i) => <tspan key={line} x={x} dy={i === 0 ? (lines.length === 1 ? 5 : -3) : 16}>{line}</tspan>)}</text>
  </g>;
}

/** Simplified information flows; adjacent copy supplies the accessible explanation. */
export function ApproachDiagram({ topic, sapiens = false }: { topic: ComparisonTopic; sapiens?: boolean }) {
  const marker = `flow-${useId().replace(/:/g, '')}`;
  const arrow = `url(#${marker})`;
  const line = (d: string) => <path className="comparison-flow" d={d} markerEnd={arrow}/>;
  return <svg className={`comparison-diagram${sapiens ? ' is-sapiens' : ''}`} viewBox="0 0 320 138" aria-hidden="true" focusable="false">
    <defs><marker id={marker} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="currentColor"/></marker></defs>
    {topic === 'Memory' && (sapiens ? <>
      {line('M99 42Q132 42 132 68H145')}{line('M99 106Q132 106 132 82H145')}
      <Node x={53} y={42} lines={['Experience']} width={94} tone="rose"/><Node x={53} y={106} lines={['Goals']} width={94} tone="green"/>
      <Node x={217} y={75} lines={['Current', 'focus']} width={134} primary/>
    </> : <>{line('M116 69H197')}<Node x={65} y={69} lines={['Saved', 'context']} width={102}/><Node x={253} y={69} lines={['Response']} width={104}/></>)}
    {topic === 'Initiative' && (sapiens ? <>
      {line('M95 69H114')}{line('M209 69H230')}
      <Node x={49} y={69} lines={['Open', 'questions']} width={90} tone="rose"/><Node x={164} y={69} lines={['Attention']} width={94} tone="warm"/><Node x={275} y={69} lines={['Next', 'action']} width={82} primary/>
    </> : <>
      {line('M89 69H112')}{line('M208 69H231')}
      <Node x={47} y={69} lines={['Task']} width={84}/><Node x={162} y={69} lines={['Agent', 'decides']} width={94}/><Node x={275} y={69} lines={['Tool', 'action']} width={82}/>
    </>)}
    {topic === 'Goals' && (sapiens ? <>
      {line('M89 52H112')}{line('M208 52H231')}{line('M275 77V111H48V79')}
      <Node x={47} y={52} lines={['Goal']} width={84} tone="rose"/><Node x={162} y={52} lines={['Plan']} width={94}/><Node x={275} y={52} lines={['Progress']} width={82} primary/>
      <text className="comparison-loop-label" x="162" y="105" textAnchor="middle">Review & revise</text>
    </> : <>
      {line('M89 69H112')}{line('M208 69H231')}
      <Node x={47} y={69} lines={['Task']} width={84}/><Node x={162} y={69} lines={['Plan']} width={94}/><Node x={275} y={69} lines={['Steps']} width={82}/>
    </>)}
    {topic === 'Feedback' && (sapiens ? <>
      {line('M89 52H112')}{line('M208 52H231')}{line('M275 77V111H48V79')}
      <Node x={47} y={52} lines={['Outcome']} width={84} tone="rose"/><Node x={162} y={52} lines={['Reflect']} width={94}/><Node x={275} y={52} lines={['Memory']} width={82} primary/>
      <text className="comparison-loop-label" x="162" y="105" textAnchor="middle">Inform a future decision</text>
    </> : <>
      {line('M115 52H198')}{line('M251 77V111H65V79')}
      <Node x={65} y={52} lines={['Result']} width={102}/><Node x={253} y={52} lines={['Evaluate']} width={104}/>
      <text className="comparison-loop-label" x="162" y="105" textAnchor="middle">Try again</text>
    </>)}
    {topic === 'Architecture' && (sapiens ? <>
      <path className="comparison-flow" d="M99 35L145 65M99 105L145 75M221 35L175 65M221 105L175 75"/>
      <Node x={53} y={34} lines={['Attention']} width={98}/><Node x={53} y={105} lines={['Memory']} width={98} tone="rose"/>
      <Node x={267} y={34} lines={['Understand']} width={102} tone="green"/><Node x={267} y={105} lines={['Goals']} width={102}/>
      <circle className="comparison-center" cx="160" cy="70" r="33"/><text className="comparison-center-label" x="160" y="75" textAnchor="middle">Sapiens</text>
    </> : <>
      <path className="comparison-flow" d="M114 70H199M65 47V24H114M205 24H254V47M65 94V112H254V94"/>
      <Node x={65} y={70} lines={['Model']} width={98}/><Node x={254} y={70} lines={['Tools']} width={98}/>
      <Node x={160} y={24} lines={['Memory']} width={88}/><text className="comparison-loop-label" x="160" y="133" textAnchor="middle">Workflow / agent loop</text>
    </>)}
  </svg>;
}
