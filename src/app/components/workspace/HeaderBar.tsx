import type { Ref } from 'react';
import { PlugZap, ScanSearch, LogOut, Beaker, ChevronDown } from 'lucide-react';
import { Link } from 'react-router';
import { YourSapiensLink } from '../navigation/YourSapiensLink';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { ThemeToggle } from '../ThemeToggle';
import { RunEngineButton } from './RunEngineButton';
import { useAuth } from '../../contexts/AuthContext';
import { SapiensPresence } from '../customer/SapiensPresence';

export function HeaderBar({ headingRef }: { headingRef?: Ref<HTMLHeadingElement> }) {
  const { currentSapiens, status, isOverloaded } = useSapiensStore();
  const { user, logout } = useAuth();
  if (!currentSapiens) return null;
  const statusLabel = { idle: 'Ready', processing: 'Processing', loading: 'Loading', error: 'Error' }[status] ?? 'Ready';

  return <header className="workspace-header">
    <YourSapiensLink className="workspace-directory-link" />
    <div className="workspace-identity">
      <SapiensPresence size={40} tone="orange" />
      <div className="workspace-identity-text"><h1 ref={headingRef} tabIndex={-1} aria-label={`${currentSapiens.name} workspace`}>{currentSapiens.name}</h1><p>{currentSapiens.role || 'Your AI individual'} <span>· ID {currentSapiens.id}</span></p></div>
      <span className="workspace-status" data-status={status}><i aria-hidden="true" />{isOverloaded ? 'Catching up' : statusLabel}</span>
    </div>
    <nav className="workspace-header-actions" aria-label="Workspace controls">
      {(user?.role === 'customer' || user?.role === 'admin') && <Link to="/connections" className="workspace-connections"><PlugZap size={16} />Connections</Link>}
      <ThemeToggle variant="ghost" size="icon" className="workspace-icon-button" />
      <details className="workspace-tools" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}>
        <summary>Tools <ChevronDown size={14} /></summary>
        <div className="workspace-tools-menu">
          {user?.role === 'admin' && <>
            <Link to="/admin/analyse"><ScanSearch size={16} />Analyse</Link>
            <Link to={`/admin/simulations?sapienId=${encodeURIComponent(currentSapiens.id)}&sapienName=${encodeURIComponent(currentSapiens.name)}&returnTo=%2Fworkspace`}><Beaker size={16} />Simulation</Link>
          </>}
          <RunEngineButton />
          <button onClick={() => void logout()} title={`Sign out ${user?.username ?? ''}`}><LogOut size={16} />Sign out</button>
        </div>
      </details>
    </nav>
  </header>;
}
