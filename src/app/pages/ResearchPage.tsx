import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
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
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const selectedSection = sections.find(section => section.id === category);
  const articleSection = sections.find(section => section.topics.some(topic => topic.id === slug));
  const article = articleSection?.topics.find(topic => topic.id === slug && topic.introduction);
  const visibleSections = selectedSection ? [selectedSection] : sections;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = article ? `${article.title} | Sapiens Research` : 'Research | Sapiens';
    return () => { document.title = previousTitle; };
  }, [article]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  return <div className="direction-page direction-world direction-science research-page">
    <ScienceEnvironment/>
    <div className="direction-design">
      <a href="#research-main" className="direction-skip">Skip to content</a>
      <header className="direction-header">
        <Link className="direction-brand" to="/" aria-label="Sapiens home"><SapiensBrandMark/>Sapiens</Link>
        <nav aria-label="Main navigation">
          <a href="/#direction-product">Product</a>
          <a href="/#layered-chapters">How it works</a>
          <Link to="/research" aria-current={slug ? undefined : 'page'}>Research</Link>
          <a href="/#direction-contact">Contact us</a>
          {user ? <YourSapiensLink/> : <Link to="/login">Sign in</Link>}
          <ThemeToggle className="layered-theme-toggle"/>
        </nav>
      </header>
      <main id="research-main" tabIndex={-1} className="direction-wrap research-main">
        {slug ? article && articleSection ? <div className="research-article-layout">
          <nav className="research-breadcrumb" aria-label="Breadcrumb">
            <Link to="/research">Research</Link><span aria-hidden="true">/</span>
            <Link to={`/research?category=${articleSection.id}`}>{articleSection.title}</Link>
          </nav>
          <article className="research-article">
            <header>
              <p className="research-status">Introduction</p>
              <h1>{article.title}</h1>
              <p className="research-intro">{article.description}</p>
            </header>
            <div className="research-article-body"><p>{article.introduction}</p></div>
            <footer className="research-article-footer">
              <p>This is a short introduction. Detailed explanations and references have not been published yet.</p>
              <Link className="research-back" to={`/research?category=${articleSection.id}`}>Browse {articleSection.title.toLowerCase()}</Link>
            </footer>
          </article>
        </div> : <div className="research-opening">
          <h1>Article not available</h1>
          <p className="research-intro">This address does not have a published research article.</p>
          <Link className="research-back" to="/research">Browse research</Link>
        </div> : <>
          <header className="research-opening">
            <h1>Research</h1>
            <p className="research-intro">The philosophy, system design and experiments behind Sapiens, a persistent AI individual.</p>
            <p className="research-reading-note">Read our first introductions or explore the topics we plan to publish.</p>
          </header>
          <div className="research-layout">
            <nav className="research-index" aria-label="Research categories">
              <p>Browse by topic</p>
              <Link to="/research" aria-current={!selectedSection ? 'page' : undefined}>All topics</Link>
              {sections.map(section => <Link key={section.id} to={`/research?category=${section.id}`} aria-current={selectedSection?.id === section.id ? 'page' : undefined}>{section.title}</Link>)}
            </nav>
            <div className="research-topics">
              {visibleSections.map(section => <section key={section.id} aria-labelledby={`${section.id}-title`}>
                <h2 id={`${section.id}-title`}>{section.title}</h2>
                <ul className="research-topic-list">
                  {section.topics.map(topic => <li key={topic.id}>
                    {topic.introduction ? <Link className="research-topic research-topic-link" to={`/research/${topic.id}`}>
                      <div className="research-topic-heading"><h3>{topic.title}</h3><span className="research-topic-status">Introduction <span aria-hidden="true">↗</span></span></div>
                      <p className="research-topic-description">{topic.description}</p>
                    </Link> : <div className="research-topic research-topic-planned">
                      <div className="research-topic-heading"><h3>{topic.title}</h3><span className="research-topic-status">Not published yet</span></div>
                      <p className="research-topic-description">{topic.description}</p>
                    </div>}
                  </li>)}
                </ul>
              </section>)}
            </div>
          </div>
        </>}
        <footer className="research-footer">
          <p className="research-note">Sapiens is experimental. Our design ideas and introductions are not evidence of proven capabilities.</p>
          <a className="research-back" href="/#layered-chapters">Back to the system overview</a>
        </footer>
      </main>
    </div>
  </div>;
}
