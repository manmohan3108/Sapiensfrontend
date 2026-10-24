import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { ApproachDiagram } from './ApproachDiagram';
import '../../../styles/approach-comparison.css';

export function ApproachComparison() {
  return (
    <section className="approach-comparison approach-compact" id="sapiens-approach" aria-labelledby="approach-title">
      <header className="compact-heading"><span className="intelligence-eyebrow">SAPIENS & OTHER AI</span><h2 id="approach-title">The Sapiens <em>approach.</em></h2></header>
      <div className="compact-approach-grid">
        <div className="compact-approach-copy">
          <div className="shared-ground"><span className="compact-label">WHAT OTHER AGENTS CAN ALREADY DO</span><p>Remember information, plan, use tools, review results and revise their approach. These capabilities are shared ground.</p></div>
          <div className="sapiens-focus"><span className="compact-label">WHAT WE’RE EXPLORING</span><h3>How experience shapes<br/>what Sapiens does next.</h3><p>We’re building an experimental architecture that connects attention, understanding, memory and ongoing goals around each Sapiens.</p></div>
          <a className="compact-example-link" href="#layered-chapters">See a simple example <ArrowDown size={18}/></a>
        </div>
        <figure className="compact-architecture">
          <div className="compact-figure-heading"><span className="compact-label">ONE CONNECTED SYSTEM</span><span className="compact-status">Experimental</span></div>
          <ApproachDiagram/>
          <figcaption><strong>Past experience → present decisions</strong><span>The aim: use what happened before to help decide what deserves attention now.</span></figcaption>
        </figure>
      </div>
      <div className="compact-footnote"><p>This explains our design focus, not an exclusive capability or a proven advantage over other AI.</p><a href="#direction-product">Meet Sapiens <ArrowUpRight size={17}/></a></div>
      <details className="approach-sources"><summary>What supports this explanation?</summary><p>Other agents already support memory, tool use, planning, evaluation, revision and modular design. Sapiens’ description reflects the architecture we’re developing. A meaningful product comparison would need named systems, matched tasks and measured results; none are claimed here.</p><p>Sources checked October 2026: <a href="https://claude.com/resources/guides/building-effective-ai-agents/common-architecture-patterns" target="_blank" rel="noreferrer">Anthropic’s architecture guide</a> and <a href="https://www.anthropic.com/research/building-effective-agents" target="_blank" rel="noreferrer">Building effective agents</a>.</p></details>
    </section>
  );
}
