import { useEffect, useLayoutEffect } from 'react';
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
type ResearchSection = { id: string; title: string; motivation: string; related: string[]; topics: ResearchTopic[] };

const topics: ResearchTopic[] = [
    { id: 'philosophy', title: 'Intelligence through interacting mechanisms', description: 'The central hypothesis guiding Sapiens.', introduction: 'Our research asks whether intelligence can emerge by bringing together mechanisms inspired by the brain, guided by neuroscience and philosophical concepts of intelligence. We aim to explore these concepts together and study what arises from their interaction. Persistence, memory, identity and learning are parts of this exploration, rather than the whole hypothesis. This is a research direction, not a demonstrated conclusion.' },
    { id: 'emergence', title: 'What we mean by emergence', description: 'Define the behaviour we seek and what would support or challenge the hypothesis.' },
    { id: 'intelligence-understanding', title: 'Intelligence and understanding', description: 'The meanings of these concepts and how they guide our research.' },
    { id: 'self-agency', title: 'Self and agency', description: 'Questions about individuality, intentions and responsibility for action.' },
    { id: 'consciousness', title: 'Consciousness and its boundaries', description: 'Distinguish consciousness from intelligence, self-representation and observable behaviour.' },
    { id: 'inspiration', title: 'From neuroscience to computational design', description: 'Our sources of inspiration and the limits of translating them into software.', introduction: 'Neuroscience informs the mechanisms we explore and how they might interact. Attention, working memory, associative recall and consolidation are among our inspirations. Our implementations are engineering interpretations: a similar name or function does not establish biological equivalence. We intend to explain the relevant concepts, their sources and our design choices as this research develops.' },
    { id: 'perception-attention', title: 'Attention and Global Workspace Theory', description: 'The scientific ideas about selection and shared availability; their relevance to Awareness and the limits of the comparison.' },
    { id: 'biological-memory-learning', title: 'Memory and learning', description: 'Ideas about retaining, recalling and adapting through experience.' },
    { id: 'motivation-action', title: 'Motivation and action', description: 'Concepts connecting internal needs, decisions, action and feedback.' },
    { id: 'architecture-overview', title: 'Bringing the mechanisms together', description: 'The overall architecture and the responsibilities of its engines.' },
    { id: 'process', title: 'From experience to action', description: 'An introduction to the flow across the system.', introduction: 'A Sapien considers incoming information alongside relevant memories, decides whether to act or wait, and assesses the outcome. What it retains can inform its next decision. This flow connects several functions within one individual; studying their interaction is part of our research into intelligence.' },
    { id: 'connections', title: 'Information flow and shared references', description: 'How engines and tools exchange information while preserving its source and meaning.' },
    { id: 'awareness', title: 'Awareness', description: 'Why a coherent present focus is needed, and how attention, decisions and assessment work today.' },
    { id: 'identity', title: 'Identity and the shared self', description: 'How multiple functions belong to one Sapien.', introduction: 'Awareness, memory, goals and learning serve one continuing identity. Each has a distinct responsibility within the same Sapien. This shared-self design describes how we organize the system; it does not by itself demonstrate consciousness or establish an explanation of the human self.' },
    { id: 'memory', title: 'Engram: long-term memory and recall', description: 'Why experiences need context and connections; how ingestion, recall and local strengthening work.' },
    { id: 'goals', title: 'Goals and planning', description: 'How intentions, progress and unfinished work are represented.' },
    { id: 'reasoning-questioning', title: 'Reasoning and questioning', description: 'How the system considers possibilities, uncertainties and questions.' },
    { id: 'action-feedback', title: 'Action and feedback', description: 'How actions are carried out and outcomes become evidence.' },
    { id: 'learning', title: 'Learning from experience', description: 'How remembered outcomes and feedback can inform future behaviour.' },
    { id: 'continuity', title: 'Development over time', description: 'How understanding and behaviour may change across accumulated experiences.' },
    { id: 'simulation', title: 'Studying Sapiens through simulation', description: 'Why we use simulated workplaces and what they can reveal.', introduction: 'We use simulated workplaces to study communication, memory, tool use and unfinished work. We inspect successes and failures to improve the system. These experiments provide observations about behaviour under specific conditions; they do not alone demonstrate emergent intelligence. Connecting observations to the research hypothesis requires explicit evaluation and consideration of alternative explanations.' },
    { id: 'findings', title: 'Observations, failures and changes', description: 'Documented findings and how they influenced our implementation.' },
    { id: 'evaluation', title: 'Evaluating the hypothesis', description: 'What evidence could distinguish progress from expected model or tool behaviour.' },
    { id: 'missing-mechanisms', title: 'Missing mechanisms and research directions', description: 'Concepts not yet represented and approaches we still need to explore.' },
    { id: 'alternative-explanations', title: 'Alternative explanations', description: 'Other reasons observed behaviour might arise, without supporting emergence.' },
    { id: 'research-limitations', title: 'Limits of our evidence', description: 'Constraints of our implementation, experiments and current conclusions.' },
  { id: 'associative-memory', title: 'How one experience brings another to mind', description: 'Associative memory: connecting experiences so the past can help explain a new situation.' },
  { id: 'replay-consolidation', title: 'Replay, consolidation and balancing associations', description: 'Replay and consolidation: exploring how revisiting memories changes their connections.' },
  { id: 'reinforcement-forgetting', title: 'Hebbian strengthening and plasticity', description: 'Reinforcement, forgetting and the risk of strengthening the wrong association.' },
  { id: 'curiosity', title: 'What makes something worth exploring?', description: 'Curiosity can concern an unfamiliar pattern, an opportunity or an idea—not only a missing answer.' },
  { id: 'initiative', title: 'Why think when nobody has asked?', description: 'Making room for exploration, gathering information and ordinary conversation without forcing constant activity.', introduction: 'Imagine a Sapien has no new message to answer. Should it simply wait? Our ambition includes noticing something worth learning, revisiting an unresolved idea or starting a conversation on its own initiative.\n\nA question is one possible starting point. An unfamiliar pattern, a connection between experiences or interest in another person can also invite exploration. Curiosity concerns what is worth exploring; questioning concerns what to ask; deciding whether and how to act is another responsibility.\n\nThis should not become a rule to contact someone every few minutes. Rest, waiting and leaving people uninterrupted can also be appropriate. The research challenge is to develop useful initiative through context and experience rather than prescribed scenarios. These connections are still being developed and evaluated.' },
  { id: 'firsthand-experience', title: 'What can an AI learn by taking part?', description: 'Firsthand experience and how an individual develops beyond its initial model knowledge.', introduction: 'Two Sapiens could begin with the same language model yet participate in different situations. One might encounter a failed deployment; another might learn why a team changed its plans. We want those different histories to matter when they next think or act.\n\nThe model supplies capabilities and prior knowledge. The wider system retains what this particular Sapien observes, discusses, attempts and learns. Its memories, associations and learned guidance can then provide different context for later decisions. This is not the same as retraining the underlying model.\n\nOur aim is growing understanding and judgment through participation, not simply keeping a transcript. We still need to measure when retained experience improves behaviour, when it misleads it and how later evidence can correct it.' },
  { id: 'abstraction', title: 'When does an experience become a general idea?', description: 'Abstraction and generalization: exploring patterns that may apply beyond one remembered event.' },
  { id: 'prediction', title: 'Could expectations help a Sapien understand what is happening?', description: 'An exploratory direction: compare expectations with incoming evidence and connect events into an unfolding account.' },
  { id: 'reward-emotion', title: 'What could give an experience significance?', description: 'Research directions around motivation, reward and emotion-inspired processes, without claiming human feelings.' },
  { id: 'senses-roles', title: 'One individual across different roles and senses', description: 'How tools, context and experience could support different roles, with future voice and vision contributing to shared understanding.' },
  { id: 'working-memory-foundation', title: 'Working memory', description: 'Why some information remains active for current thinking, and how this differs from long-term memory.' },
  { id: 'prediction-reward-foundation', title: 'Prediction, novelty and reward prediction error', description: 'Expectations, surprise and differences between expected and observed value.' },
  { id: 'language-models', title: 'The role of language models', description: 'What the underlying model contributes, and what memory, tools and the wider system add.' },
  { id: 'working-memory-engine', title: 'Working Memory engine', description: 'Keeping selected references active through activation, decay and capacity, without copying all long-term content.' },
  { id: 'hippocampus', title: 'Hippocampus: replay', description: 'Why revisit experience? The current replay driver, Engram strengthening and the separate dormant bundling design.' },
  { id: 'hold', title: 'Hold: waiting without forgetting', description: 'Retaining unresolved conditions and reconsidering them without repeatedly acting on unchanged information.' },
  { id: 'tool-learning', title: 'Tool Learning', description: 'How practical lessons from tool use are retained, reconsidered and offered as guidance rather than rules.' },
  { id: 'motor-conversation', title: 'Motor and Conversation', description: 'Why choosing an action, executing it and delivering a message have separate responsibilities.' },
  { id: 'predictive-engines', title: 'Cortex, Cerebellum and Dopamine', description: 'Experimental value, expectation, novelty and reward-error mechanisms; currently outside the main runtime.' },
  { id: 'weave', title: 'Weave: higher-level understanding', description: 'The motivation for abstraction, synthesis and belief revision; incomplete capabilities that are not currently integrated.' },
  { id: 'experience-evaluation', title: 'Does experience improve behaviour?', description: 'How to examine the benefits and failure modes of memory, replay and feedback.' },
  { id: 'imagination', title: 'Imagination and hypothesis generation', description: 'Exploring possibilities while keeping imagined explanations distinct from supported evidence.' },
];
const selectTopics = (...ids: string[]) => ids.flatMap(id => topics.filter(topic => topic.id === id));
const sections: ResearchSection[] = [
  { id: 'philosophy', title: 'Research philosophy', motivation: 'Why explore intelligence through interacting mechanisms? Start with our ambition and the questions guiding it.', related: ['architecture', 'experiments'], topics: selectTopics('philosophy', 'emergence', 'intelligence-understanding', 'self-agency', 'consciousness', 'firsthand-experience', 'continuity') },
  { id: 'neuroscience', title: 'Neuroscience foundations', motivation: 'Understand the concepts before the software. Engine deep dives explain how we adapt these ideas, where the analogy ends and what is actually implemented.', related: ['engines'], topics: selectTopics('inspiration', 'perception-attention', 'working-memory-foundation', 'associative-memory', 'reinforcement-forgetting', 'replay-consolidation', 'prediction-reward-foundation') },
  { id: 'architecture', title: 'Sapiens architecture', motivation: 'How do different responsibilities cooperate within one Sapien? Follow the overall structure and information flow before exploring individual engines.', related: ['philosophy', 'engines'], topics: selectTopics('architecture-overview', 'identity', 'process', 'connections', 'language-models') },
  { id: 'engines', title: 'Engine deep dives', motivation: 'Why does each engine exist? Each deep dive connects its motivation and scientific or philosophical influences to our interpretation, current implementation, interactions and limitations.', related: ['neuroscience', 'philosophy', 'experiments'], topics: selectTopics('awareness', 'memory', 'working-memory-engine', 'hippocampus', 'goals', 'hold', 'reasoning-questioning', 'curiosity', 'action-feedback', 'tool-learning', 'motor-conversation', 'predictive-engines', 'weave') },
  { id: 'experiments', title: 'Experiments and findings', motivation: 'What actually happens when these ideas work together? Examine conditions, observations, failures and alternative explanations rather than treating the architecture as proof.', related: ['engines', 'philosophy'], topics: selectTopics('simulation', 'findings', 'experience-evaluation', 'evaluation', 'alternative-explanations', 'research-limitations') },
  { id: 'future', title: 'Future research', motivation: 'Which ideas still need exploration? These directions describe questions and possibilities, not promises of implemented capability.', related: ['neuroscience', 'engines'], topics: selectTopics('prediction', 'imagination', 'abstraction', 'motivation-action', 'reward-emotion', 'senses-roles', 'missing-mechanisms', 'initiative') },
];
let lastBrowsePosition: { url: string; y: number } | undefined;

