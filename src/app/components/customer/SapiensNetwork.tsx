import { useId, useState } from 'react';
import identity from '../../../assets/landing/identity-480.webp';
import person from '../../../assets/landing/person.webp';
import information from '../../../assets/landing/information.webp';
import tool from '../../../assets/landing/tool.webp';
import goal from '../../../assets/landing/goal.webp';
import '../../../styles/network.css';

const connections = [
  { id: 'people', label: 'People', image: person, x: 16, y: 18,
    description: 'People bring questions and perspectives; Sapiens responds, asks and carries relevant context forward.' },
  { id: 'information', label: 'Information', image: information, x: 16, y: 82,
    description: 'New information connects with earlier experience, helping Sapiens make sense of a situation and identify what needs exploring.' },
  { id: 'tools', label: 'Tools', image: tool, x: 84, y: 18,
    description: 'Supported tools let Sapiens take permitted actions and consider the results, within the access and connections available.' },
  { id: 'activities', label: 'Activities', image: goal, x: 84, y: 82,
    description: 'Goals give ongoing activities a direction; outcomes add context for deciding what to revisit or try next.' },
];

export function SapiensNetwork() {
  const [selected, setSelected] = useState(connections[0].id);
  const explanationId = useId();
  const active = connections.find(item => item.id === selected)!;

  return <div className="sapiens-network">
    <div className="landing-section-heading network-heading">
      <span className="customer-eyebrow">The idea we’re building toward</span>
      <h2 id="how-title">An individual, connected to its world.</h2>
      <p>What it encounters informs how it understands and what it does next.</p>
    </div>
    <div className="network-map" role="group" aria-label="Explore the connections around Sapiens">
      <svg className="network-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {connections.map(item => <line key={item.id} x1="50" y1="50" x2={item.x} y2={item.y} data-selected={selected === item.id} />)}
      </svg>
      <div className="network-centre">
        <img src={identity} width="108" height="108" alt="" loading="lazy" />
        <h3>Sapiens</h3>
        <span>An AI individual</span>
      </div>
      {connections.map(item => <button key={item.id} type="button" className="network-node"
        style={{ left: `${item.x}%`, top: `${item.y}%` }}
        aria-pressed={selected === item.id} aria-controls={explanationId}
        onClick={() => setSelected(item.id)}>
        <img src={item.image} width="64" height="64" loading="lazy" alt="" />
        <span>{item.label}</span>
      </button>)}
    </div>
    <p className="network-hint">Select a circle to explore the connection.</p>
    <div className="network-explanation" id={explanationId} aria-live="polite" aria-atomic="true">
      <h3>{active.label}</h3>
      <p>{active.description}</p>
    </div>
  </div>;
}
