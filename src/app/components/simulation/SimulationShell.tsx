import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { Activity, ArrowLeft, BookOpen, CheckCircle2, ChevronDown, FolderKanban, LayoutDashboard, MessageSquare, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { OpenRunWorkspace } from '../navigation/AppNavigation';
import type { SimulationRun } from '../../types/simulationTypes';
import { readableSimulationLabel, simulationLabReturn, simulationSectionPath, simulationTime } from './simulationOverviewModel';
import '../../../styles/simulation-shell.css';

export const SIMULATION_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'Explore this run' },
  { id: 'messages', label: 'Messages (Teams)', icon: MessageSquare, group: 'Explore this run' },
  { id: 'jira', label: 'Jira', icon: FolderKanban, group: 'Explore this run' },
  { id: 'sapien', label: 'Sapien activity', icon: Activity, group: 'Explore this run' },
  { id: 'results', label: 'Results', icon: CheckCircle2, group: 'Explore this run' },
  { id: 'test-case', label: 'Test case', icon: BookOpen, group: 'Reference' },
  { id: 'diagnostics', label: 'Diagnostics', icon: Activity, group: 'Reference' },
] as const;
const diagnostics = ['timeline', 'progress', 'people', 'connections'];
const secondaryNames: Record<string, string> = { timeline: 'Evidence timeline', progress: 'Rule progress', people: 'People', connections: 'Connections & tools', world: 'World explorer' };

export function SimulationShell({ run, name, section, error, children }: {
  run: SimulationRun; name?: string | null; section: string; error?: string; children: ReactNode;
}) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try { return sessionStorage.getItem('simulation-world-sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const params = new URLSearchParams(location.search);
  const returnPath = simulationLabReturn(run, name, params.get('returnTo'));
  const heading = SIMULATION_SECTIONS.find(item => item.id === section)?.label || secondaryNames[section] || 'Simulation';
  function href(id: string) {
    return simulationSectionPath(run, id, name, params.get('returnTo'));
  }
  function toggleSidebar() {
    setCollapsed(value => {
      try { sessionStorage.setItem('simulation-world-sidebar-collapsed', String(!value)); } catch { /* Still usable without storage. */ }
      return !value;
    });
  }
  function navigation(mobile = false) {
    return <nav aria-label={mobile ? 'Simulation sections on mobile' : 'Simulation sections'}>
      {['Explore this run', 'Reference'].map(group => <div className="sim-nav-group" key={group}>
        <p>{group}</p>
        {SIMULATION_SECTIONS.filter(item => item.group === group).map(item => {
          const selected = section === item.id || (item.id === 'diagnostics' && diagnostics.includes(section));
          return <Link key={item.id} to={href(item.id)} aria-current={selected ? 'page' : undefined}
            title={collapsed && !mobile ? item.label : undefined} onClick={() => setMobileOpen(false)}>
            <item.icon size={18} aria-hidden="true" /><span>{item.label}</span>
          </Link>;
        })}
      </div>)}
    </nav>;
  }
  return <div className="simulation-world-shell simulation-inspection-theme sim-shell" data-collapsed={collapsed}>
    <a className="sim-skip" href="#simulation-main">Skip to simulation content</a>
    <aside className="sim-sidebar">
      <div className="sim-sidebar-title"><strong>Simulation</strong><button type="button" onClick={toggleSidebar} aria-label={collapsed ? 'Expand simulation navigation' : 'Collapse simulation navigation'} aria-expanded={!collapsed}>{collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}</button></div>
      {navigation()}
      <Link className="sim-lab-return" to={returnPath} title={collapsed ? 'All simulation runs' : undefined}><ArrowLeft size={18} aria-hidden="true" /><span>All simulation runs</span></Link>
    </aside>
    <div className="sim-main-column">
      <header className="sim-header">
        <div className="sim-heading"><p><span>{name || (run.sapien_id != null ? `Sapien #${run.sapien_id}` : 'No Sapien bound')}</span>{name && run.sapien_id != null && <span> #{run.sapien_id}</span>}<span className="sim-case-name"> / {readableSimulationLabel(run.case_id)}</span></p><h1>{heading}</h1></div>
        <div className="sim-run-state"><span className="sim-status">{readableSimulationLabel(run.status)}</span>{run.archived && <span className="sim-status">Archived</span>}</div>
        {run.sapien_id != null && <OpenRunWorkspace sapienId={String(run.sapien_id)} />}
        <details className="sim-run-details" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}><summary>Run details</summary><div><dl>
          <div><dt>Run ID</dt><dd>{run.run_id}</dd></div><div><dt>Current simulated time</dt><dd>{simulationTime(run.simulated_time)}</dd></div>
          <div><dt>Simulation speed</dt><dd>{run.speed}×</dd></div><div><dt>Recorded events</dt><dd>{run.event_count.toLocaleString()}</dd></div>
        </dl></div></details>
      </header>
      <div className="sim-mobile-navigation"><Link to={returnPath}><ArrowLeft size={16} aria-hidden="true" />All runs</Link><button type="button" aria-expanded={mobileOpen} aria-controls="simulation-mobile-sections" onClick={() => setMobileOpen(value => !value)}>Sections: {heading}<ChevronDown size={16} aria-hidden="true" /></button></div>
      {mobileOpen && <div className="sim-mobile-sections" id="simulation-mobile-sections" onKeyDown={event => { if (event.key === 'Escape') { setMobileOpen(false); (event.currentTarget.previousElementSibling?.querySelector('button') as HTMLButtonElement)?.focus(); } }}>{navigation(true)}</div>}
      {error && <p className="sim-load-error" role="alert">Run status could not refresh: {error}. The last loaded status is shown; retrying automatically.</p>}
      <main id="simulation-main" tabIndex={-1} data-nav-scroll="simulation-content" className="sim-content">
        {diagnostics.includes(section) && <Link className="sim-diagnostics-return" to={href('diagnostics')}><ArrowLeft size={16} aria-hidden="true" />All diagnostics</Link>}
        {children}
      </main>
    </div>
  </div>;
}

export function SimulationOpening({ error }: { error?: string }) {
  return <div className="simulation-world-shell simulation-inspection-theme sim-opening"><div><h1>{error ? 'Simulation unavailable' : 'Opening simulation…'}</h1><p role={error ? 'alert' : 'status'}>{error || 'Loading this run’s saved details.'}</p><Link to="/admin/simulations">Back to simulation runs</Link></div></div>;
}
