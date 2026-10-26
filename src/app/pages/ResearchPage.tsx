import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { YourSapiensLink } from '../components/navigation/YourSapiensLink';
import { ScienceEnvironment } from '../components/customer/ScienceEnvironment';
import { ThemeToggle } from '../components/ThemeToggle';
import { SapiensBrandMark } from '../components/customer/SapiensBrandMark';
import '../../styles/landing-directions.css';
import '../../styles/science-direction.css';
import '../../styles/research.css';

type ResearchTopic = { id: string; title: string; description: string; introduction?: string };
type ResearchSection = { id: string; title: string; topics: ResearchTopic[] };

const sections: ResearchSection[] = [
  { id: 'foundations', title: 'Foundations', topics: [
    { id: 'philosophy', title: 'Our philosophy', description: 'Why we are building a persistent AI individual.', introduction: 'We are building a persistent AI individual whose experiences inform what it notices, says and does next.' },
    { id: 'identity', title: 'One individual, many functions', description: 'How different functions serve one continuing identity.', introduction: 'Awareness, memory, goals and learning serve one continuing identity. Each has a distinct responsibility within the same Sapien.' },
    { id: 'inspiration', title: 'Inspired by neuroscience', description: 'The ideas we borrow, and the limits of the analogy.', introduction: 'Attention, working memory, associative recall and consolidation inspire our design. These are engineering interpretations, not claims that Sapiens reproduces a brain or establishes consciousness.' },
  ] },
  { id: 'system-design', title: 'System design', topics: [
    { id: 'process', title: 'From experience to action', description: 'An introduction to how a Sapien considers information and acts.', introduction: 'A Sapien considers incoming information alongside relevant memories, decides whether to act or wait, and assesses the outcome. What it retains can inform its next decision.' },
    { id: 'awareness', title: 'Awareness and attention', description: 'How information is considered and decisions are made.' },
    { id: 'memory', title: 'Memory and recall', description: 'How experiences are retained and relevant context is retrieved.' },
    { id: 'goals', title: 'Goals and unfinished work', description: 'How intentions, progress and later follow-through are represented.' },
    { id: 'learning', title: 'Learning from experience', description: 'How outcomes and feedback can inform future behaviour.' },
    { id: 'connections', title: 'How the parts communicate', description: 'How information and references move between functions and tools.' },
  ] },
  { id: 'experiments', title: 'Experiments and findings', topics: [
    { id: 'simulation', title: 'Learning through experiments', description: 'Why we study Sapiens in simulated workplaces.', introduction: 'We use simulated workplaces to study communication, memory, tool use and unfinished work. We inspect successes and failures to improve the system; reliable long-term behaviour remains an open research goal.' },
    { id: 'findings', title: 'Observations and changes', description: 'Documented examples of what worked, what failed and what changed.' },
  ] },
  { id: 'open-questions', title: 'Open questions', topics: [
    { id: 'continuity', title: 'Reliable behaviour over time', description: 'Questions about maintaining context and completing work across many interactions.' },
    { id: 'evaluation', title: 'How to measure progress', description: 'Questions about evaluating useful behaviour and the limits of simulations.' },
  ] },
];
export function ResearchPage() {
  const { user } = useAuth();
  return <div className="direction-page direction-world direction-science research-page">
    <ScienceEnvironment/>
    <div className="direction-design">
    <a href="#research-main" className="direction-skip">Skip to content</a>
    <header className="direction-header">
      <Link className="direction-brand" to="/" aria-label="Sapiens home"><SapiensBrandMark/>Sapiens</Link>
      <nav aria-label="Main navigation">
        <a href="/#direction-product">Product</a>
        <a href="/#layered-chapters">How it works</a>
        <Link to="/research" aria-current="page">Research</Link>
        <a href="/#direction-contact">Contact us</a>
        {user ? <YourSapiensLink/> : <Link to="/login">Sign in</Link>}
        <ThemeToggle className="layered-theme-toggle"/>
      </nav>
    </header>
    <main id="research-main" tabIndex={-1} className="direction-wrap research-main">
      <header className="research-opening">
      <p className="research-status">An evolving research guide</p>
      <h1>Research</h1>
      <p className="research-intro">How we are developing a persistent AI individual: the philosophy behind it, the ideas that inspire it and the experiments that help us improve it.</p>
      </header>
      <p className="research-reading-note">Start with the short introductions below. Planned articles are marked “Not published yet”.</p>
      <div className="research-layout">
        <nav className="research-index" aria-label="Research sections">
          <p>Browse research</p>
          {sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
        </nav>
        <div className="research-topics">
          {sections.map(section => <section key={section.id} id={section.id} tabIndex={-1} aria-labelledby={`${section.id}-title`}>
            <h2 id={`${section.id}-title`}>{section.title}</h2>
            <ul className="research-topic-list">
              {section.topics.map(topic => <li key={topic.id} id={topic.id}>
                {topic.introduction ? <details className="research-topic">
                  <summary>
                    <span className="research-topic-heading"><span>{topic.title}</span><span className="research-topic-status">Read introduction</span></span>
                    <span className="research-topic-description">{topic.description}</span>
                  </summary>
                  <p className="research-topic-body">{topic.introduction}</p>
                </details> : <div className="research-topic research-topic-planned">
                  <div className="research-topic-heading"><h3>{topic.title}</h3><span className="research-topic-status">Not published yet</span></div>
                  <p className="research-topic-description">{topic.description}</p>
                </div>}
              </li>)}
            </ul>
          </section>)}
        </div>
      </div>
      <footer className="research-footer">
      <p className="research-note">This is an overview of an experimental system, not a report of proven capabilities.</p>
      <a className="research-back" href="/#layered-chapters">Back to the system overview</a>
      </footer>
    </main>
    </div>
  </div>;
}


