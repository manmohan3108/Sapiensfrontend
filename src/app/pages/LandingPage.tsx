import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { LoadSapiensList } from '../components/landing/LoadSapiensList';
import { CreateSapiensForm } from '../components/landing/CreateSapiensForm';
import { SapiensHomeHeader } from '../components/customer/SapiensHomeHeader';
import { SapiensBrandMark } from '../components/customer/SapiensBrandMark';
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
        <div><p className="home-eyebrow">SAPIENS / ADMINISTRATION</p><h1 id="home-title">Your Sapiens</h1><p>Open an individual to continue, or create someone new.</p></div>
        <SapiensBrandMark className="home-intro-core" />
      </section>
      <section className="home-directory" aria-labelledby="directory-title">
        <div className="home-section-heading"><h2 id="directory-title">All Sapiens</h2><p>Search by name, focus or ID.</p></div>
        <LoadSapiensList />
      </section>
      <section ref={createSectionRef} className="home-create-section" aria-label="Create a Sapiens">
        {!showCreate ? <div className="home-create-prompt"><div><h2>A new individual starts here.</h2><p>Give your Sapiens a name and a starting focus.</p></div><button className="home-secondary" onClick={openCreate}><Plus size={17} />Create a Sapiens</button></div>
        : <><CreateSapiensForm /><button className="home-secondary home-cancel" onClick={() => setShowCreate(false)}>Cancel</button></>}
      </section>
    </main>
    <footer className="home-container home-footer">Sapiens · An AI individual shaped by experience.</footer>
  </div>;
}
