import { ArrowDown, ArrowRight, ArrowUpRight, CornerUpLeft } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { CustomerHeader } from '../components/customer/CustomerHeader';
import { IdentityArt } from '../components/customer/IdentityArt';
import '../../styles/customer.css';
import '../../styles/landing.css';

const steps = [
  {
    title: 'Encounter something',
    text: 'Conversations bring in questions, ideas and background. The broader ambition includes observations and connected activities, wherever those are supported.',
  },
  {
    title: 'Connect it with context',
    text: 'What an individual has encountered can provide context for what comes next. Today, selected past context may inform a conversation; memory supports the larger aim of developing understanding.',
  },
  {
    title: 'Respond, then encounter more',
    text: 'Relevant context can help shape a later response. We’re working toward a fuller cycle: context informing decisions and supported actions, with new experiences contributing to ongoing development.',
  },
];

export function PublicLandingPage() {
  const { user, status } = useAuth();
  const destination = user ? user.role === 'admin' ? '/admin' : '/home' : '/register?next=%2Fhome%3Fcreate%3D1';
  const action = user ? 'Open your Sapiens' : 'Create your Sapiens';
  const cta = <Link className="customer-primary" to={destination}>{action}<ArrowUpRight size={18} aria-hidden="true" /></Link>;

  return <div className="customer-surface public-story">
    <a className="customer-skip" href="#main">Skip to content</a>
    <CustomerHeader publicPage />
    <main id="main">
      <section className="customer-container landing-hero" aria-labelledby="hero-title">
        <div>
          <p className="customer-eyebrow">A PERSISTENT IDENTITY. AN EVOLVING AMBITION.</p>
          <h1 id="hero-title">Meet <span>Sapiens.</span></h1>
          <p className="landing-lead">An AI individual, built around experience.</p>
          <p className="landing-support">We’re building AI that develops understanding through what it encounters and does—connecting conversations, observations and actions with what comes next.</p>
          <p className="landing-today"><strong>Experience it today:</strong> talk with your Sapiens, share context, and return to the same individual. Selected past context may inform its replies.</p>
          <div className="landing-actions" aria-busy={status === 'loading'}>
            {cta}
            <a className="landing-explore" href="#how-it-works" onClick={() => document.getElementById('how-it-works')?.focus({ preventScroll: true })}>How it works <ArrowDown size={16} aria-hidden="true" /></a>
          </div>
        </div>
        <figure className="landing-identity">
          <IdentityArt stage={2} />
          <figcaption>One identity. Its own unfolding history.<small>An illustration of the direction we’re building toward</small></figcaption>
        </figure>
      </section>

      <section id="how-it-works" tabIndex={-1} className="customer-container landing-how" aria-labelledby="how-title">
        <div className="landing-section-heading">
          <h2 id="how-title">How Sapiens works</h2>
          <p>The central idea: an individual connects what it encounters with what comes next. Here’s what you can experience now, and the fuller cycle we’re building toward.</p>
        </div>
        <figure className="landing-experience" aria-labelledby="experience-caption">
          <div className="landing-experience-flow">
            <div className="landing-experience-end"><span className="landing-experience-label">WHAT IT ENCOUNTERS</span><strong>Conversations &amp; shared information</strong></div>
            <ArrowRight className="landing-flow-arrow" size={22} aria-hidden="true" />
            <div className="landing-experience-centre"><IdentityArt stage={2} /><strong>The same Sapiens</strong><span>Relevant context from its history</span></div>
            <ArrowRight className="landing-flow-arrow" size={22} aria-hidden="true" />
            <div className="landing-experience-end"><span className="landing-experience-label">WHAT COMES NEXT</span><strong>Context-informed responses</strong></div>
          </div>
          <div className="landing-experience-loop"><CornerUpLeft size={22} aria-hidden="true" /><p><strong>In development: the cycle continues.</strong> Observations, decisions and supported actions bring new experiences back to the individual.</p></div>
          <figcaption id="experience-caption">A concept illustration, not a live activity view. Context can inform a response; recall is not complete or guaranteed.</figcaption>
        </figure>
        <ol className="landing-steps" role="list">
          {steps.map((step, index) => <li className="landing-step" key={step.title}>
            <span className="landing-step-number" aria-hidden="true">0{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>)}
        </ol>
        <div className="landing-relevance"><h3>Why keep returning to one individual?</h3><p>Your interests, ideas and activities have continuity. The aim is for your Sapiens to develop context that becomes more relevant to them over time—whether you’re exploring a question, developing an idea or sharing a new perspective. You choose what to bring to it.</p></div>
      </section>

      <aside className="customer-container landing-future" aria-labelledby="future-title">
        <div><p className="customer-eyebrow">FUTURE DIRECTION</p><h2 id="future-title">Where Sapiens is headed</h2></div>
        <p>Richer understanding and more initiative are goals in development, not promises of guaranteed improvement or reliable autonomous work. Connected activities depend on what is supported and available; they are not part of every Sapiens experience today.</p>
      </aside>

      <section className="customer-container landing-setup" aria-labelledby="setup-title">
        <h2 id="setup-title">How to get started</h2>
        <ol role="list"><li><span aria-hidden="true">1</span>Create an account</li><li><span aria-hidden="true">2</span>Name your Sapiens</li><li><span aria-hidden="true">3</span>Begin a conversation</li></ol>
      </section>

      <section className="landing-invitation" aria-labelledby="invitation-title">
        <div className="customer-container">
          <div><h2 id="invitation-title">{action}</h2><p>{user ? 'Choose your Sapiens and continue a conversation.' : 'Give your AI individual a name and start a conversation.'}</p></div>
          {cta}
        </div>
      </section>
    </main>
    <footer className="customer-container landing-footer"><span>Sapiens · An AI individual</span><span>Sapiens is AI and can make mistakes.</span></footer>
  </div>;
}
