import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Activity, ArrowUpRight, BarChart3, Beaker, BrainCircuit, Bug, Clock3, DatabaseZap, Eye, LayoutDashboard, Menu, Search, Sparkles, Target, X } from 'lucide-react';
import '../../../styles/analyse.css';
import '../../../styles/analyse-density.css';

export const ANALYSE_GROUPS = [
  { label: 'Understanding & memory', items: [
    { id: 'awareness', label: 'Awareness', icon: Eye },
    { id: 'working-memory', label: 'Working Memory', icon: BrainCircuit },
    { id: 'engram', label: 'Engram', icon: DatabaseZap },
  ] },
  { label: 'Goals & learning', items: [
    { id: 'goals', label: 'Goals & Plans', icon: Target },
    { id: 'questioning', label: 'Questioning', icon: BrainCircuit },
    { id: 'curiosity', label: 'Curiosity', icon: Search },
    { id: 'feedback', label: 'Feedback', icon: Eye },
    { id: 'tool-learning', label: 'Tool Learning', icon: Sparkles },
  ] },
  { label: 'Operations', items: [
    { id: 'engine-bus', label: 'Engine Bus', icon: Activity },
    { id: 'engine-jobs', label: 'Engine Jobs', icon: Activity },
    { id: 'timeline', label: 'Timeline', icon: Clock3 },
  ] },
  { label: 'Analysis tools', items: [
    { id: 'simulation', label: 'Simulation', icon: Beaker },
    { id: 'debug', label: 'Debug', icon: Bug },
    { id: 'usage', label: 'AI Usage', icon: BarChart3 },
  ] },
] as const;
export type AnalyseSection = 'overview' | typeof ANALYSE_GROUPS[number]['items'][number]['id'];
type AnalyseNavItem = { id: AnalyseSection; label: string; icon: typeof Eye };
export const ANALYSE_NAV: AnalyseNavItem[] = [{ id: 'overview', label: 'Overview', icon: LayoutDashboard }, ...ANALYSE_GROUPS.flatMap<AnalyseNavItem>(group => [...group.items])];

export function AnalyseShell({ section, name, sapienId, go, children }: {
  section: AnalyseSection; name: string; sapienId: string; go: (section: AnalyseSection, params?: Record<string, string>) => void;
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const item = ANALYSE_NAV.find(item => item.id === section)!;
  const navigate = (id: AnalyseSection) => { setMobileOpen(false); go(id); };
  const navItem = (entry: typeof ANALYSE_NAV[number]) => <button key={entry.id} type="button" className="analyse-nav-link" aria-current={entry.id === section ? 'page' : undefined} onClick={() => navigate(entry.id)}>
    <entry.icon size={16} aria-hidden="true" /><span>{entry.label}</span>{entry.id === 'simulation' && <ArrowUpRight size={13} aria-label="Separate workspace" />}
  </button>;
  const navigation = <>
    <div className="analyse-brand"><div><strong>Analyse</strong><span>Sections</span></div></div>
    <nav className="analyse-navigation" aria-label="Analyse sections">
      {navItem(ANALYSE_NAV[0])}
      {ANALYSE_GROUPS.map(group => <div className="analyse-nav-group" key={group.label}><p>{group.label}</p>{group.items.map(navItem)}</div>)}
    </nav>
  </>;
  return <div className="analyse-shell" data-analyse-section={section}>
    <a className="analyse-skip" href="#analyse-content">Skip to content</a>
    <aside className="analyse-sidebar">{navigation}</aside>
    <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
      <Dialog.Portal><Dialog.Overlay className="analyse-nav-scrim" /><Dialog.Content className="analyse-mobile-nav" onCloseAutoFocus={event => { event.preventDefault(); menuButton.current?.focus(); }}>
        <Dialog.Title className="sr-only">Analyse navigation</Dialog.Title><Dialog.Description className="sr-only">Choose a diagnostic section for {name}.</Dialog.Description>
        <Dialog.Close className="analyse-nav-close" aria-label="Close navigation"><X size={20} /></Dialog.Close>{navigation}
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
    <main className="analyse-main">
      <header className="analyse-header">
        <button ref={menuButton} type="button" className="analyse-menu" aria-label="Open Analyse sections" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={20} /><span>Sections</span></button>
        <div className="analyse-heading"><p>{name}<span> / ID {sapienId}</span></p><h1>{item.label}</h1></div>
      </header>
      <div id="analyse-content" data-nav-scroll="analyse-content" tabIndex={-1} className={`analyse-content ${['engram', 'engine-bus'].includes(section) ? 'analyse-content-embedded' : ''}`} key={section}>{children}</div>
    </main>
  </div>;
}
