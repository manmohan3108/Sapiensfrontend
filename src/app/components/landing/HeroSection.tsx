import { useState } from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { CreateSapiensForm } from './CreateSapiensForm';

interface HeroSectionProps {
  onLoadClick: () => void;
}

function BirthStory({ name }: { name: string }) {
  const displayName = name.trim() || 'A new Sapiens';

  return (
    <figure className="relative mx-auto h-[18rem] w-full max-w-[20rem]" aria-label="An illuminated brain emerging from a simple human form">
      <style>{`
        @keyframes body-recede {
          0%, 18% { opacity: .7; transform: scale(1); }
          70%, 100% { opacity: .14; transform: scale(1.04); }
        }
        @keyframes brain-emerge {
          0%, 16% { transform: translate(-50%, 0) scale(.72); }
          65%, 100% { transform: translate(-50%, -105px) scale(1.35); }
        }
        @keyframes brain-glow {
          0%, 100% { filter: drop-shadow(0 0 8px rgba(253,224,71,.8)) drop-shadow(0 0 24px rgba(139,92,246,.55)); }
          50% { filter: drop-shadow(0 0 14px rgba(254,240,138,1)) drop-shadow(0 0 38px rgba(168,85,247,.75)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .body-lines, .emerging-brain, .brain-light { animation: none !important; }
        }
      `}</style>

      <svg viewBox="0 0 320 288" className="absolute inset-0 size-full" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="bodyLine" x1="40" y1="35" x2="142" y2="260" gradientUnits="userSpaceOnUse">
            <stop stopColor="#c4b5fd" stopOpacity=".18" />
            <stop offset=".48" stopColor="#a78bfa" stopOpacity=".8" />
            <stop offset="1" stopColor="#f0abfc" stopOpacity=".3" />
          </linearGradient>
        </defs>
        <g className={`body-lines ${name.trim() ? 'motion-safe:animate-[body-recede_4.4s_ease-in-out_1_forwards]' : ''}`} style={{ transformOrigin: '160px 160px' }}>
          <path d="M112 30C105 70 70 87 68 137C66 190 92 222 118 262" stroke="url(#bodyLine)" strokeWidth="3" strokeLinecap="round" />
          <path d="M208 30C215 70 250 87 252 137C254 190 228 222 202 262" stroke="url(#bodyLine)" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>

      <div className={`emerging-brain absolute bottom-[22%] left-1/2 z-10 -translate-x-1/2 ${name.trim() ? 'motion-safe:animate-[brain-emerge_4.4s_cubic-bezier(.22,.75,.25,1)_1_forwards]' : ''}`}>
        <div className="brain-light grid size-20 place-items-center rounded-full bg-[radial-gradient(circle,rgba(253,224,71,.28),rgba(139,92,246,.1)_58%,transparent_72%)] motion-safe:animate-[brain-glow_2.6s_ease-in-out_infinite]">
          <Brain className="size-12 fill-amber-200/15 stroke-[1.7] text-amber-200" aria-hidden="true" />
        </div>
      </div>

      <figcaption className="absolute inset-x-0 bottom-0 z-20 text-center">
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
