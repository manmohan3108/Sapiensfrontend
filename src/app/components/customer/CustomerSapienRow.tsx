import { ChevronRight, Loader2 } from 'lucide-react';
import { useSapienActivity } from '../../hooks/useSapienActivity';
import type { SapienActivity, Sapiens } from '../../types/sapiensTypes';
import { SapienActivityActions } from './SapienActivityControl';

export function CustomerSapienRow({ individual, opening, disabled, error, onOpen, onActivityChange }: {
  individual: Sapiens; opening: boolean; disabled: boolean; error?: string;
  onOpen: () => void;
  onActivityChange: (id: string, activity: SapienActivity | null) => void;
}) {
  const controller = useSapienActivity(individual, false, onActivityChange);
  return <article className="customer-sapien-row">
    <button type="button" className="customer-sapien-open" disabled={disabled} onClick={onOpen}
      aria-label={`Open ${individual.name}, ID ${individual.id}`} aria-busy={opening}>
      <span className="customer-sapien-avatar" aria-hidden="true">{Array.from(individual.name)[0]?.toUpperCase()}</span>
      <span className="customer-sapien-identity">
        <span className="customer-sapien-title"><span className="customer-sapien-name">{individual.name}</span><span className="customer-sapien-id">ID {individual.id}</span></span>
        <span className="customer-sapien-role">{individual.role || 'Generalist'}</span>
        {opening && <span className="sr-only">Opening…</span>}
      </span>
      {opening ? <Loader2 size={20} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <ChevronRight size={20} aria-hidden="true" />}
    </button>
    {error && <p className="customer-sapien-error" role="alert">{error}</p>}
    <div className="customer-sapien-controls"><SapienActivityActions sapien={individual} controller={controller} compact secondaryUnderMore /></div>
  </article>;
}
