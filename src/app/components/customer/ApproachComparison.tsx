import '../../../styles/approach-comparison.css';

const comparisons = [
  {
    aspect: 'Starting point',
    common: 'Answer questions or carry out tasks through chat, predefined workflows or model-directed steps.',
    sapiens: 'Investigate whether brain-inspired functions working together can support broader intelligence.',
  },
  {
    aspect: 'Organization',
    common: 'One model, several specialized agents or coordinated workflows can divide the work.',
    sapiens: 'Engines handle different functions within one continuing Sapien, sharing information and a common identity.',
  },
  {
    aspect: 'Memory and experience',
    common: 'Retrieval, saved history and memory can inform later responses and actions.',
    sapiens: 'Explore how connected memories, recall and replay make an individual’s past experience useful later.',
  },
  {
    aspect: 'Decisions and feedback',
    common: 'Agents can plan, use tools, evaluate results and adjust what they do.',
    sapiens: 'Study how present attention, ongoing intentions and observed outcomes can inform later decisions.',
  },
];

export function ApproachComparison() {
  return (
    <section className="approach-comparison approach-overview" id="sapiens-approach" aria-labelledby="approach-title">
      <header className="approach-overview-heading">
        <h3 id="approach-title">Comparing design approaches</h3>
        <p id="approach-description">AI systems vary. These are common agent patterns and our research focus—not a feature checklist for every product.</p>
      </header>
      <table className="approach-comparison-table" role="table" aria-labelledby="approach-title" aria-describedby="approach-description approach-caveat">
        <thead role="rowgroup">
          <tr role="row">
            <th scope="col" role="columnheader">Aspect</th>
            <th scope="col" role="columnheader">Common AI agent approaches</th>
            <th scope="col" role="columnheader">Sapiens research focus</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {comparisons.map(({ aspect, common, sapiens }) => (
            <tr key={aspect} role="row">
              <th scope="row" role="rowheader">{aspect}</th>
              <td role="cell"><span className="approach-column-label" aria-hidden="true">Common AI agent approaches</span>{common}</td>
              <td role="cell"><span className="approach-column-label" aria-hidden="true">Sapiens research focus</span>{sapiens}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="approach-caveat" id="approach-caveat">These capabilities overlap. Sapiens is experimental; this comparison does not claim exclusive abilities or a proven performance advantage.</p>
      <details className="approach-sources">
        <summary>Basis for this comparison</summary>
        <p>The agent patterns are illustrated in <a href="https://www.anthropic.com/engineering/building-effective-agents" target="_blank" rel="noreferrer">Anthropic’s Building effective agents</a>. The Sapiens column describes our design and research direction. A performance comparison would require named systems, matched tasks and measured results.</p>
      </details>
    </section>
  );
}
