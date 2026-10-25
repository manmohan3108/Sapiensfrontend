import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowUpRight, Plus } from 'lucide-react';
import { ExperienceDialog } from '../components/customer/ExperienceDialog';
import { LayeredStudy } from '../components/customer/LayeredStudy';
import { LandingCursorTrail } from '../components/customer/LandingCursorTrail';
import { ThemeToggle } from '../components/ThemeToggle';
import { SapiensBrandMark } from '../components/customer/SapiensBrandMark';
import { useAuth } from '../contexts/AuthContext';
import { PublicLandingPage } from './PublicLandingPage';
import { ForestEnvironment } from '../components/customer/ForestEnvironment';
import { ScienceEnvironment } from '../components/customer/ScienceEnvironment';
import '../../styles/landing-directions.css';
import '../../styles/layered-theme.css';
import '../../styles/world-directions.css';
import '../../styles/forest-environment.css';
import '../../styles/science-direction.css';

const directions = [
  { id: 'layered', number: '01', name: 'Color / Layers' },
  { id: 'original', number: '02', name: 'Original / Homepage' },
  { id: 'forest', number: '03', name: 'Living Forest' },
  { id: 'workshop', number: '04', name: 'Curiosity Workshop' },
  { id: 'science', number: '05', name: 'Math & Science' },
] as const;
type Direction = typeof directions[number];

export function LandingDirectionsPage() {
  const [params] = useSearchParams();
  const direction = directions.find(d => d.id === params.get('view')) ?? directions[0];
  if (direction.id === 'original') return <>
    <DesignDirectionPicker direction={direction}/>
    <PublicLandingPage/>
  </>;
  return <DirectionLanding key={direction.id} direction={direction}/>;
}

export function LayeredLandingPage() {
  return <DirectionLanding direction={directions[0]} homepage/>;
}

function DesignDirectionPicker({ direction }: { direction: Direction }) {
  const [, setParams] = useSearchParams();
  const choices = <nav aria-label="Choose a design direction">{directions.map(d =>
    <button key={d.id} aria-current={d.id === direction.id ? 'page' : undefined} onClick={() => setParams({ view: d.id })}>
      <span>{d.number}</span>{d.name}
    </button>
  )}</nav>;
  return direction.id !== 'original'
    ? <details className="experience-design-picker"><summary><span>DESIGN STUDY / {direction.number} · {direction.name}</span>Compare directions <Plus size={13}/></summary>{choices}</details>
    : <aside className="direction-review" aria-label="Design preview controls"><div><span className="direction-review-label">SAPIENS / DESIGN STUDIES</span><p>Five directions. Same story.</p></div>{choices}</aside>;
}

function DirectionLanding({ direction, homepage = false }: { direction: Direction; homepage?: boolean }) {
  const [graphOpen, setGraphOpen] = useState(false);
  const environment = direction.id === 'forest' || direction.id === 'workshop' || direction.id === 'science' ? direction.id : undefined;
  const { user } = useAuth();
  const destination = user ? user.role === 'admin' ? '/admin' : '/home' : '/register?next=%2Fhome%3Fcreate%3D1';
  const action = user ? 'Open your Sapiens' : 'Create your Sapiens';
  const cta = <Link className="direction-cta" to={destination}>{action}<ArrowUpRight size={18}/></Link>;
  const howLink = <a href="#layered-chapters">How it works</a>;
  return <div className={`direction-page direction-layered${environment ? ` direction-${environment} direction-world` : ''}`}>
    {environment === 'forest' && <ForestEnvironment/>}
    {environment === 'science' && <ScienceEnvironment/>}
    {!graphOpen && <LandingCursorTrail/>}
    <a href="#direction-main" className="direction-skip">Skip to content</a>
    {!homepage && <DesignDirectionPicker direction={direction}/>}
    {graphOpen && <ExperienceDialog onClose={() => setGraphOpen(false)}/>}
    <div className="direction-design">
      <header className="direction-header">
        <Link className="direction-brand" to="/" aria-label="Sapiens home"><SapiensBrandMark/>Sapiens</Link>
        <nav aria-label="Main navigation">
          <a href="#direction-product">Product</a>{howLink}<a href="#direction-contact">Contact us</a>
          <ThemeToggle className="layered-theme-toggle"/>
          <Link to={user ? destination : '/login'}>{user ? 'Your Sapiens' : 'Sign in'}<ArrowUpRight size={15}/></Link>
        </nav>
      </header>
      <main id="direction-main">
        <LayeredStudy cta={cta} onOpenGraph={() => setGraphOpen(true)} showSectionNav={!homepage && !environment} environment={environment}/>
        <section id="direction-contact" className="spectrum-contact" aria-labelledby="contact-title">
          <div className="direction-wrap">
            <div><span className="direction-eyebrow">CONTACT US</span><h2 id="contact-title">Let’s talk.</h2><p>Questions, ideas, or feedback about Sapiens?</p></div>
            <address><a href="mailto:manmohan2566@gmail.com">manmohan2566@gmail.com<ArrowUpRight size={20}/></a><a href="tel:+919980637645">+91 99806 37645<ArrowUpRight size={20}/></a></address>
          </div>
        </section>
        <footer className="spectrum-footer direction-wrap">
          <div><span className="direction-brand"><SapiensBrandMark/>Sapiens</span><p>Sapiens · An AI individual</p></div>
          <nav aria-label="Footer navigation"><a href="#direction-product">Product</a>{howLink}<a href="#direction-contact">Contact us</a></nav>
          <p>Sapiens is AI and can make mistakes.</p>
        </footer>
      </main>
    </div>
  </div>;
}
