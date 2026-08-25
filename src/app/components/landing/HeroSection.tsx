import { Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-16 pt-24 sm:pb-20 sm:pt-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_25%_20%,rgba(245,158,11,0.08),transparent_28%),radial-gradient(circle_at_75%_28%,rgba(139,92,246,0.12),transparent_34%)]" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Continue with a Sapiens
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl">
            Choose a Sapiens and start testing.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Open an existing Sapiens below—no account or setup flow required.
          </p>
        </div>
      </div>
    </section>
  );
}
