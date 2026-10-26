import '../../styles/workspace-refresh.css';
import '../../styles/workspace-context-reader.css';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { BrainCircuit, Eye, Target, Expand, Minimize2, MessageSquare } from 'lucide-react';
import { HeaderBar } from '../components/workspace/HeaderBar';
import { AwarenessPanel } from '../components/workspace/AwarenessPanel';
import { ChatWindow } from '../components/workspace/ChatWindow';
import { MemoryPanel } from '../components/workspace/MemoryPanel';
import { GoalsPanel } from '../components/workspace/GoalsPanel';
import { useSapiensStore } from '../core/state/sapiensStore';
import { useOrchestratorStatus } from '../hooks/useOrchestratorStatus';
import { useAuth } from '../contexts/AuthContext';
import { useRememberedState } from '../components/navigation/NavigationState';

type RightTab = 'awareness' | 'memory' | 'goals';

const CONTEXT_TABS = [
  { id: 'awareness' as RightTab, label: 'Understanding', icon: Eye },
  { id: 'memory' as RightTab, label: 'Context', icon: BrainCircuit },
  { id: 'goals' as RightTab, label: 'Goals', icon: Target },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export function WorkspacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const heading = useRef<HTMLHeadingElement>(null);
  const announced = useRef<string | null>(null);
  const { user } = useAuth();
  const currentSapiens = useSapiensStore((state) => state.currentSapiens);
  const viewKey = `workspace:${currentSapiens?.id || 'none'}`;
  const [rightTab, setRightTab] = useRememberedState<RightTab>(`${viewKey}:tab`, 'awareness');
  const [visitedTabs, setVisitedTabs] = useState<RightTab[]>(['awareness']);
  const [contextOpen, setContextOpen] = useRememberedState(`${viewKey}:context-open`, false);
  const [contextWide, setContextWide] = useRememberedState(`${viewKey}:context-wide`, false);
  useEffect(() => { setVisitedTabs(tabs => tabs.includes(rightTab) ? tabs : [...tabs, rightTab]); }, [rightTab]);

  // Poll /api/orchestrator/status every 10 s while this tab is visible
  useOrchestratorStatus();

  useEffect(() => {
    if (!currentSapiens) navigate(user?.role === 'admin' ? '/admin' : '/home');
  }, [currentSapiens, navigate, user?.role]);

  useEffect(() => {
    const createdName = (location.state as { createdName?: string } | null)?.createdName;
    if (currentSapiens && createdName && user?.role === 'customer' && announced.current !== currentSapiens.id) {
      announced.current = currentSapiens.id;
      toast.success(`${createdName} was created`);
      heading.current?.focus();
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [currentSapiens?.id, location.state, location.pathname, navigate, user?.role]);

  if (!currentSapiens) return null;

  return (
    <div className={`product-surface workspace-shell${contextWide ? ' workspace-context-wide' : ''}`}>
      <HeaderBar headingRef={heading} />
      <nav className="workspace-mobile-nav" aria-label="Workspace views">
        <button aria-pressed={!contextOpen} onClick={() => setContextOpen(false)}><MessageSquare size={16} />Conversation</button>
        <button aria-pressed={contextOpen} onClick={() => setContextOpen(true)}><Eye size={16} />Explore {currentSapiens.name}</button>
      </nav>
      <main className="workspace-layout" data-mobile-context={contextOpen}>
        <section className="workspace-chat-area" aria-label="Conversation"><ChatWindow key={currentSapiens.id} /></section>
        <aside className="workspace-context-area" aria-label={`Explore ${currentSapiens.name}`}>
          <div className="workspace-context-heading"><span>Explore {currentSapiens.name}</span><button className="workspace-icon-button workspace-expand" aria-label={contextWide ? 'Restore conversation layout' : 'Expand context panel'} aria-pressed={contextWide} onClick={() => setContextWide(value => !value)}>{contextWide ? <Minimize2 size={16} /> : <Expand size={16} />}</button></div>
          <nav className="workspace-context-tabs" aria-label="Sapiens context">
            {CONTEXT_TABS.map(({id, label, icon: Icon}) => <button key={id} aria-pressed={rightTab === id} onClick={() => { setRightTab(id); setVisitedTabs(tabs => tabs.includes(id) ? tabs : [...tabs, id]); }}><Icon size={15} />{label}</button>)}
          </nav>
          <div className="workspace-context-content" key={currentSapiens.id}>
            {visitedTabs.includes('awareness') && <div hidden={rightTab !== 'awareness'} className="workspace-context-view"><AwarenessPanel active={rightTab === 'awareness'} /></div>}
            {visitedTabs.includes('memory') && <div hidden={rightTab !== 'memory'} className="workspace-context-view"><MemoryPanel active={rightTab === 'memory'} /></div>}
            {visitedTabs.includes('goals') && <div hidden={rightTab !== 'goals'} className="workspace-context-view"><GoalsPanel compact active={rightTab === 'goals'} sapienId={parseInt(currentSapiens.id, 10)} /></div>}
          </div>
        </aside>
      </main>
    </div>
  );
}
