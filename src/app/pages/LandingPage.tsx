import { useRef } from 'react';
import { ArrowUpRight, Brain, Heart } from 'lucide-react';
import { HeroSection } from '../components/landing/HeroSection';
import { WhatIsSapiens } from '../components/landing/WhatIsSapiens';
import { CoreCapabilities } from '../components/landing/CoreCapabilities';
import { UseCases } from '../components/landing/UseCases';
import { HowItWorks } from '../components/landing/HowItWorks';
import { CreateSapiensForm } from '../components/landing/CreateSapiensForm';
import { LoadSapiensList } from '../components/landing/LoadSapiensList';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/ui/button';

export function LandingPage() {
  const createSectionRef = useRef<HTMLElement>(null);
  const loadSectionRef = useRef<HTMLElement>(null);
  const scrollTo = (ref: React.RefObject<HTMLElement | null>) => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground selection:bg-violet-200 dark:selection:bg-violet-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <nav aria-label="Primary navigation" className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#top" className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-sm shadow-violet-500/30 transition-transform group-hover:-rotate-3"><Brain className="size-5" aria-hidden="true" /></span>
            <span className="font-semibold tracking-tight">Sapiens</span><span className="hidden text-sm text-muted-foreground sm:inline">/ My Memory Keeper</span>
          </a>
          <div className="flex items-center gap-1 sm:gap-3">
            <a href="#how-it-works" className="hidden rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 md:block">How it works</a>
            <Button variant="ghost" size="sm" onClick={() => scrollTo(loadSectionRef)} className="hidden sm:inline-flex">Open memory</Button>
            <ThemeToggle className="rounded-full" />
            <Button size="sm" onClick={() => scrollTo(createSectionRef)} className="rounded-full bg-violet-600 px-4 text-white hover:bg-violet-700">Get started</Button>
          </div>
        </nav>
      </header>
      <main id="top">
        <HeroSection onCreateClick={() => scrollTo(createSectionRef)} onLoadClick={() => scrollTo(loadSectionRef)} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><WhatIsSapiens /><CoreCapabilities /><UseCases /><HowItWorks /></div>
        <section ref={createSectionRef} id="get-started" className="relative scroll-mt-20 border-y border-border/60 bg-muted/35 py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(139,92,246,0.12),transparent_40%)]" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-10 max-w-2xl text-center"><span className="mb-4 inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-300">Start a new memory</span><h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">Give your ideas somewhere to grow.</h2><p className="mt-4 text-lg leading-8 text-muted-foreground">Name your Sapiens and choose the role you want it to play. You can add documents, conversations, and context once you enter the workspace.</p></div>
            <CreateSapiensForm />
          </div>
        </section>
        <section ref={loadSectionRef} id="saved-memories" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="mx-auto mb-10 max-w-2xl text-center"><span className="mb-4 inline-flex rounded-full bg-amber-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Welcome back</span><h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Continue where you left off.</h2><p className="mt-3 text-muted-foreground">Your saved Sapiens instances keep their identity and accumulated context ready for the next conversation.</p></div><LoadSapiensList /></div>
        </section>
      </main>
      <footer className="border-t border-border/60 bg-muted/25"><div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Heart className="size-4 text-rose-500" aria-hidden="true" />Built to remember what matters.</div><button onClick={() => scrollTo(createSectionRef)} className="inline-flex items-center gap-1.5 self-start text-sm font-medium hover:text-violet-600 sm:self-auto">Create your Sapiens <ArrowUpRight className="size-4" /></button></div></footer>
    </div>
  );
}
