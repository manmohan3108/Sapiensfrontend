import { ArrowDown, ArrowUpRight, RotateCcw } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { CustomerHeader } from '../components/customer/CustomerHeader';
import { LandingIdentity } from '../components/customer/LandingIdentity';
import { CycleIllustration } from '../components/customer/CycleIllustration';
import { useLandingMotion } from '../components/customer/useLandingMotion';
import { LandingCursorTrail } from '../components/customer/LandingCursorTrail';
import { SapiensRelationships } from '../components/customer/SapiensRelationships';
import '../../styles/customer.css';
import '../../styles/landing.css';

// Set to false to restore the original four-card explanation, retained below.
const showRelationshipView = true;

const stages = [
  {
    title: 'Notice and explore',
    summary: 'Notice what has changed and seek information to fill gaps in understanding.',
    human: 'When something changes or is unclear, we notice it, ask questions and look for more information.',
    sapiens: 'The ambition is for Sapiens to identify gaps and seek relevant information—not only wait for a prompt.',
    availability: 'In development',
    detail: 'Proactive attention and independent investigation are being developed. Today, you can bring questions and information into a conversation.',
  },
  {
    title: 'Understand and consider',
    summary: 'Connect new information with earlier experience to decide what deserves attention.',
    human: 'We connect a situation with earlier experience and our goals, then decide what deserves attention.',
    sapiens: 'Sapiens can draw on selected past context in a reply. The wider aim is to weigh that context against goals and decide what to address next.',
    availability: 'Context today · decisions in development',
    detail: 'Recall is selective, not complete. Independent prioritisation and reliable goal pursuit are not established capabilities.',
  },
  {
    title: 'Choose and act',
    summary: 'Work toward a goal by communicating with people and using available tools.',
    human: 'We talk with other people, coordinate and use tools to move something forward.',
    sapiens: 'The direction is an individual that participates: communicating through supported channels and taking permitted tool actions toward a goal.',
    availability: 'Requires support, setup and permission',
    detail: 'Connected activity depends on available providers, configuration and access. A connection does not guarantee autonomous work or goal completion.',
  },
  {
    title: 'Reflect and continue',
    summary: 'Use outcomes and feedback to inform how the individual approaches what comes next.',
    human: 'We consider what happened, adjust our understanding and return to unfinished matters.',
    sapiens: 'We’re building toward retaining outcomes, using feedback and revisiting what matters, so experience can inform later decisions.',
    availability: 'In development',
    detail: 'Developing understanding and expertise through experience is an ambition, not a guarantee of improvement or specialist ability.',
  },
];

export function PublicLandingPage() {
  const motionRef = useLandingMotion();
  const { user, status } = useAuth();
  const destination = user ? user.role === 'admin' ? '/admin' : '/home' : '/register?next=%2Fhome%3Fcreate%3D1';
  const action = user ? 'Open your Sapiens' : 'Create your Sapiens';
  const cta = <Link className="customer-primary" to={destination}>{action}<ArrowUpRight size={18} aria-hidden="true" /></Link>;

  return <div ref={motionRef} className="customer-surface public-story">
    <LandingCursorTrail />
    <a className="customer-skip" href="#main">Skip to content</a>
    <CustomerHeader publicPage />
    <main id="main">
      <section className="customer-container landing-hero" aria-labelledby="hero-title">
        <div>
          <p className="customer-eyebrow">AI WITH A PERSISTENT IDENTITY</p>
          <h1 id="hero-title">Meet <span>Sapiens.</span></h1>
          <p className="landing-lead">An AI individual, shaped by experience.</p>
          <p className="landing-support">We’re building AI that notices, asks questions, develops understanding and acts—connecting what it encounters with what comes next.</p>
          <p className="landing-support landing-relevance">An individual you can return to, around the ideas, interests and goals that matter to you.</p>
          <div className="landing-actions" aria-busy={status === 'loading'}>
            {cta}
            <a className="landing-explore" href="#how-it-works" onClick={() => document.getElementById('how-it-works')?.focus({ preventScroll: true })}>How it works <ArrowDown size={16} aria-hidden="true" /></a>
          </div>
        </div>
        <figure className="landing-identity" data-motion-scene>
          <LandingIdentity />
        </figure>
      </section>

      <section id="how-it-works" tabIndex={-1} className="customer-container landing-how" aria-labelledby="how-title">
        {showRelationshipView ? <SapiensRelationships /> : <>
        <div className="landing-section-heading">
          <span className="customer-eyebrow">The idea behind Sapiens</span>
          <h2 id="how-title">One individual. An ongoing experience.</h2>
        </div>
        <ol className="landing-cycle" role="list" aria-label="The four stages of the Sapiens concept">
          {stages.map((stage, index) => <li className="landing-stage" key={stage.title}>
            <span className="landing-stage-number" aria-hidden="true">0{index + 1}{index === 0 && <small>Start here</small>}</span>
            <h3>{stage.title}</h3>
            <CycleIllustration stage={index} />
            <p className="landing-stage-summary">{stage.summary}</p>
            {index < stages.length - 1 && <svg className="landing-stage-connector" viewBox="0 0 32 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M0 12H31M25 6L31 12L25 18" /></svg>}
          </li>)}
        </ol>
        <div className="landing-cycle-return"><RotateCcw size={20} aria-hidden="true" /><span>Experience informs what comes next.</span></div>
        </>}
        <details className="landing-more landing-cycle-details">
          <summary>Explore the idea</summary>
          <div className="landing-explanation-grid">
            {stages.map(stage => <article key={stage.title}>
                <h3>{stage.title}</h3>
                <p className="landing-human"><strong>For people</strong>{stage.human}</p>
                <p className="landing-counterpart"><strong>For Sapiens</strong>{stage.sapiens}</p>
                <div className="landing-availability"><span>{stage.availability}</span><p>{stage.detail}</p></div>
            </article>)}
          </div>
        </details>
      </section>

      <div className="customer-container landing-available">
        <details className="landing-more landing-capabilities">
          <summary>What can I try today?</summary>
          <div className="landing-available-grid">
          <article><span className="customer-eyebrow">AVAILABLE TODAY</span><h3>Conversations with your Sapiens</h3><p>Create an individual, bring it questions, ideas and background, and continue interacting. You can revisit saved conversations; selected past context may inform later replies.</p></article>
          <article><span className="customer-eyebrow">DEPENDS ON CONNECTIONS</span><h3>Activities beyond conversation</h3><p>The Connections area shows the providers available for your Sapiens. Any connected communication or tool action needs support for that activity, the required setup and permitted access—not every service or action is available.</p></article>
          </div>
        </details>
      </div>

      <section className="customer-container landing-setup" aria-labelledby="setup-title">
        <h2 id="setup-title">How to get started</h2>
        <ol role="list"><li><span aria-hidden="true">1</span>Create an account</li><li><span aria-hidden="true">2</span>Create your Sapiens</li><li><span aria-hidden="true">3</span>Begin interacting</li></ol>
      </section>

      <section className="landing-invitation" aria-labelledby="invitation-title">
        <div className="customer-container">
          <div><h2 id="invitation-title">{action}</h2><p>{user ? 'Bring your Sapiens what matters to you next.' : 'Start with an idea, a question or something that matters to you.'}</p></div>
          {cta}
        </div>
      </section>
    </main>
    <footer className="customer-container landing-footer"><span>Sapiens · An AI individual</span><span>Sapiens is AI and can make mistakes.</span></footer>
  </div>;
}
