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
type ResearchSection = { id: string; title: string; question?: string; concepts?: string; topics: ResearchTopic[] };

const topicGroups: ResearchSection[] = [
  { id: 'hypothesis', title: 'Our research hypothesis', topics: [
    { id: 'philosophy', title: 'Intelligence through interacting mechanisms', description: 'The central hypothesis guiding Sapiens.', introduction: 'Our research asks whether intelligence can emerge by bringing together mechanisms inspired by the brain, guided by neuroscience and philosophical concepts of intelligence. We aim to explore these concepts together and study what arises from their interaction. Persistence, memory, identity and learning are parts of this exploration, rather than the whole hypothesis. This is a research direction, not a demonstrated conclusion.' },
    { id: 'emergence', title: 'What we mean by emergence', description: 'Define the behaviour we seek and what would support or challenge the hypothesis.' },
  ] },
  { id: 'philosophy-foundations', title: 'Philosophical foundations', topics: [
    { id: 'intelligence-understanding', title: 'Intelligence and understanding', description: 'The meanings of these concepts and how they guide our research.' },
    { id: 'self-agency', title: 'Self and agency', description: 'Questions about individuality, intentions and responsibility for action.' },
    { id: 'consciousness', title: 'Consciousness and its boundaries', description: 'Distinguish consciousness from intelligence, self-representation and observable behaviour.' },
  ] },
  { id: 'neuroscience', title: 'Neuroscience foundations', topics: [
    { id: 'inspiration', title: 'From neuroscience to computational design', description: 'Our sources of inspiration and the limits of translating them into software.', introduction: 'Neuroscience informs the mechanisms we explore and how they might interact. Attention, working memory, associative recall and consolidation are among our inspirations. Our implementations are engineering interpretations: a similar name or function does not establish biological equivalence. We intend to explain the relevant concepts, their sources and our design choices as this research develops.' },
    { id: 'perception-attention', title: 'Perception and attention', description: 'How incoming information and selective attention inform our design.' },
    { id: 'biological-memory-learning', title: 'Memory and learning', description: 'Ideas about retaining, recalling and adapting through experience.' },
    { id: 'motivation-action', title: 'Motivation and action', description: 'Concepts connecting internal needs, decisions, action and feedback.' },
  ] },
  { id: 'architecture', title: 'The Sapiens architecture', topics: [
    { id: 'architecture-overview', title: 'Bringing the mechanisms together', description: 'The overall architecture and the responsibilities of its engines.' },
    { id: 'process', title: 'From experience to action', description: 'An introduction to the flow across the system.', introduction: 'A Sapien considers incoming information alongside relevant memories, decides whether to act or wait, and assesses the outcome. What it retains can inform its next decision. This flow connects several functions within one individual; studying their interaction is part of our research into intelligence.' },
    { id: 'connections', title: 'Information flow and shared references', description: 'How engines and tools exchange information while preserving its source and meaning.' },
  ] },
  { id: 'mechanisms', title: 'Individual mechanisms', topics: [
    { id: 'awareness', title: 'Awareness and attention', description: 'Purpose, inspiration, implementation and open questions about attending and deciding.' },
    { id: 'identity', title: 'Identity and the shared self', description: 'How multiple functions belong to one Sapien.', introduction: 'Awareness, memory, goals and learning serve one continuing identity. Each has a distinct responsibility within the same Sapien. This shared-self design describes how we organize the system; it does not by itself demonstrate consciousness or establish an explanation of the human self.' },
    { id: 'memory', title: 'Memory and recall', description: 'The roles of working memory, retained experiences and retrieval.' },
    { id: 'goals', title: 'Goals and planning', description: 'How intentions, progress and unfinished work are represented.' },
    { id: 'reasoning-questioning', title: 'Reasoning and questioning', description: 'How the system considers possibilities, uncertainties and questions.' },
    { id: 'action-feedback', title: 'Action and feedback', description: 'How actions are carried out and outcomes become evidence.' },
  ] },
  { id: 'adaptation', title: 'Experience and adaptation', topics: [
    { id: 'learning', title: 'Learning from experience', description: 'How remembered outcomes and feedback can inform future behaviour.' },
    { id: 'continuity', title: 'Development over time', description: 'How understanding and behaviour may change across accumulated experiences.' },
  ] },
  { id: 'experiments', title: 'Experiments and evidence', topics: [
    { id: 'simulation', title: 'Studying Sapiens through simulation', description: 'Why we use simulated workplaces and what they can reveal.', introduction: 'We use simulated workplaces to study communication, memory, tool use and unfinished work. We inspect successes and failures to improve the system. These experiments provide observations about behaviour under specific conditions; they do not alone demonstrate emergent intelligence. Connecting observations to the research hypothesis requires explicit evaluation and consideration of alternative explanations.' },
    { id: 'findings', title: 'Observations, failures and changes', description: 'Documented findings and how they influenced our implementation.' },
    { id: 'evaluation', title: 'Evaluating the hypothesis', description: 'What evidence could distinguish progress from expected model or tool behaviour.' },
  ] },
  { id: 'open-questions', title: 'Open questions and limitations', topics: [
    { id: 'missing-mechanisms', title: 'Missing mechanisms and research directions', description: 'Concepts not yet represented and approaches we still need to explore.' },
    { id: 'alternative-explanations', title: 'Alternative explanations', description: 'Other reasons observed behaviour might arise, without supporting emergence.' },
    { id: 'research-limitations', title: 'Limits of our evidence', description: 'Constraints of our implementation, experiments and current conclusions.' },
  ] },
];
const existingTopics = topicGroups.flatMap(section => section.topics);
const additionalTopics: ResearchTopic[] = [
  { id: 'associative-memory', title: 'How one experience brings another to mind', description: 'Associative memory: connecting experiences so the past can help explain a new situation.' },
  { id: 'replay-consolidation', title: 'Why revisit an experience?', description: 'Replay and consolidation: exploring how revisiting memories changes their connections.' },
  { id: 'reinforcement-forgetting', title: 'What should grow stronger, and what should fade?', description: 'Reinforcement, forgetting and the risk of strengthening the wrong association.' },
  { id: 'curiosity', title: 'What makes something worth exploring?', description: 'Curiosity can concern an unfamiliar pattern, an opportunity or an idea—not only a missing answer.' },
  { id: 'initiative', title: 'Why think when nobody has asked?', description: 'Making room for exploration, gathering information and ordinary conversation without forcing constant activity.', introduction: 'Imagine a Sapien has no new message to answer. Should it simply wait? Our ambition includes noticing something worth learning, revisiting an unresolved idea or starting a conversation on its own initiative.\n\nA question is one possible starting point. An unfamiliar pattern, a connection between experiences or interest in another person can also invite exploration. Curiosity concerns what is worth exploring; questioning concerns what to ask; deciding whether and how to act is another responsibility.\n\nThis should not become a rule to contact someone every few minutes. Rest, waiting and leaving people uninterrupted can also be appropriate. The research challenge is to develop useful initiative through context and experience rather than prescribed scenarios. These connections are still being developed and evaluated.' },
  { id: 'firsthand-experience', title: 'What can an AI learn by taking part?', description: 'Firsthand experience and how an individual develops beyond its initial model knowledge.', introduction: 'Two Sapiens could begin with the same language model yet participate in different situations. One might encounter a failed deployment; another might learn why a team changed its plans. We want those different histories to matter when they next think or act.\n\nThe model supplies capabilities and prior knowledge. The wider system retains what this particular Sapien observes, discusses, attempts and learns. Its memories, associations and learned guidance can then provide different context for later decisions. This is not the same as retraining the underlying model.\n\nOur aim is growing understanding and judgment through participation, not simply keeping a transcript. We still need to measure when retained experience improves behaviour, when it misleads it and how later evidence can correct it.' },
  { id: 'abstraction', title: 'When does an experience become a general idea?', description: 'Abstraction and generalization: exploring patterns that may apply beyond one remembered event.' },
  { id: 'prediction', title: 'Could expectations help a Sapien understand what is happening?', description: 'An exploratory direction: compare expectations with incoming evidence and connect events into an unfolding account.' },
  { id: 'reward-emotion', title: 'What could give an experience significance?', description: 'Research directions around motivation, reward and emotion-inspired processes, without claiming human feelings.' },
  { id: 'senses-roles', title: 'One individual across different roles and senses', description: 'How tools, context and experience could support different roles, with future voice and vision contributing to shared understanding.' },
];
const allTopics = [...existingTopics, ...additionalTopics];
const selectTopics = (...ids: string[]) => ids.map(id => allTopics.find(topic => topic.id === id)!);
const sections: ResearchSection[] = [
  { id: 'hypothesis', title: 'The central question', question: 'Can intelligence emerge from interacting mechanisms?', concepts: 'Emergence, intelligence, neuroscience and philosophy', topics: selectTopics('philosophy', 'inspiration', 'emergence', 'intelligence-understanding', 'consciousness') },
  { id: 'understanding', title: 'Understanding and individuality', question: 'How could an AI develop its own understanding?', concepts: 'Firsthand experience, individual development and a shared self', topics: selectTopics('firsthand-experience', 'identity', 'continuity', 'self-agency') },
  { id: 'memory', title: 'Memory and association', question: 'What makes an experience matter later?', concepts: 'Working memory, associative recall, reinforcement and replay', topics: selectTopics('memory', 'associative-memory', 'replay-consolidation', 'reinforcement-forgetting', 'biological-memory-learning') },
  { id: 'initiative', title: 'Attention and curiosity', question: 'Why think when nobody has asked?', concepts: 'Attention, questioning, curiosity and initiative', topics: selectTopics('initiative', 'awareness', 'curiosity', 'reasoning-questioning', 'perception-attention') },
  { id: 'learning', title: 'Decisions and learning', question: 'How does experience change the next decision?', concepts: 'Action, reflection, feedback, goals and generalization', topics: selectTopics('process', 'action-feedback', 'learning', 'goals', 'abstraction', 'architecture-overview', 'connections') },
  { id: 'directions', title: 'Research directions', question: 'What might be missing?', concepts: 'Prediction, motivation, reward, emotion-inspired processes and new senses', topics: selectTopics('prediction', 'motivation-action', 'reward-emotion', 'senses-roles', 'missing-mechanisms') },
  { id: 'experiments', title: 'Experiments and evidence', question: 'What happens when we put these ideas to work?', concepts: 'Simulations, observations, failures and evaluation', topics: selectTopics('simulation', 'findings', 'evaluation', 'alternative-explanations', 'research-limitations') },
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
            <div className="research-article-body">{article.introduction?.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
            <footer className="research-article-footer">
              <p>This is a short introduction. Detailed explanations and references have not been published yet.</p>
              <Link className="research-back" to={`/research?category=${articleSection.id}`}>Explore {articleSection.title.toLowerCase()}</Link>
              <nav className="research-related" aria-label="Related reading">
                <h2>Keep exploring</h2>
                {sections.flatMap(section => section.topics).filter(topic => topic.introduction && topic.id !== article.id).slice(0, 3).map(topic => <Link key={topic.id} to={`/research/${topic.id}`}>{topic.title}</Link>)}
              </nav>
            </footer>
          </article>
        </div> : <div className="research-opening">
          <h1>Article not available</h1>
          <p className="research-intro">This address does not have a published research article.</p>
          <Link className="research-back" to="/research">Browse research</Link>
        </div> : <>
          <header className="research-opening">
            <h1>Research</h1>
            <p className="research-intro">Can intelligence emerge from interacting brain-inspired mechanisms? We explore this question through neuroscience, philosophy, computational design and experiments.</p>
            <p className="research-reading-note">Start with our hypothesis, then follow a question that interests you. Short introductions are available now; planned articles remain visible below.</p>
          </header>
          {!selectedSection && <Link className="research-feature" to="/research/philosophy">
            <span className="research-status">Start here</span>
            <h2>Can intelligence emerge from interacting mechanisms?</h2>
            <p>Memory alone is not the whole idea. We are exploring what might arise when attention, learning, goals, action and other brain-inspired mechanisms work together.</p>
            <span className="research-feature-action">Read our research hypothesis</span>
          </Link>}
          <div className="research-layout">
            <nav className="research-index" aria-label="Research categories">
              <p>Browse by topic</p>
              <Link to="/research" aria-current={!selectedSection ? 'page' : undefined}>All topics</Link>
              {sections.map(section => <Link key={section.id} to={`/research?category=${section.id}`} aria-current={selectedSection?.id === section.id ? 'page' : undefined}>{section.title}</Link>)}
            </nav>
            <div className="research-topics">
              {visibleSections.map(section => <section key={section.id} aria-labelledby={`${section.id}-title`}>
                <h2 id={`${section.id}-title`}>{section.question ?? section.title}</h2>
                <p className="research-concepts">{section.concepts}</p>
                <ul className="research-topic-list">
                  {[...section.topics].sort((a, b) => Number(Boolean(b.introduction)) - Number(Boolean(a.introduction))).map(topic => <li key={topic.id}>
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


