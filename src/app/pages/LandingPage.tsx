import { useRef, useState } from 'react';
import { LoadSapiensList } from '../components/landing/LoadSapiensList';
import { CreateSapiensForm } from '../components/landing/CreateSapiensForm';
import { SapiensHomeHeader } from '../components/customer/SapiensHomeHeader';
import '../../styles/home-science.css';

export function LandingPage() {
  const createSectionRef = useRef<HTMLElement>(null);
  const [showCreate, setShowCreate] = useState(false);
  const openCreate = () => {
    setShowCreate(true);
    window.setTimeout(() => createSectionRef.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }), 0);
  };
  return <div className="product-surface sapiens-home-screen">
    <a className="home-skip" href="#home-main">Skip to content</a>
    <SapiensHomeHeader onCreate={openCreate} />
    <main id="home-main" className="home-container">
      <section className="home-intro" aria-labelledby="home-title">
        <div><p className="home-eyebrow">SAPIENS / ADMINISTRATION</p><h1 id="home-title">All Sapiens</h1><p>Open a Sapiens to continue.</p></div>
      </section>
      <section className="home-directory" aria-labelledby="home-title">
        <LoadSapiensList />
      </section>
      {showCreate && <section ref={createSectionRef} className="home-create-section" aria-label="Create a Sapiens"><CreateSapiensForm /><button className="home-secondary home-cancel" onClick={() => setShowCreate(false)}>Cancel</button></section>}
    </main>
    <footer className="home-container home-footer">Sapiens · An AI individual shaped by experience.</footer>
  </div>;
}
