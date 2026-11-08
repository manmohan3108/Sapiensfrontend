import { useRef, useState } from 'react';
import { LoadSapiensList } from '../components/landing/LoadSapiensList';
import { CreateSapiensForm } from '../components/landing/CreateSapiensForm';
import { Plus } from 'lucide-react';
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
    <main id="home-main" className="home-container">
      <section className="home-intro" aria-labelledby="home-title">
        <div><h1 id="home-title">All Sapiens</h1><p>Create an AI individual shaped by experience, or open one to continue.</p></div>
        <button type="button" className="home-secondary home-intro-create" onClick={openCreate}><Plus size={17} aria-hidden="true" />Create a Sapiens</button>
      </section>
      <section className="home-directory" aria-labelledby="home-title">
        <LoadSapiensList onCreate={openCreate} />
      </section>
      {showCreate && <section ref={createSectionRef} className="home-create-section" aria-label="Create a Sapiens"><CreateSapiensForm /><button className="home-secondary home-cancel" onClick={() => setShowCreate(false)}>Cancel</button></section>}
    </main>
    <footer className="home-container home-footer">Sapiens · An AI individual shaped by experience.</footer>
  </div>;
}
