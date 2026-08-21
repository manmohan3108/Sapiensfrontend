import { BrainCircuit, Check, FileText, Lightbulb, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { CreateSapiensForm } from './CreateSapiensForm';

interface HeroSectionProps {
  onLoadClick: () => void;
}

const benefits = [
  'Builds a lasting memory',
  'Connects and reflects on what it learns',
  'Keeps working between conversations',
];

function LivingMindGraphic() {
  return (
    <div className="relative mx-auto mt-10 hidden h-56 max-w-xl sm:block lg:mx-0" aria-label="Sapiens connecting memories and developing ideas in the background">
      <div className="absolute left-1/2 top-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/15 blur-3xl" />
      <svg className="absolute inset-0 size-full text-violet-300/70 dark:text-violet-800" viewBox="0 0 560 224" fill="none" aria-hidden="true">
        <path d="M102 54C180 54 189 111 260 111M105 174C176 174 192 117 260 113M300 111C373 111 383 59 456 59M300 113C370 113 390 170 468 170" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7" />
      </svg>

      <div className="absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[2rem] border border-violet-200 bg-background shadow-xl shadow-violet-500/15 dark:border-violet-800">
        <BrainCircuit className="size-10 text-violet-600 dark:text-violet-400" aria-hidden="true" />
        <span className="absolute -bottom-3 rounded-full bg-violet-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">Thinking</span>
      </div>

      <div className="absolute left-0 top-5 flex items-center gap-2 rounded-2xl border border-border/70 bg-background/90 px-3 py-2.5 shadow-sm backdrop-blur">
        <FileText className="size-4 text-amber-600" aria-hidden="true" />
        <span className="text-xs font-medium">Your notes</span>
      </div>
      <div className="absolute bottom-4 left-3 flex items-center gap-2 rounded-2xl border border-border/70 bg-background/90 px-3 py-2.5 shadow-sm backdrop-blur">
        <MessageCircle className="size-4 text-fuchsia-600" aria-hidden="true" />
        <span className="text-xs font-medium">Conversations</span>
      </div>
      <div className="absolute right-0 top-7 flex items-center gap-2 rounded-2xl border border-border/70 bg-background/90 px-3 py-2.5 shadow-sm backdrop-blur">
        <Lightbulb className="size-4 text-emerald-600" aria-hidden="true" />
        <span className="text-xs font-medium">New connection</span>
      </div>
      <div className="absolute bottom-5 right-1 rounded-2xl border border-border/70 bg-background/90 px-3 py-2.5 shadow-sm backdrop-blur">
        <div className="mb-1.5 flex items-center gap-2 text-xs font-medium"><span className="size-1.5 rounded-full bg-emerald-500" />Working in background</div>
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted"><div className="h-full w-3/4 rounded-full bg-violet-500" /></div>
      </div>
    </div>
  );
}

export function HeroSection({ onLoadClick }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-36">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(245,158,11,0.12),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(139,92,246,0.15),transparent_35%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_.82fr] lg:px-8">
        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            <Sparkles className="size-3.5" aria-hidden="true" />
            A digital mind that grows over time
          </div>
          <h1 className="text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-6xl">
            Give your ideas a mind of their own.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Sapiens remembers what you share, makes connections, and continues working in the background—developing a deeper understanding of your world over time.
          </p>

          <ul className="mt-7 space-y-3">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-center gap-3 text-sm sm:text-base">
                <span className="grid size-6 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>

          <LivingMindGraphic />

          <div className="mt-8 flex items-center gap-3 text-sm text-muted-foreground lg:hidden">
            <MessageCircle className="size-4" aria-hidden="true" />
            Create your Sapiens below—it only needs a name.
          </div>
        </div>

        <div>
          <CreateSapiensForm />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have one?{' '}
            <Button variant="link" onClick={onLoadClick} className="h-auto p-0 font-semibold text-violet-600 dark:text-violet-400">
              Open it here
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
