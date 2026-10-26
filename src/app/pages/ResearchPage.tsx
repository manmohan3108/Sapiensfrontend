import { Link } from 'react-router';
import { ThemeToggle } from '../components/ThemeToggle';
import { SapiensBrandMark } from '../components/customer/SapiensBrandMark';
import '../../styles/landing-directions.css';
import '../../styles/science-direction.css';
import '../../styles/research.css';

const topics = [
  { id: 'philosophy', title: 'Our philosophy', text: 'We are building a persistent AI individual whose experiences inform what it notices, says and does next.' },
  { id: 'identity', title: 'One individual, many functions', text: 'Awareness, memory, goals and learning serve one continuing identity. Each has a distinct responsibility within the same Sapien.' },
  { id: 'process', title: 'From experience to action', text: 'Attend to information, recall relevant context, decide, act or wait, and assess what happened. Retained understanding can inform later decisions.' },
  { id: 'inspiration', title: 'Inspired by neuroscience', text: 'Attention, working memory, associative recall and consolidation inspire our design. These are engineering interpretations, not claims that Sapiens reproduces a brain or establishes consciousness.' },
  { id: 'research', title: 'Learning through experiments', text: 'We use simulated workplaces to study communication, memory, tool use and unfinished work. We inspect successes and failures to improve the system; reliable long-term behaviour remains an open research goal.' },
];

export function ResearchPage() {
  return <div className="direction-page direction-world direction-science research-page">
    <a href="#research-main" className="direction-skip">Skip to content</a>
    <header className="direction-header">
      <Link className="direction-brand" to="/" aria-label="Sapiens home"><SapiensBrandMark/>Sapiens</Link>
      <nav aria-label="Main navigation">
        <a href="/#direction-product">Product</a>
        <a href="/#layered-chapters">How it works</a>
        <Link to="/research" aria-current="page">Research</Link>
        <a href="/#direction-contact">Contact us</a>
        <ThemeToggle className="layered-theme-toggle"/>
      </nav>
    </header>
    <main id="research-main" className="direction-wrap research-main">
      <span className="direction-eyebrow">RESEARCH / IN DEVELOPMENT</span>
      <h1>The ideas behind Sapiens.</h1>
      <p className="research-intro">A starting guide to our philosophy, design and experiments. We will expand it with implementation details, findings and references as the work develops.</p>
      <div className="research-topics">{topics.map(topic => <section key={topic.id} id={topic.id} aria-labelledby={`${topic.id}-title`}>
        <h2 id={`${topic.id}-title`}>{topic.title}</h2><p>{topic.text}</p>
      </section>)}</div>
      <p className="research-note">This is an overview of an experimental system, not a report of proven capabilities.</p>
      <a className="research-back" href="/#layered-chapters">Back to the system overview →</a>
    </main>
  </div>;
}
