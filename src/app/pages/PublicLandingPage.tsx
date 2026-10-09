import { ArrowDown, ArrowUpRight, Fingerprint, MessagesSquare, Orbit } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { CustomerHeader } from '../components/customer/CustomerHeader';
import { IdentityArt } from '../components/customer/IdentityArt';
import '../../styles/customer.css';

const chapters = [
  { title: 'A name. A beginning.', text: 'Create a Sapiens and give it a name. A distinct individual to return to, with a place for your conversations.', note: '01 / IDENTITY', caption: 'One recognizable beginning', stage: 0 },
  { title: 'Experiences leave traces.', text: 'A question, an idea, a conversation. Your saved chats form a history you can revisit. Selected past context may also inform a later conversation.', note: '02 / EXPERIENCE', caption: 'A question · An idea · A conversation', stage: 1 },
  { title: 'An idea meets another.', text: 'When relevant context is available, an earlier idea can meet what you’re exploring now. You can clarify, correct, and continue.', note: '03 / CONNECTION', caption: 'Context creates possibilities, not perfect recall', stage: 2 },
  { title: 'The same individual.\nA different history.', text: 'Come back to the Sapiens you know by name. Start a new conversation with the same individual, or create another with a separate history.', note: '04 / CONTINUITY', caption: 'A shared history, shaped over time', stage: 3 },
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
      <section className="customer-container story-hero" aria-labelledby="hero-title">
        <div className="story-hero-copy"><p className="customer-eyebrow"><span /> A PERSISTENT AI INDIVIDUAL</p>
          <h1 id="hero-title">A name to know.<br />A history to <em>share.</em></h1>
          <p className="story-lead">Meet Sapiens. Create a named AI individual and return to it across conversations. A place for your ongoing ideas—and the history you build together.</p>
          <div className="story-actions" aria-busy={status === 'loading'}>{cta}<a className="story-explore" href="#story" onClick={() => document.getElementById('story')?.focus({ preventScroll: true })}>Explore its story <ArrowDown size={16} /></a></div>
          <p className="story-footnote">One individual. Many conversations.</p>
        </div>
        <div className="story-hero-art"><div className="art-coordinate">AN INDIVIDUAL, OVER TIME</div><IdentityArt /><div className="art-caption"><span className="art-caption-line" />Every shared history begins somewhere.<small>Conceptual illustration</small></div></div>
      </section>
      <div className="customer-container story-divider"><span>MORE THAN A SINGLE CONVERSATION</span><span>THE STORY OF ONE SAPIENS <ArrowDown size={14} /></span></div>
      <section id="story" tabIndex={-1} className="customer-container story-chapters" aria-label="The story of one Sapiens">
        {chapters.map((chapter, i) => <article className={`story-chapter ${i % 2 ? 'story-chapter-reverse' : ''}`} key={chapter.note}>
          <div className="story-scene"><IdentityArt stage={chapter.stage} /><span className="story-scene-caption">{chapter.caption}</span><span className="scene-illustration">Illustration</span></div>
          <div className="story-chapter-copy"><p className="customer-eyebrow">{chapter.note}</p><h2>{chapter.title}</h2><p>{chapter.text}</p></div>
        </article>)}
      </section>
      <section id="today" className="story-today"><div className="customer-container"><p className="customer-eyebrow">WITH SAPIENS TODAY</p><h2>A place to keep<br />your conversations going.</h2><div className="story-capabilities">
        {[{ icon: Fingerprint, title: 'A name to return to', text: 'Open the same Sapiens when you come back. Its identity stays the same across conversations.' }, { icon: MessagesSquare, title: 'Conversations to revisit', text: 'Reopen saved chats and continue a conversation, or begin a new one with the same individual.' }, { icon: Orbit, title: 'Separate when you choose', text: 'Create another Sapiens with its own name and conversation history.' }].map(({ icon: Icon, title, text }) => <article key={title}><Icon size={26} strokeWidth={1.4} aria-hidden="true" /><h3>{title}</h3><p>{text}</p></article>)}
      </div></div></section>
      <section className="customer-container story-future"><p className="customer-eyebrow">AN AMBITION, STILL IN DEVELOPMENT</p><div><h2>Where Sapiens is headed.</h2><p>The ambition is for each Sapiens to develop its understanding through experience, ask useful questions, and take more initiative over time. These abilities are still being developed and tested.</p></div></section>
      <section className="story-invitation"><div className="customer-container"><span className="invitation-orbit" aria-hidden="true" /><p className="customer-eyebrow">A BEGINNING, TOGETHER</p><h2>Start your shared history.</h2><p>Give a Sapiens a name. See where the conversation goes.</p>{cta}</div></section>
    </main>
    <footer className="customer-container customer-footer"><span>Sapiens · An AI individual</span><span>Sapiens is AI and can make mistakes.</span></footer>
  </div>;
}
