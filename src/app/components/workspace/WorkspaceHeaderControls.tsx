import { ChevronDown } from 'lucide-react';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { RunEngineButton } from './RunEngineButton';
import { SapienActivityControl } from '../customer/SapienActivityControl';

export function WorkspaceHeaderControls() {
  const { currentSapiens, status, isOverloaded } = useSapiensStore();
  if (!currentSapiens) return null;
  const statusLabel = { idle: 'Ready', processing: 'Processing', loading: 'Loading', error: 'Error' }[status] ?? 'Ready';

  return (
    <nav className="workspace-header-actions" aria-label="Workspace controls">
      {(status !== 'idle' || isOverloaded) && <span className="app-workspace-status" role="status">{isOverloaded ? 'Catching up' : statusLabel}</span>}
      <SapienActivityControl key={currentSapiens.id} sapien={currentSapiens} refreshOnMount hidePausedHelp />
      <details className="workspace-tools" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}>
        <summary>Actions <ChevronDown size={14} /></summary>
        <div className="workspace-tools-menu">
          <RunEngineButton />
        </div>
      </details>
    </nav>
  );
}
