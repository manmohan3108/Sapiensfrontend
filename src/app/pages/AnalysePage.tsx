import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Activity, ArrowLeft, BarChart3, BrainCircuit, Bug, Clock3, DatabaseZap,
  Eye, Filter, ListFilter, Search, Target, Workflow,
} from 'lucide-react';
import { AwarenessPanel } from '../components/workspace/AwarenessPanel';
import { MemoryPanel } from '../components/workspace/MemoryPanel';
import { GoalsPanel } from '../components/workspace/GoalsPanel';
import { MemoryTimeline } from '../components/workspace/MemoryTimeline';
import { DebugPanel } from '../components/workspace/DebugPanel';
import { LlmUsageDialog } from '../components/workspace/LlmUsageDialog';
import { useSapiensStore } from '../core/state/sapiensStore';
import { useOrchestratorStatus } from '../hooks/useOrchestratorStatus';

type ModuleId = 'awareness' | 'working-memory' | 'goals' | 'plans' | 'timeline' | 'debug';

const modules = [
  { id: 'awareness', label: 'Awareness', description: 'Inspect current and recent focus', icon: Eye, tone: '#67e8f9', mode: 'panel' },
  { id: 'working-memory', label: 'Working Memory', description: 'Explore active cognitive context', icon: BrainCircuit, tone: '#c4b5fd', mode: 'panel' },
  { id: 'goals', label: 'Goals', description: 'Review priorities and outcomes', icon: Target, tone: '#86efac', mode: 'panel' },
  { id: 'plans', label: 'Plans', description: 'Inspect goal plans and progress', icon: Workflow, tone: '#fcd34d', mode: 'panel' },
  { id: 'engine-bus', label: 'Engine Bus', description: 'Monitor signals and delivery flows', icon: Activity, tone: '#6ee7b7', mode: 'route' },
  { id: 'engram', label: 'Engram', description: 'Open long-term memory explorer', icon: DatabaseZap, tone: '#a5b4fc', mode: 'route' },
  { id: 'timeline', label: 'Timeline', description: 'Trace memory events over time', icon: Clock3, tone: '#d8b4fe', mode: 'panel' },
  { id: 'debug', label: 'Debug', description: 'Inspect raw cognitive activity', icon: Bug, tone: '#fda4af', mode: 'panel' },
  { id: 'usage', label: 'AI Usage', description: 'Analyze model usage and limits', icon: BarChart3, tone: '#7dd3fc', mode: 'dialog' },
] as const;

