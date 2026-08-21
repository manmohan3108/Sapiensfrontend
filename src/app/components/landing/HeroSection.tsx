import { Check, MessageCircle, Sparkles } from 'lucide-react';
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