export function ResearchPage() {
  const { user } = useAuth();
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const availableOnly = searchParams.get('available') === '1';
  const browseUrl = '/research' + (searchParams.size ? '?' + searchParams : '');
  const updateFilter = (key: string, value: string) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    }, { replace: true });
  };
  const categoryUrl = (id: string) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('category', id); else next.delete('category');
    return '/research' + (next.size ? '?' + next : '');
  };
  const rememberPosition = () => { lastBrowsePosition = { url: browseUrl, y: window.scrollY }; };
  const category = searchParams.get('category');
  const selectedSection = sections.find(section => section.id === category);
  const articleSection = sections.find(section => section.topics.some(topic => topic.id === slug));
  const article = articleSection?.topics.find(topic => topic.id === slug && topic.introduction);
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const visibleSections = (selectedSection ? [selectedSection] : sections).map(section => ({
    ...section,
    topics: section.topics.filter(topic => (!availableOnly || Boolean(topic.introduction))
      && terms.every(term => [section.title, topic.title, topic.description, topic.introduction ?? ''].join(' ').toLowerCase().includes(term))),
  })).filter(section => section.topics.length > 0);
  const resultCount = visibleSections.reduce((count, section) => count + section.topics.length, 0);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = article ? `${article.title} | Sapiens Research` : 'Research | Sapiens';
    return () => { document.title = previousTitle; };
  }, [article]);

  useLayoutEffect(() => {
    window.scrollTo({ top: !slug && lastBrowsePosition?.url === browseUrl ? lastBrowsePosition.y : 0, behavior: 'instant' });
    // Filter edits stay in place; restore only when entering or leaving an article.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <Link to={browseUrl}>Research</Link><span aria-hidden="true">/</span>
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
              <Link className="research-back" to={browseUrl}>Back to topics</Link>
              <nav className="research-related" aria-label="Related reading">
                <h2>Keep exploring</h2><p className="research-related-label">Related research areas</p>
                {articleSection.related.map(id => sections.find(item => item.id === id)).filter((item): item is ResearchSection => Boolean(item)).map(item => <Link key={item.id} to={`/research?category=${item.id}`}>{item.title}</Link>)}
                {articleSection.topics.some(topic => topic.introduction && topic.id !== article.id) && <p className="research-related-label">More introductions in this area</p>}
                {articleSection.topics.filter(topic => topic.introduction && topic.id !== article.id).slice(0, 3).map(topic => <Link key={topic.id} to={`/research/${topic.id}`}>{topic.title}</Link>)}
              </nav>
            </footer>
          </article>
        </div> : <div className="research-opening">
          <h1>Article not available</h1>
          <p className="research-intro">This address does not have a published research article.</p>
          <Link className="research-back" to="/research">Browse research</Link>
        </div> : <>
          <header className="research-opening research-overview">
            <h1>Research</h1>
            <p className="research-intro">Can intelligence emerge from interacting brain-inspired mechanisms? We explore this question through neuroscience, philosophy, computational design and experiments.</p>
            <p className="research-reading-note">Explore why we are building Sapiens, the concepts behind it, how the engines apply them and what our experiments reveal. Planned articles are marked “Not published yet”.</p>
          </header>
          <div className="research-controls">
            <label className="research-search" htmlFor="research-search">Search topics
              <input id="research-search" name="q" type="search" autoComplete="off" placeholder="Try memory or awareness…" value={query} onChange={event => updateFilter('q', event.target.value)}/>
            </label>
            <label className="research-available"><input type="checkbox" checked={availableOnly} onChange={event => updateFilter('available', event.target.checked ? '1' : '')}/>Available to read only</label>
          </div>
          <div className="research-layout">
            <nav className="research-index" aria-label="Research categories">
              <label className="research-mobile-category" htmlFor="research-category">Browse by topic
                <select id="research-category" name="category" value={selectedSection?.id ?? ''} onChange={event => updateFilter('category', event.target.value)}>
                  <option value="">All topics</option>
                  {sections.map(section => <option key={section.id} value={section.id}>{section.title}</option>)}
                </select>
              </label>
              <p>Browse by topic</p>
              <Link to={categoryUrl('')} aria-current={!selectedSection ? 'page' : undefined}>All topics</Link>
              {sections.map(section => <Link key={section.id} to={categoryUrl(section.id)} aria-current={selectedSection?.id === section.id ? 'page' : undefined}>{section.title}</Link>)}
            </nav>
            <div className="research-topics">
              <p className="research-results" role="status">{resultCount} {resultCount === 1 ? 'topic' : 'topics'}{availableOnly ? ' available to read' : ''}</p>
              {resultCount === 0 && <div className="research-empty">
                <h2>No matching topics</h2>
                <p>Try another search, choose a different category or include planned articles.</p>
                <button type="button" onClick={() => setSearchParams({})}>Show all topics</button>
              </div>}
              {visibleSections.map(section => <section key={section.id} aria-labelledby={`${section.id}-title`}>
                <header className="research-section-heading">
                  <h2 id={section.id + '-title'}>{section.title}</h2>
                  <p className="research-concepts">{section.motivation}</p>
                </header>
                <ul className="research-topic-list">
                  {[...section.topics].sort((a, b) => Number(Boolean(b.introduction)) - Number(Boolean(a.introduction))).map(topic => <li key={topic.id}>
                    {topic.introduction ? <Link className="research-topic research-topic-link" to={'/research/' + topic.id + (searchParams.size ? '?' + searchParams : '')} onClick={rememberPosition}>
                      <div className="research-topic-heading"><h3>{topic.title}</h3><span className="research-topic-status">Read introduction <span aria-hidden="true">→</span></span></div>
                      <p className="research-topic-description">{topic.description}</p>
                    </Link> : <div className="research-topic research-topic-planned">
                      <div className="research-topic-heading"><h3>{topic.title}</h3><span className="research-topic-status">Not published yet</span></div>
                      <p className="research-topic-description">{topic.description}</p>
                    </div>}
                  </li>)}
                </ul>
                <nav className="research-related-sections" aria-label={`Related sections for ${section.title}`}><span className="research-related-label">Explore related areas</span>
                  {section.related.map(id => sections.find(item => item.id === id)).filter((item): item is ResearchSection => Boolean(item)).map(item => <Link key={item.id} to={`/research?category=${item.id}`}>{item.title}</Link>)}
                </nav>
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