export function AnalysePage() {
  const navigate = useNavigate();
  const currentSapiens = useSapiensStore(s => s.currentSapiens);
  const setShowMemoryTimeline = useSapiensStore(s => s.setShowMemoryTimeline);
  const showMemoryTimeline = useSapiensStore(s => s.showMemoryTimeline);
  const [active, setActive] = useState<ModuleId>('awareness');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'recommended' | 'alphabetical'>('recommended');
  const [usageOpen, setUsageOpen] = useState(false);
  useOrchestratorStatus();

  useEffect(() => {
    if (!currentSapiens) navigate('/');
  }, [currentSapiens, navigate]);

  const visibleModules = useMemo(() => {
    const filtered = modules.filter(item => `${item.label} ${item.description}`.toLowerCase().includes(query.toLowerCase()));
    return sort === 'alphabetical' ? [...filtered].sort((a, b) => a.label.localeCompare(b.label)) : filtered;
  }, [query, sort]);

  if (!currentSapiens) return null;

  const openModule = (id: typeof modules[number]['id'], mode: typeof modules[number]['mode']) => {
    if (id === 'engine-bus') return navigate('/engine-bus');
    if (id === 'engram') return navigate('/engram');
    if (id === 'usage') return setUsageOpen(true);
    if (id === 'timeline') setShowMemoryTimeline(true);
    setActive(id as ModuleId);
  };

  return (
    <main className="min-h-screen text-white" style={{ background: '#070b15' }}>
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 0%, rgba(124,58,237,.17), transparent 35%), radial-gradient(circle at 85% 15%, rgba(6,182,212,.1), transparent 28%)' }} />
      <div className="relative mx-auto flex min-h-screen max-w-[1800px] flex-col p-4 lg:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/workspace')} aria-label="Back to workspace" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.04] text-white/55 hover:bg-white/[.08] hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-[.28em] text-cyan-300/50">{currentSapiens.name} · Cognitive intelligence</p>
              <h1 className="text-2xl font-semibold tracking-tight">Analyse platform</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/[.08] bg-black/20 px-3 py-2 text-xs text-white/40">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" /> Live cognitive data
          </div>
        </header>

        <section className="mb-4 rounded-2xl border border-white/[.08] bg-white/[.025] p-4 backdrop-blur-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-white/85">Choose what to analyse</h2>
              <p className="mt-1 text-xs text-white/35">Switch between cognitive layers without crowding the main workspace.</p>
            </div>
            <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 sm:w-56">
                <Search className="h-3.5 w-3.5 text-white/30" />
                <input value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/25" placeholder="Find an analysis view" />
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/50">
                <ListFilter className="h-3.5 w-3.5" />
                <select value={sort} onChange={e => setSort(e.target.value as typeof sort)} className="bg-transparent outline-none">
                  <option className="bg-slate-950" value="recommended">Recommended</option>
                  <option className="bg-slate-950" value="alphabetical">A–Z</option>
                </select>
              </label>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {visibleModules.map(item => {
              const Icon = item.icon;
              const selected = item.mode === 'panel' && active === item.id;
              return (
                <button key={item.id} onClick={() => openModule(item.id, item.mode)} className="group min-h-24 rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5" style={{ background: selected ? `${item.tone}12` : 'rgba(255,255,255,.025)', borderColor: selected ? `${item.tone}55` : 'rgba(255,255,255,.07)' }}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: `${item.tone}14`, color: item.tone }}><Icon className="h-4 w-4" /></span>
                    {selected && <span className="rounded-full px-2 py-0.5 text-[9px] uppercase tracking-wider" style={{ background: `${item.tone}18`, color: item.tone }}>Viewing</span>}
                  </div>
                  <div className="text-xs font-medium text-white/80">{item.label}</div>
                  <div className="mt-1 text-[10px] leading-relaxed text-white/30">{item.description}</div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex min-h-[600px] flex-1 flex-col overflow-hidden rounded-2xl border border-white/[.08] bg-black/20 p-2">
          <div className="flex items-center justify-between border-b border-white/[.06] px-3 py-2">
            <div className="flex items-center gap-2 text-xs text-white/45"><Filter className="h-3.5 w-3.5" /> Focused view · {modules.find(m => m.id === active)?.label}</div>
            <span className="text-[10px] text-white/25">Live · newest first</span>
          </div>
          <div className="min-h-0 flex-1 p-2">
            {active === 'awareness' && <AwarenessPanel />}
            {active === 'working-memory' && <MemoryPanel />}
            {(active === 'goals' || active === 'plans') && <GoalsPanel sapienId={parseInt(currentSapiens.id, 10)} />}
            {active === 'timeline' && <div className="grid h-full place-items-center text-center"><div><Clock3 className="mx-auto mb-3 h-8 w-8 text-violet-300/60" /><p className="text-sm text-white/60">Timeline opened as a detailed overlay.</p><button onClick={() => setShowMemoryTimeline(true)} className="mt-3 rounded-lg border border-violet-400/25 bg-violet-400/10 px-3 py-2 text-xs text-violet-200">Open timeline again</button></div></div>}
            {active === 'debug' && <DebugPanel onClose={() => setActive('awareness')} />}
          </div>
        </section>
      </div>
      {showMemoryTimeline && <MemoryTimeline />}
      <LlmUsageDialog open={usageOpen} onOpenChange={setUsageOpen} sapienId={currentSapiens.id} sapienName={currentSapiens.name} />
    </main>
  );
}
