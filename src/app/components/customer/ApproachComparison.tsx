import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { ApproachDiagram, type ComparisonTopic } from './ApproachDiagram';
import '../../../styles/approach-comparison.css';

const differences: Array<{ topic: ComparisonTopic; question: string; otherTitle: string; sapiensTitle: string; other: string; sapiens: string }> = [
  { topic: 'Memory', question: 'What carries forward?', otherTitle: 'Recall for a response', sapiensTitle: 'Connect experience to focus', other: 'Assistants can remember preferences. Agents can retrieve saved information.', sapiens: 'Connect memories with ongoing goals and the situation Sapiens is currently considering.' },
  { topic: 'Initiative', question: 'What prompts action?', otherTitle: 'Choose actions for a task', sapiensTitle: 'Choose what needs attention', other: 'Agents can choose actions and use tools to carry out a task.', sapiens: 'Let attention and curiosity help select what deserves action, including questions that remain unanswered.' },
  { topic: 'Goals', question: 'What stays in progress?', otherTitle: 'Plan the steps', sapiensTitle: 'Revisit an ongoing goal', other: 'Agent workflows can plan and complete multi-step tasks.', sapiens: 'Keep goals, plans and their progress as records that can be reviewed and revised over time.' },
  { topic: 'Feedback', question: 'What changes next time?', otherTitle: 'Evaluate and retry', sapiensTitle: 'Carry outcomes forward', other: 'Agent workflows can evaluate results and try again.', sapiens: 'Connect outcomes with memory and reflection so past experience can inform future decisions.' },
  { topic: 'Architecture', question: 'How do the parts connect?', otherTitle: 'Extend a model', sapiensTitle: 'Connect cognitive processes', other: 'A model combined with tools, memory and a workflow or agent loop.', sapiens: 'An experimental system with distinct processes for attention, understanding, memory and goals, working together around each Sapiens.' },
];

export function ApproachComparison() {
  return (
    <section className="approach-comparison approach-visual" id="sapiens-approach" aria-labelledby="approach-title">
      <header className="approach-heading">
        <div><span className="intelligence-eyebrow">SAPIENS & OTHER AI</span><h2 id="approach-title">How is Sapiens<br/><em>different?</em></h2></div>
        <div><p className="approach-answer">We’re building a system where memory, attention and goals help decide what happens next.</p><p>That is the focus of Sapiens’ architecture. Here’s how it relates to capabilities you may already know from AI assistants and agents.</p></div>
      </header>
      <p className="comparison-reading-note">A visual comparison of design approaches. Diagrams are simplified; other systems may share these capabilities.</p>
      <table className="approach-table">
        <caption className="sr-only">Other AI capabilities compared with Sapiens’ design focus. Sapiens is experimental; these are not exclusive capabilities or performance claims.</caption>
        <thead><tr><th scope="col">Five things to compare</th><th scope="col">Other AI assistants & agents<span>Capabilities vary by system</span></th><th scope="col">Sapiens<span>Our design focus · experimental</span></th></tr></thead>
        <tbody>{differences.map((row, i) => <tr key={row.topic}>
          <th scope="row"><span className="approach-number" aria-hidden="true">0{i + 1}</span><span className="approach-topic">{row.topic}</span><span className="approach-row-question">{row.question}</span></th>
          <td><span className="approach-mobile-label" aria-hidden="true">OTHER AI</span><h3 className="comparison-cell-title">{row.otherTitle}</h3><ApproachDiagram topic={row.topic}/><p className="comparison-cell-copy">{row.other}</p></td>
          <td><span className="approach-mobile-label" aria-hidden="true">SAPIENS · DESIGN FOCUS</span><h3 className="comparison-cell-title">{row.sapiensTitle}</h3><ApproachDiagram topic={row.topic} sapiens/><p className="comparison-cell-copy">{row.sapiens}</p></td>
        </tr>)}</tbody>
      </table>
      <div className="approach-summary"><span aria-hidden="true">↗</span><p><strong>The difference is in how we connect the parts.</strong> Memory or proactive behavior alone is not unique to Sapiens. We’re exploring how these processes can work together over time; we haven’t established that this makes Sapiens better than other systems.</p></div>
      <div className="approach-links"><a href="#layered-chapters">See it through a simple example <ArrowDown size={18}/></a><a href="#direction-product">What you can use today <ArrowUpRight size={18}/></a></div>
      <details className="approach-sources"><summary>About this comparison & sources</summary><p>This compares documented AI patterns with Sapiens’ intended architecture, not individual products or benchmark results. The example below illustrates the direction we’re developing.</p><p>Background: <a href="https://help.openai.com/en/articles/8590148-memory-in-chatgpt" target="_blank" rel="noreferrer">OpenAI: memory in ChatGPT</a> and <a href="https://www.anthropic.com/research/building-effective-agents" target="_blank" rel="noreferrer">Anthropic: agent architecture patterns</a>. Reviewed October 2026.</p></details>
    </section>
  );
}
