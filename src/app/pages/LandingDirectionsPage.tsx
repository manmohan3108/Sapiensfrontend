import { useState } from 'react';
import { ExperienceDialog } from '../components/customer/ExperienceDialog';
import { LayeredStudy } from '../components/customer/LayeredStudy';
import { SapiensBrandMark } from '../components/customer/SapiensBrandMark';
import { ProductStudyHero } from '../components/customer/ProductStudyHero';
import { Link, useSearchParams } from 'react-router';
import { ArrowUpRight, ArrowDown, ArrowRight, MessageCircle, Brain, Target, Paperclip } from 'lucide-react';
import { useLandingMotion } from '../components/customer/useLandingMotion';
import { SapiensExperienceGraph } from '../components/customer/SapiensExperienceGraph';
import { useAuth } from '../contexts/AuthContext';
import '../../styles/landing-directions.css';

const directions = [
  { id: 'editorial', name: 'Editorial / Human', note: 'Warm paper · expressive serif · illustrated narrative' },
  { id: 'continuity', name: 'Editorial / Spectrum', note: 'Warm editorial design · coral, amber and leaf accents · original flowchart' },
  { id: 'rainbow', name: 'Rainbow / Warm', note: 'A warm spectrum · colorful chapters · the same Sapiens story' },
  { id: 'precision', name: 'Precision / Product', note: 'Clear structure · product demonstration · quiet detail' },
  { id: 'living', name: 'Living / Expressive', note: 'Bold composition · vivid sculpture · unfolding relationships' },
  { id: 'studio', name: 'Product / Studio', note: 'Product first · warm paper and vermilion · interactive walkthrough' },
  { id: 'layered', name: 'Color / Layers', note: 'Full-color chapters · editorial imagery · layered scrolling' },
];
const support = 'We’re building AI that notices, asks questions, develops understanding and acts—connecting what it encounters with what comes next.';
const relevance = 'An individual you can return to, around the ideas, interests and goals that matter to you.';
function Sculpture({ className = '' }: { className?: string }) { return <img className={`direction-sculpture ${className}`} src="/concepts/sapiens-amber.png" width="1024" height="1024" alt="An amber and coral sculpture with translucent folds surrounding a luminous pearl core." />; }

