import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { BrainCircuit, Eye, Target } from 'lucide-react';
import { HeaderBar } from '../components/workspace/HeaderBar';
import { AwarenessPanel } from '../components/workspace/AwarenessPanel';
import { ChatWindow } from '../components/workspace/ChatWindow';
import { MemoryPanel } from '../components/workspace/MemoryPanel';
import { GoalsPanel } from '../components/workspace/GoalsPanel';
import { useSapiensStore } from '../core/state/sapiensStore';
import { useOrchestratorStatus } from '../hooks/useOrchestratorStatus';

type RightTab = 'awareness' | 'memory' | 'goals';

// ─── Tab pill row ─────────────────────────────────────────────────────────────
function TabRow({
  tab,
  setTab,
}: {
  tab: RightTab;
  setTab: (t: RightTab) => void;
}) {
  const TABS = [
    { id: 'awareness' as RightTab, label: 'Awareness', icon: <Eye className="w-3 h-3" />, activeColor: '#67e8f9', activeBg: 'rgba(34,211,238,0.12)', activeBorder: 'rgba(34,211,238,0.25)' },
    { id: 'memory'   as RightTab, label: 'Working Memory', icon: <BrainCircuit className="w-3 h-3" />, activeColor: '#c4b5fd', activeBg: 'rgba(124,58,237,0.15)', activeBorder: 'rgba(124,58,237,0.3)' },
    { id: 'goals'    as RightTab, label: 'Goals',    icon: <Target    className="w-3 h-3" />, activeColor: '#86efac', activeBg: 'rgba(52,211,153,0.12)', activeBorder: 'rgba(52,211,153,0.3)' },
  ] as const;

  const active = TABS.find(t => t.id === tab) ?? TABS[0];

  return (
    <div
      className="flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-xl"
      style={{ background: 'rgba(8,12,22,0.7)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}
    >
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] transition-all duration-150"
          style={
            tab === t.id
              ? { background: t.activeBg, border: `1px solid ${t.activeBorder}`, color: t.activeColor }
              : { background: 'transparent', border: '1px solid transparent', color: 'rgba(255,255,255,0.3)' }
          }
        >
          {t.icon}
          {t.label}
        </button>
      ))}
      <div className="flex-1" />
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: active.activeColor, boxShadow: `0 0 6px ${active.activeColor}99`, transition: 'background 0.25s, box-shadow 0.25s' }} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function WorkspacePage() {
  const navigate = useNavigate();
  const [rightTab, setRightTab] = useState<RightTab>('awareness');

  const currentSapiens = useSapiensStore((state) => state.currentSapiens);

  // Poll /api/orchestrator/status every 10 s while this tab is visible
  useOrchestratorStatus();

  useEffect(() => {
    if (!currentSapiens) navigate('/');
  }, [currentSapiens, navigate]);

  if (!currentSapiens) return null;

  return (
    <div className="workspace-shell min-h-[100dvh] lg:h-screen flex flex-col lg:overflow-hidden" style={{ background: '#080c18' }}>

      {/* ── Ambient canvas ── */}
      <div className="fixed inset-0 pointer-events-none select-none z-0">
        <div className="absolute -top-60 -left-60 w-[900px] h-[900px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 60%)' }} />
        <div className="absolute -bottom-80 -right-40 w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(67,56,202,0.18) 0%, transparent 60%)' }} />
        <div className="absolute top-1/4 left-1/2 w-[500px] h-[500px] rounded-full -translate-x-1/2"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)' }} />
        <div className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(148,163,184,0.25) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.18,
          }} />
      </div>

      {/* ── Header ── */}
      <div className="relative z-30 flex-shrink-0">
        <HeaderBar />
      </div>

      {/* ── Panel grid ── */}
      <div className="relative z-10 flex-1 min-h-0 p-2 gap-3 grid grid-cols-1 lg:grid-cols-12">

        {/* MAIN — Chat and attachments */}
        <div className="min-h-[38rem] lg:col-span-8 lg:min-h-0">
          <ChatWindow />
        </div>

        {/* RIGHT — Tab row + active panel */}
        <div className="min-h-[38rem] flex flex-col gap-2 lg:col-span-4 lg:min-h-0">

          {/* Tab pill row */}
          <TabRow tab={rightTab} setTab={setRightTab} />

          {/* Active panel — fills full height */}
          <div className="flex-1 min-h-0">
            {rightTab === 'awareness' && <AwarenessPanel />}
            {rightTab === 'memory'   && <MemoryPanel />}
            {rightTab === 'goals'    && <GoalsPanel sapienId={parseInt(currentSapiens.id, 10)} />}
          </div>
        </div>
      </div>

    </div>
  );
}
