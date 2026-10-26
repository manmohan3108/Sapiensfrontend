import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { YourSapiensLink } from '../components/navigation/YourSapiensLink';
import { ScienceEnvironment } from '../components/customer/ScienceEnvironment';
import { ThemeToggle } from '../components/ThemeToggle';
import { SapiensBrandMark } from '../components/customer/SapiensBrandMark';
import '../../styles/landing-directions.css';
import '../../styles/science-direction.css';
import '../../styles/research.css';

const topics = [
  { id: 'philosophy', title: 'Our philosophy', text: 'We are building a persistent AI individual whose experiences inform what it notices, says and does next.' },
  { id: 'identity', title: 'One individual, many functions', text: 'Awareness, memory, goals and learning serve one continuing identity. Each has a distinct responsibility within the same Sapien.' },
  { id: 'process', title: 'From experience to action', text: 'A Sapien considers incoming information alongside relevant memories, decides whether to act or wait, and assesses the outcome. What it retains can inform its next decision.' },
  { id: 'inspiration', title: 'Inspired by neuroscience', text: 'Attention, working memory, associative recall and consolidation inspire our design. These are engineering interpretations, not claims that Sapiens reproduces a brain or establishes consciousness.' },
  { id: 'research', title: 'Learning through experiments', text: 'We use simulated workplaces to study communication, memory, tool use and unfinished work. We inspect successes and failures to improve the system; reliable long-term behaviour remains an open research goal.' },
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
      <div className="research-layout">
        <nav className="research-index" aria-label="Research topics"><p>In this guide</p>{topics.map(topic => <a key={topic.id} href={`#${topic.id}`}>{topic.title}</a>)}</nav>
      <div className="research-topics">{topics.map(topic => <section key={topic.id} id={topic.id} tabIndex={-1} aria-labelledby={`${topic.id}-title`}>
        <h2 id={`${topic.id}-title`}>{topic.title}</h2><p>{topic.text}</p>
      </section>)}</div>
      </div>
      <footer className="research-footer">
      <p className="research-note">This is an overview of an experimental system, not a report of proven capabilities.</p>
      <a className="research-back" href="/#layered-chapters">Back to the system overview</a>
      </footer>
    </main>
    </div>
  </div>;
}

