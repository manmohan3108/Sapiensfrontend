import { ArrowDown, ArrowRight, ArrowUpRight, CircleHelp, Target, Users, Wrench, ClipboardCheck, RotateCcw, Search, Layers } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { CustomerHeader } from '../components/customer/CustomerHeader';
import { IdentityArt } from '../components/customer/IdentityArt';
import '../../styles/customer.css';
import '../../styles/landing.css';

const stages = [
  {
    title: 'Notice and investigate',
    human: 'When something changes or is unclear, we notice it, ask questions and look for more information.',
    sapiens: 'The ambition is for Sapiens to identify gaps and seek relevant information—not only wait for a prompt.',
    availability: 'In development',
    detail: 'Proactive attention and independent investigation are being developed. Today, you can bring questions and information into a conversation.',
    cues: [{ icon: Search, label: 'New information' }, { icon: CircleHelp, label: 'An open question' }],
  },
  {
    title: 'Understand and decide',
    human: 'We connect a situation with earlier experience and our goals, then decide what deserves attention.',
    sapiens: 'Sapiens can draw on selected past context in a reply. The wider aim is to weigh that context against goals and decide what to address next.',
    availability: 'Context today · decisions in development',
    detail: 'Recall is selective, not complete. Independent prioritisation and reliable goal pursuit are not established capabilities.',
    cues: [{ icon: Layers, label: 'Relevant context' }, { icon: Target, label: 'A goal' }],
  },
  {
    title: 'Communicate and act',
    human: 'We talk with other people, coordinate and use tools to move something forward.',
    sapiens: 'The direction is an individual that participates: communicating through supported channels and taking permitted tool actions toward a goal.',
    availability: 'Requires support, setup and permission',
    detail: 'Connected activity depends on available providers, configuration and access. A connection does not guarantee autonomous work or goal completion.',
    cues: [{ icon: Users, label: 'Another person' }, { icon: Wrench, label: 'A permitted action' }],
  },
  {
    title: 'Reflect and continue',
    human: 'We consider what happened, adjust our understanding and return to unfinished matters.',
    sapiens: 'We’re building toward retaining outcomes, using feedback and revisiting what matters, so experience can inform later decisions.',
    availability: 'In development',
    detail: 'Developing understanding and expertise through experience is an ambition, not a guarantee of improvement or specialist ability.',
    cues: [{ icon: ClipboardCheck, label: 'An outcome' }, { icon: RotateCcw, label: 'What to revisit' }],
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
          <p className="customer-eyebrow">AI WITH A PERSISTENT IDENTITY</p>
          <h1 id="hero-title">Meet <span>Sapiens.</span></h1>
          <p className="landing-lead">An AI individual. Built to develop through experience.</p>
          <p className="landing-support">We’re building toward an individual that gathers information, thinks through situations, communicates and acts—so its understanding can become more relevant to your interests, activities and goals.</p>
          <p className="landing-today"><strong>Begin today:</strong> talk with your Sapiens and share context. The fuller cycle of initiative, action and reflection is the direction we’re developing.</p>
          <div className="landing-actions" aria-busy={status === 'loading'}>
            {cta}
            <a className="landing-explore" href="#how-it-works" onClick={() => document.getElementById('how-it-works')?.focus({ preventScroll: true })}>How it works <ArrowDown size={16} aria-hidden="true" /></a>
          </div>
        </div>
        <figure className="landing-identity">
          <IdentityArt stage={2} />
          <figcaption>One individual, connecting experience with what comes next.<small>Illustrating the product direction</small></figcaption>
        </figure>
      </section>

      <section id="how-it-works" tabIndex={-1} className="customer-container landing-how" aria-labelledby="how-title">
        <div className="landing-section-heading">
          <h2 id="how-title">A familiar pattern. An AI individual.</h2>
          <p>People notice, investigate, decide, act and reflect. That familiar pattern explains the Sapiens ambition. It’s a human parallel for how we’re building AI, not a claim that Sapiens is human or conscious.</p>
        </div>
        <div className="landing-cycle-identity">
          <IdentityArt stage={2} />
          <div><h3>The same Sapiens throughout</h3><p>Memory connects what it encounters, what it does and what comes next. It supports the individual’s understanding; it is one part of the larger cycle.</p></div>
        </div>
        <ol className="landing-cycle" role="list" aria-label="The four stages of the Sapiens concept">
          {stages.map((stage, index) => <li className="landing-stage" key={stage.title}>
            <div className="landing-stage-marker" aria-hidden="true"><span>0{index + 1}</span>{index < stages.length - 1 && <ArrowRight size={18} />}</div>
            <h3>{stage.title}</h3>
            <div className="landing-stage-cues" aria-hidden="true">{stage.cues.map(({ icon: Icon, label }) => <span key={label}><Icon size={18} />{label}</span>)}</div>
            <p className="landing-human"><strong>For people</strong>{stage.human}</p>
            <p className="landing-counterpart"><strong>For Sapiens</strong>{stage.sapiens}</p>
            <div className="landing-availability"><span>{stage.availability}</span><p>{stage.detail}</p></div>
          </li>)}
        </ol>
        <p className="landing-cycle-return"><RotateCcw size={20} aria-hidden="true" /><span><strong>The development goal:</strong> outcomes inform what the same individual notices and does next, with understanding developing through the cycle.</span></p>
      </section>

      <section className="customer-container landing-available" aria-labelledby="available-title">
        <h2 id="available-title">What you can begin using</h2>
        <div className="landing-available-grid">
          <article><span className="customer-eyebrow">AVAILABLE TODAY</span><h3>Conversations with your Sapiens</h3><p>Create an individual, bring it questions, ideas and background, and continue interacting. You can revisit saved conversations; selected past context may inform later replies.</p></article>
          <article><span className="customer-eyebrow">DEPENDS ON CONNECTIONS</span><h3>Activities beyond conversation</h3><p>The Connections area shows the providers available for your Sapiens. Any connected communication or tool action needs support for that activity, the required setup and permitted access—not every service or action is available.</p></article>
        </div>
      </section>

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
