import { ArrowDown, ArrowUpRight } from 'lucide-react';

const differences = [
  { topic: 'Memory', other: 'Assistants can remember preferences. Agents can retrieve saved information.', sapiens: 'Connect memories with ongoing goals and the situation Sapiens is currently considering.' },
  { topic: 'Initiative', other: 'Agents can choose actions and use tools to carry out a task.', sapiens: 'Let attention and curiosity help select what deserves action, including questions that remain unanswered.' },
  { topic: 'Goals', other: 'Agent workflows can plan and complete multi-step tasks.', sapiens: 'Keep goals, plans and their progress as records that can be reviewed and revised over time.' },
  { topic: 'Feedback', other: 'Agent workflows can evaluate results and try again.', sapiens: 'Connect outcomes with memory and reflection so past experience can inform future decisions.' },
  { topic: 'Architecture', other: 'A model combined with tools, memory and a workflow or agent loop.', sapiens: 'An experimental system with distinct processes for attention, understanding, memory and goals, working together around each Sapiens.' },
];

export function ApproachComparison() {
  return (
    <section className="approach-comparison" id="sapiens-approach" aria-labelledby="approach-title">
      <header className="approach-heading">
        <div><span className="intelligence-eyebrow">SAPIENS & OTHER AI</span><h2 id="approach-title">How is Sapiens<br/><em>different?</em></h2></div>
        <div><p className="approach-answer">We’re building a system where memory, attention and goals help decide what happens next.</p><p>That is the focus of Sapiens’ architecture. Here’s how it relates to capabilities you may already know from AI assistants and agents.</p></div>
      </header>
      <table className="approach-table">
        <caption className="sr-only">Other AI capabilities compared with Sapiens’ design focus. Sapiens is experimental; these are not exclusive capabilities or performance claims.</caption>
        <thead><tr><th scope="col">The part</th><th scope="col">Other AI assistants & agents<span>Capabilities vary by system</span></th><th scope="col">Sapiens<span>Our design focus · experimental</span></th></tr></thead>
        <tbody>{differences.map((row, i) => <tr key={row.topic}>
          <th scope="row"><span className="approach-number" aria-hidden="true">0{i + 1}</span>{row.topic}</th>
          <td><span className="approach-mobile-label" aria-hidden="true">OTHER AI</span>{row.other}</td>
          <td><span className="approach-mobile-label" aria-hidden="true">SAPIENS · DESIGN FOCUS</span>{row.sapiens}</td>
        </tr>)}</tbody>
      </table>
      <div className="approach-summary"><span aria-hidden="true">↗</span><p><strong>The difference is in how we connect the parts.</strong> Memory or proactive behavior alone is not unique to Sapiens. We’re exploring how these processes can work together over time; we haven’t established that this makes Sapiens better than other systems.</p></div>
      <div className="approach-links"><a href="#layered-chapters">See it through a simple example <ArrowDown size={18}/></a><a href="#direction-product">What you can use today <ArrowUpRight size={18}/></a></div>
      <details className="approach-sources"><summary>About this comparison & sources</summary><p>This compares documented AI patterns with Sapiens’ intended architecture, not individual products or benchmark results. The example below illustrates the direction we’re developing.</p><p>Background: <a href="https://help.openai.com/en/articles/8590148-memory-in-chatgpt" target="_blank" rel="noreferrer">OpenAI: memory in ChatGPT</a> and <a href="https://www.anthropic.com/research/building-effective-agents" target="_blank" rel="noreferrer">Anthropic: agent architecture patterns</a>. Reviewed October 2026.</p></details>
    </section>
  );
}
