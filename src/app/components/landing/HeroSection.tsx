import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { CreateSapiensForm } from './CreateSapiensForm';
import birthSilhouette from '../../../assets/sapiens-birth-silhouette.png';

interface HeroSectionProps {
  onLoadClick: () => void;
}

function BirthStory({ name }: { name: string }) {
  const displayName = name.trim() || 'A new Sapiens';

  return (
    <figure className="relative mx-auto h-[22rem] w-full max-w-[22rem] overflow-hidden sm:h-[24rem]" aria-label="A human silhouette giving rise to a new Sapiens">
      <style>{`
        @keyframes creator-recede {
          0%, 24% { opacity: .92; transform: scale(1); }
          70%, 100% { opacity: .28; transform: scale(.97); }
        }
        @keyframes presence-emerge {
          0%, 18% { opacity: .35; transform: translate(-50%, 0) scale(.5); }
          62%, 100% { opacity: 1; transform: translate(-50%, -235px) scale(1.45); }
        }
        @keyframes presence-breathe {
          0%, 100% { box-shadow: 0 0 20px 8px rgba(251,191,36,.28), 0 0 70px 24px rgba(139,92,246,.14); }
          50% { box-shadow: 0 0 32px 13px rgba(251,191,36,.4), 0 0 95px 34px rgba(139,92,246,.2); }
        }
        @media (prefers-reduced-motion: reduce) {
          .creator-silhouette, .emerging-presence, .presence-core { animation: none !important; }
          .creator-silhouette { opacity: .45; }
          .emerging-presence { opacity: 1; transform: translate(-50%, -190px) scale(1.15); }
        }
      `}</style>

      <div className="absolute inset-x-10 bottom-14 h-36 rounded-full bg-violet-500/15 blur-3xl" />
      <img
        src={birthSilhouette}
        alt=""
        className={`creator-silhouette absolute inset-0 size-full object-contain transition-opacity duration-700 ${name.trim() ? 'motion-safe:animate-[creator-recede_4.8s_ease-in-out_1_forwards]' : ''}`}
      />

      <div className={`emerging-presence absolute bottom-[27%] left-1/2 z-10 -translate-x-1/2 ${name.trim() ? 'motion-safe:animate-[presence-emerge_4.8s_cubic-bezier(.22,.75,.25,1)_1_forwards]' : ''}`}>
        <div className="presence-core grid size-14 place-items-center rounded-full border border-amber-100/80 bg-[radial-gradient(circle_at_35%_30%,#fff,rgba(253,230,138,.95)_30%,rgba(245,158,11,.8)_66%,rgba(139,92,246,.28))] motion-safe:animate-[presence-breathe_2.8s_ease-in-out_infinite]">
          <span className="size-2 rounded-full bg-white/90" />
        </div>
      </div>

      <figcaption className="absolute inset-x-0 bottom-2 z-20 text-center">
        <p className="text-sm font-semibold">{name.trim() ? `${displayName} is beginning` : 'It begins with you'}</p>
        <p className="mt-1 text-xs text-muted-foreground">Then it learns how to grow.</p>
      </figcaption>
    </figure>
  );
}

export function HeroSection({ onLoadClick }: HeroSectionProps) {
  const [draftName, setDraftName] = useState('');

  return (
    <section className="relative overflow-hidden pb-14 pt-24 sm:pb-16 sm:pt-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_45%,rgba(245,158,11,0.09),transparent_30%),radial-gradient(circle_at_76%_25%,rgba(139,92,246,0.14),transparent_38%)]" />
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

        <div className="mt-2 grid items-center gap-3 lg:grid-cols-[1fr_.9fr] lg:gap-12">
          <BirthStory name={draftName} />
          <div>
            <CreateSapiensForm onNameChange={setDraftName} />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already created one?{' '}
              <Button variant="link" onClick={onLoadClick} className="h-auto p-0 font-semibold text-violet-600 dark:text-violet-400">
                Return to your Sapiens
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
