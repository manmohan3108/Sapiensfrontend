import '../../styles/workspace-refresh.css';
import '../../styles/workspace-context-reader.css';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { BrainCircuit, Eye, Target, CircleHelp, Expand, Minimize2, X } from 'lucide-react';
import { HeaderBar } from '../components/workspace/HeaderBar';
import { AwarenessPanel } from '../components/workspace/AwarenessPanel';
import { ChatWindow } from '../components/workspace/ChatWindow';
import { MemoryPanel } from '../components/workspace/MemoryPanel';
import { OpenQuestionsPanel } from '../components/workspace/OpenQuestionsPanel';
import { GoalsPanel } from '../components/workspace/GoalsPanel';
import { useSapiensStore } from '../core/state/sapiensStore';
import { useOrchestratorStatus } from '../hooks/useOrchestratorStatus';
import { useAuth } from '../contexts/AuthContext';
import { useRememberedState } from '../components/navigation/NavigationState';

type WorkspaceView = 'goals' | 'questions' | 'awareness' | 'memory';
const VIEWS = [
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'questions', label: 'Open questions', icon: CircleHelp },
  { id: 'awareness', label: 'Understanding', icon: Eye },
  { id: 'memory', label: 'Current context', icon: BrainCircuit },
] as const;

// Keep readers and in-flight requests scoped to one Sapien, including on navigation.
function WorkspaceViews({ sapienId, name }: { sapienId: string; name: string }) {
  const viewKey = `workspace:${sapienId}`;
  const [savedView, setView] = useRememberedState<WorkspaceView | 'plans'>(`${viewKey}:tab`, 'goals');
  const view: WorkspaceView = savedView === 'plans' ? 'goals' : savedView;
  const [open, setOpen] = useRememberedState(`${viewKey}:context-open`, false);
  const [wide, setWide] = useRememberedState(`${viewKey}:context-wide`, false);
  const [visited, setVisited] = useState<WorkspaceView[]>(open ? [view] : []);
  const buttons = useRef<HTMLElement>(null);
  const panel = useRef<HTMLElement>(null);
  const previous = useRef({ open, view });

  useEffect(() => {
    if (open) setVisited(items => items.includes(view) ? items : [...items, view]);
    const changed = previous.current.open !== open || previous.current.view !== view;
    if (changed) {
      if (open) panel.current?.focus({ preventScroll: true });
      else buttons.current?.querySelector<HTMLButtonElement>(`[data-view="${view}"]`)?.focus();
    }
    previous.current = { open, view };
  }, [open, view]);

  function closePanel() {
    setOpen(false);
    setWide(false);
  }

  return <main className={`workspace-layout${open ? ' workspace-panel-open' : ''}${open && wide ? ' workspace-context-wide' : ''}`}>
    <section className="workspace-chat-area" aria-label="Conversation"><ChatWindow /></section>
    <aside className="workspace-context-area" aria-label={`Explore ${name}`}>
      <nav ref={buttons} className="workspace-explore-buttons" aria-label="Workspace information">
        <span className="workspace-explore-label">Explore</span>
        {VIEWS.map(({ id, label, icon: Icon }) => <button
          type="button" key={id} data-view={id}
          aria-expanded={open && view === id} aria-controls="workspace-info-panel"
          onClick={() => { setView(id); setOpen(true); }}
        ><Icon size={19} aria-hidden="true" /><span>{label}</span></button>)}
      </nav>
      <section ref={panel} id="workspace-info-panel" className="workspace-info-panel"
        hidden={!open} tabIndex={-1} aria-label={VIEWS.find(item => item.id === view)?.label}
        onKeyDown={event => { if (event.key === 'Escape' && !event.defaultPrevented) { event.stopPropagation(); closePanel(); } }}>
        <div className="workspace-context-heading">
          <span>{name}</span>
          <div>
            <button type="button" className="workspace-icon-button workspace-expand"
              aria-label={wide ? 'Restore panel width' : 'Expand panel'} aria-pressed={wide}
              onClick={() => setWide(value => !value)}>{wide ? <Minimize2 size={16} aria-hidden="true" /> : <Expand size={16} aria-hidden="true" />}</button>
            <button type="button" className="workspace-panel-close" onClick={closePanel}><X size={16} aria-hidden="true" />Close</button>
          </div>
        </div>
        <div className="workspace-context-content">
          {visited.includes('goals') && <div hidden={view !== 'goals'} className="workspace-context-view">
            <GoalsPanel compact active={open && view === 'goals'} sapienId={Number(sapienId)} />
          </div>}
          {visited.includes('questions') && <div hidden={view !== 'questions'} className="workspace-context-view"><OpenQuestionsPanel key={sapienId} sapienId={sapienId} active={open && view === 'questions'} /></div>}
          {visited.includes('awareness') && <div hidden={view !== 'awareness'} className="workspace-context-view"><AwarenessPanel active={open && view === 'awareness'} /></div>}
          {visited.includes('memory') && <div hidden={view !== 'memory'} className="workspace-context-view"><MemoryPanel active={open && view === 'memory'} /></div>}
        </div>
      </section>
    </aside>
  </main>;
}

export function WorkspacePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const heading = useRef<HTMLHeadingElement>(null);
  const announced = useRef<string | null>(null);
  const { user } = useAuth();
  const currentSapiens = useSapiensStore(state => state.currentSapiens);
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
  return <div className="product-surface workspace-shell">
    <HeaderBar headingRef={heading} />
    <WorkspaceViews key={currentSapiens.id} sapienId={currentSapiens.id} name={currentSapiens.name} />
  </div>;
}
