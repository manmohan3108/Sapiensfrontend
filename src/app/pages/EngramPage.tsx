import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { BarChart2, Table2, User, Search, Share2, Cpu, Brain, Home } from 'lucide-react';
import { useSapiensStore } from '../core/state/sapiensStore';
import { EngramDashboard }  from '../components/engram/EngramDashboard';
import { EngramBrowse }     from '../components/engram/EngramBrowse';
import { EngramEntities }   from '../components/engram/EngramEntities';
import { EngramRecall }     from '../components/engram/EngramRecall';
import { EngramGraph }      from '../components/engram/EngramGraph';
import { EngramWMSidebar }  from '../components/engram/EngramWMSidebar';

type Tab = 'dashboard' | 'browse' | 'entities' | 'recall' | 'graph';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <BarChart2 className="w-3.5 h-3.5" /> },
  { id: 'browse',    label: 'Browse',    icon: <Table2    className="w-3.5 h-3.5" /> },
  { id: 'entities',  label: 'Entities',  icon: <User      className="w-3.5 h-3.5" /> },
  { id: 'recall',    label: 'Recall',    icon: <Search    className="w-3.5 h-3.5" /> },
  { id: 'graph',     label: 'Graph',     icon: <Share2    className="w-3.5 h-3.5" /> },
];

const TAB_ACCENT: Record<Tab, string> = {
  dashboard: '#818cf8',
  browse:    '#34d399',
  entities:  '#22d3ee',
  recall:    '#c4b5fd',
  graph:     '#f97316',
};

export function EngramPage() {
  const navigate           = useNavigate();
  const currentSapiens     = useSapiensStore(s => s.currentSapiens);
  const [tab, setTab]      = useState<Tab>('dashboard');
  const [graphSeedId, setGraphSeedId] = useState<string | undefined>(undefined);

  const openInGraph = (id: string) => {
    setGraphSeedId(id);
    setTab('graph');
  };

  useEffect(() => {
    if (!currentSapiens) navigate('/');
  }, [currentSapiens, navigate]);

  if (!currentSapiens) return null;

  const sapienId = parseInt(currentSapiens.id, 10);
  const accent   = TAB_ACCENT[tab];

  return (
    <div className="min-h-[100dvh] lg:h-screen flex flex-col lg:overflow-hidden" style={{ background: '#060a15' }}>

      {/* ── Ambient canvas ── */}
      <div className="fixed inset-0 pointer-events-none select-none z-0">
        <div className="absolute -top-60 -left-40 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.15) 0%, transparent 60%)' }} />
        <div className="absolute -bottom-60 -right-40 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 60%)' }} />
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(148,163,184,0.2) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.15,
          }} />
      </div>

      {/* ── Header ── */}
      <div className="relative z-30 flex-shrink-0">
        <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, transition: 'background 0.3s' }} />
        <div
          className="min-h-13 px-3 py-2 flex flex-wrap items-center gap-2 sm:px-4 lg:flex-nowrap lg:gap-4"
          style={{
            background: 'rgba(6,10,21,0.96)',
            backdropFilter: 'blur(24px)',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Logo + breadcrumb */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 0 16px rgba(124,58,237,0.4)' }}
            >
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="text-white/30">{currentSapiens.name}</span>
              <span className="text-white/15">/</span>
              <span className="font-medium" style={{ color: accent }}>Engram Explorer</span>
            </div>
          </div>

          {/* Tab nav */}
          <nav className="order-3 flex w-full items-center gap-1 overflow-x-auto lg:order-none lg:w-auto lg:flex-1 lg:justify-center">
            {TABS.map(t => {
              const ac = TAB_ACCENT[t.id];
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex flex-shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all duration-150"
                  style={
                    active
                      ? { background: `${ac}18`, border: `1px solid ${ac}40`, color: ac }
                      : { background: 'transparent', border: '1px solid transparent', color: 'rgba(255,255,255,0.35)' }
                  }
                >
                  {t.icon}
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}>
              <Cpu className="w-2.5 h-2.5" />
              id={sapienId}
            </span>
            <button
              onClick={() => navigate('/workspace')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-white/35 hover:text-white/70 hover:bg-white/[0.05] transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Workspace</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col gap-3 p-2 sm:p-3 lg:flex-row lg:overflow-hidden">

        {/* Main content area */}
        <div className="flex-1 min-w-0 overflow-y-auto rounded-2xl px-3 py-4 sm:px-5"
          style={{
            background: 'rgba(8,12,22,0.85)',
            border: `1px solid ${accent}20`,
            backdropFilter: 'blur(24px)',
            boxShadow: `0 0 0 1px ${accent}08, 0 30px 60px rgba(0,0,0,0.5)`,
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
        >
          {/* Section header */}
          <div className="flex items-center gap-2 mb-5 pb-3" style={{ borderBottom: `1px solid ${accent}15` }}>
            <span style={{ color: accent }}>{TABS.find(t => t.id === tab)?.icon}</span>
            <h2 className="text-sm text-white/80">{TABS.find(t => t.id === tab)?.label}</h2>
          </div>

          {tab === 'dashboard' && <EngramDashboard sapienId={sapienId} />}
          {tab === 'browse'    && <EngramBrowse    sapienId={sapienId} onOpenInGraph={openInGraph} />}
          {tab === 'entities'  && <EngramEntities  sapienId={sapienId} onOpenInGraph={openInGraph} />}
          {tab === 'recall'    && <EngramRecall     sapienId={sapienId} onOpenInGraph={openInGraph} />}
          {tab === 'graph'     && <EngramGraph      sapienId={sapienId} initialId={graphSeedId} />}
        </div>

        {/* Working Memory sidebar (always visible) */}
        <div className="min-h-[24rem] w-full flex-shrink-0 lg:min-h-0 lg:w-52">
          <EngramWMSidebar sapienId={sapienId} onOpenInGraph={openInGraph} />
        </div>
      </div>
    </div>
  );
}
