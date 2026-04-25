import { Brain, Home, Save, Zap } from 'lucide-react';
import { useSapiens } from '../../hooks/useSapiens';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { ThemeToggle } from '../ThemeToggle';
import { RunEngineButton } from './RunEngineButton';

function StatusPill({ status }: { status: string }) {
  const cfg = {
    processing: { dot: 'bg-amber-400 animate-pulse shadow-amber-400/50', text: 'text-amber-300', label: 'Processing', glow: 'shadow-sm shadow-amber-400/20' },
    loading:    { dot: 'bg-blue-400 animate-pulse shadow-blue-400/50',   text: 'text-blue-300',  label: 'Loading',    glow: 'shadow-sm shadow-blue-400/20' },
    error:      { dot: 'bg-red-400 shadow-red-400/50',                   text: 'text-red-300',   label: 'Error',      glow: '' },
    idle:       { dot: 'bg-emerald-400 shadow-emerald-400/50',           text: 'text-emerald-300', label: 'Ready',    glow: '' },
  }[status] ?? { dot: 'bg-emerald-400', text: 'text-emerald-300', label: 'Ready', glow: '' };

  return (
    <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 ${cfg.glow}`}>
      <span className={`w-1.5 h-1.5 rounded-full shadow-sm ${cfg.dot}`} />
      <span className={`text-[11px] font-medium ${cfg.text}`}>{cfg.label}</span>
    </div>
  );
}

export function HeaderBar() {
  const { currentSapiens } = useSapiensStore();
  const { saveSapiens, returnToHome } = useSapiens();
  const status = useSapiensStore((state) => state.status);

  if (!currentSapiens) return null;

  return (
    <header className="relative flex-shrink-0 z-20">
      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

      {/* Glass header */}
      <div
        className="px-4 h-[52px] flex items-center justify-between gap-4 border-b border-white/[0.08]"
        style={{ background: 'rgba(10,14,28,0.85)', backdropFilter: 'blur(20px)' }}
      >
        {/* Left identity */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Animated brain icon */}
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Brain className="w-4 h-4 text-white" />
            </div>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-xl ring-1 ring-violet-400/30 animate-ping opacity-30" />
          </div>

          {/* Sapiens name + app brand */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/90 truncate max-w-[180px]">
                {currentSapiens.name}
              </span>
              {currentSapiens.role && (
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-violet-500/15 border border-violet-500/25 text-violet-300 shrink-0">
                  {currentSapiens.role}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-2.5 h-2.5 text-violet-400/60" />
              <span className="text-[10px] text-white/30 font-mono">Sapiens Cognitive AI</span>
            </div>
          </div>

          <div className="hidden md:block w-px h-6 bg-white/10 mx-1" />

          <StatusPill status={status} />

          {/* ID badge */}
          <div className="hidden lg:flex items-center px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07]">
            <span className="text-[10px] text-white/25 font-mono">id:{currentSapiens.id}</span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ThemeToggle
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/40 hover:text-white/80 hover:bg-white/[0.06] border border-transparent hover:border-white/10 rounded-lg transition-all"
          />

          <div className="w-px h-5 bg-white/10" />

          {/* Run Engine */}
          <RunEngineButton />

          <div className="w-px h-5 bg-white/10" />

          <button
            onClick={() => saveSapiens()}
            disabled={status === 'loading' || status === 'processing'}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs text-white/60 hover:text-white/90 border border-white/10 hover:border-white/20 bg-white/[0.04] hover:bg-white/[0.08] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </button>

          <button
            onClick={returnToHome}
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </button>
        </div>
      </div>
    </header>
  );
}