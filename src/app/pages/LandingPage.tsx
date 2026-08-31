import { useRef, useState } from 'react';
import { Brain, Heart, Plus, Sparkles, ArrowRight, LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { LoadSapiensList } from '../components/landing/LoadSapiensList';
import { CreateSapiensForm } from '../components/landing/CreateSapiensForm';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

export function LandingPage() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const loadSectionRef = useRef<HTMLElement>(null);
  const createSectionRef = useRef<HTMLElement>(null);
  const [showCreate, setShowCreate] = useState(false);
  const openCreate = () => {
    setShowCreate(true);
    window.setTimeout(() => createSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-violet-200 dark:selection:bg-violet-900">
      <header className="border-b border-border/60 bg-background/90 backdrop-blur">
        <nav aria-label="Primary navigation" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
            <span className="grid size-9 place-items-center rounded-xl bg-violet-600 text-white">
              <Brain className="size-5" aria-hidden="true" />
            </span>
            <span className="font-semibold tracking-tight">Sapiens</span>
          </a>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground sm:flex">{isAdmin ? <ShieldCheck className="size-3.5 text-violet-500" /> : <UserRound className="size-3.5 text-violet-500" />}<span className="max-w-28 truncate">{user?.username}</span><span className="capitalize text-foreground/70">· {user?.role}</span></span>
            <ThemeToggle className="rounded-full" />
            <Button variant="ghost" size="sm" onClick={openCreate} className="rounded-full px-4">
              <Plus className="mr-1.5 size-4" /> Create new
            </Button>
            <Button variant="ghost" size="icon" onClick={() => void logout()} className="rounded-full" aria-label="Sign out"><LogOut className="size-4" /></Button>
          </div>
        </nav>
      </header>

      <main id="top">
        <section ref={loadSectionRef} id="saved-memories" className="scroll-mt-8 py-8 sm:py-10 lg:py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start lg:gap-12">
              <div className="lg:sticky lg:top-10 lg:pt-5">
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                  <Sparkles className="size-3.5" aria-hidden="true" /> A mind that grows with every interaction
                </div>
                <h1 className="mt-5 text-balance text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
                  Every Sapiens has a story already in motion.
                </h1>
                <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
                  It remembers what it learns, connects ideas over time, and develops a perspective shaped by every conversation.
                </p>
                <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
                  {isAdmin ? 'Browse all Sapiens, including unassigned ones. New Sapiens created here are ownerless and admin-only until assigned using the Sapiens Owner field in Django admin.' : 'Only Sapiens owned by your account appear here. New Sapiens automatically belong to you.'}
                </p>
                <div className="mt-7 flex items-center gap-2 text-sm font-medium text-violet-600 dark:text-violet-400">
                  Pick a Sapiens to begin <ArrowRight className="size-4" aria-hidden="true" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold tracking-tight">{isAdmin ? 'All Sapiens' : 'Your Sapiens'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Search by name, descriptive role, or ID. A Sapiens role is not an account permission.</p>
                </div>
                <LoadSapiensList />
              </div>
            </div>
          </div>
        </section>

        <section ref={createSectionRef} className="border-t border-border/60 py-8 sm:py-10">
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
