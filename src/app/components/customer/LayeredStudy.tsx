import { type ReactNode } from 'react';
import { ArrowDown, ArrowUpRight, MessageCircle } from 'lucide-react';
import { ApproachComparison } from './ApproachComparison';
import { SapiensWorldDiagram } from './SapiensWorldDiagram';
import '../../../styles/layered-direction.css';
import '../../../styles/sapiens-journey.css';

export function LayeredStudy({ cta, onOpenGraph }: { cta: ReactNode; onOpenGraph: () => void }) {
  return <div className="outing-study">
    <section className="outing-intro" aria-labelledby="outing-title"><div><span className="outing-eyebrow">MEET SAPIENS</span><h1 id="outing-title">An AI individual.<br/><em>Shaped by experience.</em></h1></div><div className="outing-intro-side"><p>It reaches out, gathers evidence and learns from what happens—carrying experience into its next decision.</p><div className="outing-actions"><a href="#layered-chapters">See how Sapiens works <ArrowDown size={17}/></a>{cta}</div><small>Experimental architecture · in development</small></div></section>
    <section className="world-section" id="layered-chapters" aria-labelledby="world-title">
      <header className="world-heading"><div><span className="outing-eyebrow">THE SAPIENS CONCEPT</span><h2 id="world-title">How Sapiens learns from the world.</h2><p>It notices a gap, reaches out, and carries what it learns into its next decision.</p></div><span className="world-hint">Select a part<br/>to explore an exchange.</span></header>
      <SapiensWorldDiagram/>
      <p className="outing-concept-note">Concept in development · illustrative interactions</p>
      <details className="outing-details"><summary>Architecture, capabilities & comparison <span aria-hidden="true">+</span></summary><p className="outing-technical-note">This diagram illustrates the system we’re developing. Communication and actions require supported connections and permission. It is not a fixed sequence: Sapiens can wait, seek more information or revise its understanding.</p><button className="outing-architecture" onClick={onOpenGraph} type="button" aria-haspopup="dialog">Open the full architecture <ArrowUpRight size={17}/></button><ApproachComparison/></details>
    </section>
    <section className="outing-product" id="direction-product"><div><span className="outing-eyebrow">WHAT YOU CAN TRY TODAY</span><h2>Start your shared history.</h2><p>Create an individual and begin a conversation.</p>{cta}</div><div><MessageCircle size={26}/><h3>Talk. Return. Continue.</h3><p>Revisit saved conversations. Selected past context may inform replies. Available tool actions depend on your connections and permissions.</p></div></section>
  </div>;
}
