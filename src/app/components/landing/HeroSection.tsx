import { Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { CreateSapiensForm } from './CreateSapiensForm';

interface HeroSectionProps {
  onLoadClick: () => void;
}

export function HeroSection({ onLoadClick }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden pb-16 pt-24 sm:pb-20 sm:pt-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_20%,rgba(245,158,11,0.08),transparent_28%),radial-gradient(circle_at_75%_28%,rgba(139,92,246,0.12),transparent_34%)]" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            <Sparkles className="size-3.5" aria-hidden="true" />
            It starts with you
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl">
            Create a Sapiens. Shape what it becomes.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Unlike an AI chat that resets and waits, a Sapiens remembers, reflects, and keeps developing between the moments you share.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-xl">
          <CreateSapiensForm />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already created one?{' '}
            <Button variant="link" onClick={onLoadClick} className="h-auto p-0 font-semibold text-violet-600 dark:text-violet-400">
              Return to your Sapiens
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
