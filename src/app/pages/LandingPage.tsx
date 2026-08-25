import { useRef, useState } from 'react';
import { Brain, Heart, Plus } from 'lucide-react';
import { HeroSection } from '../components/landing/HeroSection';
import { LoadSapiensList } from '../components/landing/LoadSapiensList';
import { CreateSapiensForm } from '../components/landing/CreateSapiensForm';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/ui/button';

export function LandingPage() {
  const loadSectionRef = useRef<HTMLElement>(null);
  const createSectionRef = useRef<HTMLElement>(null);
  const [showCreate, setShowCreate] = useState(false);
  const openCreate = () => {
    setShowCreate(true);
    window.setTimeout(() => createSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-violet-200 dark:selection:bg-violet-900">
      <header className="absolute inset-x-0 top-0 z-20">
        <nav aria-label="Primary navigation" className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
            <span className="grid size-9 place-items-center rounded-xl bg-violet-600 text-white">
              <Brain className="size-5" aria-hidden="true" />
            </span>
            <span className="font-semibold tracking-tight">Sapiens</span>
          </a>
          <div className="flex items-center gap-2">
            <ThemeToggle className="rounded-full" />
            <Button variant="ghost" size="sm" onClick={openCreate} className="rounded-full px-4">
              <Plus className="mr-1.5 size-4" /> Create new
            </Button>
          </div>
        </nav>
      </header>

      <main id="top">
        <HeroSection />

        <section ref={loadSectionRef} id="saved-memories" className="scroll-mt-8 border-t border-border/60 pb-16 sm:pb-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-8 max-w-xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight">Existing Sapiens</h2>
              <p className="mt-3 text-muted-foreground">Search for one, then open its workspace to begin testing.</p>
            </div>
            <LoadSapiensList />
          </div>
        </section>

        <section ref={createSectionRef} className="border-t border-border/60 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            {!showCreate ? (
              <div>
                <p className="text-sm text-muted-foreground">Need a separate Sapiens for a new test?</p>
                <Button variant="outline" onClick={openCreate} className="mt-4 rounded-full">
                  <Plus className="mr-2 size-4" /> Create a new Sapiens
                </Button>
              </div>
            ) : (
              <div>
                <div className="mb-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">One-time setup</p>
                  <h2 className="mt-2 text-2xl font-semibold">Create a new Sapiens</h2>
                </div>
                <CreateSapiensForm />
                <Button variant="ghost" onClick={() => setShowCreate(false)} className="mt-3 text-muted-foreground">Cancel</Button>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-7 text-sm text-muted-foreground">
          <Heart className="size-4 text-rose-500" aria-hidden="true" />
          A digital mind designed to grow over time.
        </div>
      </footer>
    </div>
  );
}
