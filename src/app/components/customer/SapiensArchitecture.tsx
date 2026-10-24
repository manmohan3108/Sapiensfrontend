import { Compass, History, Network, ScanSearch } from 'lucide-react';
import { SapiensWorldDiagram } from './SapiensWorldDiagram';
import '../../../styles/sapiens-architecture.css';

const processes = [
  { title: 'Attention & curiosity', icon: ScanSearch, color: '#a66a1c', summary: 'Notices something worth exploring.',
    explanation: 'A question, an interest, or a change in the situation can prompt Sapiens to seek information or start a conversation. It does not always need a new task from someone.',
    example: 'An unanswered question → reach out or investigate.' },
  { title: 'Understanding', icon: Network, color: '#357762', summary: 'Connects new information with what it already knows.',
    explanation: 'Replies and tool results are evidence to interpret. When information is incomplete or conflicting, Sapiens can ask a follow-up question, check another source, or wait for a reply.',
    example: 'An unclear reply → clarify before drawing a conclusion.' },
  { title: 'Memory & experience', icon: History, color: '#ab536a', summary: 'Carries useful experience into the next interaction.',
    explanation: 'What happened, who was involved, and what helped can inform later decisions. New evidence can change an earlier understanding; past context is not assumed to stay true forever.',
    example: 'Feedback today → a better-informed choice next time.' },
  { title: 'Goals & reflection', icon: Compass, color: '#b46535', summary: 'Decides what to pursue, and reconsiders the approach.',
    explanation: 'Sapiens weighs what it is trying to achieve against what it knows. It can take a permitted action, wait for information or approval, or change direction after an outcome.',
    example: 'An action finishes → check whether it actually helped.' },
];

export function SapiensArchitecture() {
  return <div className="sapiens-architecture">
    <div className="architecture-intro">
      <p>The same individual, connected to people, information, tools, and feedback.</p>
      <span>Select a connection to follow an exchange. Explore the internal processes below.</span>
    </div>
    <div className="architecture-key" aria-label="Connection legend">
      <span><i aria-hidden="true"/>Reaches out or acts</span>
      <span><i className="architecture-key-return" aria-hidden="true"/>Receives and interprets</span>
    </div>
    <SapiensWorldDiagram/>
    <section className="architecture-processes" aria-labelledby="architecture-processes-title">
      <header><h3 id="architecture-processes-title">Inside the individual</h3><p>Four connected processes, not a fixed sequence. Expand one to explore its role.</p></header>
      {processes.map(process => <details key={process.title} className="architecture-process">
        <summary><process.icon size={21} color={process.color} aria-hidden="true"/><span><strong>{process.title}</strong><span>{process.summary}</span></span><span className="architecture-expand" aria-hidden="true">+</span></summary>
        <div className="architecture-process-body"><p>{process.explanation}</p><p className="architecture-example">{process.example}</p></div>
      </details>)}
    </section>
    <aside className="architecture-continuity" aria-label="Between interactions">
      <h3>Between interactions</h3>
      <p>Waiting for a reply or permission is part of the process. Quiet periods allow reflection and consolidation, so useful experience can inform what happens next.</p>
    </aside>
    <p className="architecture-status">Concept architecture in development · exchanges are illustrative. Actions depend on connected tools and granted permissions.</p>
  </div>;
}
