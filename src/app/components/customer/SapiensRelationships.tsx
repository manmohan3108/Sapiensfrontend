import { useId, useState } from 'react';
import identity from '../../../assets/landing/identity-480.webp';
import person from '../../../assets/landing/person.webp';
import information from '../../../assets/landing/information.webp';
import tool from '../../../assets/landing/tool.webp';
import goal from '../../../assets/landing/goal.webp';
import '../../../styles/relationships.css';

const interactions = [
  { id: 'people', title: 'People', image: person, exchange: 'Conversation', aspect: 'understanding',
    description: 'Conversations bring questions and perspectives; Sapiens responds and asks in return.',
    impact: 'A conversation can introduce a new perspective, clarify a question or change what deserves attention.' },
  { id: 'information', title: 'Information', image: information, exchange: 'Context and questions', aspect: 'understanding',
    description: 'Observations and available sources bring context and reveal what needs exploring.',
    impact: 'New information can connect with earlier experience or reveal a gap worth investigating.' },
  { id: 'tools', title: 'Tools and connections', image: tool, exchange: 'Actions and results', aspect: 'choices',
    description: 'Supported tools let Sapiens take permitted actions and receive results.',
    impact: 'A permitted action produces a result to consider. What is possible depends on the tool, setup and access.' },
  { id: 'activities', title: 'Ongoing activities', image: goal, exchange: 'Goals and outcomes', aspect: 'experience',
    description: 'Goals give interactions a purpose, while outcomes inform what to revisit.',
    impact: 'An outcome can add context to an ongoing goal and help identify what to revisit next.' },
];
const aspects = [
  { id: 'experience', title: 'Experience', description: 'Relevant encounters and outcomes provide context for what comes next.' },
  { id: 'understanding', title: 'Understanding', description: 'New information connects with earlier context to make sense of a situation.' },
  { id: 'choices', title: 'Goals and choices', description: 'What matters helps guide where to focus and what to do next.' },
];

export function SapiensRelationships() {
  const [selected, setSelected] = useState<string | null>(null);
  const prefix = useId();
  const active = interactions.find(item => item.id === selected);

  return <div className="sapiens-relationships">
    <div className="landing-section-heading">
      <span className="customer-eyebrow">The idea behind Sapiens</span>
      <h2 id="how-title">One individual. Many ways to engage.</h2>
      <p>We’re building Sapiens to connect what it encounters with what it understands, chooses and does next.</p>
    </div>
    <p className="relationship-instruction">Choose a connection to explore how it can influence Sapiens.</p>
    <div className="relationship-map">
      <section className="relationship-individual" aria-labelledby={`${prefix}-identity`}>
        <div className="relationship-identity-heading">
          <img src={identity} width="88" height="88" alt="" loading="lazy" />
          <div><h3 id={`${prefix}-identity`}>Sapiens</h3><p>The same individual across different interactions.</p></div>
        </div>
        <div className="relationship-aspects">
          {aspects.map(aspect => <div key={aspect.id} className="relationship-aspect" data-highlighted={active?.aspect === aspect.id}>
            <h4>{aspect.title}</h4><p>{aspect.description}</p>
          </div>)}
        </div>
      </section>
      {interactions.map(item => <article key={item.id} className={`relationship-outside relationship-${item.id}`} data-selected={selected === item.id}>
        <button type="button" className="relationship-choice" aria-expanded={selected === item.id} aria-controls={`${prefix}-${item.id}-impact`} onClick={() => setSelected(selected === item.id ? null : item.id)}>
          <img src={item.image} width="64" height="64" loading="lazy" alt="" />
          <span className="relationship-choice-title">{item.title}</span>
          <span className="relationship-description">{item.description}</span>
          <span className="relationship-exchange">{item.exchange}<span aria-hidden="true"> ↔</span></span>
        </button>
        <div id={`${prefix}-${item.id}-impact`} className="relationship-impact" hidden={selected !== item.id}>
          <span>Connects with {aspects.find(aspect => aspect.id === item.aspect)?.title.toLowerCase()}</span><p>{item.impact}</p>
        </div>
        <svg className="relationship-connection" viewBox="0 0 64 32" fill="none" aria-hidden="true">
          <path d="M0 9H63M57 3L63 9L57 15M64 23H1M7 17L1 23L7 29" />
        </svg>
      </article>)}
    </div>
    <p className="relationship-caption">These relationships describe the Sapiens concept; available interactions depend on its current capabilities and connections.</p>
  </div>;
}