export function LandingDirectionsPage() {
  const [graphOpen, setGraphOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const direction = directions.find(d => d.id === params.get('view')) ?? directions[0];
  const isSpectrum = direction.id === 'continuity' || direction.id === 'rainbow';
  const isComplete = isSpectrum || direction.id === 'studio' || direction.id === 'layered';
  const motionRef = useLandingMotion();
  const { user } = useAuth();
  const destination = user ? user.role === 'admin' ? '/admin' : '/home' : '/register?next=%2Fhome%3Fcreate%3D1';
  const action = user ? 'Open your Sapiens' : 'Create your Sapiens';
  const cta = <Link className="direction-cta" to={destination}>{action}<ArrowUpRight size={18} /></Link>;
  const howLink = direction.id === 'layered' ? <a href="#layered-chapters">How it works</a> : <a href="#direction-idea">How it works</a>;
  return <div ref={motionRef} className={`direction-page direction-${direction.id}${isSpectrum ? ' direction-spectrum' : ''}`}>
    <a href="#direction-main" className="direction-skip">Skip to content</a>
    <aside className="direction-review" aria-label="Design preview controls">
      <div><span className="direction-review-label">SAPIENS / DESIGN STUDIES</span><p>Seven directions. Same story.</p></div>
      <nav aria-label="Choose a design direction">{directions.map((d,i) => <button key={d.id} aria-current={d.id === direction.id ? 'page' : undefined} onClick={() => { setParams({view:d.id}); }}><span>0{i+1}</span>{d.name}</button>)}</nav>

    </aside>
    {graphOpen && <ExperienceDialog onClose={() => setGraphOpen(false)}/>}
    <div className="direction-design">
      <header className="direction-header"><Link className="direction-brand" to="/" aria-label="Sapiens home">{direction.id === 'layered' ? <><SapiensBrandMark/>Sapiens</> : <>sapiens<span aria-hidden="true">✳</span></>}</Link><nav aria-label="Main navigation">{isComplete && <a href="#direction-product">Product</a>}{howLink}{isComplete && <a href="#direction-contact">Contact us</a>}<Link to={user ? destination : '/login'}>{user ? 'Your Sapiens' : 'Sign in'}<ArrowUpRight size={15}/></Link></nav></header>
      <main id="direction-main">
        {direction.id === 'layered' && <LayeredStudy cta={cta} onOpenGraph={() => setGraphOpen(true)}/> }
        {direction.id === 'studio' && <ProductStudyHero cta={cta}/> }
        {(direction.id === 'editorial' || isSpectrum) && <>
          <section className="editorial-hero direction-wrap">
            <div className="editorial-title"><p className="direction-eyebrow">AI WITH A PERSISTENT IDENTITY</p><h1>Meet <em>Sapiens.</em></h1><p className="editorial-lead">An AI individual,<br/>shaped by experience.</p></div>
            <figure className="editorial-art" data-motion-scene><span className="editorial-art-index" aria-hidden="true">01 — AN INDIVIDUAL</span><div className="editorial-sculpture-wrap"><Sculpture/>{direction.id === 'rainbow' && <span className="rainbow-sculpture-color" aria-hidden="true"/>}</div><figcaption>Sapiens · An AI individual</figcaption></figure>
            <div className="editorial-intro"><p>{support}</p><p>{relevance}</p><div className="direction-actions">{cta}<a className="direction-text-link" href="#direction-idea">How it works <ArrowDown size={16}/></a></div></div>
          </section>
        </>}
        {direction.id === 'precision' && <>
          <section className="precision-hero direction-wrap"><div className="precision-copy"><p className="direction-eyebrow">AI WITH A PERSISTENT IDENTITY</p><h1>Meet Sapiens.</h1><p className="precision-lead">An AI individual,<br/>shaped by experience.</p><p>{support}</p><p>{relevance}</p><div className="direction-actions">{cta}<a className="direction-text-link" href="#direction-idea">How it works <ArrowDown size={16}/></a></div></div>
          <div className="precision-demo"><div className="demo-caption"><span>CONVERSATION & CONTEXT</span><span>Illustrative interface</span></div><div className="demo-window"><aside><span className="demo-monogram">s</span><MessageCircle size={18}/><Brain size={18}/><Target size={18}/></aside><div className="demo-conversation"><div className="demo-header"><span>Sapiens</span><span>Your AI individual</span></div><div className="demo-welcome"><Sculpture/><h2>Bring what matters to you.</h2><p>An idea, a question, or something to return to.</p></div><div className="demo-composer"><span>Share a thought or ask a question…</span><div><Paperclip size={16}/><span className="demo-send"><ArrowUpRight size={18}/></span></div></div></div></div><div className="demo-footnote"><span>Conversation</span><span>Memory</span><span>Goals</span></div></div></section>
        </>}
        {direction.id === 'living' && <>
          <section className="living-hero direction-wrap"><p className="direction-eyebrow">AI WITH A PERSISTENT IDENTITY</p><div className="living-stage"><h1>Meet<br/><span>Sapiens.</span></h1><Sculpture/><p className="living-side-note">An AI individual,<br/>shaped by experience.</p></div><div className="living-intro"><p>{support}</p><div><p>{relevance}</p>{cta}</div></div></section>
        </>}
        {isComplete && direction.id !== 'layered' && <section id="direction-product" className="spectrum-product direction-wrap" aria-labelledby="product-title">
          <div className="spectrum-section-heading"><span className="direction-eyebrow">PRODUCT</span><h2 id="product-title">{direction.id === 'layered' ? 'What you can use today' : 'What can I try today?'}</h2></div>
          <div className="spectrum-products"><article><span className="spectrum-product-icon"><MessageCircle size={26}/></span><span className="direction-eyebrow">AVAILABLE TODAY</span><h3>Conversations with your Sapiens</h3><p>Create an individual, bring it questions, ideas and background, and continue interacting. You can revisit saved conversations; selected past context may inform later replies.</p></article><article><span className="spectrum-product-icon"><Target size={26}/></span><span className="direction-eyebrow">DEPENDS ON CONNECTIONS</span><h3>Activities beyond conversation</h3><p>The Connections area shows the providers available for your Sapiens. Any connected communication or tool action needs support for that activity, the required setup and permitted access—not every service or action is available.</p></article></div>
        </section>}
        {direction.id !== 'layered' && <section id="direction-idea" className="direction-flowchart direction-wrap" aria-labelledby="how-title">
          <SapiensExperienceGraph key={direction.id} identityImage="/concepts/sapiens-amber.png" />
        </section>}
        {isComplete && <>
          {direction.id !== 'layered' && <section className="spectrum-start direction-wrap"><div><span className="direction-eyebrow">GETTING STARTED</span><h2>{user ? 'Continue with Sapiens' : 'How to get started'}</h2></div><ol>{(user ? ['Open your Sapiens home','Choose or create a Sapiens','Bring a question or idea'] : ['Create an account','Create your Sapiens','Begin interacting']).map((step,i)=><li key={step}><span>0{i+1}</span>{step}</li>)}</ol>{cta}</section>}
          <section id="direction-contact" className="spectrum-contact" aria-labelledby="contact-title"><div className="direction-wrap"><div><span className="direction-eyebrow">CONTACT US</span><h2 id="contact-title">Let’s talk.</h2><p>Questions, ideas, or feedback about Sapiens?</p></div><address><a href="mailto:manmohan2566@gmail.com">manmohan2566@gmail.com<ArrowUpRight size={20}/></a><a href="tel:+919980637645">+91 99806 37645<ArrowUpRight size={20}/></a></address></div></section>
          <footer className="spectrum-footer direction-wrap"><div><span className="direction-brand">{direction.id === 'layered' ? <><SapiensBrandMark/>Sapiens</> : <>sapiens<span aria-hidden="true">✳</span></>}</span><p>Sapiens · An AI individual</p></div><nav aria-label="Footer navigation"><a href="#direction-product">Product</a>{howLink}<a href="#direction-contact">Contact us</a></nav><p>Sapiens is AI and can make mistakes.</p></footer>
        </>}
        <section className="direction-end direction-wrap"><div><span className="direction-eyebrow">END OF DESIGN PREVIEW</span><p>{direction.note}</p></div><a href="#direction-main">Back to the top <ArrowRight size={17}/></a></section>
      </main>
    </div>
  </div>;
}
