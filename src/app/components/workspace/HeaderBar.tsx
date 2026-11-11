import type { Ref } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSapiensStore } from '../../core/state/sapiensStore';
import { RunEngineButton } from './RunEngineButton';
import { SapienActivityControl } from '../customer/SapienActivityControl';
import { SapiensPresence } from '../customer/SapiensPresence';

export function HeaderBar({ headingRef }: { headingRef?: Ref<HTMLHeadingElement> }) {
  const { currentSapiens, status, isOverloaded } = useSapiensStore();
  if (!currentSapiens) return null;
  const statusLabel = { idle: 'Ready', processing: 'Processing', loading: 'Loading', error: 'Error' }[status] ?? 'Ready';

  return <header className="workspace-header">
    <div className="workspace-identity">
      <SapiensPresence size={40} tone="orange" />
      <div className="workspace-identity-text"><h1 ref={headingRef} tabIndex={-1} aria-label={`${currentSapiens.name} workspace`}>{currentSapiens.name}</h1><p>{currentSapiens.role || 'Your AI individual'} <span>· ID {currentSapiens.id}</span></p></div>
      <span className="workspace-status" data-status={status}><i aria-hidden="true" />{currentSapiens.active === false && currentSapiens.activityUnavailableReason === null && status === 'idle'
        ? currentSapiens.activityState === 'paused' ? 'Paused' : 'Inactive' : isOverloaded ? 'Catching up' : statusLabel}</span>
    </div>
    <nav className="workspace-header-actions" aria-label="Workspace controls">
      <SapienActivityControl key={currentSapiens.id} sapien={currentSapiens} refreshOnMount />
      <details className="workspace-tools" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); } }}>
        <summary>Actions <ChevronDown size={14} /></summary>
        <div className="workspace-tools-menu">
          <RunEngineButton />
        </div>
      </details>
    </nav>
  </header>;
}
