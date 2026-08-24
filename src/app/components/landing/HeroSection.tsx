import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { CreateSapiensForm } from './CreateSapiensForm';

interface HeroSectionProps {
  onLoadClick: () => void;
}

function BirthOfMindGraphic({ name }: { name: string }) {
  const displayName = name.trim() || 'Your Sapiens';

  return (
    <figure className="relative mx-auto w-full max-w-md" aria-label="An abstract human form giving rise to a growing digital mind">
      <style>{`
        @keyframes sapien-figure-fade { 0%, 18% { opacity: .58 } 65%, 100% { opacity: .16 } }
        @keyframes sapien-mind-rise { 0%, 12% { transform: translateY(42px) scale(.52); opacity: .45 } 58%, 100% { transform: translateY(-14px) scale(1); opacity: 1 } }
        @keyframes sapien-ring-grow { 0%, 30% { transform: scale(.45); opacity: 0 } 65% { opacity: .5 } 100% { transform: scale(1.25); opacity: 0 } }
        @media (prefers-reduced-motion: reduce) {
          .sapien-figure, .sapien-mind, .sapien-ring { animation: none !important; }
        }
      `}</style>

      <div className="absolute inset-x-10 bottom-8 h-24 rounded-full bg-violet-500/20 blur-3xl" />
      <svg viewBox="0 0 420 430" className="relative w-full" role="img" aria-hidden="true">
        <defs>
          <radialGradient id="mindGlow">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.35" stopColor="#c4b5fd" />
            <stop offset="1" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="figureGlow" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#c4b5fd" stopOpacity=".18" />
            <stop offset="1" stopColor="#8b5cf6" stopOpacity=".55" />
          </linearGradient>
          <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g className="sapien-figure motion-safe:animate-[sapien-figure-fade_7s_ease-in-out_infinite]" fill="url(#figureGlow)" stroke="#8b5cf6" strokeOpacity=".28">
          <path d="M210 47c-31 0-54 24-54 56 0 24 13 42 31 50-10 20-30 31-55 43-40 19-59 55-60 102l-2 92h280l-2-92c-1-47-20-83-60-102-25-12-45-23-55-43 18-8 31-26 31-50 0-32-23-56-54-56Z" />
          <path d="M132 197c18 43 47 65 78 65s60-22 78-65M111 390c11-64 40-105 99-128 59 23 88 64 99 128" fill="none" />
        </g>

        <g className="sapien-mind motion-safe:animate-[sapien-mind-rise_7s_cubic-bezier(.2,.8,.2,1)_infinite]" style={{ transformOrigin: '210px 205px' }}>
          <circle cx="210" cy="205" r={name.trim() ? 92 : 78} fill="url(#mindGlow)" className="transition-all duration-700" />
          <circle cx="210" cy="205" r={name.trim() ? 48 : 39} fill="#7c3aed" fillOpacity=".18" stroke="#8b5cf6" strokeWidth="1.5" className="transition-all duration-700" />
          <g filter="url(#softGlow)" stroke="#ddd6fe" strokeWidth="2" strokeLinecap="round">
            <path d="M183 204l16-18 21 8 19-20M180 215l22 14 20-12 22 12M199 186l3 43M220 194l2 23M239 174l5 55" />
          </g>
          <g fill="#fff">
            <circle cx="183" cy="204" r="4" /><circle cx="199" cy="186" r="4" /><circle cx="202" cy="229" r="4" />
            <circle cx="220" cy="194" r="4" /><circle cx="222" cy="217" r="4" /><circle cx="239" cy="174" r="4" /><circle cx="244" cy="229" r="4" />
          </g>
        </g>

        <circle cx="210" cy="190" r="78" fill="none" stroke="#a78bfa" strokeOpacity=".55" className="sapien-ring motion-safe:animate-[sapien-ring-grow_7s_ease-out_infinite]" style={{ transformOrigin: '210px 190px' }} />
      </svg>

      <figcaption className="absolute inset-x-0 bottom-5 text-center">
        <p className="text-sm font-semibold text-foreground transition-all duration-500">{name.trim() ? `${displayName} is taking shape` : 'A mind begins with you'}</p>
        <p className="mt-1 text-xs text-muted-foreground">Then it remembers, connects, and grows.</p>
      </figcaption>
    </figure>
  );
}

export function HeroSection({ onLoadClick }: HeroSectionProps) {
  const [draftName, setDraftName] = useState('');

  return (
    <section className="relative overflow-hidden pb-16 pt-28 sm:pb-20 sm:pt-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_10%,rgba(245,158,11,0.1),transparent_25%),radial-gradient(circle_at_82%_25%,rgba(139,92,246,0.16),transparent_36%)]" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-sm font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Not another AI chat
          </div>
          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl">
            Create a digital mind that keeps growing.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            A Sapiens is shaped by you. It remembers what you share, connects ideas, and keeps developing between conversations—so you never have to start from zero.
          </p>
        </div>

        <div className="mt-8 grid items-center gap-6 lg:grid-cols-[1fr_.9fr] lg:gap-12">
          <BirthOfMindGraphic name={draftName} />
          <div>
            <CreateSapiensForm onNameChange={setDraftName} />
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Already created one?{' '}
              <Button variant="link" onClick={onLoadClick} className="h-auto p-0 font-semibold text-violet-600 dark:text-violet-400">
                Open your Sapiens
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
